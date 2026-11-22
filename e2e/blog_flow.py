"""Browser test for the main flows. Needs the API on :8000 and Next.js on :3000.

    python e2e/blog_flow.py [base_url] [screenshot_dir]
"""

import sys
import uuid
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
SHOTS = Path(sys.argv[2]) if len(sys.argv) > 2 else None
run = uuid.uuid4().hex[:6]


def register(page, name):
    page.goto(f"{BASE}/register")
    page.get_by_label("Username").fill(name)
    page.get_by_label("Password").fill("a-long-password-1")
    page.get_by_role("button", name="Create account").click()
    expect(page.get_by_role("link", name="Write", exact=True)).to_be_visible()


with sync_playwright() as p:
    browser = p.chromium.launch()
    alice = browser.new_context(viewport={"width": 1280, "height": 860}).new_page()
    bob = browser.new_context(viewport={"width": 1280, "height": 860}).new_page()
    errors = []
    for pg in (alice, bob):
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.on("dialog", lambda d: d.accept())

    # protected page redirects to login
    alice.goto(f"{BASE}/write")
    expect(alice).to_have_url(f"{BASE}/login?next=%2Fwrite")

    register(alice, f"alice_{run}")
    register(bob, f"bob_{run}")

    # write a post with markdown + tags, check the preview tab
    title = f"Testing the editor {run}"
    alice.get_by_role("link", name="Write", exact=True).click()
    alice.get_by_label("Title").fill(title)
    alice.get_by_label("Tags").fill("testing, e2e")
    alice.get_by_label("Body").fill("## A heading\n\nSome **bold** text and a list:\n\n- one\n- two")
    alice.get_by_role("button", name="preview").click()
    expect(alice.locator(".prose h2")).to_have_text("A heading")
    alice.get_by_role("button", name="Publish").click()
    expect(alice.get_by_role("heading", level=1)).to_have_text(title)
    expect(alice.locator(".prose strong")).to_have_text("bold")
    post_url = alice.url

    # shows on the home page, searchable and filterable by tag
    bob.goto(f"{BASE}/?q={run}")
    expect(bob.get_by_role("heading", name=title)).to_be_visible()
    bob.goto(f"{BASE}/?tag=e2e")
    expect(bob.get_by_role("heading", name=title)).to_be_visible()

    # someone else can read and comment but not edit
    bob.goto(post_url)
    expect(bob.get_by_role("link", name="Edit", exact=True)).to_have_count(0)
    bob.get_by_label("Write a comment").fill("Great write-up!")
    bob.get_by_role("button", name="Post comment").click()
    expect(bob.locator("#comments-title")).to_contain_text("(1)")
    alice.reload()
    expect(alice.get_by_text("Great write-up!")).to_be_visible()

    # the author edits the post
    alice.get_by_role("link", name="Edit", exact=True).click()
    alice.get_by_label("Title").fill(title + " (edited)")
    alice.get_by_role("button", name="Update post").click()
    expect(alice.get_by_role("heading", level=1)).to_have_text(title + " (edited)")

    # drafts stay private
    alice.goto(f"{BASE}/write")
    alice.get_by_label("Title").fill(f"Secret draft {run}")
    alice.get_by_label("Body").fill("not ready yet")
    alice.get_by_role("button", name="Save draft").click()
    expect(alice).to_have_url(f"{BASE}/me")
    expect(alice.get_by_text(f"Secret draft {run}")).to_be_visible()
    bob.goto(f"{BASE}/?q=Secret")
    expect(bob.get_by_text(f"Secret draft {run}")).to_have_count(0)

    # delete
    alice.goto(post_url)
    alice.get_by_role("button", name="Delete").first.click()
    expect(alice).to_have_url(f"{BASE}/")
    bob.goto(post_url)
    expect(bob.get_by_text("404")).to_be_visible()

    if SHOTS:
        SHOTS.mkdir(parents=True, exist_ok=True)
        guest = browser.new_context(viewport={"width": 1280, "height": 900}).new_page()
        guest.goto(BASE)
        guest.wait_for_timeout(300)
        guest.screenshot(path=SHOTS / "home.png")
        guest.get_by_role("heading", name="What I learned moving a side project").click()
        expect(guest.get_by_text("Great")).to_have_count(0)
        guest.wait_for_timeout(300)
        guest.screenshot(path=SHOTS / "post.png", full_page=True)

    assert not errors, errors
    browser.close()
    print("E2E passed: auth guard, register, write + preview, search, tags, comments, edit, drafts, delete")
