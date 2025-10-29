from pydantic import BaseModel

class Allergy(BaseModel):
    allergy: str
