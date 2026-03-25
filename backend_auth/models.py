from sqlalchemy import Column, String, Text, Boolean, DateTime
import uuid
from datetime import datetime
from backend_auth.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)


class AgenticPrompt(Base):
    __tablename__ = "agentic_prompts"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False, index=True)
    description = Column(String, nullable=True)
    prompt_content = Column(Text, nullable=False)
    input_description = Column(Text, nullable=True)
    output_description = Column(Text, nullable=True)
    purpose = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
