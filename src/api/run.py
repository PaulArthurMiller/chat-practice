"""
Development server entry point.
Runs the Flask application for local development.
"""
from src.api.app import create_app
from src.api.config.config import Config

if __name__ == '__main__':
    # Load configuration
    config = Config.get_config()

    # Create app
    app = create_app(config)

    # Run development server
    print(f"Starting Flask development server on port {config.PORT}")
    print(f"Environment: {config.FLASK_ENV}")
    print(f"Debug mode: {config.DEBUG}")

    app.run(
        host='0.0.0.0',
        port=config.PORT,
        debug=config.DEBUG
    )
