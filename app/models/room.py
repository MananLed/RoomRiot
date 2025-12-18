import uuid
from datetime import datetime
from app.extensions import db

class Room(db.Model):
    __tablename__ = "rooms"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), unique=True, nullable=False)
    owner_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    password_hash = db.Column(db.String(128), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    members = db.relationship(
        "RoomMember",
        backref="room",
        cascade="all, delete",
        passive_deletes=True
    )

    messages = db.relationship(
        "Message",
        backref="room",
        cascade="all, delete",
        passive_deletes=True
    )
