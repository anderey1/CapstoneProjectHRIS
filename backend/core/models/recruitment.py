from django.db import models
from django.core.validators import MaxValueValidator

# -------------------------
# DEPED POSITIONS
# -------------------------
TEACHING_POSITIONS = [
    ('Teacher I', 'Teacher I'),
    ('Teacher II', 'Teacher II'),
    ('Teacher III', 'Teacher III'),
    ('Master Teacher I', 'Master Teacher I'),
    ('Master Teacher II', 'Master Teacher II'),
    ('SPED Teacher I', 'SPED Teacher I'),
]

NON_TEACHING_POSITIONS = [
    ('Administrative Officer I', 'Administrative Officer I'),
    ('Administrative Officer II', 'Administrative Officer II'),
    ('Administrative Assistant I', 'Administrative Assistant I'),
    ('Administrative Assistant II', 'Administrative Assistant II'),
    ('Registrar I', 'Registrar I'),
    ('Accountant I', 'Accountant I'),
    ('School Principal I', 'School Principal I'),
]

ALL_POSITIONS = TEACHING_POSITIONS + NON_TEACHING_POSITIONS

# -------------------------
# RECRUITMENT APPLICANT
# -------------------------
class Applicant(models.Model):
    STATUS_CHOICES = [
        ('applied', 'Applied / Submitted'),
        ('initial_evaluation', 'Initial Evaluation (QS Check)'),
        ('comparative_assessment', 'Comparative Assessment (HRMPSB)'),
        ('interview', 'Behavioral Events Interview (BEI)'),
        ('background_investigation', 'Background Investigation'),
        ('appointment_proposed', 'For Appointment / Proposed'),
        ('hired', 'Appointed / Hired'),
        ('disqualified', 'Not Qualified (QS)'),
        ('rejected', 'Not Selected (CAR/RQA)'),
    ]

    first_name = models.CharField(max_length=50)
    middle_name = models.CharField(max_length=50, null=True, blank=True)
    last_name = models.CharField(max_length=50)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    
    # Position Info
    position_applied = models.CharField(max_length=100, choices=ALL_POSITIONS)
    school_division = models.CharField(max_length=100, default='Lucena City')
    
    # DepEd Assessment Scores (Registry of Qualified Applicants - RQA)
    # Typical DepEd Order 007 points (adjusted to 10 each for simplicity/standard)
    education_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.0, validators=[MaxValueValidator(10.0)])
    training_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.0, validators=[MaxValueValidator(10.0)])
    experience_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.0, validators=[MaxValueValidator(10.0)])
    interview_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.0, validators=[MaxValueValidator(10.0)])
    exam_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.0, validators=[MaxValueValidator(10.0)])
    total_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)

    # Status Tracking
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='applied')
    last_status_update = models.DateTimeField(auto_now=True)
    is_notified = models.BooleanField(default=False) # Whether applicant received update email/sms
    
    # Attachments
    pds_file = models.FileField(upload_to='applicant_pds/', null=True, blank=True)
    resume = models.FileField(upload_to='applicant_resumes/', null=True, blank=True)
    
    notes = models.TextField(null=True, blank=True)
    date_applied = models.DateTimeField(auto_now_add=True)

    @property
    def is_rqa_eligible(self):
        """
        DepEd Rule: Minimum 50 points total to be included in the 
        Registry of Qualified Applicants (RQA).
        """
        return self.total_score >= 50.00

    def save(self, *args, **kwargs):
        # Auto-compute total score
        self.total_score = (
            self.education_score + 
            self.training_score + 
            self.experience_score + 
            self.interview_score + 
            self.exam_score
        )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.total_score} pts)"


class ApplicantDocument(models.Model):
    applicant = models.ForeignKey(Applicant, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=100)
    file = models.FileField(upload_to='applicant_documents/')
    filename = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.applicant.first_name} {self.applicant.last_name} - {self.document_type} - {self.filename}"

