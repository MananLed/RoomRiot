from app.extensions import db, bcrypt
from app.models.user import User

def create_user(username, password):
    existing = User.query.filter_by(username=username).first()
    if existing:
        return None, "Username already exists"

    password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    user = User(
        username=username,
        password_hash=password_hash
    )

    db.session.add(user)
    db.session.commit()

    return user, None


def authenticate_user(username, password):
    user = User.query.filter_by(username=username).first()
    if not user:
        return None

    if not bcrypt.check_password_hash(user.password_hash, password):
        return None

    return user
