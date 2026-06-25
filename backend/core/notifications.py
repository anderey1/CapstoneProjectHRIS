import logging
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)

def send_applicant_notification(applicant, new_status_display, notes='', username='', temp_password=''):
    """
    Sends a formal, polite email notification to the applicant about their status change.
    Includes onboarding details if they have been hired.
    """
    if username and temp_password:
        subject = f"Official Job Appointment: {applicant.position_applied} - DepEd Lucena City"
        message = f"""Dear {applicant.first_name} {applicant.last_name},

We are pleased to inform you that your application for the position of {applicant.position_applied} at the Department of Education - Division of Lucena City has been approved. Welcome to our Division!

To facilitate your onboarding process, we have initialized your account on our HRIS portal. You can now log in to update your profile, log attendance, and file requests:

Portal Login Link: http://localhost:5173/login
Username: {username}
Temporary Password: {temp_password}

Upon your first sign-in, please change your password immediately to ensure your account security.

Should you have any questions or require assistance setting up your portal profile, please feel free to reach out to the Human Resource Management Section.

Best regards,

Human Resource Management Section
Department of Education - Division of Lucena City
"""
    else:
        subject = f"Application Status Update: {applicant.position_applied} - DepEd Lucena City"
        
        score_info = ""
        if applicant.total_score > 0:
            score_info = f"""
Evaluation & Assessment Points:
---------------------------------------------
Education & Training Evaluation: {applicant.education_score} pts
Performance & Experience Review: {applicant.experience_score} pts
Written Examination Result: {applicant.exam_score} pts
Interview / Behavioral Assessment: {applicant.interview_score} pts
---------------------------------------------
Total Consolidated Points: {applicant.total_score} pts
"""

        message = f"""Dear {applicant.first_name} {applicant.last_name},

Thank you for your interest in joining the Department of Education - Division of Lucena City. We are writing to update you on the status of your application for the position of {applicant.position_applied}.

Your application has progressed to the following stage: {new_status_display}
{score_info}
{f"Committee Remarks: {notes}" if notes else ""}

We will continue to keep you informed of further updates as we proceed with the evaluation process. If you have any inquiries, you may contact the Human Resource Management Section.

Best regards,

Human Resource Merit Promotion and Selection Board (HRMPSB)
Department of Education - Division of Lucena City
"""
    
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [applicant.email],
            fail_silently=False,
        )
        logger.info(f"Notification sent to {applicant.email} for status {new_status_display}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {applicant.email}: {str(e)}")
        return False
