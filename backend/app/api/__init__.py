from .auth import router as auth_router
from .projects import router as projects_router
from .editais import router as editais_router
from .user import router as user_router

__all__ = ["auth_router", "projects_router", "editais_router", "user_router"]
