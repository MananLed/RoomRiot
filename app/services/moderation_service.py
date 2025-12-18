from app.extensions import db
from app.models.room import Room
from app.models.room_member import RoomMember

def is_owner(room_id, user_id):
    room = Room.query.get(room_id)
    if not room:
        return False, None
    return room.owner_id == user_id, room


def get_room_members(room_id):
    return RoomMember.query.filter_by(room_id=room_id).all()


def kick_user(room_id, target_user_id):
    member = RoomMember.query.filter_by(
        room_id=room_id,
        user_id=target_user_id
    ).first()

    if not member:
        return False

    db.session.delete(member)
    db.session.commit()
    return True


def block_user(room_id, target_user_id):
    member = RoomMember.query.filter_by(
        room_id=room_id,
        user_id=target_user_id
    ).first()

    if not member:
        return False
    else:
        member.blocked = True

    db.session.commit()
    return True
