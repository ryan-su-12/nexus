from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_key: str = ""
    finnhub_api_key: str = ""
    anthropic_api_key: str = ""
    snaptrade_client_id: str = ""
    snaptrade_consumer_key: str = ""

    model_config = {"env_file": ".env"}

settings = Settings()