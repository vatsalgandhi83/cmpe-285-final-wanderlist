from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from database import get_db
from models import Item, Vote
from schemas import VoteRequest, VoteResponse, ResultsResponse, ItemResult, UndoResponse, UserAnalytics, MyResultsResponse, MyVote

router = APIRouter(tags=["votes"])

@router.post("/vote", response_model=VoteResponse)
async def cast_vote(
    vote_req: VoteRequest,
    db: AsyncSession = Depends(get_db)
):
    # Verify item exists
    item = await db.get(Item, vote_req.item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Check if already voted
    existing = await db.execute(
        select(Vote).where(
            Vote.session_id == vote_req.session_id,
            Vote.item_id == vote_req.item_id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already voted on this item")

    # Record vote
    new_vote = Vote(
        session_id=vote_req.session_id,
        item_id=vote_req.item_id,
        choice=vote_req.choice,
        decision_time_ms=vote_req.decision_time_ms
    )
    db.add(new_vote)
    await db.commit()

    return VoteResponse(message="Vote recorded", item_id=vote_req.item_id, choice=vote_req.choice)

@router.delete("/vote/undo", response_model=UndoResponse)
async def undo_last_vote(
    session_id: str = Header(..., alias="X-Session-ID"),
    db: AsyncSession = Depends(get_db)
):
    # Find most recent vote
    result = await db.execute(
        select(Vote)
        .where(Vote.session_id == session_id)
        .order_by(Vote.created_at.desc())
        .limit(1)
    )
    last_vote = result.scalar_one_or_none()
    
    if not last_vote:
        raise HTTPException(status_code=404, detail="No votes found to undo")

    # Get the item details before deleting the vote
    item = await db.get(Item, last_vote.item_id)
    
    # Delete the vote
    await db.delete(last_vote)
    await db.commit()

    return UndoResponse(
        message="Last vote undone",
        item=item
    )

@router.get("/results", response_model=ResultsResponse)
async def get_results(db: AsyncSession = Depends(get_db)):
    # Calculate global stats
    items = await db.execute(select(Item))
    items = items.scalars().all()

    results = []
    for item in items:
        # Count total votes
        total_votes = await db.execute(select(func.count(Vote.id)).where(Vote.item_id == item.id))
        total_votes = total_votes.scalar() or 0

        # Count 'yes' votes
        yes_count = await db.execute(
            select(func.count(Vote.id)).where(Vote.item_id == item.id, Vote.choice == "yes")
        )
        yes_count = yes_count.scalar() or 0

        no_count = total_votes - yes_count
        yes_pct = round((yes_count / total_votes * 100), 1) if total_votes > 0 else 0.0

        results.append(ItemResult(
            item_id=item.id,
            label=item.label,
            image_url=item.image_url,
            yes_count=yes_count,
            no_count=no_count,
            total_votes=total_votes,
            yes_percentage=yes_pct
        ))

    # Sort descending by yes_percentage, then total_votes
    results.sort(key=lambda x: (x.yes_percentage, x.total_votes), reverse=True)

    # Distinct users who voted
    users_count = await db.execute(select(func.count(func.distinct(Vote.session_id))))
    users_count = users_count.scalar() or 0

    return ResultsResponse(results=results, total_users=users_count)

@router.get("/results/me", response_model=MyResultsResponse)
async def get_my_results(
    session_id: str = Header(..., alias="X-Session-ID"),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Vote).where(Vote.session_id == session_id))
    votes = result.scalars().all()

    my_votes = [
        MyVote(item_id=v.item_id, choice=v.choice, decision_time_ms=v.decision_time_ms)
        for v in votes
    ]
    return MyResultsResponse(votes=my_votes, total=len(my_votes))

@router.get("/analytics/me", response_model=UserAnalytics)
async def get_my_analytics(
    session_id: str = Header(..., alias="X-Session-ID"),
    db: AsyncSession = Depends(get_db)
):
    # Fetch all user votes
    result = await db.execute(select(Vote).where(Vote.session_id == session_id))
    votes = result.scalars().all()
    
    total = len(votes)
    if total == 0:
        return UserAnalytics(
            total_swipes=0, yes_count=0, no_count=0, yes_ratio=0.0,
            avg_decision_ms=None, fastest_ms=None, slowest_ms=None
        )

    yes_count = sum(1 for v in votes if v.choice == "yes")
    no_count = total - yes_count
    
    times = [v.decision_time_ms for v in votes if v.decision_time_ms is not None]
    
    avg_ms = sum(times) / len(times) if times else None
    fastest = min(times) if times else None
    slowest = max(times) if times else None

    return UserAnalytics(
        total_swipes=total,
        yes_count=yes_count,
        no_count=no_count,
        yes_ratio=round(yes_count / total, 2),
        avg_decision_ms=avg_ms,
        fastest_ms=fastest,
        slowest_ms=slowest
    )
