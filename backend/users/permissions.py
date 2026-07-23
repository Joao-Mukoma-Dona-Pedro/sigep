from rest_framework.permissions import BasePermission


class IsPedagogicalAdmin(BasePermission):
    message = 'Acesso permitido apenas ao Subdiretor Pedagogico.'

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_pedagogical_admin)
