import logging
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)

def send_applicant_notification(applicant, new_status_display, notes=''):
    """
    Sends a professional email notification to the applicant about their status change.
    Includes score summary if they have reached the Assessment stage.
    """
    subject = f"Update: Your Application for {applicant.position_applied} at DepEd Lucena City"
    
    score_info = ""
    if applicant.total_score > 0:
        score_info = f"""
    HRMPSB Assessment Summary:
    --------------------------
    Education: {applicant.education_score}
    Training: {applicant.training_score}
    Experience: {applicant.experience_score}
    Interview: {applicant.interview_score}
    Written Exam: {applicant.exam_score}
    --------------------------
    TOTAL POINTS: {applicant.total_score}
    
    {"(Congratulations! You have reached the minimum 50-point threshold for RQA eligibility.)" if applicant.is_rqa_eligible else ""}
        """

    message = f"""
    Dear {applicant.first_name} {applicant.last_name},

    We are writing to inform you of an update regarding your application for the position of {applicant.position_applied} at DepEd {applicant.school_division}.

    Your current application status is now: {new_status_display}
    {score_info}
    {f"Remarks from HRMPSB: {notes}" if notes else ""}

    Please stay tuned for further updates. If you have any questions, you may contact the Human Resource Management Office.

    Best regards,
    Human Resource Merit Promotion and Selection Board (HRMPSB)
    DepEd - Lucena City
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
