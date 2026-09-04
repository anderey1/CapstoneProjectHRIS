import pytest
from decimal import Decimal
from django.contrib.auth import get_user_model
from core.models import Role, School, SalaryGrade, Employee

User = get_user_model()

@pytest.fixture
def mock_school(db):
    return School.objects.create(
        name="Lucena East Central School",
        latitude=Decimal("13.937200"),
        longitude=Decimal("121.617200"),
        radius_meters=150
    )

@pytest.fixture
def salary_grade_11(db):
    return SalaryGrade.objects.create(
        grade=11,
        amount=Decimal("27000.00"),
        label="Teacher I"
    )

@pytest.fixture
def superintendent_user(db):
    return User.objects.create_user(
        username="superintendent",
        password="password123",
        role=Role.SUPERINTENDENT,
        first_name="SDS",
        last_name="Leader"
    )

@pytest.fixture
def hr_user(db):
    return User.objects.create_user(
        username="hr_staff",
        password="password123",
        role=Role.HR,
        first_name="HR",
        last_name="Officer"
    )

@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        username="admin",
        password="password123",
        email="admin@example.com",
        role=Role.ADMINISTRATIVE
    )

@pytest.fixture
def supervisor_user(db, mock_school):
    user = User.objects.create_user(
        username="principal_juan",
        password="password123",
        role=Role.ADMINISTRATIVE,
        first_name="Juan",
        last_name="Principal"
    )
    Employee.objects.create(
        user=user,
        first_name="Juan",
        last_name="Principal",
        school=mock_school,
        position="School Principal I",
        salary=Decimal("50000.00")
    )
    return user

@pytest.fixture
def teacher_employee(db, mock_school, salary_grade_11, supervisor_user):
    user = User.objects.create_user(
        username="maria_teacher",
        password="password123",
        role=Role.TEACHING,
        first_name="Maria",
        last_name="Santos"
    )
    emp = Employee.objects.create(
        user=user,
        first_name="Maria",
        last_name="Santos",
        school=mock_school,
        supervisor=supervisor_user.employee_profile,
        salary_grade=salary_grade_11,
        salary=Decimal("27000.00"),
        vacation_leave_balance=Decimal("15.0"),
        sick_leave_balance=Decimal("15.0")
    )
    return emp

@pytest.fixture
def non_teaching_employee(db, mock_school):
    user = User.objects.create_user(
        username="pedro_clerk",
        password="password123",
        role=Role.NON_TEACHING,
        first_name="Pedro",
        last_name="Clerk"
    )
    emp = Employee.objects.create(
        user=user,
        first_name="Pedro",
        last_name="Clerk",
        school=mock_school,
        salary=Decimal("18000.00"),
        vacation_leave_balance=Decimal("15.0"),
        sick_leave_balance=Decimal("15.0")
    )
    return emp
