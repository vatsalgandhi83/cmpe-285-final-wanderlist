from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime

# --- Items ---
class ItemResponse(BaseModel):
    id: int
    label: str
    description: str
    image_url: str
    category: str | None = None

    class Config:
        from_attributes = True

# --- Votes ---
class VoteRequest(BaseModel):
    item_id: int = Field(..., alias="itemId")
    choice: Literal["yes", "no"]
    session_id: str = Field(..., alias="sessionId")
    decision_time_ms: int | None = Field(None, alias="decisionTimeMs", ge=0)

    class Config:
        populate_by_name = True

class VoteResponse(BaseModel):
    message: str
    item_id: int
    choice: str

# --- Results ---
class ItemResult(BaseModel):
    item_id: int
    label: str
    image_url: str
    yes_count: int
    no_count: int
    total_votes: int
    yes_percentage: float

class ResultsResponse(BaseModel):
    results: list[ItemResult]
    total_users: int

# --- Personal Results ---
class MyVote(BaseModel):
    item_id: int
    choice: str
    decision_time_ms: int | None

class MyResultsResponse(BaseModel):
    votes: list[MyVote]
    total: int

class UndoResponse(BaseModel):
    message: str
    item: ItemResponse

class UserAnalytics(BaseModel):
    total_swipes: int
    yes_count: int
    no_count: int
    yes_ratio: float
    avg_decision_ms: float | None
    fastest_ms: int | None
    slowest_ms: int | None
