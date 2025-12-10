from pydantic import BaseModel

class AllergyCreate(BaseModel):
    name: str

class AllergyOut(BaseModel):
    id: int
    name: str

    class Config:
        orm_mode = True
