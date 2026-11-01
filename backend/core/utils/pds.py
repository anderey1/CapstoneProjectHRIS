from google import genai
from google.genai import types
import os
import json


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
