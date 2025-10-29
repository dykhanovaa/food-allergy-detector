from fastapi import FastAPI
from app.api.routes import auth, users, scans

app = FastAPI(title="Food Allergy Detector API")

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(scans.router, prefix="/api/scans", tags=["Scans"])

@app.get("/")
def root():
    return {"message": "Server is running!"}
