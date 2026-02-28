"""FastAPI Backend for AquaSwarm Command.

Provides a WebSocket for real-time 3D visualization and REST endpoints
for manual chat intervention with the generic orchestrator LLM.
"""

import asyncio
import json
import os
from contextlib import asynccontextmanager
from typing import Any

import httpx
from dotenv import load_dotenv

load_dotenv(override=True)

from api.database import (delete_custom_provider, init_db,
                          list_custom_providers, save_custom_provider)
from api.llm_config import get_llm_config
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from underwater_swarm.config import SwarmMode
from underwater_swarm.metrics import PerformanceMonitor
from underwater_swarm.simulation import Simulation


class CustomProviderRequest(BaseModel):
    """Request body for saving a custom provider."""

    name: str
    display_name: str
    base_url: str
    api_key: str = ""
    default_model: str = ""
    access_method: str = "openai_compatible"
    icon: str = "settings"


class ChatRequest(BaseModel):
    """Request body for the chat endpoint."""

    message: str


class ModelSwitchRequest(BaseModel):
    """Request body for switching the active LLM model."""

    provider: str
    model: str


class ProviderTestRequest(BaseModel):
    """Request body for testing a provider connection."""

    provider: str


# Global state
sim = Simulation(num_drones=20)
connected_clients: set[WebSocket] = set()

# Track the active provider/model at runtime
_active_provider: str = os.getenv("LLM_PROVIDER", "openrouter")
_active_model: str = os.getenv("LLM_MODEL", "google/gemini-2.0-flash-exp:free")


async def simulation_loop() -> None:
    """Runs the simulation steps continuously."""
    while True:
        sim.step()
        await asyncio.sleep(0.016)  # ~60 FPS simulation


async def broadcast_loop() -> None:
    """Broadcasts state to all connected web clients asynchronously."""
    while True:
        if connected_clients:
            state: dict[str, Any] = {
                "mode": sim.mode.name if sim.mode else "None",
                "drones": [d.position.tolist() for d in sim.drones],
                "targets": (
                    [t.tolist() for t in sim.targets]
                    if hasattr(sim, "targets") and sim.targets
                    else []
                ),
                "friends": (
                    [f.tolist() for f in sim.friends]
                    if hasattr(sim, "friends") and sim.friends
                    else []
                ),
                "obstacles": (
                    [obs.position.tolist() for obs in sim.environment.obstacles]
                    if hasattr(sim, "environment") and hasattr(sim.environment, "obstacles") and sim.environment.obstacles
                    else []
                ),
            }
            if hasattr(sim, "perf_monitor") and sim.perf_monitor:
                state["metrics"] = {
                    "cohesion": sim.perf_monitor.calculate_cohesion(),
                    "alignment": sim.perf_monitor.calculate_alignment(),
                    "safety": sim.perf_monitor.calculate_safety_violations(),
                }

            message = json.dumps(state)

            # Broadcast to all
            to_remove: set[WebSocket] = set()
            for ws in connected_clients:
                try:
                    await ws.send_text(message)
                except Exception:
                    to_remove.add(ws)
            connected_clients.difference_update(to_remove)

        await asyncio.sleep(0.033)  # ~30 FPS broadcast


@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore[no-untyped-def]
    """Application lifespan context manager."""
    print("Initializing Database...")
    await init_db()

    print("Initializing Simulation & Agent Orchestrator...")
    sim.perf_monitor = PerformanceMonitor(sim)

    if os.getenv("OPENROUTER_API_KEY"):
        try:
            from agent.orchestrator import SwarmOrchestrator

            sim.orchestrator = SwarmOrchestrator(sim)
            print("Swarm Orchestrator Agent loaded successfully.")
        except Exception as e:
            print(f"Agent loading failed: {e}")
            sim.orchestrator = None
    else:
        print("Warning: No OPENROUTER_API_KEY. Agent features disabled.")
        sim.orchestrator = None

    sim_task = asyncio.create_task(simulation_loop())
    broadcast_task = asyncio.create_task(broadcast_loop())

    yield

    # Teardown
    sim_task.cancel()
    broadcast_task.cancel()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


from fastapi.responses import RedirectResponse


@app.get("/")
def read_root() -> RedirectResponse:
    """Redirect root to frontend."""
    return RedirectResponse(url="http://localhost:5173")


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    """WebSocket endpoint for real-time simulation data."""
    await websocket.accept()
    connected_clients.add(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Process command if needed, e.g., manual override
            payload = json.loads(data)
            if "mode" in payload:
                try:
                    sim.mode = SwarmMode(payload["mode"])
                except ValueError:
                    pass
            elif "action" in payload and payload["action"] == "place_entity":
                entity_type = payload.get("entity_type")
                pos = payload.get("position", [50, 50, 50])
                import numpy as np

                if entity_type == "enemy":
                    if not hasattr(sim, "targets"):
                        sim.targets = []
                    sim.targets.append(np.array(pos))
                elif entity_type == "friend":
                    if not hasattr(sim, "friends"):
                        sim.friends = []
                    sim.friends.append(np.array(pos))
                elif entity_type == "obstacle":
                    from underwater_swarm.environment import Obstacle
                    # Environment is accessible via sim.environment
                    sim.environment.obstacles.append(Obstacle(np.array(pos), radius=5.0))
            elif "action" in payload and payload["action"] == "set_num_drones":
                new_num = payload.get("value", 20)
                sim.set_num_drones(new_num)
    except WebSocketDisconnect:
        connected_clients.remove(websocket)


@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest) -> dict[str, str]:
    """Allows manual prompt to the tactical orchestrator."""
    if not getattr(sim, "orchestrator", None):
        return {"error": "Orchestrator is offline. Missing API Key."}

    from langchain_core.messages import HumanMessage

    msg = HumanMessage(content=req.message)
    state = {"messages": [msg]}

    try:
        assert sim.orchestrator is not None
        response_state = sim.orchestrator.graph.invoke(state)
        return {"response": response_state["messages"][-1].content}
    except Exception as e:
        return {"error": f"Erreur API LLM (Vérifiez la clé): {e}"}


# ---------- LLM Provider Endpoints (Pattern DagBot) ----------


@app.get("/api/models")
async def get_models() -> dict[str, object]:
    """Returns available providers and models with the active selection.

    Response includes providers list, each with name, display_name,
    available models, icon, and recommended status.
    """

    config = get_llm_config()
    providers_list: list[dict[str, object]] = []

    for name, prov in config.providers.items():
        models_list = list(prov.get("models", []))  # type: ignore
        default_mdl = str(prov.get("default_model", ""))
        if default_mdl and default_mdl not in models_list:
            models_list.append(default_mdl)

        providers_list.append(
            {
                "name": name,
                "display_name": prov.get("display_name", name),
                "base_url": str(prov.get("base_url", "")),
                "icon": prov.get("icon", "settings"),
                "description": prov.get("description", ""),
                "recommended": prov.get("recommended", False),
                "default_model": default_mdl,
                "models": models_list,
                "is_custom": False,
            }
        )

    # Add custom providers from database
    custom_provs = await list_custom_providers()
    for cp in custom_provs:
        cp_models = [cp["default_model"]] if cp["default_model"] else []
        providers_list.append(
            {
                "name": cp["name"],
                "display_name": cp["display_name"],
                "base_url": cp["base_url"],
                "icon": cp["icon"],
                "description": "User Custom Provider",
                "recommended": False,
                "default_model": cp["default_model"],
                "models": cp_models,
                "is_custom": True,
                "api_key": cp[
                    "api_key"
                ],  # Passed to switch but hidden from general frontend
            }
        )

    return {
        "providers": providers_list,
        "active_provider": _active_provider,
        "active_model": _active_model,
    }


@app.post("/api/models/switch")
async def switch_model(req: ModelSwitchRequest) -> dict[str, str]:
    """Hot-swap the active LLM model used by the orchestrator.

    Rebuilds the orchestrator's LLM instance with the new provider/model.
    """
    global _active_provider, _active_model

    config = get_llm_config()
    provider_config = config.providers.get(req.provider)

    # Check custom providers if not in config
    if not provider_config:
        custom_provs = await list_custom_providers()
        custom = next((p for p in custom_provs if p["name"] == req.provider), None)
        if custom:
            provider_config = dict(custom)  # Convert row to dict

    if not provider_config:
        return {"error": f"Provider '{req.provider}' not found."}

    # Update the global active selection
    _active_provider = req.provider
    _active_model = req.model

    # Hot-swap the orchestrator LLM if it exists
    orchestrator = getattr(sim, "orchestrator", None)
    if orchestrator is not None:
        try:
            from langchain_openai import ChatOpenAI

            base_url = str(provider_config.get("base_url", ""))
            api_key = str(provider_config.get("api_key", ""))

            new_llm = ChatOpenAI(
                base_url=base_url,
                api_key=api_key,  # type: ignore[arg-type]
                model=req.model,
                default_headers={
                    "HTTP-Referer": "https://aquaswarm-command.app",
                    "X-Title": "AquaSwarm Command",
                },
            )
            orchestrator.llm = new_llm
            orchestrator.llm_with_tools = new_llm.bind_tools(orchestrator.tools)
            print(f"LLM hot-swapped to {req.provider}/{req.model}")
        except Exception as e:
            return {"error": f"LLM swap failed: {e}"}

    return {
        "status": "ok",
        "provider": _active_provider,
        "model": _active_model,
    }


@app.post("/api/models/test")
async def test_model_connection(
    req: ProviderTestRequest,
) -> dict[str, object]:
    """Test connection to a provider by sending a minimal request.

    Returns success status, message (first 50 chars of response),
    and response time in ms.
    """
    import time

    config = get_llm_config()
    provider_config = config.providers.get(req.provider)

    if not provider_config:
        custom_provs = await list_custom_providers()
        custom = next((p for p in custom_provs if p["name"] == req.provider), None)
        if custom:
            provider_config = dict(custom)

    if not provider_config:
        return {"success": False, "message": f"Provider '{req.provider}' not found."}

    base_url = str(provider_config.get("base_url", ""))
    api_key = str(provider_config.get("api_key", ""))
    model = str(provider_config.get("default_model", "gpt-3.5-turbo"))

    start = time.monotonic()
    try:
        from langchain_openai import ChatOpenAI

        llm = ChatOpenAI(
            base_url=base_url,
            api_key=api_key,  # type: ignore[arg-type]
            model=model,
            max_completion_tokens=10,
            default_headers={
                "HTTP-Referer": "https://aquaswarm-command.app",
                "X-Title": "AquaSwarm Command",
            },
            http_client=httpx.Client(timeout=15.0),
        )
        response = llm.invoke("Say 'ok'")
        elapsed = (time.monotonic() - start) * 1000
        return {
            "success": True,
            "message": f"Connected. Response: {str(response.content)[:50]}",
            "response_time_ms": round(elapsed, 1),
        }
    except Exception as exc:
        elapsed = (time.monotonic() - start) * 1000
        return {
            "success": False,
            "message": f"Connection failed: {exc}",
            "response_time_ms": round(elapsed, 1),
        }


@app.get("/api/models/{provider_name}/fetch")
async def fetch_provider_models(provider_name: str) -> list[str]:
    """Fetch available models dynamically from a provider's /models endpoint.

    Args:
        provider_name: Provider key from config.

    Returns:
        Sorted list of model ID strings.
    """
    config = get_llm_config()
    provider_config = config.providers.get(provider_name)

    if not provider_config:
        return []

    base_url = str(provider_config.get("base_url", "")).rstrip("/")
    api_key = str(provider_config.get("api_key", ""))

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}
            response = await client.get(f"{base_url}/models", headers=headers)
            response.raise_for_status()
            data = response.json()

            if isinstance(data, dict) and "data" in data:
                return sorted(
                    [m["id"] for m in data["data"] if isinstance(m, dict) and "id" in m]
                )
            if isinstance(data, list):
                return sorted(
                    [m["id"] if isinstance(m, dict) else str(m) for m in data]
                )
            return []
    except Exception as exc:
        print(f"Error fetching models from {base_url}: {exc}")
        return []


@app.post("/api/models/custom")
async def add_custom_provider(req: CustomProviderRequest) -> dict[str, str]:
    """Add a new custom provider to the SQLite database."""
    try:
        await save_custom_provider(
            name=req.name,
            display_name=req.display_name,
            base_url=req.base_url,
            api_key=req.api_key,
            default_model=req.default_model,
            access_method=req.access_method,
            icon=req.icon,
        )
        return {"status": "ok", "message": "Custom provider added."}
    except Exception as e:
        return {"error": f"Failed to save custom provider: {e}"}


@app.delete("/api/models/custom/{provider_name}")
async def remove_custom_provider(provider_name: str) -> dict[str, str]:
    """Remove a custom provider by its name from the SQLite database."""
    try:
        success = await delete_custom_provider(provider_name)
        if success:
            return {"status": "ok", "message": "Custom provider deleted."}
        return {"error": "Provider not found."}
    except Exception as e:
        return {"error": f"Failed to delete custom provider: {e}"}
