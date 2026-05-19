"""
Seed script — populates destinations for CP1.
Run: python seed.py
"""
import asyncio
import json
import os
from sqlalchemy import select
from database import engine, async_session, Base
from models import Item

DATA_FILE = os.path.join(os.path.dirname(__file__), "data", "destinations.json")

async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        existing = await session.execute(select(Item))
        if existing.scalars().first():
            print("Items already seeded. Skipping.")
            return

        with open(DATA_FILE, "r") as f:
            stub_items = json.load(f)

        for data in stub_items:
            if "label" not in data and "destination" in data:
                label = f"{data['destination']}, {data['city']}, {data['state']}"
                image_url = data.get("image_url")
                if not image_url:
                    image_url = "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800"
                
                item_data = {
                    "id": data["id"],
                    "label": label,
                    "description": data.get("description", ""),
                    "image_url": image_url,
                    "category": data.get("category", "")
                }
                session.add(Item(**item_data))
            else:
                session.add(Item(**data))
        await session.commit()
        print(f"Seeded {len(stub_items)} items.")

if __name__ == "__main__":
    asyncio.run(seed())
