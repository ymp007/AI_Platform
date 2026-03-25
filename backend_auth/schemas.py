from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    token: str
    token_type: str


class AgenticPromptBase(BaseModel):
    name: str
    description: Optional[str] = None
    prompt_content: str
    input_description: Optional[str] = None
    output_description: Optional[str] = None
    purpose: Optional[str] = None
    notes: Optional[str] = None


class AgenticPromptCreate(AgenticPromptBase):
    pass


class AgenticPromptUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    prompt_content: Optional[str] = None
    input_description: Optional[str] = None
    output_description: Optional[str] = None
    purpose: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class AgenticPromptResponse(AgenticPromptBase):
    id: str
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


class OrchestrationRequest(BaseModel):
    query: str
    document_ids: Optional[List[str]] = None


class AgentExecutionResult(BaseModel):
    agent_name: str
    agent_type: str
    output: str
    sources: Optional[List[Dict[str, Any]]] = None


class ExecutionPlan(BaseModel):
    flow_type: str
    description: str
    nodes: List[Dict[str, Any]]
    selected_documents: List[str]


class PipelineStatus(BaseModel):
    node_id: str
    agent_name: str
    status: str
    parallel_group: Optional[str] = None
    output: Optional[str] = None


class OrchestrationResponse(BaseModel):
    execution_plan: ExecutionPlan
    results: List[AgentExecutionResult]
    final_output: str
    pipeline_status: List[PipelineStatus]


class SingleAgentRequest(BaseModel):
    agent_id: str
    agent_name: str
    agent_type: str
    input_data: str
    prompt_content: Optional[str] = None
    document_ids: Optional[List[str]] = None
