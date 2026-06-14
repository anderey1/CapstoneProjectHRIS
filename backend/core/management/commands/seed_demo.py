from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from core.models import (
    Role, School, Employee, SalaryGrade, Attendance, 
    LeaveRequest, ProvidentLoan, LoanPayment, Payroll, 
    Applicant, PerformanceReview
)
from django.utils import timezone
from datetime import date, time, timedelta
import random
from decimal import Decimal

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with rich demo data for Capstone defense.'

    def handle(self, *args, **options):
        self.stdout.write('Clearing existing data...')
        # Don't delete Superusers or standard demo users if they exist, but clear records
        Attendance.objects.all().delete()
        LeaveRequest.objects.all().delete()
        LoanPayment.objects.all().delete()
        ProvidentLoan.objects.all().delete()
        Payroll.objects.all().delete()
        PerformanceReview.objects.all().delete()
        Applicant.objects.all().delete()
        # Keep SalaryGrades and Schools but refresh if needed
        # Employee.objects.exclude(user__is_superuser=True).delete()
        # User.objects.exclude(is_superuser=True).delete()

        self.stdout.write('Seeding Schools...')
        schools = [
            {'name': 'Lucena City National High School', 'lat': 13.9367, 'lng': 121.6150},
            {'name': 'Gulang-Gulang Elementary School', 'lat': 13.9450, 'lng': 121.6200},
            {'name': 'Iyam Elementary School', 'lat': 13.9300, 'lng': 121.6050},
            {'name': 'Division Office', 'lat': 13.9400, 'lng': 121.6100},
        ]
        school_objs = []
        for s in schools:
            obj, _ = School.objects.get_or_create(
                name=s['name'],
                defaults={'latitude': s['lat'], 'longitude': s['lng'], 'radius_meters': 150}
            )
            school_objs.append(obj)

        self.stdout.write('Seeding Salary Grades...')
        sg_data = [
            (1, 13000, "Administrative Aide I"),
            (11, 27000, "Teacher I"),
            (12, 29165, "Teacher II"),
            (13, 31320, "Teacher III"),
            (18, 46725, "Master Teacher I"),
            (19, 51357, "Master Teacher II"),
            (24, 88410, "School Principal III"),
        ]
        sg_objs = {}
        for grade, amt, label in sg_data:
            obj, _ = SalaryGrade.objects.update_or_create(
                grade=grade,
                defaults={'amount': amt, 'label': label}
            )
            sg_objs[grade] = obj

        self.stdout.write('Seeding Users & Employees...')
        roles_to_seed = [
            (Role.ADMIN, 'admin_user', 'System', 'Admin'),
            (Role.HR, 'hr_manager', 'Hilaria', 'Ramos'),
            (Role.ACCOUNTANT, 'accountant_user', 'Alicia', 'Contador'),
            (Role.SUPERINTENDENT, 'superintendent_user', 'Samuel', 'Principal'),
            (Role.TEACHING, 'teacher_marites', 'Marites', 'Cruz'),
            (Role.TEACHING, 'teacher_juan', 'Juan', 'Dela Cruz'),
            (Role.NON_TEACHING, 'staff_pedro', 'Pedro', 'Penduko'),
        ]

        employee_objs = []
        for role, username, fname, lname in roles_to_seed:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': f'{username}@deped.gov.ph',
                    'role': role,
                    'is_staff': role in [Role.ADMIN, Role.HR, Role.ACCOUNTANT, Role.SUPERINTENDENT]
                }
            )
            if created:
                user.set_password('password123')
                user.save()

            emp, _ = Employee.objects.update_or_create(
                user=user,
                defaults={
                    'first_name': fname,
                    'last_name': lname,
                    'agency_employee_no': f'2024-LC-00{random.randint(10,99)}',
                    'salary': Decimal('30000.00'),
                    'school': random.choice(school_objs),
                    'salary_grade': sg_objs[11] if role == Role.TEACHING else sg_objs[1],
                    'bank_name': 'Land Bank of the Philippines',
                    'account_number': f'00{random.randint(1000000000, 9999999999)}',
                    'vacation_leave_balance': Decimal('12.5'),
                    'sick_leave_balance': Decimal('14.0'),
                }
            )
            employee_objs.append(emp)

        self.stdout.write('Seeding Attendance...')
        today = date.today()
        for emp in employee_objs:
            for i in range(10): # Last 10 days
                day = today - timedelta(days=i)
                if day.weekday() < 5: # Weekdays only
                    status = random.choice(['present', 'present', 'present', 'late'])
                    am_in = time(8, 0) if status == 'present' else time(8, random.randint(15, 45))
                    Attendance.objects.get_or_create(
                        employee=emp,
                        date=day,
                        defaults={
                            'am_in': am_in,
                            'am_out': time(12, 0),
                            'pm_in': time(13, 0),
                            'pm_out': time(17, 0),
                            'status': status,
                            'latitude': emp.school.latitude if random.random() > 0.1 else emp.school.latitude + Decimal('0.005'),
                            'is_geo_flagged': random.random() < 0.1
                        }
                    )

        self.stdout.write('Seeding Leave Requests...')
        leave_reasons = [
            ('vacation', 'Family Trip to Manila', 'location_details'),
            ('sick', 'Severe Flu and Fever', 'illness_details'),
            ('vacation', 'Personal Errands', 'location_details'),
            ('emergency', 'House Repairs after Typhoon', 'other_type_details'),
            ('study', 'Master Degree Thesis Writing', 'study_type'),
        ]
        for emp in employee_objs[:4]:
            for ltype, reason, field in random.sample(leave_reasons, 2):
                start = today + timedelta(days=random.randint(5, 20))
                LeaveRequest.objects.create(
                    employee=emp,
                    leave_type=ltype,
                    status=random.choice(['pending', 'approved']),
                    start_date=start,
                    end_date=start + timedelta(days=2),
                    working_days_applied=3.0,
                    **{field: reason if field != 'study_type' else 'masters'}
                )

        self.stdout.write('Seeding Loans...')
        for emp in employee_objs[2:]:
            loan = ProvidentLoan.objects.create(
                employee=emp,
                loan_amount=Decimal(random.randint(10000, 50000)),
                interest_rate=Decimal('5.00'),
                term_months=12,
                status=random.choice(['released', 'paid', 'approved', 'pending']),
                purpose=random.choice(['medical', 'general', 'educational'])
            )
            if loan.status == 'paid':
                LoanPayment.objects.create(
                    loan=loan,
                    amount_paid=loan.total_amount,
                    remaining_balance=0
                )

        self.stdout.write('Seeding Payroll...')
        cutoffs = ["May 1-15, 2026", "May 16-31, 2026", "June 1-15, 2026"]
        for cutoff in cutoffs:
            for emp in employee_objs:
                Payroll.objects.create(
                    employee=emp,
                    cutoff_period=cutoff,
                    basic_salary=Decimal(str(emp.salary / 2)),
                    status='released',
                    sss=Decimal('500.00'),
                    philhealth=Decimal('300.00'),
                    tax=Decimal('200.00'),
                    date_released=timezone.now() - timedelta(days=random.randint(1, 30))
                )

        self.stdout.write('Seeding Performance...')
        for emp in employee_objs:
            PerformanceReview.objects.create(
                employee=emp,
                period="SY 2025-2026",
                punctuality_score=random.randint(3, 5),
                quality_score=random.randint(4, 5),
                behavior_score=random.randint(4, 5),
                is_promotion_eligible=random.random() > 0.7
            )

        self.stdout.write('Seeding Applicants...')
        applicant_names = [
            ('Maria', 'Santos'), ('Juan', 'Luna'), ('Elena', 'Reyes'), 
            ('Roberto', 'Diaz'), ('Clara', 'Bautista'), ('Hose', 'Rizal')
        ]
        for f, l in applicant_names:
            Applicant.objects.create(
                first_name=f,
                last_name=l,
                email=f'{f.lower()}.{l.lower()}@example.com',
                phone='09123456789',
                position_applied=random.choice(['Teacher I', 'Teacher II', 'Administrative Officer I']),
                status=random.choice(['applied', 'initial_evaluation', 'interview', 'comparative_assessment']),
                education_score=Decimal(random.randint(5, 10)),
                training_score=Decimal(random.randint(5, 10)),
                experience_score=Decimal(random.randint(5, 10)),
                interview_score=Decimal(random.randint(5, 10)),
                exam_score=Decimal(random.randint(5, 10))
            )

        self.stdout.write(self.style.SUCCESS('Successfully seeded demo data!'))
