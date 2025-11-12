from fastapi import FastAPI

from app import models
from app.core import register_exception_handlers
from app.db.database import Base, engine

# 데이터베이스 테이블 생성
# 모든 모델 클래스 검사 + 존재하지 않는 테이블 생성
def init_db():
    """데이터베이스 테이블 초기화"""
    Base.metadata.create_all(bind=engine)

# 애플리케이션 생성
app = FastAPI(
    title="HCI Fashion Recommendation API",
    description="Fashion Recommendation Application for HCI Lecture",
    version="1.0.0"
)

register_exception_handlers(app)


# 시작 시 데이터베이스 초기화
@app.on_event("startup")
async def startup_event():
    init_db()


@app.get("/")
async def root():
    return {"message": "HCI Fashion Recommendation API is running!"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}

