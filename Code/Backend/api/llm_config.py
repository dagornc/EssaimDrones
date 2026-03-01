"""LLM Configuration loader for AquaSwarm.

Loads llm_providers from Config/global.yaml and resolves ${VAR} from .env.
Follows the Strategy/Factory pattern from DagBot.
"""

import os
import re
from pathlib import Path
from typing import Optional

import yaml
from dotenv import load_dotenv

# Resolve project root (EssaimDrones/)
_PROJECT_ROOT = Path(__file__).resolve().parents[3]

# Load .env from project root
load_dotenv(_PROJECT_ROOT / ".env", override=True)


def _resolve_env_vars(value: str) -> str:
    """Replace ${VAR} or ${VAR:default} placeholders with environment variable values.

    Args:
        value: String potentially containing ${VAR} or ${VAR:default} patterns.

    Returns:
        Resolved string with env var values substituted.
    """
    # Match ${VAR} and ${VAR:default}
    pattern = re.compile(r"\$\{(\w+)(?::([^}]+))?\}")

    def _replacer(match: re.Match[str]) -> str:
        var_name = match.group(1)
        default_val = match.group(2)
        return os.getenv(
            var_name, default_val if default_val is not None else f"MISSING_{var_name}"
        )

    return pattern.sub(_replacer, value)


def _resolve_dict(data: dict[str, object]) -> dict[str, object]:
    """Recursively resolve env vars in dictionary values.

    Args:
        data: Dictionary with potentially unresolved ${VAR} strings.

    Returns:
        Dictionary with all string values resolved.
    """
    resolved: dict[str, object] = {}
    for key, value in data.items():
        if isinstance(value, str):
            resolved[key] = _resolve_env_vars(value)
        elif isinstance(value, dict):
            resolved[key] = _resolve_dict(value)  # type: ignore[arg-type]
        elif isinstance(value, list):
            resolved[key] = [
                _resolve_env_vars(v) if isinstance(v, str) else v for v in value
            ]
        else:
            resolved[key] = value
    return resolved


class LLMConfig:
    """Singleton that loads and caches LLM provider configuration."""

    _instance: Optional["LLMConfig"] = None
    _providers: dict[str, dict[str, object]]

    def __new__(cls) -> "LLMConfig":
        """Create or return existing singleton instance."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._load()
        return cls._instance

    def _load(self) -> None:
        """Load and resolve the YAML configuration file."""
        config_path = _PROJECT_ROOT / "Config" / "global.yaml"
        with open(config_path, "r", encoding="utf-8") as f:
            raw = yaml.safe_load(f)
        resolved = _resolve_dict(raw)
        self._providers = resolved.get("llm_providers", {})  # type: ignore[assignment]

    def reload(self) -> None:
        """Force-reload configuration from disk."""
        self._load()

    @property
    def providers(self) -> dict[str, dict[str, object]]:
        """Return all configured LLM providers."""
        return self._providers


def get_llm_config() -> LLMConfig:
    """Get the LLM configuration singleton.

    Returns:
        LLMConfig singleton instance with resolved configuration.
    """
    return LLMConfig()
