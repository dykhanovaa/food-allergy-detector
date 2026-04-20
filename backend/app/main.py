import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import admin, auth, scans, seo, users
from app.api.routes.allergy_routes import router as allergy_router
from app.core.config import settings
from app.core.storage import check_storage_connection
from app.db.database import Base, check_db_connection, engine

app = FastAPI(title="Food Allergy Detector API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    last_error = None
    for _ in range(settings.DB_CONNECT_MAX_RETRIES):
        try:
            check_db_connection()
            Base.metadata.create_all(bind=engine)
            if settings.APP_ENV != "test":
                check_storage_connection()
            return
        except Exception as exc:
            last_error = exc
            time.sleep(settings.DB_CONNECT_RETRY_DELAY)

    raise RuntimeError(f"Application dependencies are not ready: {last_error}")


@app.get("/health/live", tags=["Health"])
def liveness_probe() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/ready", tags=["Health"])
def readiness_probe() -> dict[str, str]:
    check_db_connection()
    if settings.APP_ENV != "test":
        check_storage_connection()
    return {"status": "ready"}


app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(scans.router, prefix="/api/scans", tags=["Scans"])
app.include_router(allergy_router)
app.include_router(seo.router)
