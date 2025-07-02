from pydantic import BaseModel
from typing import List

class PollOption(BaseModel):
    id:int
    text:str
    votes:int=0
    
class Poll(BaseModel):
    id:int
    question:str
    options:List[PollOption]

