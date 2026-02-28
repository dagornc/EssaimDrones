"""Tactical Orchestrator for the Swarm using LangChain and LangGraph.

This agent receives metrics from the swarm simulation and uses a LLM
to decide whether to change the swarm's operational mode dynamically.
"""

import os
from typing import TypedDict, Annotated
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, BaseMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, START
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition

from underwater_swarm.config import SwarmMode

load_dotenv(override=True)


class AgentState(TypedDict):
    """State dictionary for the LangGraph agent."""

    messages: Annotated[list[BaseMessage], add_messages]


class SwarmOrchestrator:
    """Agent orchestrator for the Underwater Swarm."""

    def __init__(self, simulation_ref):
        """Initializes the orchestrator with a reference to the simulation."""
        self.simulation = simulation_ref

        # 1. Factory pattern for retrieving the correct LLM ChatModel
        self.llm = self._create_llm()

        # 2. Define tools bound to the simulation instance
        @tool
        def change_swarm_mode(new_mode: str) -> str:
            """Changes the global behavior mode of the drone swarm.

            Valid modes: PATROL, ATTACK, DEFEND, ENCIRCLE, SHIELD, SEARCH,
            FLASH_EXPANSION, SCHOOLING, PREDATOR_PACK, EXPLORATION.
            """
            try:
                mode_enum = SwarmMode(new_mode)
                self.simulation.mode = mode_enum
                return f"Swarm mode successfully changed to {mode_enum.name}."
            except ValueError:
                return f"Error: {new_mode} is not a valid SwarmMode."

        self.tools = [change_swarm_mode]
        self.llm_with_tools = self.llm.bind_tools(self.tools)

        # 3. Build LangGraph
        builder = StateGraph(AgentState)

        def agent_node(state: AgentState):
            messages = state["messages"]
            response = self.llm_with_tools.invoke(messages)
            return {"messages": [response]}

        builder.add_node("agent", agent_node)
        builder.add_node("tools", ToolNode(self.tools))

        builder.add_edge(START, "agent")
        builder.add_conditional_edges("agent", tools_condition)
        builder.add_edge("tools", "agent")

        self.graph = builder.compile()

        self.system_prompt = SystemMessage(
            content="""You are the Tactical Commander of an underwater drone swarm.
You receive real-time metrics about the swarm's performance.
Based on parameters like cohesion, alignment, safety violations, you must decide
if the swarm should change its behavior mode.

Available tools:
- change_swarm_mode(new_mode): Changes the swarm mode.

Reasoning Examples:
- If safety violations are high, consider switching to SCHOOLING to enforce spacing.
- If in SEARCH mode and metrics suggest a find, you might transition.
- Often, you don't need to change mode. Just output your analysis.

Be concise. Do not change mode unless it is strategically sound."""
        )

    def _create_llm(self) -> ChatOpenAI:
        """Strategy/Factory for the LLM based on environment."""
        provider = os.getenv("LLM_PROVIDER", "openrouter").lower()
        if provider == "openrouter":
            return ChatOpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=os.getenv("OPENROUTER_API_KEY") or "",  # type: ignore
                model=os.getenv("LLM_MODEL", "google/gemini-2.0-flash-exp:free"),
                default_headers={
                    "HTTP-Referer": "https://votre-site.com",
                    "X-Title": "Nom de votre application",
                },
            )
        # Default fallback
        return ChatOpenAI(model="gpt-4o-mini")

    def analyze_metrics(self, metrics: dict) -> str:
        """Invokes the LangGraph agent to analyze the current swarm metrics.

        Returns:
            The final textual response of the LLM.
        """
        current_mode = self.simulation.mode.name if self.simulation.mode else "None"
        prompt = f"Current Swarm Metrics: {metrics}. Current Mode: {current_mode}."
        user_msg = HumanMessage(content=prompt)

        initial_state = {"messages": [self.system_prompt, user_msg]}
        response_state = self.graph.invoke(initial_state)

        return response_state["messages"][-1].content
