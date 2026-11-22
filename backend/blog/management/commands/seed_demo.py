from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from blog.models import Comment, Post, Tag

User = get_user_model()

POSTS = [
    (
        "maya",
        "What I learned moving a side project from SQLite to Postgres",
        ["postgres", "django"],
        """SQLite got me surprisingly far. The trouble started when two background jobs tried to write at the same time.

## What actually changed

- **Migrations:** Django handled almost all of it. The only manual step was a `JSONField` default.
- **Full-text search:** I swapped my `icontains` hack for `SearchVector`, and results got noticeably better.
- **Connection pooling:** `CONN_MAX_AGE=60` cut request time by about 30ms on my tiny VPS.

## Would I do it again?

Yes, but later than I did. SQLite is perfect until it isn't, and you'll know when that happens.""",
    ),
    (
        "dev_dan",
        "Next.js server components, explained with a coffee order",
        ["nextjs", "react"],
        """Think of a server component as the barista who preps everything behind the counter. The client component is the bit you interact with: the cup you pick up and sip.

The menu page is rendered on the server, so it's fast and needs no JavaScript. The **order button** is a client component, because it has to react to your clicks.

```tsx
// runs on the server
export default async function Menu() {
  const drinks = await getDrinks()
  return <DrinkList drinks={drinks} />
}
```

Keep the interactive bits small and push everything else to the server.""",
    ),
    (
        "maya",
        "Five REST API habits that saved me debugging time",
        ["api", "django"],
        """1. **Return the object after a write.** The client doesn't need a second request.
2. **Use slugs in URLs.** `/posts/my-first-post` beats `/posts/42` for humans and logs.
3. **Paginate from day one.** Adding it later breaks clients.
4. **Make permissions object-level.** Authors edit their own posts, and nobody else's.
5. **Write the test before the bug report.** Future you says thanks.""",
    ),
    (
        "dev_dan",
        "Tailwind felt wrong for a week, then it clicked",
        ["css", "tailwind"],
        """My first reaction was that this is just inline styles with extra steps.

After a week, I stopped jumping between files. The design lives right where the markup is, and the constraints (a spacing scale, a colour palette) keep things consistent without a design-system meeting.

It's not for every project. For anything I'm building alone, though, it's now the default.""",
    ),
]


class Command(BaseCommand):
    help = "Create a few demo users, posts and comments (idempotent)."

    def handle(self, *args, **options):
        users = {}
        for name in ("maya", "dev_dan"):
            user, created = User.objects.get_or_create(username=name, defaults={"email": f"{name}@example.com"})
            if created:
                user.set_password("demo-pass-123")
                user.save()
            users[name] = user

        for author, title, tags, body in POSTS:
            post, created = Post.objects.get_or_create(
                title=title, defaults={"author": users[author], "body": body}
            )
            if created:
                post.tags.set([Tag.objects.get_or_create(name=t)[0] for t in tags])

        first = Post.objects.filter(title=POSTS[0][1]).first()
        if first and not first.comments.exists():
            Comment.objects.create(post=first, author=users["dev_dan"], body="The CONN_MAX_AGE tip is underrated. Same thing happened to me.")
            Comment.objects.create(post=first, author=users["maya"], body="Right? Such a small change for that much difference.")

        self.stdout.write(self.style.SUCCESS("Demo data ready. Log in as maya / demo-pass-123"))
