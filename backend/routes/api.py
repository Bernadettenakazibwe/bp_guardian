from flask import Blueprint, jsonify, request, abort, render_template
from datetime import datetime, timedelta, date
from werkzeug.security import generate_password_hash, check_password_hash

from ..db import db
from ..models import BPReading, MoodLog, User, Badge, UserBadge
from ..services.rules_engine import get_daily_recommendation
from ..services.badges import evaluate_and_award_badges

api_bp = Blueprint("api", __name__)


# -----------------------
# AUTH HELPER
# -----------------------
def get_current_user_id():
    """
    Prototype auth:
    - Frontend sends header: X-User-Id: <user_id>
    - We verify the user exists.
    """
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        abort(401, description="Missing X-User-Id header")

    try:
        user_id_int = int(user_id)
    except ValueError:
        abort(401, description="Invalid X-User-Id header")

    user = db.session.get(User, user_id_int)
    if not user:
        abort(401, description="User not found")

    return user_id_int


# -----------------------
# PAGES (Frontend routes)
# -----------------------
@api_bp.route("/", methods=["GET"])
def page_auth():
    # Your landing page / login page
    return render_template("auth.html")


@api_bp.route("/dashboard", methods=["GET"])
def page_dashboard():
    return render_template("dashboard.html")


@api_bp.route("/log", methods=["GET"])
def page_log():
    return render_template("log.html")


@api_bp.route("/insights", methods=["GET"])
def page_insights():
    return render_template("insights.html")


@api_bp.route("/badges", methods=["GET"])
def page_badges():
    return render_template("badges.html")


# -----------------------
# HEALTH CHECK
# -----------------------
@api_bp.route("/ping", methods=["GET"])
def ping():
    return jsonify({"status": "ok", "message": "BP Guardian backend is running"}), 200


# -----------------------
# AUTH ENDPOINTS
# -----------------------
@api_bp.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password")
    name = (data.get("name") or "").strip() or None

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    existing = User.query.filter_by(email=email).first()
    if existing:
        return jsonify({"error": "Email already registered"}), 400

    password_hash = generate_password_hash(password)
    user = User(email=email, password_hash=password_hash, name=name)

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "message": "User registered successfully",
        "user_id": user.id,
        "email": user.email,
        "name": user.name
    }), 201


@api_bp.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid email or password"}), 401

    return jsonify({
        "message": "Login successful",
        "user_id": user.id,
        "email": user.email,
        "name": user.name
    }), 200


# -----------------------
# BP ENDPOINTS
# -----------------------
@api_bp.route("/api/bp", methods=["POST"])
def add_bp_reading():
    user_id = get_current_user_id()
    data = request.get_json() or {}

    try:
        systolic = int(data.get("systolic"))
        diastolic = int(data.get("diastolic"))
    except (TypeError, ValueError):
        return jsonify({"error": "systolic and diastolic must be integers"}), 400

    if systolic <= 0 or diastolic <= 0:
        return jsonify({"error": "systolic and diastolic must be positive values"}), 400

    timestamp = None
    timestamp_str = data.get("timestamp")
    if timestamp_str:
        try:
            timestamp = datetime.fromisoformat(timestamp_str)
        except ValueError:
            return jsonify({"error": "timestamp must be ISO 8601"}), 400

    reading = BPReading(user_id=user_id, systolic=systolic, diastolic=diastolic)
    if timestamp:
        reading.timestamp = timestamp

    db.session.add(reading)
    db.session.commit()

    return jsonify({
        "id": reading.id,
        "user_id": reading.user_id,
        "systolic": reading.systolic,
        "diastolic": reading.diastolic,
        "timestamp": reading.timestamp.isoformat()
    }), 201


@api_bp.route("/api/bp", methods=["GET"])
def list_bp_readings():
    user_id = get_current_user_id()

    try:
        limit = int(request.args.get("limit", 20))
    except ValueError:
        limit = 20

    readings = (
        BPReading.query
        .filter_by(user_id=user_id)
        .order_by(BPReading.timestamp.desc())
        .limit(limit)
        .all()
    )

    return jsonify([
        {
            "id": r.id,
            "user_id": r.user_id,
            "systolic": r.systolic,
            "diastolic": r.diastolic,
            "timestamp": r.timestamp.isoformat()
        } for r in readings
    ]), 200


# -----------------------
# MOOD ENDPOINTS
# -----------------------
@api_bp.route("/api/mood", methods=["POST"])
def add_mood_log():
    user_id = get_current_user_id()
    data = request.get_json() or {}

    try:
        mood_level = int(data.get("mood_level"))
    except (TypeError, ValueError):
        return jsonify({"error": "mood_level must be an integer (1,2,3)"}), 400

    if mood_level not in (1, 2, 3):
        return jsonify({"error": "mood_level must be 1, 2, or 3"}), 400

    note = data.get("note")

    timestamp = None
    timestamp_str = data.get("timestamp")
    if timestamp_str:
        try:
            timestamp = datetime.fromisoformat(timestamp_str)
        except ValueError:
            return jsonify({"error": "timestamp must be ISO 8601"}), 400

    mood_log = MoodLog(user_id=user_id, mood_level=mood_level, note=note)
    if timestamp:
        mood_log.timestamp = timestamp

    db.session.add(mood_log)
    db.session.commit()

    return jsonify({
        "id": mood_log.id,
        "user_id": mood_log.user_id,
        "mood_level": mood_log.mood_level,
        "note": mood_log.note,
        "timestamp": mood_log.timestamp.isoformat()
    }), 201


@api_bp.route("/api/mood", methods=["GET"])
def list_mood_logs():
    user_id = get_current_user_id()

    try:
        limit = int(request.args.get("limit", 20))
    except ValueError:
        limit = 20

    moods = (
        MoodLog.query
        .filter_by(user_id=user_id)
        .order_by(MoodLog.timestamp.desc())
        .limit(limit)
        .all()
    )

    return jsonify([
        {
            "id": m.id,
            "user_id": m.user_id,
            "mood_level": m.mood_level,
            "note": m.note,
            "timestamp": m.timestamp.isoformat()
        } for m in moods
    ]), 200


# -----------------------
# DASHBOARD ENDPOINT
# -----------------------
def _get_range_days(range_param: str) -> int:
    range_param = (range_param or "").lower()
    if range_param == "month":
        return 30
    if range_param == "year":
        return 365
    return 7  # week


def classify_mood_from_avg(avg_mood: float) -> str:
    if avg_mood < 1.5:
        return "high_stress"
    elif avg_mood < 2.5:
        return "medium"
    else:
        return "calm"


@api_bp.route("/api/dashboard", methods=["GET"])
def dashboard():
    user_id = get_current_user_id()

    range_param = request.args.get("range", "week")
    days = _get_range_days(range_param)

    end_dt = datetime.utcnow()
    start_dt = end_dt - timedelta(days=days)

    bp_readings = (
        BPReading.query
        .filter(BPReading.user_id == user_id, BPReading.timestamp >= start_dt)
        .order_by(BPReading.timestamp.asc())
        .all()
    )

    mood_logs = (
        MoodLog.query
        .filter(MoodLog.user_id == user_id, MoodLog.timestamp >= start_dt)
        .order_by(MoodLog.timestamp.asc())
        .all()
    )

    if not bp_readings:
        return jsonify({
            "range": range_param,
            "start_date": start_dt.date().isoformat(),
            "end_date": end_dt.date().isoformat(),
            "last_bp": None,
            "highest_bp": None,
            "lowest_bp": None,
            "bp_series": [],
            "mood_series": [],
            "daily_summary": {"bp_daily": [], "mood_daily": [], "correlation_points": []}
        }), 200

    last_bp = bp_readings[-1]
    highest_bp = max(bp_readings, key=lambda r: (r.systolic, r.diastolic))
    lowest_bp = min(bp_readings, key=lambda r: (r.systolic, r.diastolic))

    last_bp_obj = {"systolic": last_bp.systolic, "diastolic": last_bp.diastolic, "timestamp": last_bp.timestamp.isoformat()}
    highest_bp_obj = {"systolic": highest_bp.systolic, "diastolic": highest_bp.diastolic, "timestamp": highest_bp.timestamp.isoformat()}
    lowest_bp_obj = {"systolic": lowest_bp.systolic, "diastolic": lowest_bp.diastolic, "timestamp": lowest_bp.timestamp.isoformat()}

    bp_series = [{"timestamp": r.timestamp.isoformat(), "systolic": r.systolic, "diastolic": r.diastolic} for r in bp_readings]
    mood_series = [{"timestamp": m.timestamp.isoformat(), "mood_level": m.mood_level, "note": m.note} for m in mood_logs]

    # Group BP by date
    bp_by_date = {}
    for r in bp_readings:
        d = r.timestamp.date()
        bp_by_date.setdefault(d, {"systolic": [], "diastolic": []})
        bp_by_date[d]["systolic"].append(r.systolic)
        bp_by_date[d]["diastolic"].append(r.diastolic)

    bp_daily = []
    for d, vals in sorted(bp_by_date.items()):
        avg_sys = sum(vals["systolic"]) / len(vals["systolic"])
        avg_dia = sum(vals["diastolic"]) / len(vals["diastolic"])
        bp_daily.append({"date": d.isoformat(), "avg_systolic": round(avg_sys, 1), "avg_diastolic": round(avg_dia, 1)})

    # Group mood by date
    mood_by_date = {}
    for m in mood_logs:
        d = m.timestamp.date()
        if d not in mood_by_date:
            mood_by_date[d] = []
        mood_by_date[d].append(m.mood_level)
        
    mood_daily = []
    for d, levels in sorted(mood_by_date.items()):
        avg_mood = sum(levels) / len(levels)
        category = classify_mood_from_avg(avg_mood)
        mood_daily.append({"date": d.isoformat(), "avg_mood": round(avg_mood, 2), "mood_category": category})

    correlation_points = []
    for d in sorted(bp_by_date.keys()):
        if d in mood_by_date:
            avg_sys = sum(bp_by_date[d]["systolic"]) / len(bp_by_date[d]["systolic"])
            avg_dia = sum(bp_by_date[d]["diastolic"]) / len(bp_by_date[d]["diastolic"])
            avg_mood = sum(mood_by_date[d]) / len(mood_by_date[d])
            category = classify_mood_from_avg(avg_mood)
            correlation_points.append({
                "date": d.isoformat(),
                "avg_systolic": round(avg_sys, 1),
                "avg_diastolic": round(avg_dia, 1),
                "avg_mood": round(avg_mood, 2),
                "mood_category": category
            })

    return jsonify({
        "range": range_param,
        "start_date": start_dt.date().isoformat(),
        "end_date": end_dt.date().isoformat(),
        "last_bp": last_bp_obj,
        "highest_bp": highest_bp_obj,
        "lowest_bp": lowest_bp_obj,
        "bp_series": bp_series,
        "mood_series": mood_series,
        "daily_summary": {
            "bp_daily": bp_daily,
            "mood_daily": mood_daily,
            "correlation_points": correlation_points
        }
    }), 200


# -----------------------
# RECOMMENDATION ENDPOINT
# -----------------------
@api_bp.route("/api/recommendation/today", methods=["GET"])
def recommendation_today():
    user_id = get_current_user_id()
    today = date.today()
    result = get_daily_recommendation(db.session, today, user_id)
    return jsonify(result), 200


# -----------------------
# BADGES ENDPOINT
# -----------------------
@api_bp.route("/api/badges", methods=["GET"])
def get_badges():
    user_id = get_current_user_id()
    today = date.today()
    result = evaluate_and_award_badges(db.session, today, user_id)
    return jsonify(result), 200
