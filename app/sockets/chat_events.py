from flask_socketio import join_room, leave_room, emit
from flask_jwt_extended import decode_token
from app.models.room import Room
from app.models.room_member import RoomMember
from app.models.message import Message
from app.extensions import db
from datetime import datetime

def register_socket_events(socketio):

    @socketio.on("connect")
    def connect(auth):
        token = auth.get("token") if auth else None
        if not token:
            return False

        try:
            decoded = decode_token(token)
            user_id = decoded["sub"]
        except Exception:
            return False

        join_room(user_id)
        emit("connected", {"user_id": user_id})

    @socketio.on("join_room")
    def handle_join(data):
        room_id = data.get("room_id")
        user_id = data.get("user_id")

        room = Room.query.get(room_id)
        if not room:
            emit("error", {"message": "Room not found"})
            return

        member = RoomMember.query.filter_by(
            room_id=room_id,
            user_id=user_id
        ).first()

        if not member or member.blocked:
            emit("error", {"message": "Access denied"})
            return

        join_room(room_id)

        # Load last 100 messages
        messages = (
            Message.query
            .filter_by(room_id=room_id)
            .order_by(Message.timestamp.desc())
            .limit(100)
            .all()
        )

        history = [{
            "username": msg.user.username,
            "content": msg.content,
            "timestamp": msg.timestamp.strftime("%H:%M")
        } for msg in reversed(messages)]

        emit("message_history", history)

        emit("new_message", {
            "username": "System",
            "content": f"{member.user.username} joined the room",
            "timestamp": datetime.utcnow().strftime("%H:%M"),
            "system": True
        }, room=room_id)


    @socketio.on("send_message")
    def handle_message(data):
        room_id = data.get("room_id")
        user_id = data.get("user_id")
        content = data.get("content")

        member = RoomMember.query.filter_by(room_id=room_id, user_id=user_id).first()
        if not member or member.blocked:
            return

        message = Message(room_id=room_id, user_id=user_id, content=content)
        db.session.add(message)
        db.session.commit()

        emit("new_message", {
            "username": message.user.username,
            "content": content,
            "timestamp": message.timestamp.strftime("%H:%M")
        }, room=room_id)

    @socketio.on("force_leave")
    def force_leave_user(data):
        room_id = data.get("room_id")
        user_id = data.get("user_id")
        leave_room(room_id)
        emit("kicked", {"room_id": room_id}, to=user_id)
    
    @socketio.on("leave_room")
    def handle_leave(data):
        room_id = data.get("room_id")
        user_id = data.get("user_id")

        member = RoomMember.query.filter_by(
            room_id=room_id,
            user_id=user_id
        ).first()

        if not member:
            return

        leave_room(room_id)

        emit("new_message", {
            "username": "System",
            "content": f"{member.user.username} left the room",
            "timestamp": datetime.utcnow().strftime("%H:%M"),
            "system": True
        }, room=room_id)
