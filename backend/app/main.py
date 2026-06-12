import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.routes.games import router as games_router
from backend.app.config import get_settings

settings = get_settings()
logger = logging.getLogger("boardarena")

app = FastAPI(title=settings.app_name, version=settings.app_version)

# Defaults support local Vite development. Set ALLOWED_ORIGINS to exact deployed
# frontend origins for production, for example: https://boardarena.example.com
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.allowed_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def health_payload() -> dict[str, str]:
    return {
        "status": "ok",
        "app": settings.app_name,
        "environment": settings.environment,
        "version": settings.app_version,
    }


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return health_payload()


@app.get("/api/health")
def api_healthcheck() -> dict[str, str]:
    return health_payload()


@app.get("/_backend/health")
def prefixed_healthcheck() -> dict[str, str]:
    return health_payload()


@app.get("/_backend/api/health")
def prefixed_api_healthcheck() -> dict[str, str]:
    return health_payload()


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled API error for %s %s", request.method, request.url.path, exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "The BoardArena API hit an unexpected error. Please try again."},
    )


app.include_router(games_router)
app.include_router(games_router, prefix="/_backend")
