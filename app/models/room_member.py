import uuid
from datetime import datetime
from app.extensions import db

class RoomMember(db.Model):
    __tablename__ = "room_members"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    room_id = db.Column(
        db.String(36),
        db.ForeignKey("rooms.id", ondelete="CASCADE"),
        nullable=False
    )

    user_id = db.Column(
        db.String(36),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    blocked = db.Column(db.Boolean, default=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="room_members")

    __table_args__ = (
        db.UniqueConstraint("room_id", "user_id", name="unique_room_user"),
    )
