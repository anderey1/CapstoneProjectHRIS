# Revision Specification: REV-04
## Title: DepEd Order 7, s. 2023 Recruitment Rubric & RQA Eligibility

### 1. Objective & Problem Statement
In `backend/core/models/recruitment.py`, 5 criteria are capped at `MaxValueValidator(10.0)` each (max score = 50.0), while `is_rqa_eligible` requires `total_score >= 50.00`. An applicant has to score 10/10 on every category just to qualify.
Under **DepEd Order No. 7, s. 2023** (Guidelines on Recruitment, Selection, and Appointment in the Department of Education), the Comparative Assessment for Teacher applicants is evaluated on a **100-point** or **85-point** scale with specific criteria weights (e.g. Demonstration Teaching 35 pts, Teacher Reflection 25 pts, etc.), and a qualifying threshold of **50 points** for inclusion in the Registry of Qualified Applicants (RQA).

### 2. Files to Modify
- [`backend/core/models/recruitment.py`](file:///C:/Users/user/Documents/CapstoneProjectHRIS_jerwin/backend/core/models/recruitment.py)
- [`backend/core/serializers/recruitment.py`](file:///C:/Users/user/Documents/CapstoneProjectHRIS_jerwin/backend/core/serializers/recruitment.py)
- [`backend/core/views/recruitment.py`](file:///C:/Users/user/Documents/CapstoneProjectHRIS_jerwin/backend/core/views/recruitment.py)

### 3. Step-by-Step Implementation Instructions

#### Step 1: Update Criteria Fields in `Applicant` Model
In `backend/core/models/recruitment.py`:
```python
class Applicant(models.Model):
    # ... personal info fields ...

    # DepEd Order 7, s. 2023 Assessment Scoring (Total: 100 points)
    education_score = models.DecimalField(
        max_digits=5, decimal_places=2, default=0.0, 
        validators=[MaxValueValidator(10.0)],
        help_text="Education (Max 10 pts)"
    )
    training_score = models.DecimalField(
        max_digits=5, decimal_places=2, default=0.0, 
        validators=[MaxValueValidator(10.0)],
        help_text="Training (Max 10 pts)"
    )
    experience_score = models.DecimalField(
        max_digits=5, decimal_places=2, default=0.0, 
        validators=[MaxValueValidator(10.0)],
        help_text="Experience (Max 10 pts)"
    )
    demo_teaching_score = models.DecimalField(
        max_digits=5, decimal_places=2, default=0.0, 
        validators=[MaxValueValidator(35.0)],
        help_text="Classroom Observation / Demonstration Teaching (Max 35 pts)"
    )
    teacher_reflection_score = models.DecimalField(
        max_digits=5, decimal_places=2, default=0.0, 
        validators=[MaxValueValidator(25.0)],
        help_text="Teacher Reflection Form / Written Evaluation (Max 25 pts)"
    )
    interview_score = models.DecimalField(
        max_digits=5, decimal_places=2, default=0.0, 
        validators=[MaxValueValidator(10.0)],
        help_text="Behavioral Events Interview (Max 10 pts)"
    )
    total_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)

    @property
    def is_rqa_eligible(self):
        """
        DepEd DO 7, s. 2023: Minimum 50 points aggregate total
        to be listed in the Registry of Qualified Applicants (RQA).
        """
        return self.total_score >= 50.00

    def save(self, *args, **kwargs):
        self.total_score = (
            self.education_score +
            self.training_score +
            self.experience_score +
            self.demo_teaching_score +
            self.teacher_reflection_score +
            self.interview_score
        )
        super().save(*args, **kwargs)
```

#### Step 2: Generate and Run Django Migration
```bash
python manage.py makemigrations core
python manage.py migrate
```

#### Step 3: Update `ApplicantSerializer` and Frontend Recruitment Views
Ensure the new `demo_teaching_score` and `teacher_reflection_score` fields are serialized and displayed on the HRMPSB assessment panel.

### 4. Verification & Acceptance Criteria
1. An applicant scoring Education=8, Training=8, Experience=8, Demo Teaching=28, TRF=20, Interview=8 achieves a total of `80.00` points.
2. `is_rqa_eligible` returns `True` because $80.00 \ge 50.00$.
3. An applicant scoring an aggregate total of `48.50` returns `is_rqa_eligible = False`.
4. Entering scores exceeding individual maximums (e.g. 40 in Demo Teaching) triggers a validation error.
