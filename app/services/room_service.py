from app.extensions import db, bcrypt
from app.models.room import Room
from app.models.room_member import RoomMember

def create_room(name, owner_id, password=None):
    existing = Room.query.filter_by(name=name).first()
    if existing:
        return None, "Room name already exists"

    if password is not None and password.strip() != "":
        password_hash = bcrypt.generate_password_hash(password).decode("utf-8")
    else:
        password_hash = None

    room = Room(
        name=name,
        owner_id=owner_id,
        password_hash=password_hash
    )

    db.session.add(room)
    db.session.commit()

    member = RoomMember(
        room_id=room.id,
        user_id=owner_id
    )
    db.session.add(member)
    db.session.commit()

    return room, None


def join_room(room, user_id, password=None):
    membership = RoomMember.query.filter_by(
        room_id=room.id,
        user_id=user_id
    ).first()


    if membership is not None:
        if membership.blocked:
            return None, "You are blocked from this room"
        return membership, None

    if room.password_hash is not None:
        if password is None or not bcrypt.check_password_hash(room.password_hash, password):
            return None, "Invalid room password"

    member = RoomMember(
        room_id=room.id,
        user_id=user_id
    )

    db.session.add(member)
    db.session.commit()

    return member, None
