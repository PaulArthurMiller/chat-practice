"""
Configuration module for Flask application.
Loads environment variables and provides configuration classes.
"""
import os
from typing import List
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    """
    Base configuration class.
    Loads all configuration from environment variables.
    """

    # Anthropic API
    ANTHROPIC_API_KEY: str = os.getenv('ANTHROPIC_API_KEY', '')
    ANTHROPIC_MODEL: str = os.getenv('ANTHROPIC_MODEL', 'claude-sonnet-4-5-20250929')

    # Flask settings
    FLASK_ENV: str = os.getenv('FLASK_ENV', 'development')
    PORT: int = int(os.getenv('PORT', '5000'))
    DEBUG: bool = FLASK_ENV == 'development'

    # Chat settings
    MAX_CONTEXT_MESSAGES: int = int(os.getenv('MAX_CONTEXT_MESSAGES', '10'))

    # Rate limiting
    RATE_LIMIT_CALLS: int = int(os.getenv('RATE_LIMIT_CALLS', '10'))
    RATE_LIMIT_PERIOD: int = int(os.getenv('RATE_LIMIT_PERIOD', '60'))

    # CORS settings
    CORS_ORIGINS: List[str] = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')

    @classmethod
    def validate(cls) -> None:
        """
        Validates that required configuration is present.
        Raises ValueError if required config is missing.
        """
        if not cls.ANTHROPIC_API_KEY:
            raise ValueError(
                "ANTHROPIC_API_KEY is not set. "
                "Please create a .env file with your API key (see .env.example)"
            )

    @classmethod
    def get_config(cls) -> 'Config':
        """
        Returns the configuration instance after validation.

        Returns:
            Config: Validated configuration instance
        """
        cls.validate()
        return cls()
