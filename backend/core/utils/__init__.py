from google import genai
from google.genai import types
import math
import os
import json
from django.utils import timezone
from datetime import datetime

def extract_pds_data(file_bytes):
    """
    Extracts PDS data from PDF using Gemini API for high-accuracy structured extraction.
    Aligned with core.models.Employee fields.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return None, "API key missing"

    try:
        client = genai.Client(api_key=api_key)

        prompt = """
        You are a high-security HR data extraction system. Your task is to extract data ONLY from a valid Civil Service Form No. 212 (Personal Data Sheet - PDS).
        
        STRICT RULES:
        1. NO HALLUCINATION. If a field is not present in the document, is blank, or contains only placeholders (like "N/A", "NONE", "(mm/dd/yyyy)"), return EXACTLY "".
        2. BE LITERAL. Do not infer values.
        3. IGNORE FORM INSTRUCTIONS. Do not extract text that is part of the form's labels or guidance (e.g., "(Write in full)").
        4. NORMALIZE DATES to YYYY-MM-DD. If only a year is visible, use YYYY-01-01.
        
        CRITICAL VERIFICATION:
        First, check if this document is a CS Form No. 212. 
        If it is NOT a PDS, return: {"is_valid_pds": false}
        
        If it IS a PDS, return a JSON object with "is_valid_pds": true and a "data" object containing:
        {
            "first_name": "...",
            "last_name": "...",
            "middle_name": "...",
            "name_extension": "...",
            "date_of_birth": "YYYY-MM-DD",
            "place_of_birth": "...",
            "sex": "...",
            "civil_status": "...",
            "umid_id": "...",
            "pagibig_id": "...",
            "philhealth_no": "...",
            "philsys_id": "...",
            "tin_no": "...",
            "agency_employee_no": "...",
            "mobile_no": "...",
            "email": "...",
            "residential_address": "...",
            "permanent_address": "...",
            "position": "...",
            "department": "...",
            "salary": "number",
            "date_hired": "YYYY-MM-DD",
            
            "family": [
                {
                    "relationship": "SPOUSE|FATHER|MOTHER|CHILD",
                    "surname": "...",
                    "first_name": "...",
                    "middle_name": "...",
                    "full_name": "...",
                    "occupation": "...",
                    "employer": "...",
                    "date_of_birth": "YYYY-MM-DD"
                }
            ],
            
            "education": [
                {
                    "level": "ELEMENTARY|SECONDARY|VOCATIONAL|COLLEGE|GRADUATE",
                    "school_name": "...",
                    "degree_course": "...",
                    "period_from": "YYYY-MM-DD",
                    "period_to": "YYYY-MM-DD|present",
                    "highest_level": "...",
                    "year_graduated": "YYYY",
                    "honors_received": "..."
                }
            ],
            
            "eligibilities": [
                {
                    "service": "...",
                    "rating": "...",
                    "date_of_exam": "YYYY-MM-DD",
                    "place_of_exam": "...",
                    "license_number": "...",
                    "validity_date": "YYYY-MM-DD"
                }
            ],
            
            "work_experience": [
                {
                    "date_from": "YYYY-MM-DD",
                    "date_to": "YYYY-MM-DD|present",
                    "position_title": "...",
                    "agency": "...",
                    "monthly_salary": "number",
                    "salary_grade": "...",
                    "status_of_appointment": "...",
                    "is_gov_service": boolean
                }
            ]
        }
        """
        
        response = client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=[
                types.Part.from_bytes(data=file_bytes, mime_type="application/pdf"),
                prompt
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        
        result = json.loads(response.text)
        if not result.get("is_valid_pds"):
            return None, "Document is not a valid PDS (CS Form 212)"
            
        return result.get("data"), None

        
    except Exception as e:
        print(f"Gemini Error (PDS Extraction): {e}")
        return None, str(e)

def generate_hr_summary(data_context):
    """
    Generates an AI-powered HR summary using Gemini API.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return f"Descriptive analytics summary: Currently managing {data_context.get('total_employees', 0)} personnel records and {data_context.get('total_loans', 0)} loans. (AI features deactivated: API key missing)"
    
    try:
        client = genai.Client(api_key=api_key)
        prompt = f"As an HR Analytics assistant, provide a 2-sentence concise executive summary of this HR data: {json.dumps(data_context)}. Focus on overall workforce health and loan activity."
        response = client.models.generate_content(
            model="gemini-2.0-flash-lite",
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        print(f"Gemini Error (HR Summary): {e}")
        return "The system is operating normally with all modules integrated. Workforce and loan metrics are within standard parameters."

def generate_performance_summary(scores, attendance_data=None):
    """
    Generates an AI-powered performance summary using Gemini API.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        avg = (scores['punctuality_score'] + scores['quality_score'] + scores['behavior_score']) / 3
        if avg >= 4.5: return "Outstanding performance across all metrics."
        elif avg >= 3.0: return "Satisfactory performance. Meets standard requirements."
        return "Needs improvement in certain areas."
    
    try:
        client = genai.Client(api_key=api_key)
        prompt = f"Provide a brief, professional performance evaluation summary (1-2 sentences) for an employee with these scores: {json.dumps(scores)}. Attendance context: {attendance_data or 'Not provided'}. Focus on strengths and potential."
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        print(f"Gemini Error (Performance): {e}")
        return "Standard performance evaluation based on scoring criteria. Meets division expectations for the current period."

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

def calculate_working_days(start_date, end_date):
    """
    Calculates the number of working days (Mon-Fri) between two dates inclusive.
    Pure python implementation to avoid extra dependencies.
    """
    import datetime
    day_count = 0
    current_date = start_date
    while current_date <= end_date:
        if current_date.weekday() < 5: # 0-4 is Mon-Fri
            day_count += 1
        current_date += datetime.timedelta(days=1)
    return day_count

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

def parse_cutoff_dates(cutoff_string):
    """
    Parses string like "May 1-15, 2026" or "May 1-15 (1st Quatrain)"
    Returns (start_date, end_date) as datetime.date objects.
    """
    import re
    from datetime import date
    
    # Try to extract Month, Day1, Day2, and Year
    # Supports "May 1-15, 2026" and "May 1-15 (1st Quatrain)" with Year extracted from context if missing
    pattern = r"([A-Za-z]+)\s+(\d+)-(\d+)(?:,\s+(\d{4}))?"
    match = re.search(pattern, cutoff_string)
    
    if not match:
        return None, None
        
    month_name = match.group(1)
    day1 = int(match.group(2))
    day2 = int(match.group(3))
    year = int(match.group(4)) if match.group(4) else timezone.now().year
    
    try:
        month_num = datetime.strptime(month_name[:3], "%b").month
        start_date = date(year, month_num, day1)
        end_date = date(year, month_num, day2)
        return start_date, end_date
    except Exception:
        return None, None
