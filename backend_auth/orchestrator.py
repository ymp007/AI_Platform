import os
import uuid
import logging
from typing import List, Optional, Dict, Any
from pathlib import Path
from dotenv import load_dotenv

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

from langchain_openai import AzureChatOpenAI
from langchain_core.prompts import PromptTemplate

from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AgentExecutionResult(BaseModel):
    agent_name: str
    agent_type: str
    output: str
    sources: Optional[List[Dict[str, Any]]] = None


class OrchestrationRequest(BaseModel):
    query: str
    document_ids: Optional[List[str]] = None
    agent_prompt_ids: Optional[List[str]] = None
    mode: str = "auto"


class OrchestrationResponse(BaseModel):
    results: List[AgentExecutionResult]
    final_output: str
    selected_agents: List[str]


class Orchestrator:
    def __init__(self):
        self._init_azure_client()

    def _init_azure_client(self):
        api_key = os.getenv("AZURE_OPENAI_API_KEY")
        endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4o-mini")

        if not api_key or api_key == "your_azure_openai_api_key_here":
            raise ValueError("Azure OpenAI API key not configured")

        endpoint = endpoint.rstrip("/")
        os.environ["OPENAI_API_KEY"] = api_key
        api_version = os.getenv("Azure_OPENAI_API_VERSION", "2024-02-15-preview")

        self.llm = AzureChatOpenAI(
            azure_endpoint=endpoint,
            azure_deployment=deployment,
            api_key=api_key,
            api_version=api_version,
            temperature=0.7,
        )
        logger.info("Orchestrator Azure client initialized")

    def _get_available_agents(
        self, document_ids: List[str], agent_prompt_ids: List[str]
    ) -> List[Dict[str, Any]]:
        """Get information about available agents"""
        from backend_auth.database import SessionLocal
        from backend_auth import models, crud

        available_agents = []

        if document_ids:
            available_agents.append(
                {
                    "id": "rag_search",
                    "name": "RAG Document Search",
                    "type": "rag",
                    "description": "Search through indexed documents to find relevant information",
                }
            )

        if agent_prompt_ids:
            db = SessionLocal()
            try:
                for prompt_id in agent_prompt_ids:
                    prompt = crud.get_agentic_prompt(db, prompt_id)
                    if prompt:
                        available_agents.append(
                            {
                                "id": prompt.id,
                                "name": prompt.name,
                                "type": "agentic_prompt",
                                "description": prompt.purpose
                                or prompt.description
                                or "Custom agent",
                                "prompt_content": prompt.prompt_content,
                            }
                        )
            finally:
                db.close()

        return available_agents

    def _analyze_query_for_agents(
        self, query: str, available_agents: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Use AI to decide which agents to use and in what order"""

        agents_description = "\n".join(
            [
                f"- {agent['name']} ({agent['type']}): {agent['description']}"
                for agent in available_agents
            ]
        )

        system_prompt = f"""You are an AI orchestration assistant. Your job is to analyze a user query and determine which agents should be used to fulfill the request.

Available Agents:
{agents_description}

Rules:
1. Always include RAG Document Search if the query asks about documents, information retrieval, or needs context from files
2. Add agentic prompts that can process the retrieved information
3. Order agents in a logical sequence where output of one feeds into the next
4. If query only needs document search, just use RAG
5. If query needs processing after search (summarize, analyze, etc.), add those agents after RAG

Return a JSON list of agent IDs in the order they should be executed.
Example: ["rag_search", "summarizer_agent_id"]

Only return the JSON array, nothing else."""

        prompt = PromptTemplate.from_template(
            "User Query: {query}\n\nDetermine which agents to use and return as JSON array:"
        )

        chain = prompt | self.llm

        try:
            response = chain.invoke({"query": query})
            content = response.content.strip()

            if "[" in content:
                start = content.find("[")
                end = content.find("]") + 1
                json_str = content[start:end]

                import json

                selected_ids = json.loads(json_str)

                selected_agents = []
                for agent in available_agents:
                    if agent["id"] in selected_ids:
                        selected_agents.append(agent)

                return selected_agents
        except Exception as e:
            logger.warning(f"Error analyzing query: {e}")

        return available_agents

    def _execute_rag_search(
        self, query: str, document_ids: Optional[List[str]] = None
    ) -> AgentExecutionResult:
        """Execute RAG document search"""
        from backend_auth.rag_service import get_rag_service

        try:
            rag = get_rag_service()
            result = rag.query(query_str=query, document_ids=document_ids, top_k=5)

            return AgentExecutionResult(
                agent_name="RAG Document Search",
                agent_type="rag",
                output=result.answer,
                sources=result.sources,
            )
        except Exception as e:
            logger.error(f"RAG search error: {e}")
            return AgentExecutionResult(
                agent_name="RAG Document Search",
                agent_type="rag",
                output=f"Error: {str(e)}",
                sources=[],
            )

    def _execute_agentic_prompt(
        self, prompt_content: str, input_data: str, agent_name: str
    ) -> AgentExecutionResult:
        """Execute an agentic prompt with the given input"""

        prompt = PromptTemplate.from_template(
            """You are an AI agent. Use the following instructions to process the input:

{prompt_content}

---

Input:
{input_data}

---

Output:"""
        )

        chain = prompt | self.llm

        try:
            response = chain.invoke(
                {"prompt_content": prompt_content, "input_data": input_data}
            )

            return AgentExecutionResult(
                agent_name=agent_name,
                agent_type="agentic_prompt",
                output=response.content.strip(),
                sources=None,
            )
        except Exception as e:
            logger.error(f"Agent execution error: {e}")
            return AgentExecutionResult(
                agent_name=agent_name,
                agent_type="agentic_prompt",
                output=f"Error: {str(e)}",
                sources=None,
            )

    def _generate_final_output(self, results: List[AgentExecutionResult]) -> str:
        """Generate final aggregated output from all agent results"""

        if len(results) == 1:
            return results[0].output

        output_parts = []
        for i, result in enumerate(results):
            output_parts.append(
                f"### Step {i + 1}: {result.agent_name}\n\n{result.output}"
            )

        combined_prompt = PromptTemplate.from_template(
            """Combine the following outputs from multiple agents into a coherent final response:

{outputs}

Provide a well-structured final answer that incorporates all the results:"""
        )

        chain = combined_prompt | self.llm

        try:
            response = chain.invoke({"outputs": "\n\n---\n\n".join(output_parts)})
            return response.content.strip()
        except Exception as e:
            return "\n\n---\n\n".join(output_parts)

    def orchestrate(
        self,
        query: str,
        document_ids: Optional[List[str]] = None,
        agent_prompt_ids: Optional[List[str]] = None,
        mode: str = "auto",
    ) -> OrchestrationResponse:
        """Main orchestration method"""

        logger.info(f"Starting orchestration for query: {query[:50]}...")

        available_agents = self._get_available_agents(
            document_ids or [], agent_prompt_ids or []
        )

        if mode == "auto" and available_agents:
            selected_agents = self._analyze_query_for_agents(query, available_agents)
            logger.info(f"AI selected agents: {[a['name'] for a in selected_agents]}")
        else:
            selected_agents = available_agents

        results: List[AgentExecutionResult] = []
        current_input = query

        for agent in selected_agents:
            logger.info(f"Executing agent: {agent['name']}")

            if agent["type"] == "rag":
                result = self._execute_rag_search(current_input, document_ids)
            else:
                result = self._execute_agentic_prompt(
                    agent["prompt_content"], current_input, agent["name"]
                )

            results.append(result)
            current_input = result.output

        final_output = self._generate_final_output(results)

        return OrchestrationResponse(
            results=results,
            final_output=final_output,
            selected_agents=[a["name"] for a in selected_agents],
        )


orchestrator_instance: Optional[Orchestrator] = None


def get_orchestrator() -> Orchestrator:
    global orchestrator_instance
    if orchestrator_instance is None:
        try:
            orchestrator_instance = Orchestrator()
        except ValueError as e:
            logger.error(f"Failed to initialize orchestrator: {e}")
            raise
    return orchestrator_instance
