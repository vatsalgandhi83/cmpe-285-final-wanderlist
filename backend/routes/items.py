from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from database import get_db
from models import Item, Vote
from schemas import ItemResponse

router = APIRouter(tags=["items"])

@router.get("/items", response_model=List[ItemResponse])
async def get_items(
    session_id: Optional[str] = Query(None, alias="sessionId"),
    db: AsyncSession = Depends(get_db)
):
    query = select(Item)
    if session_id:
        voted_subquery = select(Vote.item_id).where(Vote.session_id == session_id)
        query = query.where(Item.id.not_in(voted_subquery))
    
    result = await db.execute(query)
    items = result.scalars().all()
    return items
