import math


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


def validate_attendance_geo(employee_lat, employee_lng, school_lat, school_lng, radius=100, accuracy=0):
    """
    Validates if the employee is within the allowed radius of the school.
    Allows a bounded GPS accuracy tolerance (up to 30m) for mobile device jitter.
    """
    distance = haversine(employee_lat, employee_lng, school_lat, school_lng)
    tolerance = min(max(0.0, float(accuracy or 0)), 30.0)
    effective_distance = max(0.0, distance - tolerance)
    return effective_distance <= radius, distance
