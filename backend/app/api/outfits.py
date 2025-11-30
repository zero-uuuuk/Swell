"""
코디 목록 조회 관련 API 라우터.
"""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends, Header, Query, status
from sqlalchemy.orm import Session

from app.core.security import extract_bearer_token
from app.db.database import get_db
from app.schemas.recommendation_response import (
    RecommendationsResponse,
    RecommendationsResponseData,
)
from app.schemas.outfits import (
    AddFavoriteResponse,
    AddFavoriteResponseData,
    RecordViewLogRequest,
    RecordViewLogResponse,
    RecordViewLogResponseData,
    RemoveFavoriteResponse,
    RemoveFavoriteResponseData,
    SkipOutfitResponse,
    SkipOutfitResponseData,
)
from app.services.auth_service import get_user_from_token
from app.services.outfits_service import (
    add_favorite,
    get_favorite_outfits,
    get_outfits_list,
    record_view_log,
    remove_favorite,
    skip_outfit,
)

# 코디 목록 조회 관련 라우터(접두사: /outfits)
router = APIRouter(prefix="/outfits", tags=["Outfits"])

# 계절 필터 허용값
SeasonFilter = Literal["all", "spring", "summer", "fall", "winter"]

# 스타일 필터 허용값
StyleFilter = Literal["all", "casual", "street", "sporty", "minimal"]

# 성별 필터 허용값
GenderFilter = Literal["all", "male", "female"]


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    response_model=RecommendationsResponse,
)
async def get_outfits(
    season: SeasonFilter = Query(default="all", description="계절 필터"),
    style: StyleFilter = Query(default="all", description="스타일 필터"),
    gender: GenderFilter = Query(default="all", description="성별 필터"),
    page: int = Query(default=1, ge=1, description="페이지 번호"),
    limit: int = Query(default=20, ge=1, le=50, description="페이지당 개수"),
    authorization: str = Header(...),
    db: Session = Depends(get_db),
) -> RecommendationsResponse:
    """
    필터링된 코디 목록을 조회합니다.
    
    season, style, gender로 필터링할 수 있으며, 여러 필터를 동시에 사용하면
    모든 조건을 만족하는 코디만 반환됩니다.
    """
    # 헤더에서 토큰 추출
    token = extract_bearer_token(authorization)
    
    # 토큰 검증 및 사용자 조회
    user = get_user_from_token(db, token)
    
    # 코디 목록 조회
    outfits, pagination = await get_outfits_list(
        db=db,
        user_id=user.user_id,
        season=season,
        style=style,
        gender=gender,
        page=page,
        limit=limit,
    )
    
    # 응답 반환
    return RecommendationsResponse(
        data=RecommendationsResponseData(
            outfits=outfits,
            pagination=pagination,
        )
    )


@router.post(
    "/{outfit_id}/skip",
    status_code=status.HTTP_200_OK,
    response_model=SkipOutfitResponse,
)
async def skip_outfit_endpoint(
    outfit_id: int,
    authorization: str = Header(...),
    db: Session = Depends(get_db),
) -> SkipOutfitResponse:
    """
    코디를 스킵으로 기록합니다.
    
    이미 좋아요한 코디는 스킵으로 변경되지 않으며, 예외 없이 기존 레코드를 반환합니다.
    이미 스킵된 코디는 idempotent하게 처리되어 기존 레코드를 반환합니다.
    """
    # 헤더에서 토큰 추출
    token = extract_bearer_token(authorization)
    
    # 토큰 검증 및 사용자 조회
    user = get_user_from_token(db, token)
    
    # 스킵 기록
    interaction = skip_outfit(
        db=db,
        user_id=user.user_id,
        coordi_id=outfit_id,
    )
    
    # 응답 반환
    return SkipOutfitResponse(
        data=SkipOutfitResponseData(
            outfitId=interaction.coordi_id,
            isSkipped=True,
            skippedAt=interaction.interacted_at,
        )
    )


@router.post(
    "/{outfit_id}/view",
    status_code=status.HTTP_200_OK,
    response_model=RecordViewLogResponse,
)
async def record_view_log_endpoint(
    outfit_id: int,
    request: RecordViewLogRequest,
    authorization: str = Header(...),
    db: Session = Depends(get_db),
) -> RecordViewLogResponse:
    """
    코디 조회 로그를 기록합니다.
    
    같은 코디를 여러 번 볼 수 있으며, 각 조회 세션마다 새로운 레코드가 생성됩니다.
    """
    # 헤더에서 토큰 추출
    token = extract_bearer_token(authorization)
    
    # 토큰 검증 및 사용자 조회
    user = get_user_from_token(db, token)
    
    # 조회 로그 기록
    recorded_at = record_view_log(
        db=db,
        user_id=user.user_id,
        coordi_id=outfit_id,
        duration_seconds=request.duration_seconds,
    )
    
    # 응답 반환
    return RecordViewLogResponse(
        data=RecordViewLogResponseData(
            message="조회 로그가 기록되었습니다",
            recordedAt=recorded_at,
        )
    )


@router.get(
    "/favorites",
    status_code=status.HTTP_200_OK,
    response_model=RecommendationsResponse,
)
async def get_favorite_outfits_endpoint(
    page: int = Query(default=1, ge=1, description="페이지 번호"),
    limit: int = Query(default=20, ge=1, le=50, description="페이지당 개수"),
    authorization: str = Header(...),
    db: Session = Depends(get_db),
) -> RecommendationsResponse:
    """
    사용자가 좋아요한 코디 목록을 조회합니다.
    
    좋아요 추가 일시 기준으로 최신순으로 정렬됩니다.
    """
    # 헤더에서 토큰 추출
    token = extract_bearer_token(authorization)
    
    # 토큰 검증 및 사용자 조회
    user = get_user_from_token(db, token)
    
    # 좋아요한 코디 목록 조회
    outfits, pagination = await get_favorite_outfits(
        db=db,
        user_id=user.user_id,
        page=page,
        limit=limit,
    )
    
    # 응답 반환
    return RecommendationsResponse(
        data=RecommendationsResponseData(
            outfits=outfits,
            pagination=pagination,
        )
    )


@router.post(
    "/{outfit_id}/favorite",
    status_code=status.HTTP_200_OK,
    response_model=AddFavoriteResponse,
)
async def add_favorite_endpoint(
    outfit_id: int,
    authorization: str = Header(...),
    db: Session = Depends(get_db),
) -> AddFavoriteResponse:
    """
    코디에 좋아요를 추가합니다.
    
    이미 좋아요한 코디에 다시 좋아요를 추가할 수 없습니다.
    """
    # 헤더에서 토큰 추출
    token = extract_bearer_token(authorization)
    
    # 토큰 검증 및 사용자 조회
    user = get_user_from_token(db, token)
    
    # 좋아요 추가
    interaction = add_favorite(
        db=db,
        user_id=user.user_id,
        coordi_id=outfit_id,
    )
    
    # 응답 반환
    return AddFavoriteResponse(
        data=AddFavoriteResponseData(
            outfitId=interaction.coordi_id,
            isFavorited=True,
            favoritedAt=interaction.interacted_at,
        )
    )


@router.delete(
    "/{outfit_id}/favorite",
    status_code=status.HTTP_200_OK,
    response_model=RemoveFavoriteResponse,
)
async def remove_favorite_endpoint(
    outfit_id: int,
    authorization: str = Header(...),
    db: Session = Depends(get_db),
) -> RemoveFavoriteResponse:
    """
    코디 좋아요를 취소합니다.
    
    좋아요하지 않은 코디에 대해 취소 요청을 할 수 없습니다.
    """
    # 헤더에서 토큰 추출
    token = extract_bearer_token(authorization)
    
    # 토큰 검증 및 사용자 조회
    user = get_user_from_token(db, token)
    
    # 좋아요 취소
    coordi_id, unfavorited_at = remove_favorite(
        db=db,
        user_id=user.user_id,
        coordi_id=outfit_id,
    )
    
    # 응답 반환
    return RemoveFavoriteResponse(
        data=RemoveFavoriteResponseData(
            outfitId=coordi_id,
            isFavorited=False,
            unfavoritedAt=unfavorited_at,
        )
    )

