from datetime import datetime, timedelta, date

from ..models import BPReading, MoodLog, Badge, UserBadge


# -------------------------
# Badge definitions
# -------------------------

BADGE_DEFINITIONS = [
    {
        "code": "FIRST_BP_READING",
        "name": "First Step",
        "description": "Recorded your first blood pressure reading."
    },
    {
        "code": "WEEKLY_BP_CONSISTENT_7",
        "name": "Consistency Star",
        "description": "Logged blood pressure on 7 different days in the last 7 days."
    },
    {
        "code": "WEEKLY_MOOD_AWARE",
        "name": "Mood Aware",
        "description": "Logged your mood on at least 5 days in the last 7 days."
    },
    {
        "code": "MONTHLY_BP_CONSISTENT_20",
        "name": "Long-Run Logger",
        "description": "Logged blood pressure on at least 20 days in the last 30 days."
    },
]


def ensure_badges_exist(db_session):
    """
    Ensure that all badge definitions exist in the Badge table.
    This is global (not per user).
    """
    existing = {
        b.code: b
        for b in db_session.query(Badge).all()
    }

    for bd in BADGE_DEFINITIONS:
        if bd["code"] not in existing:
            badge = Badge(
                code=bd["code"],
                name=bd["name"],
                description=bd.get("description")
            )
            db_session.add(badge)

    db_session.commit()


# -------------------------
# Helper functions
# -------------------------

def get_earned_badge_codes(db_session, user_id: int):
    """
    Return a set of badge codes that have already been earned
    by this user.
    """
    user_badges = (
        db_session.query(UserBadge)
        .join(Badge, UserBadge.badge_id == Badge.id)
        .filter(UserBadge.user_id == user_id)
        .all()
    )
    return {ub.badge.code for ub in user_badges}


def get_user_badge_status(db_session, user_id: int):
    """
    Return a list of all badges with whether they are earned and when,
    for this specific user.
    """
    # All badge definitions
    badges = {b.code: b for b in db_session.query(Badge).all()}

    # User's earned badges
    earned_entries = (
        db_session.query(UserBadge)
        .join(Badge, UserBadge.badge_id == Badge.id)
        .filter(UserBadge.user_id == user_id)
        .all()
    )
    earned_map = {ub.badge.code: ub for ub in earned_entries}

    result = []
    for code, badge in badges.items():
        ub = earned_map.get(code)
        result.append({
            "code": badge.code,
            "name": badge.name,
            "description": badge.description,
            "earned": ub is not None,
            "earned_at": ub.earned_at.isoformat() if ub else None
        })

    # Sort: earned first, then by name
    result.sort(key=lambda x: (not x["earned"], x["name"]))
    return result


# -------------------------
# Badge condition checks (per user)
# -------------------------

def has_any_bp_reading(db_session, user_id: int) -> bool:
    """
    Check if user has at least one BP reading.
    """
    reading = (
        db_session.query(BPReading)
        .filter_by(user_id=user_id)
        .first()
    )
    return reading is not None


def check_weekly_bp_consistent_7(db_session, today: date, user_id: int) -> bool:
    """
    True if this user has BP readings on 7 distinct days in the last 7 days.
    """
    end_dt = datetime.combine(today, datetime.max.time())
    start_dt = end_dt - timedelta(days=6)  # last 7 calendar days including today

    readings = (
        db_session.query(BPReading)
        .filter(BPReading.user_id == user_id, BPReading.timestamp >= start_dt)
        .all()
    )
    days = {r.timestamp.date() for r in readings}
    return len(days) >= 7


def check_weekly_mood_aware(db_session, today: date, user_id: int) -> bool:
    """
    True if this user logged mood on at least 5 days in the last 7 days.
    """
    end_dt = datetime.combine(today, datetime.max.time())
    start_dt = end_dt - timedelta(days=6)

    moods = (
        db_session.query(MoodLog)
        .filter(MoodLog.user_id == user_id, MoodLog.timestamp >= start_dt)
        .all()
    )
    days = {m.timestamp.date() for m in moods}
    return len(days) >= 5


def check_monthly_bp_consistent_20(db_session, today: date, user_id: int) -> bool:
    """
    True if this user logged BP on at least 20 days in the last 30 days.
    """
    end_dt = datetime.combine(today, datetime.max.time())
    start_dt = end_dt - timedelta(days=29)

    readings = (
        db_session.query(BPReading)
        .filter(BPReading.user_id == user_id, BPReading.timestamp >= start_dt)
        .all()
    )
    days = {r.timestamp.date() for r in readings}
    return len(days) >= 20


# -------------------------
# Main evaluation function
# -------------------------

def evaluate_and_award_badges(db_session, today: date, user_id: int):
    """
    Check which badges this user should have based on their activity,
    award any new ones, and return:
      - badges: list of all badges with earned flag and date
      - newly_awarded: list of codes just awarded in this call
    """
    # Make sure badge definitions exist globally
    ensure_badges_exist(db_session)

    # What does this user already have?
    earned_codes = get_earned_badge_codes(db_session, user_id)

    newly_awarded_codes = []

    # 1. FIRST_BP_READING
    if "FIRST_BP_READING" not in earned_codes and has_any_bp_reading(db_session, user_id):
        _award_badge_by_code(db_session, user_id, "FIRST_BP_READING")
        newly_awarded_codes.append("FIRST_BP_READING")

    # 2. WEEKLY_BP_CONSISTENT_7
    if "WEEKLY_BP_CONSISTENT_7" not in earned_codes and check_weekly_bp_consistent_7(db_session, today, user_id):
        _award_badge_by_code(db_session, user_id, "WEEKLY_BP_CONSISTENT_7")
        newly_awarded_codes.append("WEEKLY_BP_CONSISTENT_7")

    # 3. WEEKLY_MOOD_AWARE
    if "WEEKLY_MOOD_AWARE" not in earned_codes and check_weekly_mood_aware(db_session, today, user_id):
        _award_badge_by_code(db_session, user_id, "WEEKLY_MOOD_AWARE")
        newly_awarded_codes.append("WEEKLY_MOOD_AWARE")

    # 4. MONTHLY_BP_CONSISTENT_20
    if "MONTHLY_BP_CONSISTENT_20" not in earned_codes and check_monthly_bp_consistent_20(db_session, today, user_id):
        _award_badge_by_code(db_session, user_id, "MONTHLY_BP_CONSISTENT_20")
        newly_awarded_codes.append("MONTHLY_BP_CONSISTENT_20")

    db_session.commit()

    # Final badge status for this user
    all_status = get_user_badge_status(db_session, user_id)

    return {
        "badges": all_status,
        "newly_awarded": newly_awarded_codes
    }


def _award_badge_by_code(db_session, user_id: int, code: str):
    """
    Helper: create a UserBadge entry for this user and badge code.
    """
    badge = db_session.query(Badge).filter_by(code=code).first()
    if not badge:
        return  # should not happen if ensure_badges_exist() worked

    ub = UserBadge(
        user_id=user_id,
        badge_id=badge.id,
        earned_at=datetime.utcnow()
    )
    db_session.add(ub)
