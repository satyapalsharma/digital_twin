from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # OpenRouter
    openrouter_api_key: str = Field(default="", validation_alias="OPENROUTER_API_KEY")
    openrouter_agent_model: str = Field(
        default="google/gemini-2.0-flash-001",
        validation_alias="OPENROUTER_AGENT_MODEL",
    )
    openrouter_synthesizer_model: str = Field(
        default="anthropic/claude-haiku-4.5",
        validation_alias="OPENROUTER_SYNTHESIZER_MODEL",
    )
    openrouter_debate_model: str = Field(
        default="google/gemini-2.0-flash-001",
        validation_alias="OPENROUTER_DEBATE_MODEL",
    )
    openrouter_http_referer: str = Field(
        default="http://localhost:3000",
        validation_alias="OPENROUTER_HTTP_REFERER",
    )
    openrouter_app_title: str = Field(
        default="Simulation Sentinels",
        validation_alias="OPENROUTER_APP_TITLE",
    )

    # Arize Phoenix (feature-flagged)
    phoenix_enabled: bool = Field(default=False, validation_alias="PHOENIX_ENABLED")
    phoenix_collector_endpoint: str = Field(
        default="", validation_alias="PHOENIX_COLLECTOR_ENDPOINT"
    )
    phoenix_api_key: str = Field(default="", validation_alias="PHOENIX_API_KEY")
    phoenix_project_name: str = Field(
        default="simulation-sentinels", validation_alias="PHOENIX_PROJECT_NAME"
    )

    # Simulation tuning
    sim_concurrency: int = Field(default=25, validation_alias="SIM_CONCURRENCY")
    sim_timeout_seconds: int = Field(default=30, validation_alias="SIM_TIMEOUT_SECONDS")
    persona_gen_temperature: float = Field(
        default=0.9, validation_alias="PERSONA_GEN_TEMPERATURE"
    )
    agent_temperature: float = Field(default=0.8, validation_alias="AGENT_TEMPERATURE")

    # Server
    backend_host: str = Field(default="0.0.0.0", validation_alias="BACKEND_HOST")
    backend_port: int = Field(default=8000, validation_alias="BACKEND_PORT")
    database_url: str = Field(
        default="sqlite:///./data/sentinels.db", validation_alias="DATABASE_URL"
    )
    cors_origins: str = Field(
        default="http://localhost:3000", validation_alias="CORS_ORIGINS"
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
