"""FastAPI main application entrypoint for ZentroMart Customer Support Agent."""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.api import health, chat, conversations, orders, tickets, knowledge, evaluation, voice, tinyfish

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("zentromart-backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    logger.info(f"Dataset path: {settings.DATASET_DIR}")
    logger.info(f"Reference date: {settings.REFERENCE_DATE}")
    yield
    logger.info(f"Shutting down {settings.PROJECT_NAME}")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise AI Customer Support Agent for ZentroMart (FTTT Capstone 2026)",
    lifespan=lifespan,
)

# CORS Middleware with explicit origins and regex for all Vercel apps & localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.FRONTEND_ORIGINS,
    allow_origin_regex=r"^(https?://(localhost|127\.0\.0\.1)(:\d+)?|https://.*\.vercel\.app)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Root"])
def root_endpoint():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "documentation": "/docs",
        "openapi_spec": "/openapi.json",
        "health": "/health",
        "integrations": "/api/health/integrations",
        "frontend": "https://zentro-mart-ai.vercel.app",
    }

@app.get("/api/docs", include_in_schema=False)
def redirect_to_docs():
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/docs")

@app.get("/api/openapi.json", include_in_schema=False)
def redirect_to_openapi():
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/openapi.json")

# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global unhandled exception on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "An internal server error occurred.", "path": request.url.path},
    )

# Include API Routers
app.include_router(health.router)
app.include_router(chat.router)
app.include_router(conversations.router)
app.include_router(orders.router)
app.include_router(tickets.router)
app.include_router(knowledge.router)
app.include_router(evaluation.router)
app.include_router(voice.router)
app.include_router(tinyfish.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
