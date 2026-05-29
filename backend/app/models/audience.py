from datetime import datetime
from sqlalchemy import JSON, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Audience(Base):
    __tablename__ = "audiences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    # Filter criteria (the rules used to build this audience)
    filter_json: Mapped[dict] = mapped_column(JSON, default=dict)
    # Resolved persona IDs at the time of save (snapshot)
    persona_ids: Mapped[list[int]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, index=True
    )
