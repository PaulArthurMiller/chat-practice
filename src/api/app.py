"""
Flask application factory.
Creates and configures the Flask application instance.
"""
from flask import Flask
from flask_cors import CORS
from src.api.config.config import Config
from src.api.routes.chat_routes import chat_bp, init_chat_services
from src.api.utils.logger import setup_logger
from src.api.utils.request_context import add_request_id_to_app
import logging

logger = logging.getLogger(__name__)


def create_app(config: Config = None) -> Flask:
    """
    Application factory for creating Flask app.

    Args:
        config: Configuration object (uses Config.get_config() if None)

    Returns:
        Flask: Configured Flask application
    """
    # Create Flask app
    app = Flask(__name__)

    # Load configuration
    if config is None:
        config = Config.get_config()

    app.config.from_object(config)

    # Setup logging with request ID tracking
    setup_logger('chat_api', level=logging.DEBUG if config.DEBUG else logging.INFO)
    logger.info("Initializing Flask application")

    # Add request ID middleware
    add_request_id_to_app(app)
    logger.info("Request ID tracking enabled")

    # Configure CORS
    CORS(app, origins=config.CORS_ORIGINS, supports_credentials=True)
    logger.info(f"CORS configured for origins: {config.CORS_ORIGINS}")

    # Initialize services
    init_chat_services(config)

    # Register blueprints
    app.register_blueprint(chat_bp)
    logger.info("Blueprints registered")

    logger.info("Flask application initialized successfully")
    return app
