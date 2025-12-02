"""description embedding

Revision ID: b98884439c49
Revises: 797fa3bd0d20
Create Date: 2025-12-02 11:06:12.297536

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b98884439c49'
down_revision: Union[str, None] = '797fa3bd0d20'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # pgvector 확장 활성화
    op.execute('CREATE EXTENSION IF NOT EXISTS vector')
    
    # description_embedding 컬럼 추가 (512차원 벡터)
    op.execute("""
        ALTER TABLE "Coordis" 
        ADD COLUMN description_embedding vector(512)
    """)
    
    # 벡터 검색을 위한 인덱스 생성 (코사인 유사도 검색용)
    # ivfflat 인덱스는 데이터가 많을 때 성능 향상
    # lists 파라미터는 데이터 양에 따라 조정 (일반적으로 sqrt(총_레코드_수))
    op.execute("""
        CREATE INDEX idx_coordis_embedding ON "Coordis" 
        USING ivfflat (description_embedding vector_cosine_ops)
        WITH (lists = 100)
    """)


def downgrade() -> None:
    # 인덱스 삭제
    op.drop_index('idx_coordis_embedding', table_name='Coordis')
    
    # 컬럼 삭제
    op.drop_column('Coordis', 'description_embedding')
    
    # 주의: pgvector 확장은 제거하지 않음 (다른 곳에서 사용할 수 있음)
