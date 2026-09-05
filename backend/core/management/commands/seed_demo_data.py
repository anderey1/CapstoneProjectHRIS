import os
from decimal import Decimal
from datetime import date, datetime, timedelta
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.contrib.auth import get_user_model
from django.utils import timezone
from core.models import (
    School, SalaryGrade, Employee, LeaveRequest, 
    ProvidentLoan, LoanPayment, Payroll, Attendance, 
    Applicant, PerformanceReview, Role
)
from core.models.pds_details import FamilyMember, Education, Eligibility

User = get_user_model()

DEFAULT_PASSWORD = "password123"

class Command(BaseCommand):
    help = "Seeds comprehensive demo data for Lucena City Division HRIS presentation"

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("--- Starting DepEd Lucena City HRIS Demo Seeder ---"))

        # 1. Salary Grades
        self.stdout.write("Seeding Salary Grades...")
        salary_grades_data = [
            (11, Decimal("28512.00"), "Teacher I"),
            (12, Decimal("30898.00"), "Teacher II"),
            (13, Decimal("33575.00"), "Teacher III"),
            (14, Decimal("36619.00"), "Teacher IV / Head Teacher I"),
            (15, Decimal("39672.00"), "Teacher V / Head Teacher II"),
            (16, Decimal("43030.00"), "Teacher VI / Head Teacher III"),
            (18, Decimal("50601.00"), "Master Teacher I / Accountant III"),
            (19, Decimal("55614.00"), "Master Teacher II / Principal I / AO V"),
            (20, Decimal("62100.00"), "Master Teacher III / Principal II"),
            (21, Decimal("68918.00"), "Master Teacher IV / Principal III"),
            (22, Decimal("76903.00"), "Principal IV"),
            (26, Decimal("124792.00"), "Schools Division Superintendent"),
        ]
        sg_map = {}
        for grade, amount, label in salary_grades_data:
            sg, _ = SalaryGrade.objects.update_or_create(
                grade=grade,
                defaults={"amount": amount, "label": label}
            )
            sg_map[grade] = sg

        # 2. Schools in Division of Lucena City
        self.stdout.write("Seeding Schools & Division Offices...")
        schools_data = [
            {"name": "Lucena City National High School", "latitude": Decimal("13.936700"), "longitude": Decimal("121.615000"), "radius": 150},
            {"name": "Gulang-Gulang Elementary School", "latitude": Decimal("13.945000"), "longitude": Decimal("121.620000"), "radius": 100},
            {"name": "Lucena West I Elementary School", "latitude": Decimal("13.931000"), "longitude": Decimal("121.608000"), "radius": 100},
            {"name": "Lucena East I Elementary School", "latitude": Decimal("13.938000"), "longitude": Decimal("121.625000"), "radius": 100},
            {"name": "Dalahican National High School", "latitude": Decimal("13.912000"), "longitude": Decimal("121.638000"), "radius": 120},
            {"name": "Division Office - Lucena City", "latitude": Decimal("13.937200"), "longitude": Decimal("121.617800"), "radius": 200},
        ]
        school_objs = {}
        for s in schools_data:
            sch, _ = School.objects.update_or_create(
                name=s["name"],
                defaults={"latitude": s["latitude"], "longitude": s["longitude"], "radius_meters": s["radius"]}
            )
            school_objs[s["name"]] = sch

        # 3. Create Key Demo Users
        self.stdout.write("Seeding Users & Employee Profiles...")
        users_specs = [
            {
                "username": "admin",
                "email": "admin@deped.gov.ph",
                "role": Role.ADMINISTRATIVE,
                "is_staff": True,
                "is_superuser": True,
                "emp": {
                    "first_name": "System", "last_name": "Administrator",
                    "position": "Information Technology Officer I", "department": "ICT Section",
                    "school": school_objs["Division Office - Lucena City"],
                    "agency_employee_no": "2024-SDO-000", "salary": Decimal("46725.00"),
                }
            },
            {
                "username": "hr_lucena",
                "email": "hr.lucena@deped.gov.ph",
                "role": Role.HR,
                "is_staff": True,
                "emp": {
                    "first_name": "Helen", "last_name": "Ramos", "middle_name": "Santos",
                    "position": "Administrative Officer V (HRMO)", "department": "Personnel / HR Section",
                    "school": school_objs["Division Office - Lucena City"],
                    "agency_employee_no": "2024-SDO-001", "salary": sg_map[19].amount, "salary_grade": sg_map[19],
                    "mobile_no": "09171234561", "civil_status": "Married", "sex": "Female",
                    "tin_no": "123-456-789-000", "philhealth_no": "12-345678901-2", "pagibig_id": "1234-5678-9012"
                }
            },
            {
                "username": "superintendent",
                "email": "sds.lucena@deped.gov.ph",
                "role": Role.SUPERINTENDENT,
                "is_staff": True,
                "emp": {
                    "first_name": "Dr. Susan", "last_name": "Perez", "middle_name": "Alvarez",
                    "position": "Schools Division Superintendent", "department": "Office of the SDS",
                    "school": school_objs["Division Office - Lucena City"],
                    "agency_employee_no": "2024-SDO-002", "salary": sg_map[26].amount, "salary_grade": sg_map[26],
                    "mobile_no": "09171234562", "civil_status": "Married", "sex": "Female",
                    "tin_no": "234-567-890-000", "philhealth_no": "23-456789012-3", "pagibig_id": "2345-6789-0123"
                }
            },
            {
                "username": "accountant",
                "email": "finance.lucena@deped.gov.ph",
                "role": Role.ACCOUNTANT,
                "is_staff": True,
                "emp": {
                    "first_name": "Arthur", "last_name": "Valenzuela", "middle_name": "Dizon",
                    "position": "Accountant III", "department": "Accounting Section",
                    "school": school_objs["Division Office - Lucena City"],
                    "agency_employee_no": "2024-SDO-003", "salary": sg_map[18].amount, "salary_grade": sg_map[18],
                    "mobile_no": "09171234563", "civil_status": "Single", "sex": "Male",
                    "tin_no": "345-678-901-000", "philhealth_no": "34-567890123-4", "pagibig_id": "3456-7890-1234"
                }
            },
            {
                "username": "principal_santos",
                "email": "eduardo.santos@deped.gov.ph",
                "role": Role.TEACHING,
                "is_staff": False,
                "emp": {
                    "first_name": "Eduardo", "last_name": "Santos", "middle_name": "Luna",
                    "position": "Principal II", "department": "School Administration",
                    "school": school_objs["Lucena City National High School"],
                    "agency_employee_no": "2024-LCNHS-001", "salary": sg_map[20].amount, "salary_grade": sg_map[20],
                    "mobile_no": "09171234564", "civil_status": "Married", "sex": "Male",
                    "tin_no": "456-789-012-000", "philhealth_no": "45-678901234-5", "pagibig_id": "4567-8901-2345"
                }
            },
            {
                "username": "marites.cruz",
                "email": "marites.cruz@deped.gov.ph",
                "role": Role.TEACHING,
                "is_staff": False,
                "emp": {
                    "first_name": "Marites", "last_name": "Cruz", "middle_name": "Tolentino",
                    "position": "Teacher III", "department": "Senior High School - STEM",
                    "school": school_objs["Lucena City National High School"],
                    "agency_employee_no": "2024-LCNHS-002", "salary": sg_map[13].amount, "salary_grade": sg_map[13],
                    "mobile_no": "09171234565", "civil_status": "Married", "sex": "Female",
                    "vacation_leave_balance": Decimal("14.500"), "sick_leave_balance": Decimal("15.000"),
                    "tin_no": "567-890-123-000", "philhealth_no": "56-789012345-6", "pagibig_id": "5678-9012-3456"
                }
            },
            {
                "username": "juandelacruz",
                "email": "juan.delacruz@deped.gov.ph",
                "role": Role.TEACHING,
                "is_staff": False,
                "emp": {
                    "first_name": "Juan", "last_name": "Dela Cruz", "middle_name": "Bautista",
                    "position": "Teacher I", "department": "Junior High School - English",
                    "school": school_objs["Lucena City National High School"],
                    "agency_employee_no": "2024-LCNHS-003", "salary": sg_map[11].amount, "salary_grade": sg_map[11],
                    "mobile_no": "09171234566", "civil_status": "Single", "sex": "Male",
                    "vacation_leave_balance": Decimal("12.000"), "sick_leave_balance": Decimal("11.500"),
                    "tin_no": "678-901-234-000", "philhealth_no": "67-890123456-7", "pagibig_id": "6789-0123-4567"
                }
            },
            {
                "username": "clarissa.reyes",
                "email": "clarissa.reyes@deped.gov.ph",
                "role": Role.TEACHING,
                "is_staff": False,
                "emp": {
                    "first_name": "Clarissa", "last_name": "Reyes", "middle_name": "Mendoza",
                    "position": "Master Teacher I", "department": "Science Department",
                    "school": school_objs["Gulang-Gulang Elementary School"],
                    "agency_employee_no": "2024-GGES-001", "salary": sg_map[18].amount, "salary_grade": sg_map[18],
                    "mobile_no": "09171234567", "civil_status": "Married", "sex": "Female",
                    "vacation_leave_balance": Decimal("18.000"), "sick_leave_balance": Decimal("16.000"),
                    "tin_no": "789-012-345-000", "philhealth_no": "78-901234567-8", "pagibig_id": "7890-1234-5678"
                }
            },
            {
                "username": "roberto.navarro",
                "email": "roberto.navarro@deped.gov.ph",
                "role": Role.NON_TEACHING,
                "is_staff": False,
                "emp": {
                    "first_name": "Roberto", "last_name": "Navarro", "middle_name": "Castillo",
                    "position": "Administrative Officer II", "department": "Supply & Property Section",
                    "school": school_objs["Division Office - Lucena City"],
                    "agency_employee_no": "2024-SDO-004", "salary": sg_map[12].amount, "salary_grade": sg_map[12],
                    "mobile_no": "09171234568", "civil_status": "Married", "sex": "Male",
                    "vacation_leave_balance": Decimal("10.000"), "sick_leave_balance": Decimal("12.000"),
                    "tin_no": "890-123-456-000", "philhealth_no": "89-012345678-9", "pagibig_id": "8901-2345-6789"
                }
            },
            {
                "username": "elena.torres",
                "email": "elena.torres@deped.gov.ph",
                "role": Role.ADMINISTRATIVE,
                "is_staff": False,
                "emp": {
                    "first_name": "Elena", "last_name": "Torres", "middle_name": "Villanueva",
                    "position": "Administrative Assistant II", "department": "Cashier & Disbursement",
                    "school": school_objs["Division Office - Lucena City"],
                    "agency_employee_no": "2024-SDO-005", "salary": Decimal("20402.00"),
                    "mobile_no": "09171234569", "civil_status": "Single", "sex": "Female",
                    "vacation_leave_balance": Decimal("15.000"), "sick_leave_balance": Decimal("14.000"),
                    "tin_no": "901-234-567-000", "philhealth_no": "90-123456789-0", "pagibig_id": "9012-3456-7890"
                }
            },
        ]

        emp_objs = {}
        for item in users_specs:
            user_obj, created = User.objects.update_or_create(
                username=item["username"],
                defaults={
                    "email": item["email"],
                    "role": item["role"],
                    "is_staff": item.get("is_staff", False),
                    "is_superuser": item.get("is_superuser", False),
                }
            )
            user_obj.set_password(DEFAULT_PASSWORD)
            user_obj.save()

            emp_data = item["emp"]
            emp, _ = Employee.objects.update_or_create(
                user=user_obj,
                defaults=emp_data
            )
            emp_objs[item["username"]] = emp

        # Assign Principal as supervisor for school staff
        principal = emp_objs.get("principal_santos")
        if principal:
            if "marites.cruz" in emp_objs:
                emp_objs["marites.cruz"].supervisor = principal
                emp_objs["marites.cruz"].save()
            if "juandelacruz" in emp_objs:
                emp_objs["juandelacruz"].supervisor = principal
                emp_objs["juandelacruz"].save()

        # 4. PDS Details for Marites Cruz (Civil Service Form 212)
        self.stdout.write("Seeding PDS Personal Data Sheet Details...")
        marites = emp_objs["marites.cruz"]
        FamilyMember.objects.filter(employee=marites).delete()
        FamilyMember.objects.create(
            employee=marites, relationship='SPOUSE', first_name='Renato', surname='Cruz',
            occupation='Mechanical Engineer', employer='Meralco Lucena'
        )
        FamilyMember.objects.create(
            employee=marites, relationship='CHILD', full_name='Angelo Cruz',
            date_of_birth=date(2015, 8, 22)
        )
        Education.objects.filter(employee=marites).delete()
        Education.objects.create(
            employee=marites, level='COLLEGE', school_name='Manuel S. Enverga University Foundation',
            degree_course='Bachelor of Secondary Education - Major in Mathematics',
            period_from='2010', period_to='2014', year_graduated='2014', honors_received='Cum Laude'
        )
        Education.objects.create(
            employee=marites, level='GRADUATE', school_name='Southern Luzon State University',
            degree_course='Master of Arts in Education (Educational Management)',
            period_from='2017', period_to='2020', year_graduated='2020'
        )
        Eligibility.objects.filter(employee=marites).delete()
        Eligibility.objects.create(
            employee=marites, service='Licensure Examination for Teachers (LET)',
            rating='87.40', date_of_exam=date(2014, 9, 28), place_of_exam='Lucena City',
            license_number='LET-1049281'
        )

        from core.models.pds_details import WorkExperience
        WorkExperience.objects.filter(employee=marites).delete()
        WorkExperience.objects.create(
            employee=marites,
            date_from=date(2018, 6, 1),
            is_present=True,
            position_title='Teacher III',
            agency='Department of Education - Division of Lucena City',
            monthly_salary=Decimal('33575.00'),
            salary_grade='13',
            status_of_appointment='Permanent',
            is_gov_service=True
        )

        # 5. Leave Requests (CSC Form No. 6)
        self.stdout.write("Seeding CSC Form No. 6 Leave Requests across all stages...")
        LeaveRequest.objects.all().delete()
        leaves_data = [
            {
                "employee": emp_objs["marites.cruz"],
                "leave_type": "vacation",
                "start_date": date(2026, 6, 8),
                "end_date": date(2026, 6, 10),
                "working_days_applied": Decimal("3.0"),
                "status": "pending_supervisor",
                "is_within_philippines": True,
                "location_details": "Family gathering in Tagaytay City",
                "commutation": "not_requested",
            },
            {
                "employee": emp_objs["juandelacruz"],
                "leave_type": "sick",
                "start_date": date(2026, 5, 18),
                "end_date": date(2026, 5, 19),
                "working_days_applied": Decimal("2.0"),
                "status": "pending_hr",
                "is_in_hospital": False,
                "illness_details": "Acute viral gastroenteritis",
                "commutation": "not_requested",
            },
            {
                "employee": emp_objs["roberto.navarro"],
                "leave_type": "vacation",
                "start_date": date(2026, 7, 1),
                "end_date": date(2026, 7, 10),
                "working_days_applied": Decimal("8.0"),
                "status": "pending_superintendent",
                "is_within_philippines": False,
                "location_details": "Tokyo, Japan (Personal vacation)",
                "commutation": "requested",
            },
            {
                "employee": emp_objs["clarissa.reyes"],
                "leave_type": "forced",
                "start_date": date(2026, 4, 13),
                "end_date": date(2026, 4, 17),
                "working_days_applied": Decimal("5.0"),
                "status": "approved",
                "approved_days_with_pay": Decimal("5.0"),
                "commutation": "not_requested",
            },
            {
                "employee": emp_objs["elena.torres"],
                "leave_type": "special_privilege",
                "start_date": date(2026, 3, 16),
                "end_date": date(2026, 3, 17),
                "working_days_applied": Decimal("2.0"),
                "status": "rejected",
                "disapproval_reason": "Overlapping with scheduled quarterly division inventory audit.",
                "rejection_stage": "pending_hr",
            },
        ]
        for l in leaves_data:
            LeaveRequest.objects.create(**l)

        # 6. Provident Fund Loans & Amortization
        self.stdout.write("Seeding Provident Fund Loans and Ledger...")
        ProvidentLoan.objects.all().delete()
        LoanPayment.objects.all().delete()

        # Loan 1: Pending Accountant Verification
        ProvidentLoan.objects.create(
            employee=emp_objs["juandelacruz"],
            loan_amount=Decimal("30000.00"),
            interest_rate=Decimal("6.00"),
            term_months=12,
            status="pending",
            purpose="emergency",
            letter_request="Urgent loan application for home electrical repair caused by recent rainstorm.",
            co_maker=emp_objs["principal_santos"],
        )

        # Loan 2: Verified by Accountant, Pending Superintendent Approval
        ProvidentLoan.objects.create(
            employee=emp_objs["roberto.navarro"],
            loan_amount=Decimal("50000.00"),
            interest_rate=Decimal("6.00"),
            term_months=24,
            status="verified",
            purpose="medical",
            letter_request="Provident loan for hospitalization expenses of dependent spouse.",
            co_maker=emp_objs["principal_santos"],
            remarks="Verified complete documentation: payslips and medical certificate in order.",
            reviewed_by=User.objects.get(username="accountant"),
            reviewed_at=timezone.now() - timedelta(days=2),
        )

        # Loan 3: Approved by Superintendent, Pending Disbursement (Payout)
        ProvidentLoan.objects.create(
            employee=emp_objs["clarissa.reyes"],
            loan_amount=Decimal("80000.00"),
            interest_rate=Decimal("6.00"),
            term_months=36,
            status="approved",
            purpose="educational",
            letter_request="Provident loan for doctoral dissertation tuition and research requirements.",
            co_maker=emp_objs["principal_santos"],
            remarks="Approved by Superintendent. Endorsed for fund availability and payout.",
            reviewed_by=User.objects.get(username="superintendent"),
            reviewed_at=timezone.now() - timedelta(days=1),
        )

        # Loan 4: Active Released Loan with Subsidiary Ledger Payments
        active_loan = ProvidentLoan.objects.create(
            employee=emp_objs["marites.cruz"],
            loan_amount=Decimal("60000.00"),
            interest_rate=Decimal("6.00"),
            term_months=24,
            status="released",
            purpose="general",
            letter_request="Provident fund personal loan application.",
            co_maker=emp_objs["principal_santos"],
            date_granted=date(2026, 2, 1),
            remarks="Approved and disbursed via LandBank ATM payroll credit.",
        )
        # Add 3 posted monthly ledger entries
        monthly_ded = active_loan.monthly_payment
        for seq in range(1, 4):
            LoanPayment.objects.create(
                loan=active_loan,
                amount_paid=monthly_ded,
                posted_by=User.objects.get(username="accountant")
            )

        # 7. Attendance & Form 48 DTR (May 2026)
        self.stdout.write("Seeding Form 48 Daily Time Records (DTR)...")
        Attendance.objects.all().delete()
        target_dates = [
            (date(2026, 5, 4), "07:45", "12:02", "12:58", "17:01", "present", True),
            (date(2026, 5, 5), "07:50", "12:00", "12:55", "17:05", "present", True),
            (date(2026, 5, 6), "08:15", "12:01", "12:50", "17:00", "late", True),
            (date(2026, 5, 7), "07:40", "12:05", "12:59", "17:02", "present", True),
            (date(2026, 5, 8), "07:55", "12:00", "12:56", "17:00", "present", True),
            (date(2026, 5, 11), "07:48", "12:01", "12:55", "17:03", "present", False),
            (date(2026, 5, 12), "07:52", "12:03", "12:54", "17:04", "present", False),
            (date(2026, 5, 13), "08:10", "12:00", "12:50", "17:01", "late", False),
        ]
        sample_employees = [emp_objs["marites.cruz"], emp_objs["juandelacruz"], emp_objs["roberto.navarro"]]
        for emp in sample_employees:
            for d, a_in, a_out, p_in, p_out, st, approved in target_dates:
                Attendance.objects.create(
                    employee=emp,
                    date=d,
                    am_in=datetime.strptime(a_in, "%H:%M").time(),
                    am_out=datetime.strptime(a_out, "%H:%M").time(),
                    pm_in=datetime.strptime(p_in, "%H:%M").time(),
                    pm_out=datetime.strptime(p_out, "%H:%M").time(),
                    status=st,
                    is_dtr_approved=approved,
                    dtr_approved_by=User.objects.get(username="hr_lucena") if approved else None,
                    dtr_approved_at=timezone.now() if approved else None,
                )

        # 8. Payroll Cutoffs
        self.stdout.write("Seeding Payroll records for May 1-15, 2026...")
        Payroll.objects.all().delete()
        payroll_staff = [
            (emp_objs["marites.cruz"], Decimal("11.0"), Decimal("16787.50"), Decimal("1510.88"), Decimal("419.69"), Decimal("100.00"), Decimal("1200.00"), Decimal("2650.00"), "released"),
            (emp_objs["juandelacruz"], Decimal("11.0"), Decimal("14256.00"), Decimal("1283.04"), Decimal("356.40"), Decimal("100.00"), Decimal("650.00"), Decimal("0.00"), "approved"),
            (emp_objs["clarissa.reyes"], Decimal("11.0"), Decimal("25300.50"), Decimal("2277.05"), Decimal("632.51"), Decimal("100.00"), Decimal("3100.00"), Decimal("0.00"), "draft"),
            (emp_objs["roberto.navarro"], Decimal("10.5"), Decimal("14746.77"), Decimal("1390.41"), Decimal("386.23"), Decimal("100.00"), Decimal("850.00"), Decimal("0.00"), "approved"),
            (emp_objs["elena.torres"], Decimal("11.0"), Decimal("10201.00"), Decimal("918.09"), Decimal("255.03"), Decimal("100.00"), Decimal("0.00"), Decimal("0.00"), "released"),
        ]
        for emp, days, basic, gsis, phil, pagibig, tax, loans, st in payroll_staff:
            Payroll.objects.create(
                employee=emp,
                cutoff_period="May 1-15, 2026",
                days_worked=days,
                basic_salary=basic,
                gross_salary=basic + Decimal("1000.00"), # plus PERA
                gsis=gsis,
                sss=gsis,
                philhealth=phil,
                pagibig=pagibig,
                tax=tax,
                loans=loans,
                pera=Decimal("1000.00"),
                status=st,
                date_released=timezone.now() if st == "released" else None
            )

        # 9. Recruitment Applicants (DepEd Order 7, s. 2023)
        self.stdout.write("Seeding Recruitment Registry of Qualified Applicants (RQA)...")
        Applicant.objects.all().delete()
        applicants_data = [
            {
                "first_name": "Kaye", "middle_name": "Alvarez", "last_name": "Bernardo",
                "email": "kaye.bernardo@gmail.com", "phone": "09181234571",
                "position_applied": "Teacher I", "status": "comparative_assessment",
                "education_score": Decimal("9.50"), "training_score": Decimal("8.50"),
                "experience_score": Decimal("7.00"), "demo_teaching_score": Decimal("31.50"),
                "exam_score": Decimal("22.00"), "interview_score": Decimal("8.50")
            },
            {
                "first_name": "Rico", "middle_name": "Dizon", "last_name": "Mercado",
                "email": "rico.mercado@yahoo.com", "phone": "09181234572",
                "position_applied": "Teacher I", "status": "appointment_proposed",
                "education_score": Decimal("10.00"), "training_score": Decimal("9.00"),
                "experience_score": Decimal("9.50"), "demo_teaching_score": Decimal("33.00"),
                "exam_score": Decimal("23.50"), "interview_score": Decimal("9.50")
            },
            {
                "first_name": "Janice", "middle_name": "Flores", "last_name": "Magno",
                "email": "janice.magno@outlook.com", "phone": "09181234573",
                "position_applied": "Administrative Officer II", "status": "initial_evaluation",
                "education_score": Decimal("8.50"), "training_score": Decimal("6.00"),
                "experience_score": Decimal("5.50"), "demo_teaching_score": Decimal("0.00"),
                "exam_score": Decimal("0.00"), "interview_score": Decimal("0.00")
            },
            {
                "first_name": "Mark", "middle_name": "Gomez", "last_name": "Salazar",
                "email": "mark.salazar@gmail.com", "phone": "09181234574",
                "position_applied": "Teacher II", "status": "interview",
                "education_score": Decimal("9.00"), "training_score": Decimal("8.00"),
                "experience_score": Decimal("8.00"), "demo_teaching_score": Decimal("30.00"),
                "exam_score": Decimal("20.50"), "interview_score": Decimal("8.00")
            },
        ]
        for app in applicants_data:
            Applicant.objects.create(**app)

        # 10. Performance Reviews (IPCRF)
        self.stdout.write("Seeding IPCRF Performance Reviews...")
        PerformanceReview.objects.all().delete()
        reviews = [
            (emp_objs["marites.cruz"], "SY 2024-2025 (Annual)", 5, 5, 5, True, "Outstanding classroom delivery with 100% participation in school learning action cell sessions."),
            (emp_objs["juandelacruz"], "SY 2024-2025 (Annual)", 4, 4, 4, False, "Very satisfactory performance; recommended to participate in regional pedagogy workshops."),
            (emp_objs["clarissa.reyes"], "SY 2024-2025 (Annual)", 5, 5, 5, True, "Exemplary instructional leadership and demonstration teaching coach for district science competition."),
        ]
        for emp, period, p, q, b, promo, summary in reviews:
            PerformanceReview.objects.create(
                employee=emp, period=period, punctuality_score=p, quality_score=q,
                behavior_score=b, is_promotion_eligible=promo, ai_summary=summary
            )

        self.stdout.write(self.style.SUCCESS("\n[SUCCESS] Successfully seeded all sample demo data!"))
        self.stdout.write(self.style.SUCCESS("All users are initialized with password: 'password123'"))
        self.stdout.write("Key demo accounts ready:")
        self.stdout.write("  • HR Officer:         username: hr_lucena       password: password123")
        self.stdout.write("  • Superintendent:     username: superintendent  password: password123")
        self.stdout.write("  • Division Accountant:username: accountant      password: password123")
        self.stdout.write("  • School Principal:   username: principal_santos password: password123")
        self.stdout.write("  • Teacher III:        username: marites.cruz    password: password123")
        self.stdout.write("  • Teacher I:          username: juandelacruz    password: password123")
        self.stdout.write("  • Admin Superuser:    username: admin           password: password123\n")
