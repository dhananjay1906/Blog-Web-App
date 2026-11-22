from django.contrib import admin

from .models import Comment, Post, Tag


class CommentInline(admin.TabularInline):
    model = Comment
    extra = 0
    readonly_fields = ["author", "created_at"]


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ["title", "author", "status", "published_at"]
    list_filter = ["status", "tags"]
    search_fields = ["title", "body"]
    prepopulated_fields = {"slug": ["title"]}
    filter_horizontal = ["tags"]
    inlines = [CommentInline]


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ["name", "slug"]
    prepopulated_fields = {"slug": ["name"]}


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ["author", "post", "created_at"]
