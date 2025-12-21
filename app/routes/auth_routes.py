from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from app.services.auth_service import create_user, authenticate_user

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return {"error": "Username and password required"}, 400

    user, error = create_user(username, password)
    if error:
        return {"error": error}, 409

    return {"message": "User created successfully"}, 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    user = authenticate_user(username, password)
    if not user:
        return {"error": "Invalid credentials"}, 401

    access_token = create_access_token(identity=user.id)

    return jsonify(
        access_token=access_token,
        username=user.username
    )
