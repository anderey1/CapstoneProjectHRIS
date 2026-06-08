

Enum role {
  ADMIN
  HR
  SUPERVISOR
  ACCOUNTANT
  EMPLOYEE
}

Enum attendance_status {
  present
  late
  absent
}

Enum loan_status {
  pending
  approved
  released
  rejected
  paid
}

Enum loan_purpose {
  general
  medical
  calamity
  educational
  emergency
}

Enum loan_doc_type {
  laf
  letter_request
  auth_deduct
  payslip
  deped_id
  appointment
  service_record
  contract
  comaker_payslip
  medical_abstract
  calamity_cert
}

Enum leave_status {
  pending
  approved
  rejected
}

Enum leave_type {
  vacation
  forced
  sick
  maternity
  paternity
  special_privilege
  solo_parent
  study
  vawc
  rehabilitation
  women_special
  emergency
  adoption
  others
}

Enum study_type {
  masters
  board_exam
}

Enum commutation_type {
  not_requested
  requested
}

Enum payroll_status {
  draft
  approved
  released
}

Enum relation_type {
  SPOUSE
  FATHER
  MOTHER
  CHILD
}

Enum education_level {
  ELEMENTARY
  SECONDARY
  VOCATIONAL
  COLLEGE
  GRADUATE
}

Enum upload_status {
  PENDING
  SUCCESS
  FAILED
}

Enum applicant_status {
  applied
  initial_evaluation
  comparative_assessment
  interview
  background_investigation
  appointment_proposed
  hired
  disqualified
  rejected
}

// --- Tables ---

Table User {
  id integer [primary key]
  username varchar
  email varchar
  password varchar
  first_name varchar
  last_name varchar
  role role [default: 'EMPLOYEE']
  is_staff boolean
  is_active boolean
  date_joined datetime
}

Table School {
  id integer [primary key]
  name varchar
  latitude decimal
  longitude decimal
  radius_meters integer [default: 100]
}

Table SalaryGrade {
  id integer [primary key]
  grade integer [unique]
  amount decimal
  label varchar [note: 'e.g., Teacher I']
}

Table Employee {
  id integer [primary key]
  user_id integer [unique]
  first_name varchar
  last_name varchar
  middle_name varchar
  name_extension varchar
  date_of_birth date
  place_of_birth varchar
  sex varchar
  civil_status varchar
  umid_id varchar
  pagibig_id varchar
  philhealth_no varchar
  philsys_id varchar
  tin_no varchar
  agency_employee_no varchar
  mobile_no varchar
  email varchar
  residential_address text
  permanent_address text
  position varchar
  department varchar
  school_id integer
  salary_grade_id integer
  salary decimal
  date_hired date
  bank_name varchar [default: 'Land Bank of the Philippines']
  account_number varchar
  face_descriptor text
  vacation_leave_balance decimal [default: 15.0]
  sick_leave_balance decimal [default: 15.0]
}

Table Attendance {
  id integer [primary key]
  employee_id integer
  date date
  time_in time
  time_out time
  status attendance_status [default: 'present']
  latitude decimal
  longitude decimal
  is_geo_flagged boolean [default: false]
  
  Indexes {
    (employee_id, date) [unique]
  }
}

Table AuditLog {
  id integer [primary key]
  user_id integer
  action text
  timestamp datetime
}

Table ProvidentLoan {
  id integer [primary key]
  employee_id integer
  loan_amount decimal
  interest_rate decimal
  term_months integer [default: 12]
  monthly_payment decimal
  total_amount decimal
  status loan_status [default: 'pending']
  date_applied date
  purpose loan_purpose [default: 'general']
  letter_request text
  co_maker_id integer
  co_maker_name varchar
  remarks text
  reviewed_by_id integer
  reviewed_at datetime
}

Table LoanDocument {
  id integer [primary key]
  loan_id integer
  doc_type loan_doc_type
  file varchar
  uploaded_at datetime
}

Table LoanPayment {
  id integer [primary key]
  loan_id integer
  amount_paid decimal
  payment_date date
  remaining_balance decimal
}

Table LeaveRequest {
  id integer [primary key]
  employee_id integer
  leave_type leave_type
  other_type_details varchar
  is_within_philippines boolean [default: true]
  location_details varchar
  illness_details varchar
  is_in_hospital boolean
  study_type study_type
  is_monetization boolean [default: false]
  is_terminal_leave boolean [default: false]
  start_date date
  end_date date
  working_days_applied decimal
  commutation commutation_type [default: 'not_requested']
  date_applied datetime
  status leave_status [default: 'pending']
  supporting_document varchar
  disapproval_reason text
  approved_days_with_pay decimal
  approved_days_without_pay decimal
  approved_others varchar
}

Table Payroll {
  id integer [primary key]
  employee_id integer
  cutoff_period varchar
  days_worked decimal
  basic_salary decimal
  gross_salary decimal
  sss decimal
  philhealth decimal
  pagibig decimal
  tax decimal
  loans decimal
  total_deductions decimal
  net_salary decimal
  status payroll_status [default: 'draft']
  date_generated datetime
  date_released datetime
}

Table FamilyMember {
  id integer [primary key]
  employee_id integer
  relationship relation_type
  surname varchar
  first_name varchar
  middle_name varchar
  full_name varchar
  extension varchar
  occupation varchar
  employer varchar
  date_of_birth date
}

Table Education {
  id integer [primary key]
  employee_id integer
  level education_level
  school_name varchar
  degree_course varchar
  period_from varchar
  period_to varchar
  highest_level varchar
  year_graduated varchar
  honors_received varchar
}

Table Eligibility {
  id integer [primary key]
  employee_id integer
  service varchar
  rating varchar
  date_of_exam date
  place_of_exam varchar
  license_number varchar
  validity_date date
}

Table WorkExperience {
  id integer [primary key]
  employee_id integer
  date_from date
  date_to date
  is_present boolean [default: false]
  position_title varchar
  agency varchar
  monthly_salary decimal
  salary_grade varchar
  status_of_appointment varchar
  is_gov_service boolean [default: true]
}

Table PDSUpload {
  id integer [primary key]
  employee_id integer
  file varchar
  uploaded_at datetime
  confidence_avg float
  status upload_status [default: 'PENDING']
  raw_response json
  extracted_data json
}

Table PerformanceReview {
  id integer [primary key]
  employee_id integer
  period varchar
  punctuality_score integer
  quality_score integer
  behavior_score integer
  ai_summary text
  is_promotion_eligible boolean [default: false]
  date_evaluated datetime
}

Table Applicant {
  id integer [primary key]
  first_name varchar
  last_name varchar
  email varchar
  phone varchar
  position_applied varchar
  school_division varchar
  education_score decimal
  training_score decimal
  experience_score decimal
  interview_score decimal
  exam_score decimal
  total_score decimal
  status applicant_status [default: 'applied']
  last_status_update datetime
  is_notified boolean [default: false]
  pds_file varchar
  resume varchar
  notes text
  date_applied datetime
}

// --- Relationships ---

Ref: Employee.user_id - User.id [delete: cascade]
Ref: Employee.school_id > School.id [delete: set null]
Ref: Employee.salary_grade_id > SalaryGrade.id [delete: set null]

Ref: Attendance.employee_id > Employee.id [delete: cascade]

Ref: AuditLog.user_id > User.id [delete: set null]

Ref: ProvidentLoan.employee_id > Employee.id [delete: cascade]
Ref: ProvidentLoan.co_maker_id > Employee.id [delete: set null]
Ref: ProvidentLoan.reviewed_by_id > User.id [delete: set null]

Ref: LoanDocument.loan_id > ProvidentLoan.id [delete: cascade]
Ref: LoanPayment.loan_id > ProvidentLoan.id [delete: cascade]

Ref: LeaveRequest.employee_id > Employee.id [delete: cascade]

Ref: Payroll.employee_id > Employee.id [delete: cascade]

Ref: FamilyMember.employee_id > Employee.id [delete: cascade]
Ref: Education.employee_id > Employee.id [delete: cascade]
Ref: Eligibility.employee_id > Employee.id [delete: cascade]
Ref: WorkExperience.employee_id > Employee.id [delete: cascade]

Ref: PDSUpload.employee_id > Employee.id [delete: set null]

Ref: PerformanceReview.employee_id > Employee.id [delete: cascade]

