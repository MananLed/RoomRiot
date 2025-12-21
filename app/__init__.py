from flask import Flask
from .config import Config
from .extensions import db, bcrypt, jwt, socketio

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    socketio.init_app(app)

    # Register blueprints (we’ll create these later)
    from .routes.auth_routes import auth_bp
    from .routes.room_routes import room_bp
    from .routes.main_routes import main_bp
    from .routes.front_routes import front_bp
    
    app.register_blueprint(main_bp)
    app.register_blueprint(front_bp)
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(room_bp, url_prefix="/api/rooms")

    # Register socket events
    from .sockets.chat_events import register_socket_events
    register_socket_events(socketio)

    return app
