from flask import Blueprint, render_template

front_bp = Blueprint("front", __name__)

@front_bp.route("/login", methods=["GET"])
def login_page():
    return render_template("auth/login.html")

@front_bp.route("/signup", methods=["GET"])
def signup_page():
    return render_template("auth/signup.html")

@front_bp.route("/dashboard", methods=["GET"])
def dashboard_page():
    return render_template("dashboard.html")

@front_bp.route("/chat/<room_id>", methods=["GET"])
def chat_page(room_id):
    return render_template("chat.html", room_id=room_id)