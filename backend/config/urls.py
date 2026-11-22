from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from blog.views import CommentViewSet, MeView, PostViewSet, RegisterView, TagListView

router = DefaultRouter()
router.trailing_slash = "/?"  # accept /api/posts and /api/posts/
router.register("posts", PostViewSet, basename="post")
router.register("comments", CommentViewSet, basename="comment")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health", lambda request: JsonResponse({"status": "ok"})),
    path("api/auth/register", RegisterView.as_view()),
    path("api/auth/token", TokenObtainPairView.as_view()),
    path("api/auth/token/refresh", TokenRefreshView.as_view()),
    path("api/auth/me", MeView.as_view()),
    path("api/tags", TagListView.as_view()),
    path("api/", include(router.urls)),
]
