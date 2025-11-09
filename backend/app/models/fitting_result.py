"""
가상 피팅 결과(FittingResult) 엔티티 모델.

사용자와 아이템의 조합으로 생성된 가상 피팅 수행 내역을 기록한다.
"""

from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base


class FittingResult(Base):
    """`Fitting_Results` 테이블 모델."""

    __tablename__ = "Fitting_Results"

    fitting_id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(
        BigInteger,
        ForeignKey("Users.user_id", ondelete="CASCADE"),
        nullable=False,
    )
    item_id = Column(
        BigInteger,
        ForeignKey("Items.item_id", ondelete="CASCADE"),
        nullable=False,
        comment="어떤 아이템을 피팅했는지",
    )
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (Index("idx_fitting_results_user_item", "user_id", "item_id"),)

    user = relationship(
        "User",
        back_populates="fitting_results",
        passive_deletes=True,
    )
    item = relationship(
        "Item",
        back_populates="fitting_results",
        passive_deletes=True,
    )
    images = relationship(
        "FittingResultImage",
        back_populates="fitting_result",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"FittingResult(fitting_id={self.fitting_id}, user_id={self.user_id}, item_id={self.item_id})"

