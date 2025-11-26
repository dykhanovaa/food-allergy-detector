from pydantic import BaseModel

class Allergy(BaseModel):
    id: int
    name: str
