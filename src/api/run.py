"""
Development server entry point.
Runs the Flask application for local development.
"""
import sys
from pathlib import Path

# Add project root to Python path
# This allows the script to be run from any directory
project_root = Path(__file__).resolve().parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from src.api.app import create_app
from src.api.config.config import Config

if __name__ == '__main__':
    try:
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
    except ValueError as e:
        print(f"\n❌ Configuration Error: {e}")
        print("\n📝 To fix this:")
        print("   1. Copy .env.example to .env:")
        print("      cp .env.example .env")
        print("   2. Edit .env and add your Anthropic API key:")
        print("      ANTHROPIC_API_KEY=sk-ant-your-key-here")
        print("   3. Restart the server\n")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected Error: {e}")
        print(f"   Error type: {type(e).__name__}\n")
        sys.exit(1)
