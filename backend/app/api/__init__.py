from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.items import router as items_router

api_router = APIRouter()

# 인증 관련 라우터
api_router.include_router(auth_router)

# 아이템 관련 라우터
api_router.include_router(items_router)

__all__ = ["api_router"]


