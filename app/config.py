import os

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "roomriot-secret")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "roomriot-jwt-secret")

    SQLALCHEMY_DATABASE_URI = "sqlite:///roomriot.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
