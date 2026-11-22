import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from blog.models import Post

User = get_user_model()
pytestmark = pytest.mark.django_db


@pytest.fixture
def api():
    return APIClient()


def make_user(name="maya"):
    return User.objects.create_user(username=name, password="strong-pass-123")


def login(api, user):
    res = api.post("/api/auth/token", {"username": user.username, "password": "strong-pass-123"}, format="json")
    api.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")
    return api


def create_post(api, **data):
    payload = {"title": "Hello world", "body": "Some **markdown** text", "tag_names": ["django"], **data}
    return api.post("/api/posts", payload, format="json")


# --- auth -----------------------------------------------------------------

def test_register_then_login_then_me(api):
    res = api.post("/api/auth/register", {"username": "new_user", "password": "a-good-password"}, format="json")
    assert res.status_code == 201
    assert "password" not in res.data

    res = api.post("/api/auth/token", {"username": "new_user", "password": "a-good-password"}, format="json")
    assert res.status_code == 200 and "access" in res.data and "refresh" in res.data

    api.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")
    assert api.get("/api/auth/me").data["username"] == "new_user"


def test_register_rejects_weak_password_and_duplicate_name(api):
    make_user("taken")
    assert api.post("/api/auth/register", {"username": "x1", "password": "12345678"}, format="json").status_code == 400
    assert api.post("/api/auth/register", {"username": "TAKEN", "password": "a-good-password"}, format="json").status_code == 400


def test_bad_login(api):
    make_user()
    res = api.post("/api/auth/token", {"username": "maya", "password": "nope"}, format="json")
    assert res.status_code == 401


# --- posts ----------------------------------------------------------------

def test_anonymous_can_read_but_not_write(api):
    assert api.get("/api/posts").status_code == 200
    assert create_post(api).status_code == 401


def test_create_post_sets_author_slug_tags(api):
    login(api, make_user())
    res = create_post(api)
    assert res.status_code == 201
    assert res.data["slug"] == "hello-world"
    assert res.data["author"]["username"] == "maya"
    assert res.data["tags"] == ["django"]
    assert res.data["published_at"] is not None


def test_slugs_stay_unique(api):
    login(api, make_user())
    assert create_post(api).data["slug"] == "hello-world"
    assert create_post(api).data["slug"] == "hello-world-2"


def test_list_is_paginated_with_excerpt_and_reading_time(api):
    login(api, make_user())
    for i in range(11):
        create_post(api, title=f"Post {i}")
    page = api.get("/api/posts").data
    assert page["count"] == 11 and len(page["results"]) == 9 and page["next"]
    card = page["results"][0]
    assert "body" not in card and card["excerpt"] == "Some markdown text" and card["reading_time"] == 1


def test_only_author_can_edit_or_delete(api):
    login(api, make_user("maya"))
    slug = create_post(api).data["slug"]

    other = login(APIClient(), make_user("dan"))
    assert other.patch(f"/api/posts/{slug}", {"title": "hacked"}, format="json").status_code == 403
    assert other.delete(f"/api/posts/{slug}").status_code == 403

    res = api.patch(f"/api/posts/{slug}", {"title": "Edited", "tag_names": ["python", "Django"]}, format="json")
    assert res.status_code == 200 and res.data["title"] == "Edited"
    assert sorted(res.data["tags"]) == ["django", "python"]
    assert res.data["slug"] == slug  # slug is stable after edits
    assert api.delete(f"/api/posts/{slug}").status_code == 204
    assert not Post.objects.exists()


def test_drafts_are_private(api):
    login(api, make_user("maya"))
    slug = create_post(api, title="Secret", status="draft").data["slug"]

    assert APIClient().get("/api/posts").data["count"] == 0
    assert APIClient().get(f"/api/posts/{slug}").status_code == 404
    assert api.get(f"/api/posts/{slug}").status_code == 200

    mine = api.get("/api/posts?mine=true").data
    assert [p["status"] for p in mine["results"]] == ["draft"]


def test_publishing_a_draft_sets_published_at(api):
    login(api, make_user())
    slug = create_post(api, status="draft").data["slug"]
    assert api.get(f"/api/posts/{slug}").data["published_at"] is None
    res = api.patch(f"/api/posts/{slug}", {"status": "published"}, format="json")
    assert res.data["published_at"] is not None


def test_search_and_filters(api):
    login(api, make_user("maya"))
    create_post(api, title="Django tips", tag_names=["django"])
    create_post(api, title="React hooks", body="useEffect stuff", tag_names=["react"])

    titles = lambda url: [p["title"] for p in api.get(url).data["results"]]  # noqa: E731
    assert titles("/api/posts?search=useEffect") == ["React hooks"]
    assert titles("/api/posts?tag=django") == ["Django tips"]
    assert len(titles("/api/posts?author=MAYA")) == 2


def test_validation(api):
    login(api, make_user())
    assert create_post(api, title="   ").status_code == 400
    assert create_post(api, tag_names=["a", "b", "c", "d", "e", "f"]).status_code == 400


# --- comments & tags --------------------------------------------------------

def test_comments_flow(api):
    login(api, make_user("maya"))
    slug = create_post(api).data["slug"]

    dan = login(APIClient(), make_user("dan"))
    res = dan.post(f"/api/posts/{slug}/comments", {"body": "Nice post!"}, format="json")
    assert res.status_code == 201 and res.data["author"]["username"] == "dan"
    assert APIClient().post(f"/api/posts/{slug}/comments", {"body": "anon"}, format="json").status_code == 401
    assert dan.post(f"/api/posts/{slug}/comments", {"body": "  "}, format="json").status_code == 400

    comments = APIClient().get(f"/api/posts/{slug}/comments").data
    assert [c["body"] for c in comments] == ["Nice post!"]
    assert APIClient().get("/api/posts").data["results"][0]["comment_count"] == 1

    # a stranger can't delete it, the post author can
    stranger = login(APIClient(), make_user("eve"))
    assert stranger.delete(f"/api/comments/{res.data['id']}").status_code == 403
    assert api.delete(f"/api/comments/{res.data['id']}").status_code == 204


def test_tags_endpoint_counts_published_only(api):
    login(api, make_user())
    create_post(api, tag_names=["django"])
    create_post(api, tag_names=["django", "react"])
    create_post(api, tag_names=["hidden"], status="draft")
    tags = {t["name"]: t["post_count"] for t in APIClient().get("/api/tags").data}
    assert tags == {"django": 2, "react": 1}


def test_seed_command_is_idempotent():
    from django.core.management import call_command

    call_command("seed_demo")
    call_command("seed_demo")
    assert Post.objects.count() == 4
    assert User.objects.filter(username__in=["maya", "dev_dan"]).count() == 2
