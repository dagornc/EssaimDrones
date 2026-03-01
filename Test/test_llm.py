"""Tests for the LLM selection API endpoints and Custom Provider DB."""

import os
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

from api.main import app
from api.database import init_db, delete_custom_provider
from api.llm_config import get_llm_config

# Ensure we use an isolated DB for testing?
# For now, we will just use the main app DB but cleanup our test provider.

@pytest_asyncio.fixture(autouse=True)
async def db_setup():
    """Ensure DB is initialized before tests."""
    await init_db()
    yield
    # Cleanup test provider
    await delete_custom_provider("test_pytest_provider")


@pytest.mark.asyncio
async def test_get_models_endpoint():
    """Test fetching the models list."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/models")
        assert response.status_code == 200
        data = response.json()
        
        assert "providers" in data
        assert "active_provider" in data
        assert "active_model" in data
        
        # Verify openrouter is there
        provider_names = [p["name"] for p in data["providers"]]
        assert "openrouter" in provider_names


@pytest.mark.asyncio
async def test_custom_provider_crud():
    """Test creating, reading, and deleting a custom provider via API."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create
        create_payload = {
            "name": "test_pytest_provider",
            "display_name": "Pytest Prov",
            "base_url": "http://pytest.local",
            "api_key": "test_key",
            "default_model": "test-model"
        }
        res_create = await client.post("/api/models/custom", json=create_payload)
        assert res_create.status_code == 200
        assert res_create.json()["status"] == "ok"
        
        # Read (verify it shows up in models)
        res_get = await client.get("/api/models")
        data = res_get.json()
        custom = next((p for p in data["providers"] if p["name"] == "test_pytest_provider"), None)
        assert custom is not None
        assert custom["display_name"] == "Pytest Prov"
        assert custom["is_custom"] == True
        
        # Switch model to custom
        switch_payload = {
            "provider": "test_pytest_provider",
            "model": "test-model"
        }
        res_switch = await client.post("/api/models/switch", json=switch_payload)
        assert res_switch.status_code == 200
        # Ignore LLM init errors mapping to agent keys, the switch API itself should return ok
        assert res_switch.json()["status"] == "ok"
        
        # Delete
        res_del = await client.delete("/api/models/custom/test_pytest_provider")
        assert res_del.status_code == 200
        assert res_del.json()["status"] == "ok"
        
        # Verify deleted
        res_get_after = await client.get("/api/models")
        data_after = res_get_after.json()
        custom_after = next((p for p in data_after["providers"] if p["name"] == "test_pytest_provider"), None)
        assert custom_after is None
