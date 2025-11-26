from fastapi import FastAPI
from app.api.routes import auth, users, scans
from app.api.routes.allergy_routes import router as allergy_router

app = FastAPI(title="Food Allergy Detector API")

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(scans.router, prefix="/api/scans", tags=["Scans"])
app.include_router(allergy_router)

@app.get("/")
def root():
    return {"message": "Server is running!"}
