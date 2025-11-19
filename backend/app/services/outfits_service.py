"""
코디 목록 조회 관련 비즈니스 로직.
"""

from __future__ import annotations

from typing import Literal

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.coordi import Coordi
from app.models.coordi_item import CoordiItem
from app.models.item import Item
from app.models.user_closet_item import UserClosetItem
from app.models.user_coordi_interaction import UserCoordiInteraction
from app.models.user_coordi_view_log import UserCoordiViewLog
from app.schemas.recommendation_response import (
    OutfitItemPayload,
    OutfitPayload,
    PaginationPayload,
)

# 필터 타입 정의
SeasonFilter = Literal["all", "spring", "summer", "fall", "winter"]
StyleFilter = Literal["all", "casual", "street", "sporty", "minimal"]
GenderFilter = Literal["all", "male", "female"]


def _build_item_payload_list(
    item: Item,
    user_id: int,
    user_closet_item_ids: set[int],
) -> OutfitItemPayload:
    """
    아이템 페이로드를 생성합니다.
    
    Parameters
    ----------
    item:
        아이템 모델
    user_id:
        사용자 ID
    user_closet_item_ids:
        사용자가 저장한 아이템 ID 집합
        
    Returns
    -------
    OutfitItemPayload:
        아이템 페이로드
    """
    # 메인 이미지 추출 (is_main=True 우선, 없으면 첫 번째 이미지)
    main_image = next(
        (img for img in item.images if img.is_main),
        item.images[0] if item.images else None
    )
    image_url = main_image.image_url if main_image else None
    
    # isSaved 체크
    is_saved = item.item_id in user_closet_item_ids
    
    # price 변환 (Numeric → int, 원 단위)
    price = int(float(item.price)) if item.price is not None else None
    
    return OutfitItemPayload(
        id=item.item_id,
        category=item.category,
        brand=item.brand_name_ko,
        name=item.item_name,
        price=price,
        imageUrl=image_url,
        purchaseUrl=item.purchase_url,
        isSaved=is_saved,
    )


def _build_outfit_payload_list(
    coordi: Coordi,
    user_id: int,
    user_favorited_coordi_ids: set[int],
    user_closet_item_ids: set[int],
) -> OutfitPayload:
    """
    코디 페이로드를 생성합니다 (LLM 메시지 없음).
    
    Parameters
    ----------
    coordi:
        코디 모델
    user_id:
        사용자 ID
    user_favorited_coordi_ids:
        사용자가 좋아요한 코디 ID 집합
    user_closet_item_ids:
        사용자가 저장한 아이템 ID 집합
        
    Returns
    -------
    OutfitPayload:
        코디 페이로드 (llmMessage는 None)
    """
    # 메인 이미지 추출 (is_main=True 우선, 없으면 첫 번째 이미지)
    main_image = next(
        (img for img in coordi.images if img.is_main),
        coordi.images[0] if coordi.images else None
    )
    if main_image is None:
        raise ValueError(f"Coordi {coordi.coordi_id} has no images")
    
    # isFavorited 체크
    is_favorited = coordi.coordi_id in user_favorited_coordi_ids
    
    # 아이템 페이로드 생성
    items = [
        _build_item_payload_list(coordi_item.item, user_id, user_closet_item_ids)
        for coordi_item in coordi.coordi_items
    ]
    
    return OutfitPayload(
        id=coordi.coordi_id,
        imageUrl=main_image.image_url,
        gender=coordi.gender,
        season=coordi.season,
        style=coordi.style,
        description=coordi.description or "",
        isFavorited=is_favorited,
        llmMessage=None,  # 목록 조회에서는 LLM 메시지 없음
        items=items,
        createdAt=coordi.created_at,
    )


async def get_outfits_list(
    db: Session,
    user_id: int,
    season: SeasonFilter = "all",
    style: StyleFilter = "all",
    gender: GenderFilter = "all",
    page: int = 1,
    limit: int = 10,
) -> tuple[list[OutfitPayload], PaginationPayload]:
    """
    필터링된 코디 목록을 조회합니다.
    
    Parameters
    ----------
    db:
        데이터베이스 세션
    user_id:
        사용자 ID
    season:
        계절 필터 ("all"이면 필터링 안 함)
    style:
        스타일 필터 ("all"이면 필터링 안 함)
    gender:
        성별 필터 ("all"이면 필터링 안 함)
    page:
        페이지 번호 (1부터 시작)
    limit:
        페이지당 개수
        
    Returns
    -------
    tuple[list[OutfitPayload], PaginationPayload]:
        (코디 페이로드 리스트, 페이지네이션 정보)
    """
    # 1. 사용자가 이미 본 코디 또는 상호작용한 코디 ID 조회 (제외할 코디)
    viewed_coordi_ids = db.execute(
        select(UserCoordiViewLog.coordi_id)
        .where(UserCoordiViewLog.user_id == user_id)
    ).scalars().all()
    
    interacted_coordi_ids = db.execute(
        select(UserCoordiInteraction.coordi_id)
        .where(UserCoordiInteraction.user_id == user_id)
    ).scalars().all()
    
    # 두 집합 합치기 (중복 제거)
    excluded_coordi_ids = set(viewed_coordi_ids) | set(interacted_coordi_ids)
    
    # 2. 필터링 쿼리 구성
    query = select(Coordi)
    
    if season != "all":
        query = query.where(Coordi.season == season)
    if style != "all":
        query = query.where(Coordi.style == style)
    if gender != "all":
        query = query.where(Coordi.gender == gender)
    
    # 이미 본 코디 또는 상호작용한 코디 제외
    if excluded_coordi_ids:
        query = query.where(Coordi.coordi_id.notin_(excluded_coordi_ids))
    
    # 3. 전체 개수 조회 (페이지네이션용)
    count_query = select(func.count(Coordi.coordi_id))
    if season != "all":
        count_query = count_query.where(Coordi.season == season)
    if style != "all":
        count_query = count_query.where(Coordi.style == style)
    if gender != "all":
        count_query = count_query.where(Coordi.gender == gender)
    
    # 이미 본 코디 또는 상호작용한 코디 제외
    if excluded_coordi_ids:
        count_query = count_query.where(Coordi.coordi_id.notin_(excluded_coordi_ids))
    
    total_items = db.execute(count_query).scalar_one()
    
    # 결과가 없으면 빈 결과 반환
    if total_items == 0:
        return [], PaginationPayload(
            currentPage=page,
            totalPages=0,
            totalItems=0,
            hasNext=False,
            hasPrev=False,
        )
    
    # 4. 페이지네이션 적용 및 정렬
    offset = (page - 1) * limit
    coordis = db.execute(
        query
        .order_by(Coordi.created_at.desc())
        .offset(offset)
        .limit(limit)
        .options(
            selectinload(Coordi.images),
            selectinload(Coordi.coordi_items).selectinload(CoordiItem.item).selectinload(Item.images),
        )
    ).scalars().all()
    
    # 5. 사용자별 isFavorited 체크
    coordi_ids = [coordi.coordi_id for coordi in coordis]
    favorited_interactions = db.execute(
        select(UserCoordiInteraction)
        .where(
            UserCoordiInteraction.user_id == user_id,
            UserCoordiInteraction.coordi_id.in_(coordi_ids),
            UserCoordiInteraction.action_type == "like",
        )
    ).scalars().all()
    user_favorited_coordi_ids = {interaction.coordi_id for interaction in favorited_interactions}
    
    # 6. 사용자별 isSaved 체크 (UserClosetItem 존재 여부)
    all_item_ids = set()
    for coordi in coordis:
        for coordi_item in coordi.coordi_items:
            all_item_ids.add(coordi_item.item_id)
    
    closet_items = db.execute(
        select(UserClosetItem)
        .where(
            UserClosetItem.user_id == user_id,
            UserClosetItem.item_id.in_(all_item_ids),
        )
    ).scalars().all()
    user_closet_item_ids = {item.item_id for item in closet_items}
    
    # 7. 페이로드 생성
    outfits = [
        _build_outfit_payload_list(
            coordi,
            user_id,
            user_favorited_coordi_ids,
            user_closet_item_ids,
        )
        for coordi in coordis
    ]
    
    # 8. 페이지네이션 정보 계산
    total_pages = (total_items + limit - 1) // limit if total_items > 0 else 0
    has_next = page < total_pages
    has_prev = page > 1
    
    pagination = PaginationPayload(
        currentPage=page,
        totalPages=total_pages,
        totalItems=total_items,
        hasNext=has_next,
        hasPrev=has_prev,
    )
    
    return outfits, pagination


def skip_outfits(
    db: Session,
    user_id: int,
    coordi_ids: list[int],
) -> tuple[int, int]:
    """
    사용자가 본 코디들을 스킵으로 기록합니다.
    
    Parameters
    ----------
    db:
        데이터베이스 세션
    user_id:
        사용자 ID
    coordi_ids:
        스킵할 코디 ID 리스트
        
    Returns
    -------
    tuple[int, int]:
        (recorded_count, skipped_count)
        - recorded_count: 새로 기록된 코디 개수
        - skipped_count: 이미 기록된 코디 개수 (like 또는 skip)
    """
    if not coordi_ids:
        return 0, 0
    
    # 1. 이미 like로 기록된 코디 조회 (제외 대상)
    existing_likes = db.execute(
        select(UserCoordiInteraction)
        .where(
            UserCoordiInteraction.user_id == user_id,
            UserCoordiInteraction.coordi_id.in_(coordi_ids),
            UserCoordiInteraction.action_type == "like",
        )
    ).scalars().all()
    liked_coordi_ids = {interaction.coordi_id for interaction in existing_likes}
    
    # 2. 이미 skip으로 기록된 코디 조회 (중복 체크용)
    existing_skips = db.execute(
        select(UserCoordiInteraction)
        .where(
            UserCoordiInteraction.user_id == user_id,
            UserCoordiInteraction.coordi_id.in_(coordi_ids),
            UserCoordiInteraction.action_type == "skip",
        )
    ).scalars().all()
    skipped_coordi_ids = {interaction.coordi_id for interaction in existing_skips}
    
    # 3. 새로운 skip 기록 생성 (like도 skip도 아닌 코디만)
    new_skip_coordi_ids = [
        coordi_id
        for coordi_id in coordi_ids
        if coordi_id not in liked_coordi_ids and coordi_id not in skipped_coordi_ids
    ]
    
    if new_skip_coordi_ids:
        new_interactions = [
            UserCoordiInteraction(
                user_id=user_id,
                coordi_id=coordi_id,
                action_type="skip",
            )
            for coordi_id in new_skip_coordi_ids
        ]
        db.add_all(new_interactions)
        db.commit()
    
    # 4. 카운트 계산
    recorded_count = len(new_skip_coordi_ids)
    skipped_count = len(liked_coordi_ids) + len(skipped_coordi_ids)
    
    return recorded_count, skipped_count

