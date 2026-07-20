"""
Main FastAPI Application
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from app.core.config import settings
from app.core.database import async_engine, Base, AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.api import auth, faceswap, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup: Create tables and superadmin
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create superadmin if not exists
    async with AsyncSessionLocal() as db:
        from sqlalchemy import select
        result = await db.execute(
            select(User).where(User.email == settings.SUPERADMIN_EMAIL)
        )
        if not result.scalar_one_or_none():
            superadmin = User(
                email=settings.SUPERADMIN_EMAIL,
                username="superadmin",
                hashed_password=get_password_hash(settings.SUPERADMIN_PASSWORD),
                is_admin=True,
                is_superadmin=True,
                is_verified=True,
                role="superadmin",
                video_quota=9999,
                image_quota=9999
            )
            db.add(superadmin)
            await db.commit()
            print(f"Superadmin created: {settings.SUPERADMIN_EMAIL}")
    
    yield
    
    # Shutdown
    await async_engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Face Swap Ecosystem API",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(faceswap.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
