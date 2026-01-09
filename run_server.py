#!/usr/bin/env python
"""
Convenience script to run the Flask development server from project root.

Usage:
    python run_server.py
"""
import sys
from pathlib import Path

# Ensure project root is in path
project_root = Path(__file__).resolve().parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

# Import and run the Flask server
if __name__ == '__main__':
    from src.api.run import *
