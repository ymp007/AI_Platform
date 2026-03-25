from sqlalchemy.orm import Session
from backend_auth import models, schemas, auth


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        email=user.email, name=user.name, hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def create_agentic_prompt(db: Session, prompt: schemas.AgenticPromptCreate):
    db_prompt = models.AgenticPrompt(
        name=prompt.name,
        description=prompt.description,
        prompt_content=prompt.prompt_content,
        input_description=prompt.input_description,
        output_description=prompt.output_description,
        purpose=prompt.purpose,
        notes=prompt.notes,
    )
    db.add(db_prompt)
    db.commit()
    db.refresh(db_prompt)
    return db_prompt


def get_agentic_prompts(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(models.AgenticPrompt)
        .filter(models.AgenticPrompt.is_active == True)
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_agentic_prompt(db: Session, prompt_id: str):
    return (
        db.query(models.AgenticPrompt)
        .filter(models.AgenticPrompt.id == prompt_id)
        .first()
    )


def update_agentic_prompt(
    db: Session, prompt_id: str, prompt: schemas.AgenticPromptUpdate
):
    db_prompt = (
        db.query(models.AgenticPrompt)
        .filter(models.AgenticPrompt.id == prompt_id)
        .first()
    )
    if db_prompt:
        update_data = prompt.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_prompt, key, value)
        db.commit()
        db.refresh(db_prompt)
    return db_prompt


def delete_agentic_prompt(db: Session, prompt_id: str):
    db_prompt = (
        db.query(models.AgenticPrompt)
        .filter(models.AgenticPrompt.id == prompt_id)
        .first()
    )
    if db_prompt:
        db_prompt.is_active = False
        db.commit()
        db.refresh(db_prompt)
    return db_prompt


def search_agentic_prompts(db: Session, query: str):
    return (
        db.query(models.AgenticPrompt)
        .filter(
            models.AgenticPrompt.is_active == True,
            (models.AgenticPrompt.name.ilike(f"%{query}%"))
            | (models.AgenticPrompt.purpose.ilike(f"%{query}%")),
        )
        .all()
    )
