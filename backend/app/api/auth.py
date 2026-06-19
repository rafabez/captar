from fastapi import APIRouter, Depends
from ..core.deps import require_user
from ..models.user import User
from ..schemas import UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(require_user)):
    return current_user
