import os
from flask import Flask
from .config import Config
from .db import db
from .routes.api import api_bp

def create_app():
    app = Flask(__name__, instance_relative_config=True)

    # Load config
    app.config.from_object(Config)

    # Ensure instance folder exists
    try:
        os.makedirs(app.instance_path, exist_ok=True)
    except OSError:
        pass

    # Initialize extensions
    db.init_app(app)

    # Register blueprints
    app.register_blueprint(api_bp)

    # Create tables
    with app.app_context():
        from . import models  # noqa: F401
        db.create_all()

    return app
