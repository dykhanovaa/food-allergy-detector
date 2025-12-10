# app/api/models/user_models.py

from pydantic import BaseModel
from typing import List

class AllergyIdList(BaseModel):
    allergy_ids: List[int]

class UserProfileResponse(BaseModel):
    email: str
    name: str 
    allergies: List[str]