from dotenv import load_dotenv
import os

load_dotenv()

class Settings:
    PROJECT_NAME = "Food Allergy Detector"
    API_PREFIX = "/api"
    PORT = os.getenv("PORT", 8000)

settings = Settings()
