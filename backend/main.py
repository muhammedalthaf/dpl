from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from config import settings
from database import connect_to_mongo, close_mongo_connection

# Import routes
from routes import players, teams, bids, auction, registrations

# Create upload directories
UPLOAD_BASE_DIR = "/tmp/cvcl_uploads"
os.makedirs(f"{UPLOAD_BASE_DIR}/teams", exist_ok=True)
os.makedirs(f"{UPLOAD_BASE_DIR}/registrations", exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB
    await connect_to_mongo()
    print("✅ Application startup complete")
    yield
    # Shutdown: Close MongoDB connection
    await close_mongo_connection()
    print("✅ Application shutdown complete")


# Create FastAPI app
app = FastAPI(
    title=settings.API_TITLE,
    description=settings.API_DESCRIPTION,
    version=settings.API_VERSION,
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": settings.API_TITLE,
        "version": settings.API_VERSION,
    }


# API Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """API Root endpoint"""
    return {
        "message": "Welcome to Calcutta Cricket League API",
        "version": settings.API_VERSION,
        "docs": "/docs",
        "endpoints": {
            "players": "/api/players",
            "teams": "/api/teams",
            "bids": "/api/bids",
            "auction": "/api/auction",
            "registrations": "/api/registrations",
        },
    }


# Include routers
app.include_router(players.router, prefix="/api")
app.include_router(teams.router, prefix="/api")
app.include_router(bids.router, prefix="/api")
app.include_router(auction.router, prefix="/api")
app.include_router(registrations.router, prefix="/api")

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=UPLOAD_BASE_DIR), name="uploads")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
