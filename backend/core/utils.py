import math
import os
import json
from django.utils import timezone
from datetime import datetime

def generate_hr_summary(data_context):
    """
    Placeholder for HR summary. AI features removed per scope.
    """
    return "Descriptive analytics summary: The system is operating normally with all modules integrated."

def generate_performance_summary(scores, attendance_data):
    """
    Placeholder for performance summary. AI features removed per scope.
    """
    avg = (scores['punctuality_score'] + scores['quality_score'] + scores['behavior_score']) / 3
    if avg >= 4.5:
        return "Outstanding performance across all metrics."
    elif avg >= 3.0:
        return "Satisfactory performance. Meets standard requirements."
    return "Needs improvement in certain areas."

def haversine(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    Returns distance in meters.
    """
    # convert decimal degrees to radians 
    lat1, lon1, lat2, lon2 = map(math.radians, [float(lat1), float(lon1), float(lat2), float(lon2)])

    # haversine formula 
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a)) 
    r = 6371000 # Radius of earth in meters.
    return c * r

def validate_attendance_geo(employee_lat, employee_lng, school_lat, school_lng, radius=100):
    """
    Validates if the employee is within the allowed radius of the school.
    """
    distance = haversine(employee_lat, employee_lng, school_lat, school_lng)
    return distance <= radius, distance

def get_attendance_status(check_in_time):
    """
    Determines if check-in is 'present' or 'late'.
    Standard DepEd time is usually 8:00 AM.
    """
    # Mocking standard time to 8:00 AM
    standard_time = check_in_time.replace(hour=8, minute=0, second=0, microsecond=0)
    if check_in_time > standard_time:
        return 'late'
    return 'present'

def generate_daily_qr_token():
    """
    Generates a unique token for the current day.
    In a real app, use a more secure rotating hash.
    """
    from django.conf import settings
    import hashlib
    
    today = timezone.now().date().isoformat()
    # Simple hash of date + secret key
    seed = f"{today}-{settings.SECRET_KEY}"
    return hashlib.md5(seed.encode()).hexdigest()[:12].upper()
