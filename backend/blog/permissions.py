from rest_framework import permissions


class IsAuthorOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.author_id == request.user.id


class CanDeleteComment(permissions.BasePermission):
    """The commenter or the post's author can remove a comment."""

    def has_object_permission(self, request, view, obj):
        return request.user.id in (obj.author_id, obj.post.author_id)
