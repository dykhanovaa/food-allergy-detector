from dotenv import load_dotenv
import os

load_dotenv()

class Settings:
    PROJECT_NAME = "Food Allergy Detector"
    API_PREFIX = "/api"
    PORT = int(os.getenv("PORT", 8000))
    SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-jwt-key-change-in-production")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30

settings = Settings()