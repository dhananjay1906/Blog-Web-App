from django.db.models import Count, Q
from rest_framework import generics, mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Comment, Post, Tag
from .permissions import CanDeleteComment, IsAuthorOrReadOnly
from .serializers import (
    CommentSerializer,
    PostDetailSerializer,
    PostListSerializer,
    RegisterSerializer,
    TagSerializer,
    UserSerializer,
)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_scope = "auth"


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class PostViewSet(viewsets.ModelViewSet):
    lookup_field = "slug"
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]
    search_fields = ["title", "body"]
    ordering_fields = ["published_at", "created_at"]

    def get_queryset(self):
        user = self.request.user
        qs = (
            Post.objects.select_related("author")
            .prefetch_related("tags")
            .annotate(comment_count=Count("comments", distinct=True))
            .order_by("-published_at", "-created_at")
        )

        if self.action == "list":
            if self.request.query_params.get("mine") == "true" and user.is_authenticated:
                qs = qs.filter(author=user).order_by("-updated_at")
            else:
                qs = qs.filter(status=Post.Status.PUBLISHED)
            tag = self.request.query_params.get("tag")
            if tag:
                qs = qs.filter(tags__slug=tag)
            author = self.request.query_params.get("author")
            if author:
                qs = qs.filter(author__username__iexact=author)
            return qs

        # Drafts are only visible to the person who wrote them.
        visible = Q(status=Post.Status.PUBLISHED)
        if user.is_authenticated:
            visible |= Q(author=user)
        return qs.filter(visible)

    def get_serializer_class(self):
        return PostListSerializer if self.action == "list" else PostDetailSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        post = serializer.save()
        if post.status == Post.Status.PUBLISHED and post.published_at is None:
            post.save()

    @action(detail=True, methods=["get", "post"], permission_classes=[permissions.IsAuthenticatedOrReadOnly])
    def comments(self, request, slug=None):
        post = self.get_object()
        if request.method == "GET":
            comments = post.comments.select_related("author")
            return Response(CommentSerializer(comments, many=True).data)

        serializer = CommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(post=post, author=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CommentViewSet(mixins.DestroyModelMixin, viewsets.GenericViewSet):
    queryset = Comment.objects.select_related("post")
    permission_classes = [permissions.IsAuthenticated, CanDeleteComment]


class TagListView(generics.ListAPIView):
    serializer_class = TagSerializer
    pagination_class = None
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return (
            Tag.objects.annotate(post_count=Count("posts", filter=Q(posts__status=Post.Status.PUBLISHED)))
            .filter(post_count__gt=0)
            .order_by("-post_count", "name")
        )
