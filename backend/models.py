from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint, func
from database import Base

class Item(Base):
    __tablename__ = "items"
    id          = Column(Integer, primary_key=True)
    label       = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    image_url   = Column(String, nullable=False)
    category    = Column(String, nullable=True)

class Vote(Base):
    __tablename__ = "votes"
    id               = Column(Integer, primary_key=True, autoincrement=True)
    session_id       = Column(String, nullable=False, index=True)
    item_id          = Column(Integer, ForeignKey("items.id"), nullable=False)
    choice           = Column(String, nullable=False)       # "yes" or "no"
    decision_time_ms = Column(Integer, nullable=True)
    created_at       = Column(DateTime, server_default=func.now())
    updated_at       = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("session_id", "item_id", name="uq_session_item"),
    )
