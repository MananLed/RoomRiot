from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager

db = SQLAlchemy()
socketio = SocketIO(cors_allowed_origins="*")
bcrypt = Bcrypt()
jwt = JWTManager()
