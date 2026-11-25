import base64
import calendar
import hashlib
import io
import random
import re
from collections import defaultdict
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from pathlib import Path

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from core.models import (
    Applicant,
    ApplicantDocument,
    Attendance,
    AttendanceImportBatch,
    AuditLog,
    BiometricEmployeeMapping,
    Education,
    Eligibility,
    Employee,
    EmployeeDocument,
    FamilyMember,
    LeaveAction,
    LeaveRequest,
    LoanDocument,
    LoanPayment,
    Notification,
    NotificationTaskDismissal,
    PDSUpload,
    Payroll,
    PerformanceReview,
    ProvidentLoan,
    Role,
    SalaryGrade,
    School,
    User,
    WorkExperience,
)
from core.services.payroll import PayrollCalculator


DEFAULT_PASSWORD = "password123"

SALARY_GRADES = [
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

SCHOOLS = [
    ("LCNHS", "13.936700", "121.615000", 150),
    ("South 1", "13.921000", "121.611000", 150),
    ("West 1", "13.931000", "121.608000", 150),
    ("North 1", "13.952000", "121.621000", 150),
    ("East 1", "13.938000", "121.625000", 150),
    ("Division Office - Lucena City", "13.937200", "121.617800", 200),
]

STATIONS = [
    "LCNHS",
    "South 1",
    "West 1",
    "North 1",
    "East 1",
]

FEMALE_NAMES = [
    "Maria", "Marites", "Clarissa", "Patricia", "Helen", "Teresa", "Lourdes",
    "Grace", "Janice", "Kaye", "Rica", "Novie", "Edna", "Leticia", "Mylene",
    "Rowena", "Jocelyn", "Alma", "Norie", "Sheryl", "Dahlia", "Imelda",
]

MALE_NAMES = [
    "Juan", "Angelo", "Roberto", "Ricardo", "Eduardo", "Danilo", "Rogelio",
    "Arthur", "Mark", "Rico", "Ronnie", "Nestor", "Virgilio", "Rodrigo",
    "Freddie", "Elmer", "Ramon", "Joel", "Randy", "Alfredo", "Nilo", "Peter",
]

LAST_NAMES = [
    "Santos", "Cruz", "Reyes", "Lim", "Santos", "Mendoza", "Aquino", "Dizon",
    "Valenzuela", "Navarro", "Garcia", "Bautista", "Villanueva", "Bernardo",
    "Mercado", "Magno", "Salazar", "Tolentino", "Fernandez", "Pascual",
    "Castillo", "Moreno", "Alvarez", "Luna", "Ramos", "Perez", "Dalisay",
]

MIDDLE_NAMES = [
    "Alvarez", "Bautista", "Cordero", "Dizon", "Espinoza", "Flores", "Gomez",
    "Hernandez", "Ibarra", "Javier", "Luna", "Mendoza", "Navarro", "Ocampo",
    "Pascual", "Quinto", "Ramos", "Salazar", "Tolentino", "Valdez",
]

DEPARTMENTS = [
    "Junior High School - English",
    "Junior High School - Mathematics",
    "Junior High School - Science",
    "Senior High School - STEM",
    "Senior High School - HUMSS",
    "Elementary Education - Math",
    "Primary Grade Department",
    "Social Studies Department",
    "Science Department",
    "Technical Vocational Department",
]

TEACHING_POSITIONS = [
    ("Teacher I", 11),
    ("Teacher II", 12),
    ("Teacher III", 13),
    ("Master Teacher I", 18),
    ("Master Teacher II", 19),
]

NON_TEACHING_POSITIONS = [
    ("Administrative Officer II", 12),
    ("Administrative Assistant II", 11),
    ("Registrar I", 11),
    "Administrative Aide VI",
]

LEAVE_TYPES = [choice[0] for choice in LeaveRequest.TYPE_CHOICES]
LEAVE_STATUSES = [choice[0] for choice in LeaveRequest.STATUS_CHOICES]
LOAN_STATUSES = [choice[0] for choice in ProvidentLoan.STATUS_CHOICES]
APPLICANT_STATUSES = [choice[0] for choice in Applicant.STATUS_CHOICES]
POSITIONS_APPLIED = [choice[0] for choice in Applicant._meta.get_field("position_applied").choices]

TEACHING_STAGES = [
    "pending_checking",
    "pending_supervisor",
    "pending_records",
    "pending_hr",
]
STANDARD_STAGES = [
    "pending_supervisor",
    "pending_hr",
    "pending_superintendent",
]

PNG_BYTES = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
)


class Command(BaseCommand):
    help = "Reset the local database and seed a large DepEd Lucena City HRIS showcase dataset."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Required. Flush the database before seeding.",
        )
        parser.add_argument(
            "--yes",
            action="store_true",
            help="Skip the interactive reset confirmation.",
        )
        parser.add_argument(
            "--seed",
            type=int,
            default=20261125,
            help="Random seed for repeatable demo data.",
        )
        parser.add_argument(
            "--months",
            type=int,
            default=6,
            help="Number of recent months to generate. Default: 6.",
        )
        parser.add_argument(
            "--staff-count",
            type=int,
            default=60,
            help="Number of active employee accounts. Default: 60.",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Allow seeding when DEBUG is false.",
        )
        parser.add_argument(
            "--clear-media",
            action="store_true",
            help="Remove sample files generated by this seeder before seeding.",
        )

    def handle(self, *args, **options):
        if not options["reset"]:
            raise CommandError("Pass --reset to confirm a full database reset.")

        if not settings.DEBUG and not options["force"]:
            raise CommandError("Refusing to reset a non-development database. Pass --force only when intentional.")

        months = options["months"]
        staff_count = options["staff_count"]
        if not 1 <= months <= 24:
            raise CommandError("--months must be between 1 and 24.")
        if staff_count < 30:
            raise CommandError("--staff-count must be at least 30.")

        if not options["yes"]:
            confirm = input(
                "This will delete all database rows and replace them with demo data. Type 'yes' to continue: "
            )
            if confirm.strip().lower() != "yes":
                raise CommandError("Seed cancelled. No data was changed.")

        self.rng = random.Random(options["seed"])
        self.today = timezone.localdate()
        self.windows = self._month_windows(months)
        self.schools = {}
        self.salary_grades = {}
        self.users = {}
        self.employees = []
        self.by_role = defaultdict(list)
        self.school_principals = {}
        self.school_checkers = {}
        self.records_staff = []
        self.hr_user = None
        self.accountant_user = None
        self.superintendent_user = None

        if options["clear_media"]:
            self._clear_demo_media()

        self._progress("Resetting database")
        call_command("migrate", verbosity=0, interactive=False)
        call_command("flush", verbosity=0, interactive=False)

        with transaction.atomic():
            self._seed_salary_grades()
            self._seed_schools()
            self._seed_accounts(staff_count)
            self._assign_leave_processing()
            self._seed_pds_details()
            self._seed_attendance()
            self._seed_leaves()
            self._seed_loans()
            self._seed_payroll()
            self._seed_recruitment()
            self._seed_performance()
            self._seed_files()
            self._seed_notifications_and_audit()

        self._print_summary()

    def _progress(self, message):
        self.stdout.write(self.style.SUCCESS(f"[seed] {message}"))

    def _clear_demo_media(self):
        media_root = Path(settings.MEDIA_ROOT)
        if not media_root.exists():
            return

        patterns = [
            re.compile(r"^applicant_\d+_document(?:_[A-Za-z0-9]+)?\.pdf$"),
            re.compile(r"^employee_\d+_(?:pds|appointment|service_record)(?:_[A-Za-z0-9]+)?\.pdf$"),
            re.compile(r"^loan_\d+_(?:laf|letter_request|auth_deduct|payslip)(?:_[A-Za-z0-9]+)?\.pdf$"),
            re.compile(r"^ipcrf_\d+_[01](?:_[A-Za-z0-9]+)?\.pdf$"),
            re.compile(r"^leave_support_\d+(?:_[A-Za-z0-9]+)?\.pdf$"),
            re.compile(r"^travel_authority_\d+(?:_[A-Za-z0-9]+)?\.pdf$"),
            re.compile(r"^leave_signature_\d+(?:_[A-Za-z0-9]+)?\.png$"),
            re.compile(r"^pds_upload_\d+(?:_[A-Za-z0-9]+)?\.pdf$"),
            re.compile(r"^signature_\d+(?:_[A-Za-z0-9]+)?\.png$"),
        ]
        directories = [
            "applicant_documents",
            "employee_documents",
            "leave_documents",
            "loan_documents",
            "ipcrf_uploads",
            "leave_signatures",
            "pds_uploads",
            "e_signatures",
        ]

        removed = 0
        for directory in directories:
            folder = media_root / directory
            if not folder.exists():
                continue
            for path in folder.rglob("*"):
                if path.is_file() and any(pattern.match(path.name) for pattern in patterns):
                    path.unlink()
                    removed += 1
        self._progress(f"Removed {removed} sample media files")

    def _month_windows(self, months):
        windows = []
        year = self.today.year
        month = self.today.month
        for _ in range(months):
            first = date(year, month, 1)
            last = date(year, month, calendar.monthrange(year, month)[1])
            windows.append((first, last))
            month -= 1
            if month == 0:
                month = 12
                year -= 1
        windows.reverse()

        result = []
        for first, last in windows:
            first_end = date(first.year, first.month, 15)
            second_start = date(first.year, first.month, 16)
            result.append(
                {
                    "start": first,
                    "end": min(last, self.today),
                    "first_label": f"{first.strftime('%B')} 1-15, {first.year}",
                    "first_start": first,
                    "first_end": min(first_end, last),
                    "second_label": f"{first.strftime('%B')} 16-{last.day}, {first.year}",
                    "second_start": second_start,
                    "second_end": last,
                }
            )
        return result

    def _pdf(self, name, lines):
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas

        buffer = io.BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=A4)
        pdf.setTitle("Dep HRIS sample document")
        safe_title = re.sub(r"[^A-Za-z0-9 _-]", " ", name).strip()[:70]
        pdf.drawString(72, 790, "DEMO SAMPLE DOCUMENT")
        pdf.drawString(72, 768, safe_title)
        for index, line in enumerate(lines[:28]):
            text = str(line)
            pdf.drawString(72, 735 - index * 18, text[:95])
        pdf.showPage()
        pdf.save()
        return ContentFile(buffer.getvalue(), name=f"{self._slug(name)}.pdf")

    def _png(self, name):
        return ContentFile(PNG_BYTES, name=f"{self._slug(name)}.png")

    def _slug(self, value):
        return re.sub(r"[^a-z0-9]+", "_", str(value).lower()).strip("_") or "sample"

    def _aware(self, value):
        return timezone.make_aware(datetime.combine(value, time(hour=12)))

    def _weekday_count(self, start, end):
        count = 0
        current = start
        while current <= end:
            if current.weekday() < 5:
                count += 1
            current += timedelta(days=1)
        return count

    def _random_date(self, start, end):
        span = (end - start).days
        return start + timedelta(days=self.rng.randint(0, max(span, 0)))

    def _backdate(self, model, pk, field, value):
        model.objects.filter(pk=pk).update(**{field: value})

    def _seed_salary_grades(self):
        self._progress("Salary grades")
        for grade, amount, label in SALARY_GRADES:
            self.salary_grades[grade] = SalaryGrade.objects.create(
                grade=grade,
                amount=amount,
                label=label,
            )

    def _seed_schools(self):
        self._progress("Schools")
        for name, latitude, longitude, radius in SCHOOLS:
            self.schools[name] = School.objects.create(
                name=name,
                latitude=Decimal(latitude),
                longitude=Decimal(longitude),
                radius_meters=radius,
            )

    def _create_account(self, username, first, last, role, school_name, position, grade, department, **extra):
        email = f"{username}@deped.gov.ph"
        user = User.objects.create_user(
            username=username,
            email=email,
            password=DEFAULT_PASSWORD,
            role=role,
            first_name=first,
            last_name=last,
            is_staff=extra.pop("is_staff", False),
            is_superuser=extra.pop("is_superuser", False),
        )
        salary_grade = self.salary_grades[grade]
        employee = Employee.objects.create(
            user=user,
            first_name=first,
            last_name=last,
            middle_name=self.rng.choice(MIDDLE_NAMES),
            email=email,
            mobile_no=f"09{self.rng.randint(100000000, 999999999)}",
            sex=extra.pop("sex", self.rng.choice(["Female", "Male"])),
            civil_status=extra.pop("civil_status", self.rng.choice(["Single", "Married"])),
            date_of_birth=extra.pop("date_of_birth", date(1985, 6, 15)),
            place_of_birth="Lucena City, Quezon",
            residential_address=extra.pop("residential_address", "Lucena City, Quezon"),
            permanent_address="Lucena City, Quezon",
            tin_no=f"{self.rng.randint(100, 999)}-{self.rng.randint(100, 999)}-{self.rng.randint(100, 999)}-000",
            philhealth_no=f"{self.rng.randint(10, 99)}-{self.rng.randint(100000000, 999999999)}-{self.rng.randint(1, 9)}",
            pagibig_id=f"{self.rng.randint(1000, 9999)}-{self.rng.randint(1000, 9999)}-{self.rng.randint(1000, 9999)}",
            agency_employee_no=f"2026-{self._slug(school_name).upper()}-{len(self.employees) + 1:04d}",
            position=position,
            department=department,
            school=self.schools[school_name],
            salary_grade=salary_grade,
            salary=salary_grade.amount,
            date_hired=date(2016 + self.rng.randint(0, 8), self.rng.randint(1, 12), self.rng.randint(1, 28)),
            account_number=f"LAND{self.rng.randint(10000000, 99999999)}",
            vacation_leave_balance=Decimal("15.000"),
            sick_leave_balance=Decimal("15.000"),
            **extra,
        )
        self.users[username] = user
        self.employees.append(employee)
        self.by_role[role].append(employee)
        return user, employee

    def _seed_accounts(self, staff_count):
        self._progress(f"Accounts and personnel ({staff_count} active)")

        admin_user, _ = self._create_account(
            "admin", "System", "Administrator", "", "Division Office - Lucena City",
            "Information Technology Officer I", 18, "ICT Section",
            is_staff=True, is_superuser=True,
        )
        hr_user, _ = self._create_account(
            "hr_lucena", "Helen", "Ramos", Role.HR, "Division Office - Lucena City",
            "Administrative Officer V (HRMO)", 19, "Personnel / HR Section", is_staff=True,
        )
        sds_user, _ = self._create_account(
            "superintendent", "Susan", "Perez", Role.SUPERINTENDENT, "Division Office - Lucena City",
            "Schools Division Superintendent", 26, "Office of the SDS", is_staff=True,
        )
        accountant_user, _ = self._create_account(
            "accountant", "Arthur", "Valenzuela", Role.ACCOUNTANT, "Division Office - Lucena City",
            "Accountant III", 18, "Accounting Section", is_staff=True,
        )
        self.hr_user = hr_user
        self.superintendent_user = sds_user
        self.accountant_user = accountant_user

        principal_specs = [
            ("principal_lcnhs", "Eduardo", "Santos", "LCNHS", 20),
            ("principal_south1", "Rogelio", "Bautista", "South 1", 19),
            ("principal_west1", "Teresa", "Mendoza", "West 1", 19),
            ("principal_north1", "Lourdes", "Garcia", "North 1", 19),
            ("principal_east1", "Danilo", "Reyes", "East 1", 19),
        ]
        for username, first, last, school_name, grade in principal_specs:
            _, principal = self._create_account(
                username, first, last, Role.PRINCIPAL, school_name,
                "School Principal I" if grade == 19 else "School Principal II",
                grade, "School Administration", sex="Female" if first in ("Teresa", "Lourdes") else "Male",
            )
            self.school_principals[school_name] = principal

        checker_specs = [
            ("checker_lcnhs", "Rica", "Villanueva", "LCNHS"),
            ("checker_south1", "Novie", "Cordero", "South 1"),
            ("checker_west1", "Edna", "Salazar", "West 1"),
            ("checker_north1", "Leticia", "Ocampo", "North 1"),
            ("checker_east1", "Mylene", "Javier", "East 1"),
        ]
        for username, first, last, school_name in checker_specs:
            _, checker = self._create_account(
                username, first, last, Role.NON_TEACHING, school_name,
                "Administrative Assistant II", 11, "School Administration", sex="Female",
            )
            self.school_checkers[school_name] = checker

        for index, (username, first, last) in enumerate(
            [
                ("records_lucena", "Jocelyn", "Dimaculangan"),
                ("records_lucena_2", "Alma", "Ferrer"),
            ]
        ):
            _, records = self._create_account(
                username, first, last, Role.NON_TEACHING, "Division Office - Lucena City",
                "Records Officer II", 11, "Records Unit", sex="Female",
            )
            self.records_staff.append(records)

        key_count = len(self.employees)
        remaining = staff_count - key_count
        teacher_count = max(1, round(remaining * 0.72))
        non_teaching_count = remaining - teacher_count

        for index in range(teacher_count):
            school_name = STATIONS[index % len(STATIONS)]
            sex = "Female" if self.rng.random() < 0.62 else "Male"
            first = self.rng.choice(FEMALE_NAMES if sex == "Female" else MALE_NAMES)
            last = self.rng.choice(LAST_NAMES)
            position, grade = TEACHING_POSITIONS[index % len(TEACHING_POSITIONS)]
            username = f"teacher_{self._slug(first)}_{self._slug(last)}_{index + 1}"
            self._create_account(
                username, first, last, Role.TEACHING, school_name,
                position, grade, DEPARTMENTS[index % len(DEPARTMENTS)], sex=sex,
            )

        for index in range(non_teaching_count):
            school_name = self.rng.choice(STATIONS + ["Division Office - Lucena City"])
            sex = "Female" if self.rng.random() < 0.55 else "Male"
            first = self.rng.choice(FEMALE_NAMES if sex == "Female" else MALE_NAMES)
            last = self.rng.choice(LAST_NAMES)
            position_spec = NON_TEACHING_POSITIONS[index % len(NON_TEACHING_POSITIONS)]
            if isinstance(position_spec, tuple):
                position, grade = position_spec
            else:
                position, grade = position_spec, None
            username = f"staff_{self._slug(first)}_{self._slug(last)}_{index + 1}"
            if grade is None:
                user = User.objects.create_user(
                    username=username,
                    email=f"{username}@deped.gov.ph",
                    password=DEFAULT_PASSWORD,
                    role=Role.NON_TEACHING,
                    first_name=first,
                    last_name=last,
                )
                employee = Employee.objects.create(
                    user=user,
                    first_name=first,
                    last_name=last,
                    middle_name=self.rng.choice(MIDDLE_NAMES),
                    email=f"{username}@deped.gov.ph",
                    mobile_no=f"09{self.rng.randint(100000000, 999999999)}",
                    sex=sex,
                    civil_status=self.rng.choice(["Single", "Married"]),
                    date_of_birth=date(1990, 3, 12),
                    place_of_birth="Lucena City, Quezon",
                    residential_address="Lucena City, Quezon",
                    permanent_address="Lucena City, Quezon",
                    agency_employee_no=f"2026-SDO-{len(self.employees) + 1:04d}",
                    position=position,
                    department="General Services",
                    school=self.schools[school_name],
                    salary=Decimal("17553.00"),
                    date_hired=date(2018, 7, 1),
                )
                self.users[username] = user
                self.employees.append(employee)
                self.by_role[Role.NON_TEACHING].append(employee)
            else:
                self._create_account(
                    username, first, last, Role.NON_TEACHING, school_name,
                    position, grade, "School Administration", sex=sex,
                )

        for index, (first, last, status) in enumerate(
            [
                ("Kaye", "Bernardo", "pending"),
                ("Rico", "Mercado", "pending"),
                ("Janice", "Magno", "pending"),
                ("Mark", "Salazar", "pending"),
                ("Sheryl", "Rivera", "pending"),
                ("Nestor", "Galvez", "pending"),
                ("Freddie", "Lopez", "rejected"),
                ("Ronnie", "Palacio", "rejected"),
            ]
        ):
            Employee.objects.create(
                first_name=first,
                last_name=last,
                middle_name=self.rng.choice(MIDDLE_NAMES),
                sex="Female" if first in ("Kaye", "Janice", "Sheryl") else "Male",
                civil_status="Single",
                date_of_birth=date(1997, 4, 20),
                place_of_birth="Lucena City, Quezon",
                residential_address="Lucena City, Quezon",
                permanent_address="Lucena City, Quezon",
                email=f"registration.{index + 1}@example.com",
                mobile_no=f"09{self.rng.randint(100000000, 999999999)}",
                position="Teacher I" if index < 6 else "Administrative Assistant II",
                department="Human Resource",
                salary_grade=self.salary_grades[11],
                salary=self.salary_grades[11].amount,
                registration_status=status,
                rejection_reason="Incomplete supporting documents." if status == "rejected" else "",
                reviewed_by=self.hr_user if status == "rejected" else None,
                reviewed_at=self._aware(self.today - timedelta(days=10 + index)) if status == "rejected" else None,
            )

    def _assign_leave_processing(self):
        self._progress("Leave processing assignments")
        for school_name, checker in self.school_checkers.items():
            Employee.objects.filter(pk=checker.pk).update(leave_duty="checker")
            Employee.objects.filter(
                user__role=Role.TEACHING,
                school__name=school_name,
            ).update(leave_checker=checker, supervisor=self.school_principals[school_name])
        for records in self.records_staff:
            Employee.objects.filter(pk=records.pk).update(leave_duty="records")

    def _seed_pds_details(self):
        self._progress("PDS family, education, eligibility, and work history")
        family_rows = []
        education_rows = []
        eligibility_rows = []
        work_rows = []

        for employee in self.employees:
            if employee.civil_status == "Married":
                family_rows.append(
                    FamilyMember(
                        employee=employee,
                        relationship="SPOUSE",
                        surname=employee.last_name,
                        first_name=self.rng.choice(FEMALE_NAMES if employee.sex == "Male" else MALE_NAMES),
                        middle_name=self.rng.choice(MIDDLE_NAMES),
                        occupation=self.rng.choice(["Teacher", "Nurse", "Engineer", "Vendor"]),
                        employer=self.rng.choice(["DepEd Lucena City", "Private Practice", "Self-employed"]),
                    )
                )
            for index in range(self.rng.randint(1, 2)):
                family_rows.append(
                    FamilyMember(
                        employee=employee,
                        relationship="CHILD",
                        full_name=f"Child {index + 1} {employee.last_name}",
                        date_of_birth=date(2012 + index * 2, self.rng.randint(1, 12), self.rng.randint(1, 28)),
                    )
                )

            for level, school_name, degree, year in [
                ("ELEMENTARY", "Lucena City Elementary School", "Elementary", 2001),
                ("SECONDARY", "Quezon National High School", "Secondary", 2007),
                ("COLLEGE", "Southern Luzon State University", self.rng.choice(["Bachelor of Education", "Bachelor of Science in Accountancy", "Bachelor of Arts"]), 2011),
                ("GRADUATE", "Philippine Normal University", "Master of Arts in Teaching", 2018),
            ]:
                education_rows.append(
                    Education(
                        employee=employee,
                        level=level,
                        school_name=school_name,
                        degree_course=degree,
                        period_from=f"200{self.rng.randint(0, 4)}",
                        period_to=str(year),
                        year_graduated=str(year),
                        honors_received="With Honors" if level == "COLLEGE" and self.rng.random() < 0.3 else "",
                    )
                )

            eligibility_rows.append(
                Eligibility(
                    employee=employee,
                    service="Career Service Professional",
                    rating=f"{self.rng.randint(80, 95)}.{self.rng.randint(0, 9)}",
                    date_of_exam=date(2012, self.rng.randint(1, 12), self.rng.randint(1, 28)),
                    place_of_exam="Lucena City",
                    license_number=f"CSC-{self.rng.randint(100000, 999999)}",
                    validity_date=None,
                )
            )
            if employee.user and employee.user.role in (Role.TEACHING, Role.PRINCIPAL):
                eligibility_rows.append(
                    Eligibility(
                        employee=employee,
                        service="Professional Teacher (PRC)",
                        rating="Passed",
                        date_of_exam=date(2011, 5, 20),
                        place_of_exam="Manila",
                        license_number=f"PRC-{self.rng.randint(1000000, 9999999)}",
                        validity_date=date(2028, 6, 30),
                    )
                )

            start = employee.date_hired or date(2018, 1, 1)
            work_rows.append(
                WorkExperience(
                    employee=employee,
                    date_from=start,
                    date_to=None,
                    is_present=True,
                    position_title=employee.position,
                    agency="DepEd Lucena City Division",
                    monthly_salary=employee.salary,
                    salary_grade=str(employee.salary_grade.grade) if employee.salary_grade else "",
                    status_of_appointment="Permanent",
                    is_gov_service=True,
                )
            )
            previous_start = date(start.year - 3, start.month, 1)
            work_rows.append(
                WorkExperience(
                    employee=employee,
                    date_from=previous_start,
                    date_to=start - timedelta(days=1),
                    is_present=False,
                    position_title="Teacher I" if employee.user and employee.user.role == Role.TEACHING else "Administrative Assistant I",
                    agency="DepEd Quezon Province",
                    monthly_salary=Decimal("24000.00"),
                    salary_grade="11-1",
                    status_of_appointment="Permanent",
                    is_gov_service=True,
                )
            )

        FamilyMember.objects.bulk_create(family_rows, batch_size=300)
        Education.objects.bulk_create(education_rows, batch_size=300)
        Eligibility.objects.bulk_create(eligibility_rows, batch_size=300)
        WorkExperience.objects.bulk_create(work_rows, batch_size=300)

    def _seed_attendance(self):
        self._progress("Attendance and DTR records")
        rows = []
        for window_index, window in enumerate(self.windows):
            current = window["start"]
            while current <= window["end"]:
                if current.weekday() < 5:
                    for employee in self.employees:
                        roll = self.rng.random()
                        if window_index >= len(self.windows) - 2:
                            status = "present" if roll < 0.80 else "late" if roll < 0.90 else "absent" if roll < 0.96 else "incomplete"
                        else:
                            status = "present" if roll < 0.87 else "late" if roll < 0.95 else "absent" if roll < 0.98 else "incomplete"

                        if status == "absent":
                            am_in = am_out = pm_in = pm_out = None
                        elif status == "late":
                            am_in, am_out, pm_in, pm_out = time(8, 15), time(12, 2), time(13, 0), time(17, 3)
                        elif status == "incomplete":
                            am_in, am_out, pm_in, pm_out = time(7, 52), time(12, 1), time(13, 2), None
                        else:
                            minute_in = self.rng.randint(40, 55)
                            minute_out = self.rng.randint(0, 8)
                            am_in, am_out, pm_in, pm_out = time(7, minute_in), time(12, minute_out), time(13, 0), time(17, self.rng.randint(0, 8))

                        approved = window_index < len(self.windows) - 1 or self.rng.random() < 0.55
                        latitude = employee.school.latitude if employee.school else Decimal("13.937200")
                        longitude = employee.school.longitude if employee.school else Decimal("121.617800")
                        geo_flagged = self.rng.random() < 0.02
                        rows.append(
                            Attendance(
                                employee=employee,
                                date=current,
                                am_in=am_in,
                                am_out=am_out,
                                pm_in=pm_in,
                                pm_out=pm_out,
                                status=status,
                                is_dtr_approved=approved,
                                dtr_approved_by=self.hr_user if approved else None,
                                dtr_approved_at=self._aware(current + timedelta(days=2)) if approved else None,
                                latitude=latitude + Decimal(str(round(self.rng.uniform(-0.002, 0.002), 6))),
                                longitude=longitude + Decimal(str(round(self.rng.uniform(-0.002, 0.002), 6))),
                                is_geo_flagged=geo_flagged,
                            )
                        )
                current += timedelta(days=1)

        Attendance.objects.bulk_create(rows, batch_size=800, ignore_conflicts=True)

        for index, window in enumerate(self.windows):
            AttendanceImportBatch.objects.create(
                checksum=hashlib.sha256(f"showcase-{index}-{self.rng.random()}".encode()).hexdigest(),
                uploaded_by=self.hr_user,
                imported_rows=Attendance.objects.filter(date__range=(window["start"], window["end"])).count(),
                duplicate_rows=self.rng.randint(0, 6),
                start_date=window["start"],
                end_date=window["end"],
            )

        BiometricEmployeeMapping.objects.bulk_create(
            [
                BiometricEmployeeMapping(
                    source_id=f"BIO-{index + 1:03d}",
                    biometric_id=f"{1000 + index:04d}",
                    employee=employee,
                )
                for index, employee in enumerate(self.employees)
            ],
            batch_size=300,
        )

        for employee in self.employees[:20]:
            Employee.objects.filter(pk=employee.pk).update(e_signature=self._png(f"signature_{employee.pk}"))

    def _seed_leaves(self):
        self._progress("Leave applications and action history")
        status_plan = []
        for status in LEAVE_STATUSES:
            repeats = 12 if status in ("pending_supervisor", "pending_hr", "approved") else 9
            status_plan.extend([status] * repeats)
        status_plan = status_plan[:96]

        paid_days_by_employee = defaultdict(Decimal)
        leave_rows = []
        action_rows = []

        for index, status in enumerate(status_plan):
            is_teaching = index % 3 != 0
            if is_teaching:
                pool = self.by_role[Role.TEACHING]
            elif index % 6 == 0:
                pool = self.by_role[Role.PRINCIPAL]
            else:
                pool = self.by_role[Role.NON_TEACHING]
            employee = pool[index % len(pool)]
            window = self.windows[index % len(self.windows)]
            start = self._random_date(window["start"], max(window["start"], window["end"] - timedelta(days=10)))
            end = min(start + timedelta(days=self.rng.randint(0, 7)), window["end"])
            days = Decimal(str(self._weekday_count(start, end)))

            leave_type = LEAVE_TYPES[index % len(LEAVE_TYPES)]
            commutation = "requested" if leave_type in ("vacation", "special_privilege") and self.rng.random() < 0.3 else "not_requested"
            approved_days = days if status == "approved" else Decimal("0.0")

            if approved_days > 0:
                available = employee.vacation_leave_balance + employee.sick_leave_balance - paid_days_by_employee[employee.pk]
                if available < approved_days:
                    approved_days = Decimal("0.0")

            fields = {
                "employee": employee,
                "leave_type": leave_type,
                "start_date": start,
                "end_date": end,
                "working_days_applied": days,
                "status": status,
                "commutation": commutation,
                "approved_days_with_pay": approved_days,
                "workflow": "teaching" if is_teaching else "standard",
            }

            if leave_type in ("vacation", "special_privilege"):
                abroad = self.rng.random() < 0.25
                fields.update(
                    is_within_philippines=not abroad,
                    location_details="Tokyo, Japan" if abroad else self.rng.choice(["Tagaytay City", "Lucena City", "National Capital Region"]),
                )
            if leave_type in ("sick", "women_special", "others"):
                fields.update(
                    illness_details=self.rng.choice(["Acute viral infection", "Seasonal allergies", "Post-operative recovery"]),
                    is_in_hospital=self.rng.random() < 0.25,
                )
            if leave_type == "study":
                fields["study_type"] = self.rng.choice(["masters", "board_exam"])
            if leave_type == "others":
                fields["other_type_details"] = self.rng.choice(["Monetization of leave credits", "Terminal leave"])

            if is_teaching:
                checker = self.school_checkers.get(employee.school.name if employee.school else "")
                principal = self.school_principals.get(employee.school.name if employee.school else "")
                fields.update(assigned_checker=checker, assigned_principal=principal)
                stages = TEACHING_STAGES
            else:
                stages = STANDARD_STAGES

            current_stage = status if status in stages else None
            stage_index = stages.index(current_stage) + 1 if current_stage else len(stages)

            principal_signed = (is_teaching and stage_index >= 3) or (not is_teaching and stage_index >= 2)
            if principal_signed:
                signer = (
                    self.school_principals.get(employee.school.name if employee.school else "")
                    if is_teaching
                    else self.superintendent_user
                )
                signer_user = signer.user if isinstance(signer, Employee) else signer
                fields.update(
                    principal_signature=self._png(f"leave_signature_{index + 1}"),
                    principal_signed_by=signer_user,
                    principal_signed_at=self._aware(end),
                )
            if is_teaching and stage_index >= 4:
                fields["records_reference"] = f"REC-2026-{index + 1:04d}"

            if status == "rejected":
                fields.update(
                    disapproval_reason="Documents do not match the requested leave dates.",
                    rejection_stage=stages[min(stage_index, len(stages) - 1)],
                )
            if status == "returned":
                fields["correction_reason"] = "Please attach the complete supporting document and resubmit."

            leave = LeaveRequest.objects.create(**fields)
            LeaveRequest.objects.filter(pk=leave.pk).update(
                date_applied=self._aware(start - timedelta(days=self.rng.randint(3, 12)))
            )
            leave_rows.append(leave)

            supporting_types = {"sick", "maternity", "women_special", "rehabilitation", "vawc"}
            if leave_type in supporting_types and self.rng.random() < 0.7:
                LeaveRequest.objects.filter(pk=leave.pk).update(
                    supporting_document=self._pdf(
                        f"leave_support_{index + 1}",
                        [employee.first_name, employee.last_name, leave.get_leave_type_display(), str(start), str(end)],
                    )
                )
            if leave_type in ("vacation", "special_privilege") and commutation == "requested":
                LeaveRequest.objects.filter(pk=leave.pk).update(
                    travel_authority_document=self._pdf(
                        f"travel_authority_{index + 1}",
                        [employee.first_name, employee.last_name, fields.get("location_details", "")],
                    )
                )

            history = ["submitted"] + stages[:stage_index]
            if status == "approved":
                history.append("approved")
            elif status in ("rejected", "returned"):
                history.append(status)

            previous = ""
            for step_index, step in enumerate(history):
                if step == "submitted":
                    actor = employee.user
                    target = stages[0] if stages else "pending_supervisor"
                    note = "Leave application submitted."
                elif step == "approved":
                    actor = self.hr_user if is_teaching else self.superintendent_user
                    target = "approved"
                    note = "Application approved and leave credits processed."
                elif step in ("rejected", "returned"):
                    actor = self.hr_user
                    target = status
                    note = fields.get("disapproval_reason") or fields.get("correction_reason") or "Application returned."
                elif step == "pending_checking":
                    actor = self.school_checkers.get(employee.school.name if employee.school else "").user
                    target = "pending_supervisor"
                    note = "Checked by school Administrative Assistant II."
                elif step == "pending_supervisor":
                    actor = (
                        self.school_principals.get(employee.school.name if employee.school else "").user
                        if is_teaching
                        else self.hr_user
                    )
                    target = "pending_records" if is_teaching else "pending_hr"
                    note = "Recommended and signed."
                elif step == "pending_records":
                    actor = self.records_staff[step_index % len(self.records_staff)].user
                    target = "pending_hr"
                    note = f"Received by Records Unit ({fields.get('records_reference', '')})."
                elif step == "pending_hr":
                    actor = self.hr_user
                    target = "approved" if is_teaching else "pending_superintendent"
                    note = "HR certification completed."
                else:
                    actor = self.superintendent_user
                    target = "approved"
                    note = "Final approval by Superintendent."

                if actor is None:
                    continue
                action = LeaveAction.objects.create(
                    leave=leave,
                    actor=actor,
                    actor_name=f"{actor.first_name} {actor.last_name}".strip() or actor.username,
                    from_status=previous,
                    to_status=target,
                    note=note,
                )
                LeaveAction.objects.filter(pk=action.pk).update(
                    created_at=self._aware(start + timedelta(days=step_index))
                )
                action_rows.append(action)
                previous = target

            if approved_days > 0:
                employee.refresh_from_db()
                employee.deduct_leave(leave_type, approved_days)
                paid_days_by_employee[employee.pk] += employee.deduct_leave(leave_type, Decimal("0"))

    def _seed_loans(self):
        self._progress("Provident fund loans and documents")
        applicants = [
            employee
            for employee in self.employees
            if employee.user
            and employee.user.role in (Role.TEACHING, Role.NON_TEACHING, Role.PRINCIPAL)
            and employee.salary < self.salary_grades[26].amount
        ]
        co_maker = self.users["superintendent"].employee_profile
        status_plan = []
        for status in LOAN_STATUSES:
            status_plan.extend([status] * 8)

        for index, status in enumerate(status_plan):
            employee = applicants[index % len(applicants)]
            amount = Decimal(str(self.rng.choice([15000, 20000, 30000, 50000, 60000, 80000])))
            purpose = ["general", "medical", "calamity", "educational", "emergency"][index % 5]
            reviewed_by = None
            reviewed_at = None
            date_granted = None
            if status in ("verified", "approved", "released", "rejected", "paid"):
                reviewed_by = self.accountant_user if status in ("verified", "rejected") else self.superintendent_user
                reviewed_at = self._aware(self.today - timedelta(days=40 - index))
            if status in ("released", "paid"):
                date_granted = self.windows[0]["start"] + timedelta(days=5)

            loan = ProvidentLoan.objects.create(
                employee=employee,
                loan_amount=amount,
                interest_rate=Decimal("6.00"),
                term_months=self.rng.choice([12, 24, 36]),
                status=status,
                purpose=purpose,
                letter_request=f"Request for provident fund loan for {purpose}.",
                co_maker=co_maker,
                remarks=self.rng.choice([
                    "Verified complete documentation.",
                    "Approved by the Superintendent.",
                    "Released through payroll.",
                    "Application endorsed for review.",
                ]),
                reviewed_by=reviewed_by,
                reviewed_at=reviewed_at,
                date_granted=date_granted,
                station_code=self._slug(employee.school.name if employee.school else "division").upper()[:12],
            )
            ProvidentLoan.objects.filter(pk=loan.pk).update(
                date_applied=self.today - timedelta(days=60 - index)
            )

            for doc_type in ("laf", "letter_request", "auth_deduct", "payslip"):
                if self.rng.random() < 0.65:
                    LoanDocument.objects.create(
                        loan=loan,
                        doc_type=doc_type,
                        file=self._pdf(f"loan_{loan.pk}_{doc_type}", [employee.first_name, employee.last_name, doc_type]),
                    )

            loan.refresh_from_db()
            if status == "paid":
                guard = 0
                while loan.current_balance > Decimal("0.00") and guard < 80:
                    payment_amount = min(loan.monthly_payment, loan.current_balance)
                    LoanPayment.objects.create(
                        loan=loan,
                        amount_paid=payment_amount.quantize(Decimal("0.01")),
                        posted_by=self.accountant_user,
                    )
                    loan.refresh_from_db()
                    guard += 1

    def _seed_payroll(self):
        self._progress("Payroll records")
        accountant = self.accountant_user
        for window_index, window in enumerate(self.windows):
            for half in ("first", "second"):
                label = window[f"{half}_label"]
                start = window[f"{half}_start"]
                end = window[f"{half}_end"]
                if start > min(end, self.today):
                    continue

                for employee_index, employee in enumerate(self.employees):
                    if employee.user is None:
                        continue
                    calc = PayrollCalculator.compute(employee, label, start, end)
                    if window_index <= len(self.windows) - 4:
                        status = "released" if employee_index % 9 != 0 else "approved"
                    elif window_index == len(self.windows) - 3:
                        status = "released" if employee_index % 4 == 0 else "approved"
                    elif window_index == len(self.windows) - 2:
                        status = "approved" if employee_index % 3 == 0 else "draft"
                    else:
                        status = "draft" if employee_index % 4 != 0 else "approved"

                    release_date = None
                    if status == "released":
                        release_date = self._aware(min(end + timedelta(days=5), self.today))

                    payroll = Payroll.objects.create(
                        employee=employee,
                        cutoff_period=label,
                        status=status,
                        date_released=release_date,
                        **calc,
                    )
                    if status == "released" and payroll.loans > 0:
                        LoanPayment.allocate_payroll_deduction(
                            employee,
                            payroll.loans,
                            posted_by=accountant,
                        )

    def _seed_recruitment(self):
        self._progress("Recruitment applicants")
        applicants = []
        for index, status in enumerate(APPLICANT_STATUSES):
            for repeat in range(5 if status in ("applied", "comparative_assessment", "interview") else 4):
                sex = "Female" if self.rng.random() < 0.6 else "Male"
                first = self.rng.choice(FEMALE_NAMES if sex == "Female" else MALE_NAMES)
                last = self.rng.choice(LAST_NAMES)
                email = f"applicant.{len(applicants) + 1}@example.com"
                if status in ("applied", "initial_evaluation", "disqualified"):
                    scores = (self.rng.uniform(6, 10), self.rng.uniform(4, 8), self.rng.uniform(3, 8), 0, 0, 0)
                else:
                    scores = (
                        self.rng.uniform(8, 10),
                        self.rng.uniform(6, 10),
                        self.rng.uniform(6, 10),
                        self.rng.uniform(24, 35),
                        self.rng.uniform(17, 25),
                        self.rng.uniform(7, 10),
                    )
                applicant = Applicant.objects.create(
                    first_name=first,
                    middle_name=self.rng.choice(MIDDLE_NAMES),
                    last_name=last,
                    email=email,
                    phone=f"09{self.rng.randint(100000000, 999999999)}",
                    position_applied=POSITIONS_APPLIED[index % len(POSITIONS_APPLIED)],
                    status=status,
                    education_score=Decimal(str(round(scores[0], 2))),
                    training_score=Decimal(str(round(scores[1], 2))),
                    experience_score=Decimal(str(round(scores[2], 2))),
                    demo_teaching_score=Decimal(str(round(scores[3], 2))),
                    exam_score=Decimal(str(round(scores[4], 2))),
                    interview_score=Decimal(str(round(scores[5], 2))),
                    is_notified=self.rng.random() < 0.5,
                    notes=f"Processed under Lucena City division recruitment workflow ({status}).",
                )
                Applicant.objects.filter(pk=applicant.pk).update(
                    date_applied=self._aware(self.today - timedelta(days=self.rng.randint(5, 170)))
                )
                applicants.append(applicant)

                if self.rng.random() < 0.55:
                    ApplicantDocument.objects.create(
                        applicant=applicant,
                        document_type=self.rng.choice(["PDS", "Resume", "Transcript of Records", "Certificate"]),
                        file=self._pdf(f"applicant_{applicant.pk}_document", [first, last, status]),
                        filename=f"{self._slug(first)}_{self._slug(last)}_document.pdf",
                    )

    def _seed_performance(self):
        self._progress("IPCRF performance reviews")
        periods = ["SY 2024-2025 (Annual)", "SY 2025-2026 (Mid-year)"]
        for employee_index, employee in enumerate(self.employees):
            for period_index, period in enumerate(periods):
                incomplete = period_index == 1 and employee_index % 7 == 0
                punctuality = self.rng.randint(3, 5)
                quality = self.rng.randint(3, 5)
                behavior = self.rng.randint(3, 5)
                eligible = min(punctuality, quality, behavior) == 5 and period_index == 0
                review = PerformanceReview.objects.create(
                    employee=employee,
                    period=period,
                    punctuality_score=None if incomplete else punctuality,
                    quality_score=None if incomplete else quality,
                    behavior_score=None if incomplete else behavior,
                    is_promotion_eligible=eligible,
                    ai_summary=(
                        "Meets expectations across the scored IPCRF dimensions."
                        if not incomplete
                        else "Scores pending completion for this review period."
                    ),
                    ipcrf_file=self._pdf(
                        f"ipcrf_{employee.pk}_{period_index}",
                        [employee.first_name, employee.last_name, period],
                    ),
                )
                PerformanceReview.objects.filter(pk=review.pk).update(
                    date_evaluated=self._aware(self.today - timedelta(days=45 + period_index * 120))
                )

    def _seed_files(self):
        self._progress("PDS uploads and employee documents")
        for index, employee in enumerate(self.employees[:12]):
            status = "SUCCESS" if index % 5 != 4 else "FAILED"
            education = list(employee.education.all())
            eligibility = list(employee.eligibilities.all())
            work = list(employee.work_experience.all())
            PDSUpload.objects.create(
                employee=employee,
                file=self._pdf(f"pds_upload_{employee.pk}", [employee.first_name, employee.last_name, "Personal Data Sheet"]),
                confidence_avg=round(self.rng.uniform(0.72, 0.99), 3),
                status=status,
                raw_response={"source": "showcase-seeder", "status": status},
                extracted_data={
                    "personal_information": {
                        "surname": employee.last_name,
                        "first_name": employee.first_name,
                        "middle_name": employee.middle_name,
                    },
                    "education": [row.degree_course for row in education if row.degree_course],
                    "eligibility": [row.service for row in eligibility if row.service],
                    "work_experience": [row.position_title for row in work if row.position_title],
                }
                if status == "SUCCESS"
                else None,
            )

        for employee in self.employees:
            for doc_type in ("PDS", "Appointment", "Service Record"):
                if self.rng.random() < 0.45:
                    EmployeeDocument.objects.create(
                        employee=employee,
                        document_type=doc_type,
                        file=self._pdf(f"employee_{employee.pk}_{doc_type}", [employee.first_name, employee.last_name, doc_type]),
                        file_name=f"{self._slug(doc_type)}_{employee.pk}.pdf",
                        verified=doc_type != "Service Record",
                        verified_by=self.hr_user,
                        verified_at=self._aware(self.today - timedelta(days=20)),
                    )

    def _seed_notifications_and_audit(self):
        self._progress("Notifications and audit activity")
        recipients = list(self.users.values())
        leave_ids = list(LeaveRequest.objects.values_list("pk", flat=True))
        loan_ids = list(ProvidentLoan.objects.values_list("pk", flat=True))
        payroll_ids = list(Payroll.objects.values_list("pk", flat=True))

        notifications = [
            Notification(
                recipient=self.rng.choice(recipients),
                title=title,
                source_type=source_type,
                source_id=source_id,
            )
            for title, source_type, source_id in (
                [("Leave application updated", "leave", self.rng.choice(leave_ids)) for _ in range(60)]
                + [("Provident loan updated", "loan", self.rng.choice(loan_ids)) for _ in range(45)]
                + [("Payslip available", "payroll", self.rng.choice(payroll_ids)) for _ in range(45)]
            )
            if source_id
        ]
        Notification.objects.bulk_create(notifications, batch_size=300)
        for notification in notifications:
            created = self._aware(self.today - timedelta(days=self.rng.randint(0, 150)))
            read_at = created + timedelta(days=1) if self.rng.random() < 0.55 else None
            dismissed_at = read_at + timedelta(days=1) if read_at and self.rng.random() < 0.25 else None
            Notification.objects.filter(pk=notification.pk).update(
                created_at=created,
                read_at=read_at,
                dismissed_at=dismissed_at,
            )

        for user in recipients[:20]:
            NotificationTaskDismissal.objects.create(
                recipient=user,
                task_key=self.rng.choice(["review_dtr", "review_leave", "review_loan", "review_payroll"]),
            )

        audit_actors = [
            self.users["admin"],
            self.hr_user,
            self.superintendent_user,
            self.accountant_user,
            self.users["principal_lcnhs"],
        ]
        actions = []
        for index in range(220):
            actor = self.rng.choice(audit_actors)
            action = self.rng.choice(
                [
                    "Approved payroll",
                    "Released payroll",
                    "Processed leave application",
                    "Verified provident loan",
                    "Released provident loan funds",
                    "Updated employee record",
                    "Reviewed DTR submission",
                    "Created School record",
                ]
            )
            entry = AuditLog.objects.create(user=actor, action=f"{action} during showcase preparation #{index + 1}")
            actions.append((entry.pk, self._aware(self.today - timedelta(days=self.rng.randint(0, 180)))))
        for pk, timestamp in actions:
            AuditLog.objects.filter(pk=pk).update(timestamp=timestamp)

    def _print_summary(self):
        counts = {
            "users": User.objects.count(),
            "employees": Employee.objects.count(),
            "attendance": Attendance.objects.count(),
            "leaves": LeaveRequest.objects.count(),
            "leave_actions": LeaveAction.objects.count(),
            "loans": ProvidentLoan.objects.count(),
            "loan_payments": LoanPayment.objects.count(),
            "payroll": Payroll.objects.count(),
            "applicants": Applicant.objects.count(),
            "performance": PerformanceReview.objects.count(),
            "pds_uploads": PDSUpload.objects.count(),
            "notifications": Notification.objects.count(),
            "audit": AuditLog.objects.count(),
        }
        self.stdout.write(self.style.SUCCESS("\nShowcase data ready."))
        for label, value in counts.items():
            self.stdout.write(f"  {label}: {value}")
        self.stdout.write(f"  password for all accounts: {DEFAULT_PASSWORD}")
        self.stdout.write("  key accounts: admin, hr_lucena, superintendent, accountant, principal_lcnhs")
