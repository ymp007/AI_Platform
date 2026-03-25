import os
import uuid
import logging
from typing import List, Optional, Dict, Any
from pathlib import Path
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed
import json

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

# Import schema models from schemas module
from backend_auth import schemas


class PipelineNode(BaseModel):
    id: str
    agent_id: str
    agent_name: str
    agent_type: str
    prompt_content: Optional[str] = None
    depends_on: List[str] = []
    parallel_group: Optional[str] = None


class Orchestrator:
    MAX_PARALLEL_AGENTS = 3

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

    def _get_all_agentic_prompts(self) -> List[Dict[str, Any]]:
        """Get ALL agentic prompts from database"""
        from backend_auth.database import SessionLocal
        from backend_auth import crud

        prompts = []
        db = SessionLocal()
        try:
            all_prompts = crud.get_agentic_prompts(db, skip=0, limit=100)
            for prompt in all_prompts:
                prompts.append(
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
        logger.info(f"Found {len(prompts)} agentic prompts in database")
        return prompts

    def _create_execution_plan(
        self, query: str, document_ids: List[str]
    ) -> schemas.ExecutionPlan:
        """Use AI to analyze query and create execution plan with flow decision"""

        agentic_prompts = self._get_all_agentic_prompts()

        # Only include RAG if documents are provided
        all_agents = []
        if document_ids:
            logger.info(f"Documents selected ({len(document_ids)}), including RAG agent")
            rag_info = {
                "id": "rag_search",
                "name": "RAG Document Search",
                "type": "rag",
                "description": "Search through indexed documents to find relevant information",
            }
            all_agents.append(rag_info)
        else:
            logger.info("No documents selected, RAG agent will NOT be included")

        all_agents.extend(agentic_prompts)
        
        logger.info(f"Total agents available: {len(all_agents)} (RAG: {'Yes' if document_ids else 'No'}, Agentic: {len(agentic_prompts)})")
        logger.info(f"Agent list: {[a['name'] for a in all_agents]}")

        agents_description = "\n".join(
            [
                f"- {agent['name']} (ID: {agent['id']}, Type: {agent['type']}): {agent.get('description', 'No description')}"
                for agent in all_agents
            ]
        )

        rag_rules = ""
        example_json = ""
        if document_ids:
            rag_rules = "1. ALWAYS include RAG Document Search (agent_id: rag_search) as the first node to search through available documents\n"
            example_json = """{{
  "flow_type": "hybrid",
  "description": "Search documents then run agents in parallel for analysis",
  "nodes": [
    {{
      "id": "node_1",
      "agent_id": "rag_search",
      "agent_name": "RAG Document Search",
      "agent_type": "rag",
      "depends_on": [],
      "parallel_group": null
    }},
    {{
      "id": "node_2",
      "agent_id": "agent1_id",
      "agent_name": "Agent 1",
      "agent_type": "agentic_prompt",
      "depends_on": ["node_1"],
      "parallel_group": "analysis"
    }},
    {{
      "id": "node_3",
      "agent_id": "agent2_id",
      "agent_name": "Agent 2",
      "agent_type": "agentic_prompt",
      "depends_on": ["node_1"],
      "parallel_group": "analysis"
    }}
  ]
}}"""
        else:
            rag_rules = "1. NO RAG is available - use only agentic prompts and choose agents best suited for the query\n"
            example_json = """{{
  "flow_type": "sequential",
  "description": "Run agents sequentially for document generation",
  "nodes": [
    {{
      "id": "node_1",
      "agent_id": "agent1_id",
      "agent_name": "Agent 1",
      "agent_type": "agentic_prompt",
      "depends_on": [],
      "parallel_group": null
    }},
    {{
      "id": "node_2",
      "agent_id": "agent2_id",
      "agent_name": "Agent 2",
      "agent_type": "agentic_prompt",
      "depends_on": ["node_1"],
      "parallel_group": null
    }}
  ]
}}"""

        system_prompt = (
            """You are an AI orchestration planner. Your job is to analyze a user query and create an optimal execution plan.

AVAILABLE AGENTS:
"""
            + agents_description
            + """

CRITICAL RULES:
"""
            + rag_rules
            + """2. ALWAYS include at least one agentic prompt to perform analysis or generation
3. Design flow type smartly:
   - "sequential": When agents depend on each other's output
   - "parallel": When multiple agents can work independently (use parallel_group field)
   - "hybrid": Mix both for complex workflows
4. Maximum """ + str(self.MAX_PARALLEL_AGENTS) + """ agents in any parallel group
5. Use appropriate dependencies and parallel_group settings to optimize execution

EXAMPLE EXECUTION PLAN:
""" + example_json + """

EXPECTED JSON RESPONSE FORMAT:
- flow_type: Must be "sequential", "parallel", or "hybrid"
- description: Brief explanation of the plan
- nodes: Array of agent execution nodes
  - Each node needs: id, agent_id, agent_name, agent_type, depends_on, parallel_group
  - node IDs must be unique (node_1, node_2, etc.)
  - agent_id must match an available agent from the list above
  - depends_on: list of node IDs this node depends on (empty array for first nodes)
  - parallel_group: null for sequential, or a string identifier for parallel nodes

USER QUERY:
{query}

Return ONLY the JSON execution plan, no additional text:"""
        )

        prompt = PromptTemplate.from_template(system_prompt)
        chain = prompt | self.llm

        try:
            response = chain.invoke({"query": query})
            content = response.content.strip()

            logger.info(f"AI raw response: {content[:300]}...")

            import re
            import json

            # Try to extract JSON more robustly
            try:
                # First try: Look for entire JSON object/array structures with careful bracket matching
                start_idx = content.find('{')
                if start_idx == -1:
                    logger.error("No opening brace found in response")
                else:
                    # Find matching closing brace
                    depth = 0
                    end_idx = -1
                    for i in range(start_idx, len(content)):
                        if content[i] == '{':
                            depth += 1
                        elif content[i] == '}':
                            depth -= 1
                            if depth == 0:
                                end_idx = i + 1
                                break
                    
                    if end_idx > start_idx:
                        json_str = content[start_idx:end_idx]
                        logger.info(f"Extracted JSON: {json_str[:200]}...")
                        plan_data = json.loads(json_str)

                        nodes_with_content = []
                        for node in plan_data.get("nodes", []):
                            for agent in all_agents:
                                if agent["id"] == node.get("agent_id"):
                                    node["prompt_content"] = agent.get("prompt_content", "")
                                    break
                            nodes_with_content.append(node)

                        plan_data["nodes"] = nodes_with_content
                        plan_data["selected_documents"] = document_ids or []

                        logger.info(
                            f"AI created execution plan: {plan_data.get('flow_type')} with {len(nodes_with_content)} nodes"
                        )
                        return schemas.ExecutionPlan(**plan_data)
                    else:
                        logger.error("Could not find matching closing brace")
            except json.JSONDecodeError as je:
                logger.error(f"JSON parsing error: {je}. Extracted content: {json_str[:300] if 'json_str' in locals() else 'N/A'}")
            except Exception as inner_e:
                logger.error(f"Inner parsing error: {inner_e}")

        except Exception as e:
            logger.error(f"Error creating execution plan: {e}", exc_info=True)

        nodes = []
        
        # Only add RAG node if documents are provided
        if document_ids:
            nodes.append(
                {
                    "id": "node_1",
                    "agent_id": "rag_search",
                    "agent_name": "RAG Document Search",
                    "agent_type": "rag",
                    "depends_on": [],
                    "parallel_group": None,
                    "prompt_content": None,
                }
            )

        if agentic_prompts:
            first_agent = agentic_prompts[0]
            node_id = "node_2" if document_ids else "node_1"
            depends_on = ["node_1"] if document_ids else []
            
            nodes.append(
                {
                    "id": node_id,
                    "agent_id": first_agent["id"],
                    "agent_name": first_agent["name"],
                    "agent_type": "agentic_prompt",
                    "depends_on": depends_on,
                    "parallel_group": None,
                    "prompt_content": first_agent.get("prompt_content", ""),
                }
            )
            if document_ids:
                description = f"Fallback plan: RAG + {first_agent['name']}"
            else:
                description = f"Fallback plan: {first_agent['name']}"
            flow_type = "sequential"
        else:
            if document_ids:
                description = "Fallback plan: RAG only (no agentic prompts available)"
            else:
                description = "Fallback plan: No agents available"
            flow_type = "sequential"

        fallback_plan = schemas.ExecutionPlan(
            flow_type=flow_type,
            description=description,
            nodes=nodes,
            selected_documents=document_ids or [],
        )
        return fallback_plan

    def _execute_rag_search(
        self, query: str, document_ids: Optional[List[str]] = None
    ) -> schemas.AgentExecutionResult:
        """Execute RAG document search"""
        from backend_auth.rag_service import get_rag_service

        try:
            rag = get_rag_service()
            result = rag.query(query_str=query, document_ids=document_ids, top_k=5)

            return schemas.AgentExecutionResult(
                agent_name="RAG Document Search",
                agent_type="rag",
                output=result.answer,
                sources=result.sources,
            )
        except Exception as e:
            logger.error(f"RAG search error: {e}")
            return schemas.AgentExecutionResult(
                agent_name="RAG Document Search",
                agent_type="rag",
                output=f"Error: {str(e)}",
                sources=[],
            )

    def _execute_agentic_prompt(
        self, prompt_content: str, input_data: str, agent_name: str
    ) -> schemas.AgentExecutionResult:
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

            return schemas.AgentExecutionResult(
                agent_name=agent_name,
                agent_type="agentic_prompt",
                output=response.content.strip(),
                sources=None,
            )
        except Exception as e:
            logger.error(f"Agent execution error: {e}")
            return schemas.AgentExecutionResult(
                agent_name=agent_name,
                agent_type="agentic_prompt",
                output=f"Error: {str(e)}",
                sources=None,
            )

    def _execute_node(
        self, node: Dict[str, Any], input_data: str, document_ids: Optional[List[str]]
    ) -> schemas.AgentExecutionResult:
        """Execute a single node"""
        agent_type = node.get("agent_type", "")
        agent_name = node.get("agent_name", "")
        prompt_content = node.get("prompt_content", "")

        if agent_type == "rag":
            return self._execute_rag_search(input_data, document_ids)
        else:
            return self._execute_agentic_prompt(prompt_content, input_data, agent_name)

    def _execute_parallel_group(
        self,
        nodes: List[Dict[str, Any]],
        node_inputs: Dict[str, str],
        document_ids: Optional[List[str]],
    ) -> str:
        """Execute multiple agents in parallel and combine results
        
        Args:
            nodes: List of nodes to execute in parallel
            node_inputs: Dict mapping node_id to input_data for that node
            document_ids: Document IDs for RAG search
        """

        results = []

        with ThreadPoolExecutor(max_workers=len(nodes)) as executor:
            futures = {
                executor.submit(
                    self._execute_node, node, node_inputs.get(node["id"], ""), document_ids
                ): node
                for node in nodes
            }

            for future in as_completed(futures):
                try:
                    result = future.result()
                    results.append(result)
                except Exception as e:
                    logger.error(f"Parallel execution error: {e}")
                    results.append(
                        schemas.AgentExecutionResult(
                            agent_name=futures[future].get("agent_name", "Unknown"),
                            agent_type="error",
                            output=f"Error: {str(e)}",
                        )
                    )

        outputs = [r.output for r in results]
        combined = "\n\n---\n\n".join(outputs)

        synthesis_prompt = PromptTemplate.from_template(
            """You are an AI synthesis assistant. Combine the following outputs from multiple agents into a coherent single response.

AGENT OUTPUTS:
{outputs}

INSTRUCTIONS:
- Synthesize all the outputs into a unified response
- Preserve key information from each agent
- Create a cohesive answer that incorporates all perspectives
- Do NOT list which agent provided what - just create a unified response

UNIFIED OUTPUT:"""
        )

        chain = synthesis_prompt | self.llm

        try:
            response = chain.invoke({"outputs": combined})
            return response.content.strip()
        except Exception as e:
            logger.warning(f"Synthesis failed, using concatenation: {e}")
            return combined

    def _build_dependency_graph(
        self, nodes: List[Dict[str, Any]]
    ) -> Dict[str, Dict[str, Any]]:
        """Build a dependency graph from nodes"""
        graph = {}
        for node in nodes:
            graph[node["id"]] = node
        return graph

    def _get_ready_nodes(
        self, graph: Dict, completed: set, parallel_groups: set
    ) -> List[Dict]:
        """Get nodes that are ready to execute (all dependencies completed)"""
        ready = []
        for node_id, node in graph.items():
            if node_id in completed:
                continue

            depends_on = node.get("depends_on", [])
            if not depends_on or all(dep in completed for dep in depends_on):
                pg = node.get("parallel_group")
                if pg and pg not in parallel_groups:
                    continue
                ready.append(node)

        return ready

    def _execute_plan(
        self, plan: schemas.ExecutionPlan, query: str, document_ids: Optional[List[str]]
    ) -> tuple:
        """Execute the plan and return results + pipeline status
        
        Handles proper data flow between nodes:
        - Sequential: output from node N becomes input to node N+1
        - Parallel: nodes in same group receive output from dependencies
        - Hybrid: combination of sequential and parallel stages
        """

        graph = self._build_dependency_graph(plan.nodes)
        completed = {}
        pipeline_status = []
        parallel_groups_completed = set()

        logger.info(f"🚀 Starting orchestration: {len(plan.nodes)} nodes, flow={plan.flow_type}")

        while len(completed) < len(plan.nodes):
            ready_nodes = self._get_ready_nodes(
                graph, completed, parallel_groups_completed
            )

            if not ready_nodes:
                break

            parallel_groups = {}
            for node in ready_nodes:
                pg = node.get("parallel_group")
                if pg:
                    if pg not in parallel_groups:
                        parallel_groups[pg] = []
                    parallel_groups[pg].append(node)
                else:
                    parallel_groups[f"sequential_{node['id']}"] = [node]

            for group_id, group_nodes in parallel_groups.items():
                group_inputs = {}

                for node in group_nodes:
                    depends_on = node.get("depends_on", [])
                    if depends_on:
                        last_dep = depends_on[-1]
                        prev_result = completed.get(last_dep)
                        if prev_result and hasattr(prev_result, "output"):
                            group_inputs[node["id"]] = prev_result.output
                            logger.info(
                                f"  📤 Data: {last_dep} → {node['id']} ({len(prev_result.output)} chars)"
                            )
                        else:
                            group_inputs[node["id"]] = query
                            logger.warning(
                                f"  ⚠️ Missing output from {last_dep}, using original query"
                            )
                    else:
                        group_inputs[node["id"]] = query
                        logger.info(f"  📥 {node['id']}: using original query")

                if len(group_nodes) == 1:
                    node = group_nodes[0]
                    input_data = group_inputs.get(node["id"], query)
                    logger.info(f"  ▶️ Executing: {node['agent_name']}")
                    result = self._execute_node(node, input_data, document_ids)
                    completed[node["id"]] = result
                    logger.info(f"  ✅ Completed: {node['agent_name']} ({len(result.output)} chars output)")
                    pipeline_status.append(
                        {
                            "node_id": node["id"],
                            "agent_name": node["agent_name"],
                            "status": "completed",
                            "output": result.output[:200] + "..."
                            if len(result.output) > 200
                            else result.output,
                        }
                    )
                else:
                    logger.info(
                        f"  ⚡ Executing {len(group_nodes)} parallel nodes"
                    )
                    combined_result = self._execute_parallel_group(
                        group_nodes, group_inputs, document_ids
                    )

                    for node in group_nodes:
                        completed[node["id"]] = schemas.AgentExecutionResult(
                            agent_name=node["agent_name"],
                            agent_type=node["agent_type"],
                            output=combined_result,
                        )
                        logger.info(
                            f"  ✅ Completed parallel: {node['agent_name']}"
                        )
                        pipeline_status.append(
                            {
                                "node_id": node["id"],
                                "agent_name": node["agent_name"],
                                "status": "completed",
                                "parallel_group": group_id,
                                "output": combined_result[:200] + "..."
                                if len(combined_result) > 200
                                else combined_result,
                            }
                        )

                    parallel_groups_completed.add(group_id)

        results = list(completed.values())
        logger.info(f"✨ Orchestration complete: {len(results)} agents executed successfully")
        return results, pipeline_status

    def orchestrate(
        self, query: str, document_ids: Optional[List[str]] = None
    ) -> schemas.OrchestrationResponse:
        """Main orchestration method with auto-planning and parallel execution"""

        logger.info(f"Starting auto-orchestration for query: {query[:50]}...")

        execution_plan = self._create_execution_plan(query, document_ids or [])

        results, pipeline_status = self._execute_plan(
            execution_plan, query, document_ids
        )

        last_output = results[-1].output if results else ""

        final_output_prompt = PromptTemplate.from_template(
            """You are a final output formatter. The following is the result of processing through multiple AI agents.

FINAL RESULT:
{result}

Present this in a clear, well-formatted way:"""
        )

        try:
            chain = final_output_prompt | self.llm
            response = chain.invoke({"result": last_output})
            final_output = response.content.strip()
        except Exception as e:
            final_output = last_output

        return schemas.OrchestrationResponse(
            execution_plan=execution_plan,
            results=results,
            final_output=final_output,
            pipeline_status=pipeline_status,
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
