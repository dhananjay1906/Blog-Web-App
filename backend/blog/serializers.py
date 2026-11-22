import re

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.utils.text import slugify
from rest_framework import serializers

from .models import Comment, Post, Tag

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("That username is taken.")
        return value

    def validate(self, attrs):
        validate_password(attrs["password"], User(username=attrs["username"], email=attrs.get("email", "")))
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class TagSerializer(serializers.ModelSerializer):
    post_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Tag
        fields = ["name", "slug", "post_count"]


class PostListSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    tags = serializers.SlugRelatedField(many=True, read_only=True, slug_field="name")
    excerpt = serializers.SerializerMethodField()
    comment_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Post
        fields = [
            "id", "slug", "title", "excerpt", "author", "tags", "status",
            "reading_time", "comment_count", "published_at", "created_at", "updated_at",
        ]

    def get_excerpt(self, obj):
        # Strip the most common markdown so the card preview reads as plain text.
        text = re.sub(r"```.*?```", "", obj.body, flags=re.S)
        text = re.sub(r"[#>*_`\[\]]|\(http[^)]*\)", "", text)
        text = " ".join(text.split())
        return text[:180] + ("…" if len(text) > 180 else "")


class PostDetailSerializer(PostListSerializer):
    tag_names = serializers.ListField(
        child=serializers.CharField(max_length=30), write_only=True, required=False, max_length=5
    )

    class Meta(PostListSerializer.Meta):
        fields = PostListSerializer.Meta.fields + ["body", "tag_names"]
        read_only_fields = ["slug"]

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError("Title can't be empty.")
        return value.strip()

    def _set_tags(self, post, names):
        tags = []
        for name in {n.strip().lower() for n in names if n.strip()}:
            tag, _ = Tag.objects.get_or_create(slug=slugify(name), defaults={"name": name})
            tags.append(tag)
        post.tags.set(tags)

    def create(self, validated_data):
        names = validated_data.pop("tag_names", [])
        post = Post.objects.create(**validated_data)
        self._set_tags(post, names)
        return post

    def update(self, instance, validated_data):
        names = validated_data.pop("tag_names", None)
        post = super().update(instance, validated_data)
        if names is not None:
            self._set_tags(post, names)
        return post


class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "author", "body", "created_at"]

    def validate_body(self, value):
        if not value.strip():
            raise serializers.ValidationError("Comment can't be empty.")
        return value.strip()
