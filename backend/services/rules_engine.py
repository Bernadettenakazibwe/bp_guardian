from datetime import datetime, timedelta, date

from ..models import BPReading, MoodLog


# ------------ Helper functions: BP classification & trends ------------ #

def classify_bp_status(avg_sys: float, avg_dia: float) -> str:
    """
    Classify weekly average BP into categories.
    """
    if avg_sys < 120 and avg_dia < 80:
        return "normal"
    elif 120 <= avg_sys <= 129 and avg_dia < 80:
        return "elevated"
    elif 130 <= avg_sys <= 139 or 80 <= avg_dia <= 89:
        return "stage1"
    else:
        return "stage2"


def classify_bp_risk(bp_status: str) -> str:
    """
    Map bp_status to a simpler risk label.
    """
    if bp_status == "normal":
        return "low"
    elif bp_status == "elevated":
        return "borderline"
    elif bp_status == "stage1":
        return "moderate"
    elif bp_status == "stage2":
        return "high"
    return "unknown"


def compute_bp_stats(bp_readings):
    """
    Compute weekly average and min/max systolic/diastolic.
    """
    systolics = [r.systolic for r in bp_readings]
    diastolics = [r.diastolic for r in bp_readings]

    avg_sys = sum(systolics) / len(systolics)
    avg_dia = sum(diastolics) / len(diastolics)

    max_sys = max(systolics)
    max_dia = max(diastolics)
    min_sys = min(systolics)
    min_dia = min(diastolics)

    return {
        "avg_sys": avg_sys,
        "avg_dia": avg_dia,
        "max_sys": max_sys,
        "max_dia": max_dia,
        "min_sys": min_sys,
        "min_dia": min_dia,
    }


def compute_bp_trend(bp_readings):
    """
    Rough trend: compare older half vs newer half.
    Returns: "improving", "worsening", "stable", or "unknown".
    """
    if len(bp_readings) < 2:
        return "unknown"

    sorted_readings = sorted(bp_readings, key=lambda r: r.timestamp)

    mid = len(sorted_readings) // 2
    older = sorted_readings[:mid]
    newer = sorted_readings[mid:]

    def avg_sys(reads):
        return sum(r.systolic for r in reads) / len(reads)

    older_avg = avg_sys(older)
    newer_avg = avg_sys(newer)
    diff = newer_avg - older_avg  # positive = getting higher

    # Thresholds in mmHg – simple heuristic
    if diff >= 5:
        return "worsening"
    elif diff <= -5:
        return "improving"
    else:
        return "stable"


def summarize_logging(bp_readings, start_dt, end_dt):
    """
    Days with any BP reading in the analysis window.
    """
    if not bp_readings:
        return "no_data"

    days_with_bp = {r.timestamp.date() for r in bp_readings}
    num_days = (end_dt.date() - start_dt.date()).days + 1

    count = len(days_with_bp)

    if count >= min(5, num_days):
        return "consistent"
    elif count >= min(3, num_days):
        return "semi_consistent"
    else:
        return "irregular"


# ------------ Helper functions: mood & stress impact ------------ #

def classify_mood_from_avg(avg_mood: float) -> str:
    """
    Same logic as dashboard: map numeric avg_mood (1–3) to category.
    """
    if avg_mood < 1.5:
        return "high_stress"
    elif avg_mood < 2.5:
        return "medium"
    else:
        return "calm"


def compute_weekly_mood(mood_logs):
    """
    Compute weekly average mood and category.
    """
    if not mood_logs:
        return {
            "avg_mood": None,
            "mood_category": "no_data"
        }

    levels = [m.mood_level for m in mood_logs]
    avg_mood = sum(levels) / len(levels)
    category = classify_mood_from_avg(avg_mood)

    return {
        "avg_mood": avg_mood,
        "mood_category": category
    }


def compute_stress_impact(bp_readings, mood_logs):
    """
    Heuristic 'stress impact' based on daily averages:
      - "likely"  : BP clearly higher on high-stress days
      - "possible": small difference
      - "unclear": too little data or no clear pattern
    """
    if not bp_readings or not mood_logs:
        return "unclear"

    # Group BP by date
    bp_by_date = {}
    for r in bp_readings:
        d = r.timestamp.date()
        bp_by_date.setdefault(d, {"sys": [], "dia": []})
        bp_by_date[d]["sys"].append(r.systolic)
        bp_by_date[d]["dia"].append(r.diastolic)

    # Group mood by date
    mood_by_date = {}
    for m in mood_logs:
        d = m.timestamp.date()
        mood_by_date.setdefault(d, [])
        mood_by_date[d].append(m.mood_level)

    # Days with both BP & mood
    common_days = [d for d in bp_by_date.keys() if d in mood_by_date]
    if len(common_days) < 3:
        return "unclear"

    stressed_sys = []
    calm_sys = []

    for d in common_days:
        avg_sys = sum(bp_by_date[d]["sys"]) / len(bp_by_date[d]["sys"])
        avg_mood = sum(mood_by_date[d]) / len(mood_by_date[d])

        # high stress days vs calm days
        if avg_mood < 2.0:   # mostly stressed
            stressed_sys.append(avg_sys)
        elif avg_mood >= 2.5:  # mostly calm
            calm_sys.append(avg_sys)

    if len(stressed_sys) < 1 or len(calm_sys) < 1:
        return "unclear"

    avg_stressed = sum(stressed_sys) / len(stressed_sys)
    avg_calm = sum(calm_sys) / len(calm_sys)
    diff = avg_stressed - avg_calm  # positive if higher on stressed days

    if diff >= 5:
        return "likely"
    elif diff >= 2:
        return "possible"
    else:
        return "unclear"


# ------------ Main recommendation function ------------ #

def get_daily_recommendation(db_session, today: date, user_id: int):

    """
    High-level engine combining:
      - BP risk level
      - Trend over last 7 days
      - Weekly mood category
      - Stress impact heuristic
      - Logging consistency

    Returns a structured dict for the API.
    """
    analysis_days = 7
    end_dt = datetime.combine(today, datetime.max.time())
    start_dt = end_dt - timedelta(days=analysis_days)

    # Query data in range
    bp_readings = (
        db_session.query(BPReading)
        .filter(BPReading.user_id == user_id,BPReading.timestamp >= start_dt)
        .order_by(BPReading.timestamp.asc())
        .all()
    )

    mood_logs = (
        db_session.query(MoodLog)
        .filter(MoodLog.user_id == user_id,MoodLog.timestamp >= start_dt)
        .order_by(MoodLog.timestamp.asc())
        .all()
    )

    # No BP data: can't give meaningful BP-based advice
    if not bp_readings:
        recommendations = [
            "Start by measuring your blood pressure at least once a day for a few days.",
            "After each measurement, take a moment to record how you feel (stressed, okay, or calm).",
        ]
        return {
            "date": str(today),
            "bp_status": "no_data",
            "bp_risk_level": "unknown",
            "bp_trend": "unknown",
            "mood_status": "no_data",
            "stress_impact": "unknown",
            "logging_status": "no_data",
            "summary": (
                "No blood pressure data recorded in the last week. "
                "Please log your readings so BP Guardian can give you a personalized recommendation."
            ),
            "recommendations": recommendations,
        }

    # Latest reading
    latest = bp_readings[-1]

    # BP stats & classifications
    bp_stats = compute_bp_stats(bp_readings)
    bp_status = classify_bp_status(bp_stats["avg_sys"], bp_stats["avg_dia"])
    bp_risk = classify_bp_risk(bp_status)
    bp_trend = compute_bp_trend(bp_readings)

    # Mood & stress
    mood_info = compute_weekly_mood(mood_logs)
    mood_status = mood_info["mood_category"]
    stress_impact = compute_stress_impact(bp_readings, mood_logs)

    # Logging consistency
    logging_status = summarize_logging(bp_readings, start_dt, end_dt)

    # ------------ Build human-friendly recommendations ------------ #

    recommendations = []

    # 1. BP core advice based on risk
    if bp_status == "normal":
        recommendations.append(
            "Your blood pressure has been in the normal range on average. "
            "Keep your current habits: regular movement, moderate salt intake, and enough sleep."
        )
    elif bp_status == "elevated":
        recommendations.append(
            "Your average blood pressure is slightly above the normal range. "
            "Try to reduce very salty foods (like instant soups, chips, and processed meat) "
            "and add at least 20–30 minutes of light activity, such as walking, on most days."
        )
    elif bp_status == "stage1":
        recommendations.append(
            "Your average blood pressure is in the moderately high range. "
            "Focus on reducing salt, avoiding smoking and excessive alcohol, "
            "and adding daily movement such as brisk walking."
        )
    else:  # stage2
        recommendations.append(
            "Your average blood pressure is in the high range. "
            "It is important to reduce salt, avoid smoking and alcohol, and keep active with light exercise if you can. "
            "Consider contacting a healthcare professional, especially if you see repeated very high readings."
        )

    # 2. Trend-based advice
    if bp_trend == "worsening":
        recommendations.append(
            "Over the last days, your blood pressure looks higher compared to earlier in the week. "
            "Try to pay extra attention to salty meals, late-night eating, and missed medication (if prescribed). "
            "Monitor your readings more regularly over the next few days."
        )
    elif bp_trend == "improving":
        recommendations.append(
            "Your blood pressure trend over the last days is improving. "
            "Keep up the helpful habits you have started, such as moving more or reducing salt."
        )
    elif bp_trend == "stable":
        recommendations.append(
            "Your blood pressure has been relatively stable over the last week. "
            "Maintain your current routine and continue tracking."
        )

    # 3. Mood & stress recommendations
    if mood_status == "high_stress":
        text = (
            "Your mood data suggests frequent stress. "
            "Try short relaxation breaks during the day: slow deep breathing for 5 minutes, "
            "a brief walk, or stretching away from screens."
        )
        if stress_impact == "likely":
            text += " Your readings tend to be higher on stressful days, so stress management may help your blood pressure."
        elif stress_impact == "possible":
            text += " There are signs that your blood pressure may be higher on stressful days."
        recommendations.append(text)
    elif mood_status == "medium":
        text = (
            "Your mood has been mixed or moderate. "
            "Notice which situations raise your stress level and try to balance them with short breaks or light activity."
        )
        if stress_impact == "likely":
            text += " BP Guardian sees a clear pattern of higher blood pressure on more stressful days."
        elif stress_impact == "possible":
            text += " There may be some link between stress and higher readings."
        recommendations.append(text)
    elif mood_status == "calm":
        if stress_impact in ("likely", "possible"):
            recommendations.append(
                "Your mood has been mostly calm, which is positive. "
                "On the few more stressful days, your blood pressure appears slightly higher. "
                "Keep your calm routines and use them on stressful days as well."
            )
        else:
            recommendations.append(
                "Your mood has been mostly calm. This is good for your heart health. "
                "Try to protect this by getting enough sleep and taking short breaks during busy days."
            )

    # 4. Logging consistency
    if logging_status == "irregular":
        recommendations.append(
            "Your blood pressure has not been logged very regularly this week. "
            "Try to record it on at least 4–5 days per week so that trends and advice are more accurate."
        )
    elif logging_status == "semi_consistent":
        recommendations.append(
            "You are logging your blood pressure on some days. "
            "A little more consistency (most days of the week) will make the patterns clearer."
        )
    elif logging_status == "consistent":
        recommendations.append(
            "You are logging your blood pressure consistently. "
            "This regular tracking makes the insights from BP Guardian more reliable."
        )

    # Short summary
    summary_parts = []

    summary_parts.append(f"Average blood pressure risk: {bp_risk}.")
    if bp_trend != "unknown":
        summary_parts.append(f"Trend over the last week: {bp_trend}.")
    if mood_status not in ("no_data",):
        summary_parts.append(f"Mood/stress level: {mood_status.replace('_', ' ')}.")
    if stress_impact != "unclear":
        summary_parts.append(f"Stress impact on BP: {stress_impact}.")

    summary = " ".join(summary_parts)

    return {
        "date": str(today),
        "latest_bp": {
            "systolic": latest.systolic,
            "diastolic": latest.diastolic,
            "timestamp": latest.timestamp.isoformat(),
        },
        "bp_status": bp_status,
        "bp_risk_level": bp_risk,
        "bp_trend": bp_trend,
        "mood_status": mood_status,
        "stress_impact": stress_impact,
        "logging_status": logging_status,
        "summary": summary,
        "recommendations": recommendations,
    }
