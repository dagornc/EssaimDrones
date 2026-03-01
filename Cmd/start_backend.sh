#!/bin/bash
cd "$(dirname "$0")/.."
source .venv/bin/activate
export PYTHONPATH=$PWD/Code/Backend
echo "Starting FastAPI Backend..."
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
