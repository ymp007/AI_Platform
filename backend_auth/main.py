from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Optional, List
from backend_auth import models, schemas, crud, auth, database
from backend_auth.rag_service import get_rag_service, QueryRequest, QueryResponse
from backend_auth.orchestrator import get_orchestrator
import logging
from dotenv import load_dotenv
import os

# Load environment variables
current_dir = os.path.dirname(__file__)
env_paths = [
    os.path.join(current_dir, ".env"),
    os.path.join(os.getcwd(), ".env"),
    ".env",
]

for env_path in env_paths:
    if os.path.exists(env_path):
        load_dotenv(env_path)
        break

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize database
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Nexus OS API", redirect_slashes=True)


@app.get("/")
def health_check():
    return {"status": "online", "system": "Nexus OS"}


# Configure CORS with explicit origins (required when allow_credentials=True)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/register", response_model=schemas.Token)
def register_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = crud.create_user(db=db, user=user)

    # Payload for JWT matches frontend's User interface
    access_token = auth.create_access_token(
        data={"id": new_user.id, "email": new_user.email, "name": new_user.name}
    )
    return {"token": access_token, "token_type": "bearer"}


@app.post("/api/login", response_model=schemas.Token)
def login_user(login_data: schemas.UserLogin, db: Session = Depends(database.get_db)):
    user = crud.get_user_by_email(db, email=login_data.email)
    if not user or not auth.verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Payload for JWT matches frontend's User interface
    access_token = auth.create_access_token(
        data={"id": user.id, "email": user.email, "name": user.name}
    )
    return {"token": access_token, "token_type": "bearer"}


@app.get("/api/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


# ============ RAG ENDPOINTS ============


@app.get("/api/rag/documents")
def get_documents(current_user: models.User = Depends(auth.get_current_user)):
    """Get list of indexed documents"""
    try:
        rag = get_rag_service()
        documents = rag.get_documents()
        return {"documents": documents}
    except Exception as e:
        logger.error(f"Error getting documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/rag/documents")
async def upload_document(
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Upload and index a document"""
    try:
        content = await file.read()

        allowed_extensions = {".pdf", ".docx", ".doc", ".txt", ".md"}
        file_ext = (
            "." + file.filename.split(".")[-1].lower() if "." in file.filename else ""
        )

        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}",
            )

        rag = get_rag_service()
        document_id = rag.load_document(file.filename, content, file.filename)

        return {
            "status": "success",
            "document_id": document_id,
            "message": f"Document {file.filename} indexed successfully",
        }
    except Exception as e:
        logger.error(f"Error uploading document: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/rag/documents/{document_id}")
def delete_document(
    document_id: str, current_user: models.User = Depends(auth.get_current_user)
):
    """Delete a document and its chunks"""
    try:
        logger.info(f"Attempting to delete document: {document_id}")
        rag = get_rag_service()
        success = rag.delete_document(document_id)

        if success:
            logger.info(f"Document {document_id} deleted successfully")
            return {"status": "success", "message": f"Document {document_id} deleted"}
        else:
            error_msg = f"Failed to delete document {document_id}"
            logger.error(error_msg)
            raise HTTPException(status_code=500, detail=error_msg)
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Error deleting document {document_id}: {str(e)}"
        logger.error(error_msg, exc_info=True)
        raise HTTPException(status_code=500, detail=error_msg)


@app.post("/api/rag/query", response_model=QueryResponse)
def query_documents(
    request: QueryRequest, current_user: models.User = Depends(auth.get_current_user)
):
    """Query the RAG system"""
    try:
        rag = get_rag_service()
        result = rag.query(
            query_str=request.query,
            document_ids=request.document_ids,
            top_k=request.top_k,
        )
        return result
    except Exception as e:
        logger.error(f"Error querying: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ AGENTIC PROMPT ENDPOINTS ============


@app.post("/api/agentic-prompts", response_model=schemas.AgenticPromptResponse)
def create_agentic_prompt(
    prompt: schemas.AgenticPromptCreate,
    current_user: models.User = Depends(auth.get_current_user),
):
    """Create a new agentic prompt"""
    try:
        db = next(database.get_db())
        db_prompt = crud.create_agentic_prompt(db, prompt)

        import os
        from datetime import datetime

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_name = db_prompt.name.replace(" ", "-").lower()
        filename = f"agent_prompts/generated/{safe_name}-{timestamp}.md"

        os.makedirs(os.path.dirname(filename), exist_ok=True)
        with open(filename, "w", encoding="utf-8") as f:
            f.write(db_prompt.prompt_content)

        logger.info(f"Agentic prompt created: {db_prompt.id}")
        return db_prompt
    except Exception as e:
        logger.error(f"Error creating agentic prompt: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@app.get("/api/agentic-prompts", response_model=List[schemas.AgenticPromptResponse])
def list_agentic_prompts(
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(auth.get_current_user),
):
    """List all agentic prompts"""
    try:
        db = next(database.get_db())
        prompts = crud.get_agentic_prompts(db, skip, limit)
        return prompts
    except Exception as e:
        logger.error(f"Error listing agentic prompts: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@app.get(
    "/api/agentic-prompts/{prompt_id}", response_model=schemas.AgenticPromptResponse
)
def get_agentic_prompt(
    prompt_id: str, current_user: models.User = Depends(auth.get_current_user)
):
    """Get a specific agentic prompt"""
    try:
        db = next(database.get_db())
        prompt = crud.get_agentic_prompt(db, prompt_id)
        if not prompt:
            raise HTTPException(status_code=404, detail="Prompt not found")
        return prompt
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting agentic prompt: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@app.put(
    "/api/agentic-prompts/{prompt_id}", response_model=schemas.AgenticPromptResponse
)
def update_agentic_prompt(
    prompt_id: str,
    prompt: schemas.AgenticPromptUpdate,
    current_user: models.User = Depends(auth.get_current_user),
):
    """Update an agentic prompt"""
    try:
        db = next(database.get_db())
        db_prompt = crud.update_agentic_prompt(db, prompt_id, prompt)
        if not db_prompt:
            raise HTTPException(status_code=404, detail="Prompt not found")

        import os
        from datetime import datetime

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_name = db_prompt.name.replace(" ", "-").lower()
        filename = f"agent_prompts/generated/{safe_name}-{timestamp}.md"

        os.makedirs(os.path.dirname(filename), exist_ok=True)
        with open(filename, "w", encoding="utf-8") as f:
            f.write(db_prompt.prompt_content)

        return db_prompt
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating agentic prompt: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@app.delete("/api/agentic-prompts/{prompt_id}")
def delete_agentic_prompt(
    prompt_id: str, current_user: models.User = Depends(auth.get_current_user)
):
    """Delete (soft) an agentic prompt"""
    try:
        db = next(database.get_db())
        db_prompt = crud.delete_agentic_prompt(db, prompt_id)
        if not db_prompt:
            raise HTTPException(status_code=404, detail="Prompt not found")
        return {"status": "success", "message": "Prompt deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting agentic prompt: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@app.get("/api/agentic-prompts/search/{query}")
def search_agentic_prompts(
    query: str, current_user: models.User = Depends(auth.get_current_user)
):
    """Search agentic prompts by name or purpose"""
    try:
        db = next(database.get_db())
        prompts = crud.search_agentic_prompts(db, query)
        return prompts
    except Exception as e:
        logger.error(f"Error searching agentic prompts: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


# ============ ORCHESTRATOR ENDPOINTS ============


@app.post("/api/orchestrate/plan", response_model=schemas.ExecutionPlan)
def create_execution_plan(
    request: schemas.OrchestrationRequest,
    current_user: models.User = Depends(auth.get_current_user),
):
    """Create execution plan - AI decides which agents to use and flow type"""
    try:
        orchestrator = get_orchestrator()
        plan = orchestrator._create_execution_plan(
            query=request.query,
            document_ids=request.document_ids or [],
        )
        return plan
    except Exception as e:
        logger.error(f"Error creating execution plan: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/orchestrate/execute", response_model=schemas.OrchestrationResponse)
def execute_orchestration(
    request: schemas.OrchestrationRequest,
    current_user: models.User = Depends(auth.get_current_user),
):
    """Execute orchestration with auto-planning"""
    try:
        orchestrator = get_orchestrator()
        result = orchestrator.orchestrate(
            query=request.query,
            document_ids=request.document_ids,
        )
        return result
    except Exception as e:
        logger.error(f"Error in orchestration: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/orchestrate/step", response_model=schemas.AgentExecutionResult)
def orchestrate_single_step(
    request: schemas.SingleAgentRequest,
    current_user: models.User = Depends(auth.get_current_user),
):
    """Execute a single agent step in the pipeline"""
    try:
        orchestrator = get_orchestrator()
        result = orchestrator.execute_single_agent(
            agent_id=request.agent_id,
            agent_name=request.agent_name,
            agent_type=request.agent_type,
            input_data=request.input_data,
            prompt_content=request.prompt_content,
            document_ids=request.document_ids,
        )
        return result
    except Exception as e:
        logger.error(f"Error in single agent execution: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
