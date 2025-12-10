from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth, users, scans
from app.api.routes.allergy_routes import router as allergy_router
from app.db.database import Base, engine

app = FastAPI(title="Food Allergy Detector API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(scans.router, prefix="/api/scans", tags=["Scans"])
app.include_router(allergy_router)