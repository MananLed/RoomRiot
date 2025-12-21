from flask import Blueprint, request
from app.models.room import Room
from app.services.room_service import create_room, join_room, check_membership
from app.utils.jwt_required import jwt_required_custom, get_current_user_id
from app.models.user import User
from app.services.moderation_service import (
    is_owner,
    get_room_members,
    kick_user,
    block_user
)
from app.extensions import socketio
from app.extensions import db, socketio
from datetime import datetime
from app.models.room_member import RoomMember


room_bp = Blueprint("rooms", __name__)

@room_bp.route("", methods=["GET"])
@jwt_required_custom
def list_rooms():
    rooms = Room.query.all()
    return [{
        "id": room.id,
        "name": room.name,
        "password": bool(room.password_hash)
    } for room in rooms]

@room_bp.route("/create", methods=["POST"])
@jwt_required_custom
def create():
    data = request.get_json()
    name = data.get("name")
    password = data.get("password")

    if not name:
        return {"error": "Room name required"}, 400

    user_id = get_current_user_id()
    room, error = create_room(name, user_id, password)

    if error:
        return {"error": error}, 409

    return {
        "room_id": room.id,
        "room_name": room.name
    }, 201

@room_bp.route("/<room_id>/member", methods=["GET"])
@jwt_required_custom
def is_member(room_id):
    user_id = get_current_user_id()

    room = Room.query.get(room_id)
    if not room:
        return {"error": "Room not found"}, 404
    
    is_a_member, error = check_membership(room, user_id)

    if error:
        return {"error": error}, 403

    return {
        "isMember":is_a_member
    }, 200


@room_bp.route("/<room_id>/join", methods=["POST"])
@jwt_required_custom
def join(room_id):
    data = request.get_json()
    password = data.get("password")

    room = Room.query.get(room_id)
    if not room:
        return {"error": "Room not found"}, 404

    user_id = get_current_user_id()
    member, error = join_room(room, user_id, password)

    if error:
        return {"error": error}, 403

    return {
        "room_id": room.id,
        "room_name": room.name
    }, 200

@room_bp.route("/<room_id>/members", methods=["GET"])
@jwt_required_custom
def members(room_id):
    user_id = get_current_user_id()
    owner, room = is_owner(room_id, user_id)

    if not room:
        return {"error": "Room not found"}, 404
    if not owner:
        return {"error": "Forbidden"}, 403
    else:
        owner_of_room = user_id

    members = get_room_members(room_id)
    return [{
    "user_id": m.user_id,
    "username": User.query.get(m.user_id).username,
    "blocked": m.blocked
    } for m in members if m.user_id != owner_of_room and m.blocked != 1] 

@room_bp.route("/<room_id>/kick", methods=["POST"])
@jwt_required_custom
def kick(room_id):
    user_id = get_current_user_id()
    target_user_id = request.get_json().get("user_id")

    owner, room = is_owner(room_id, user_id)
    if not room:
        return {"error": "Room not found"}, 404
    if not owner:
        return {"error": "Forbidden"}, 403
    
    member = RoomMember.query.filter_by(
        room_id=room_id,
        user_id=target_user_id
    ).first()

    username = member.user.username
    success = kick_user(room_id, target_user_id)
    if not success:
        return {"error": "User not in room"}, 404
    
    
    socketio.emit(
        "new_message",
        {
            "username": "System",
            "content": f"{username} was kicked from the room",
            "timestamp": datetime.utcnow().strftime("%H:%M"),
            "system": True
        },
        room=room_id
    )
    
    socketio.emit(
    "kicked",
    {"room_id": room_id},
    room=target_user_id
    )

    return {"message": "User kicked"}

@room_bp.route("/<room_id>/block", methods=["POST"])
@jwt_required_custom
def block(room_id):
    user_id = get_current_user_id()
    target_user_id = request.get_json().get("user_id")

    owner, room = is_owner(room_id, user_id)
    if not room:
        return {"error": "Room not found"}, 404
    if not owner:
        return {"error": "Forbidden"}, 403
    
    member = RoomMember.query.filter_by(
        room_id=room_id,
        user_id=target_user_id
    ).first()

    username = member.user.username
    success = block_user(room_id, target_user_id)

    if not success:
        return {"error": "User not in room"}, 404
    
    
    socketio.emit(
        "new_message",
        {
            "username": "System",
            "content": f"{username} was blocked from the room",
            "timestamp": datetime.utcnow().strftime("%H:%M"),
            "system": True
        },
        room=room_id
    )

    socketio.emit(
    "blocked",
    {"room_id": room_id},
    room=target_user_id
    )

    return {"message": "User blocked"}


@room_bp.route("/<room_id>/delete", methods=["DELETE"])
@jwt_required_custom
def delete_room(room_id):
    user_id = get_current_user_id()

    room = Room.query.get(room_id)
    if not room:
        return {"error": "Room not found"}, 404

    if room.owner_id != user_id:
        return {"error": "Forbidden"}, 403


    socketio.emit(
        "room_deleted",
        {"room_id": room_id},
        room=room_id
    )


    db.session.delete(room)
    db.session.commit()

    return {"message": "Room deleted successfully"}
