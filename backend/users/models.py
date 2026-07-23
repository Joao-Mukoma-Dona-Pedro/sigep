from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('O e-mail e obrigatorio.')

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Role.PEDAGOGICAL_DIRECTOR)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superutilizador deve ter is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superutilizador deve ter is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    class Role(models.TextChoices):
        PEDAGOGICAL_DIRECTOR = 'PEDAGOGICAL_DIRECTOR', 'Subdiretor Pedagogico'

    username = None
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150)
    role = models.CharField(
        max_length=40,
        choices=Role.choices,
        default=Role.PEDAGOGICAL_DIRECTOR,
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    objects = UserManager()

    @property
    def is_pedagogical_admin(self):
        return self.role == self.Role.PEDAGOGICAL_DIRECTOR

    def __str__(self):
        return self.email
