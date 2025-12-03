from datetime import datetime
from .db import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    bp_readings = db.relationship("BPReading", back_populates="user", cascade="all, delete-orphan")
    mood_logs = db.relationship("MoodLog", back_populates="user", cascade="all, delete-orphan")
    user_badges = db.relationship("UserBadge", back_populates="user", cascade="all, delete-orphan")


class BPReading(db.Model):
    __tablename__ = "bp_readings"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    systolic = db.Column(db.Integer, nullable=False)
    diastolic = db.Column(db.Integer, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    user = db.relationship("User", back_populates="bp_readings")


class MoodLog(db.Model):
    __tablename__ = "mood_logs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    mood_level = db.Column(db.Integer, nullable=False)  # 1–3 scale
    note = db.Column(db.String(255))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    user = db.relationship("User", back_populates="mood_logs")


class Badge(db.Model):
    __tablename__ = "badges"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)   # e.g. "CONSISTENT_7_DAYS"
    name = db.Column(db.String(100), nullable=False)               # e.g. "Consistency Star"
    description = db.Column(db.String(255), nullable=True)


class UserBadge(db.Model):
    __tablename__ = "user_badges"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    badge_id = db.Column(db.Integer, db.ForeignKey("badges.id"), nullable=False)
    earned_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    user = db.relationship("User", back_populates="user_badges")
    badge = db.relationship("Badge")
