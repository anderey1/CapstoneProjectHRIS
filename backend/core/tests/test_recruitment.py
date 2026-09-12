import pytest
from decimal import Decimal
from django.core.exceptions import ValidationError
from core.models import Applicant
from rest_framework.test import APIClient

@pytest.fixture
def client():
    return APIClient()

@pytest.fixture
def applicant(db):
    return Applicant.objects.create(
        first_name="Clara",
        last_name="Reyes",
        email="clara@example.com",
        phone="09123456789",
        position_applied="Teacher I",
        education_score=Decimal("8.50"),
        training_score=Decimal("9.00"),
        experience_score=Decimal("7.50"),
        demo_teaching_score=Decimal("30.00"),
        exam_score=Decimal("20.00"),
        interview_score=Decimal("8.00")
    )


@pytest.mark.django_db
class TestRecruitmentRubric:
    def test_rqa_rubric_total_score_calculation(self):
        """Auto-computes total score from all DO 7, s. 2023 components on save."""
        applicant = Applicant.objects.create(
            first_name="Clara",
            last_name="Reyes",
            email="clara@example.com",
            phone="09123456789",
            position_applied="Teacher I",
            education_score=Decimal("8.50"),
            training_score=Decimal("9.00"),
            experience_score=Decimal("7.50"),
            demo_teaching_score=Decimal("30.00"),
            exam_score=Decimal("20.00"),
            interview_score=Decimal("8.00")
        )
        # 8.5 + 9 + 7.5 + 30 + 20 + 8 = 83.00
        assert applicant.total_score == Decimal("83.00")
        assert applicant.is_rqa_eligible is True

    def test_rqa_eligibility_threshold_pass(self):
        """Applicants with 50.0 points or higher qualify for RQA."""
        applicant = Applicant.objects.create(
            first_name="Jose",
            last_name="Rizal",
            email="jose@example.com",
            phone="09123456781",
            position_applied="Teacher I",
            education_score=Decimal("5.00"),
            training_score=Decimal("5.00"),
            experience_score=Decimal("5.00"),
            demo_teaching_score=Decimal("20.00"),
            exam_score=Decimal("10.00"),
            interview_score=Decimal("5.00")
        )
        # Total = 50.00
        assert applicant.total_score == Decimal("50.00")
        assert applicant.is_rqa_eligible is True

    def test_rqa_eligibility_threshold_fail(self):
        """Applicants with less than 50.0 points do not qualify for RQA."""
        applicant = Applicant.objects.create(
            first_name="Juan",
            last_name="Luna",
            email="juan@example.com",
            phone="09123456782",
            position_applied="Teacher I",
            education_score=Decimal("5.00"),
            training_score=Decimal("5.00"),
            experience_score=Decimal("5.00"),
            demo_teaching_score=Decimal("15.00"),
            exam_score=Decimal("10.00"),
            interview_score=Decimal("5.00")
        )
        # Total = 45.00
        assert applicant.total_score == Decimal("45.00")
        assert applicant.is_rqa_eligible is False

    def test_rubric_validators_clean(self):
        """Full clean catches scores that exceed maximum field limits."""
        applicant = Applicant(
            first_name="Over",
            last_name="Achiever",
            email="over@example.com",
            phone="09123456783",
            position_applied="Teacher I",
            demo_teaching_score=Decimal("40.00") # Max is 35.0
        )
        with pytest.raises(ValidationError):
            applicant.full_clean()

    def test_hired_applicant_gets_randomized_secure_password(self, client, superintendent_user, applicant):
        """Verify hired applicant does NOT receive predictable static password."""
        client.force_authenticate(user=superintendent_user)
        response = client.post(f'/api/applicants/{applicant.id}/change-status/', {
            'status': 'hired',
            'notes': 'Hired with test verification'
        })
        assert response.status_code == 200
        assert "WelcomeDepEd2026!" not in response.data.get("message", "")
