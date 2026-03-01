"""AquaSwarm — SQLite database layer for custom LLM providers.

Provides async CRUD operations.
"""

from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List

import aiosqlite

# Resolve project root (EssaimDrones/)
_PROJECT_ROOT = Path(__file__).resolve().parents[3]
_DB_DIR = _PROJECT_ROOT / "Config"
_DB_PATH = _DB_DIR / "aquaswarm.db"


def _now_iso() -> str:
    """Return current UTC time in ISO format."""
    return datetime.now(timezone.utc).isoformat()


async def init_db() -> None:
    """Initialize the database and create tables if they don't exist."""
    _DB_DIR.mkdir(parents=True, exist_ok=True)

    async with aiosqlite.connect(_DB_PATH) as db:
        await db.executescript("""
            CREATE TABLE IF NOT EXISTS custom_providers (
                name TEXT PRIMARY KEY,
                display_name TEXT NOT NULL,
                base_url TEXT NOT NULL,
                api_key TEXT NOT NULL DEFAULT '',
                default_model TEXT NOT NULL DEFAULT '',
                access_method TEXT NOT NULL DEFAULT 'openai_compatible',
                icon TEXT NOT NULL DEFAULT 'settings',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
        """)
        await db.commit()


# --- Custom Provider CRUD ---


async def save_custom_provider(
    name: str,
    display_name: str,
    base_url: str,
    api_key: str = "",
    default_model: str = "",
    access_method: str = "openai_compatible",
    icon: str = "settings",
) -> Dict[str, str]:
    """Save or update a custom provider.

    Args:
        name: Unique provider key.
        display_name: Human-readable name.
        base_url: API base URL.
        api_key: API key.
        default_model: Default model name.
        access_method: API compatibility type.
        icon: Icon identifier.

    Returns:
        Dictionary with provider fields.
    """
    now = _now_iso()
    async with aiosqlite.connect(_DB_PATH) as db:
        await db.execute(
            """INSERT INTO custom_providers (name, display_name, base_url, api_key, default_model, access_method, icon, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(name) DO UPDATE SET
                   display_name = excluded.display_name,
                   base_url = excluded.base_url,
                   api_key = excluded.api_key,
                   default_model = excluded.default_model,
                   access_method = excluded.access_method,
                   icon = excluded.icon,
                   updated_at = excluded.updated_at""",
            (
                name,
                display_name,
                base_url,
                api_key,
                default_model,
                access_method,
                icon,
                now,
                now,
            ),
        )
        await db.commit()
    return {
        "name": name,
        "display_name": display_name,
        "base_url": base_url,
        "created_at": now,
        "updated_at": now,
    }


async def list_custom_providers() -> List[Dict[str, str]]:
    """Return all custom providers.

    Returns:
        List of provider dictionaries.
    """
    async with aiosqlite.connect(_DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM custom_providers ORDER BY created_at ASC"
        )
        rows = await cursor.fetchall()
        return [
            {
                "name": row["name"],
                "display_name": row["display_name"],
                "base_url": row["base_url"],
                "api_key": row["api_key"],
                "default_model": row["default_model"],
                "access_method": row["access_method"],
                "icon": row["icon"],
            }
            for row in rows
        ]


async def delete_custom_provider(name: str) -> bool:
    """Delete a custom provider.

    Args:
        name: Provider unique key.

    Returns:
        True if deleted, False if not found.
    """
    async with aiosqlite.connect(_DB_PATH) as db:
        cursor = await db.execute(
            "DELETE FROM custom_providers WHERE name = ?", (name,)
        )
        await db.commit()
        return cursor.rowcount > 0
