from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200

def test_get_models():
    response = client.get("/api/models")
    assert response.status_code == 200
    assert "providers" in response.json()

def test_chat_no_auth():
    response = client.post("/api/chat", json={"message": "hello"})
    # Since orchestrator is offline if no OPENROUTER_API_KEY
    assert response.status_code == 200
    assert "error" in response.json() or "response" in response.json()
