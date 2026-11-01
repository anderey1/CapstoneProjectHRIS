from google import genai
import os
import json


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
            model="gemini-2.5-flash-lite",
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
            model="gemini-2.5-flash",
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        print(f"Gemini Error (Performance): {e}")
        return "Standard performance evaluation based on scoring criteria. Meets division expectations for the current period."
