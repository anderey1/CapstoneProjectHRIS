# Biometric attendance integration

HR and Administrative staff import school biometric logs through **Attendance Monitor → Import biometric attendance**. Staff view imported records through **My Attendance** or **My DTR**. The HRIS no longer accepts QR/GPS punches.

## Prepare an attendance file

Download the Excel or CSV template from Attendance Monitor. Accepted file types are `.xlsx`, Excel 97-2003 `.xls`, and `.csv`. Use one worksheet for Excel files, values rather than formulas, and one punch per row (maximum 10,000 rows / 5 MB). Keep identifiers as text to preserve leading zeros. Date values may be Excel dates or `YYYY-MM-DD`; times may be Excel times or `HH:MM:SS`. All times are local Asia/Manila times. CSV accepts comma, semicolon, or tab delimiters and UTF-8 (with or without BOM), Windows-1252, or BOM-marked UTF-16 encoding. Keep the same template columns for every format. Older `.xls` files provide cached cell values; save computed cells as values before uploading.

| Column | Value |
| --- | --- |
| employee_identifier | Agency employee number or machine biometric ID |
| identifier_type | `AGENCY_EMPLOYEE_NO` or `BIOMETRIC_ID` |
| source_id | Required for biometric IDs; identifies the school/device |
| date | Attendance date |
| time | Recorded local time |
| punch_type | `AM_IN`, `AM_OUT`, `PM_IN`, `PM_OUT`, `OT_IN`, `OT_OUT` |
| employee_name | Optional display text; never used to match employees |

Example: `000123`, `AGENCY_EMPLOYEE_NO`, blank source, `2026-05-04`, `07:45:00`, `AM_IN`, optional employee name.

Agency numbers must uniquely match the personnel record's `agency_employee_no`. When the machine uses a different ID, use **Employee ID mappings** to link its source and biometric ID to an existing employee. A mapping cannot silently be reassigned. Never upload fingerprint or facial templates. Device vendor exports must first be converted to the documented template; this version is file-based integration, not a live device connection.

## Preview, import, and review

1. Select the file and choose **Preview file**. Resolve unknown identities, conflicting times, malformed rows, or chronological errors. Errors block the entire batch.
2. Review missing-punch warnings. Missing logs do not automatically become absences. For machine failures, official business, or corrections, HR must check the supporting records; a formal correction submission workflow remains a follow-up.
3. Choose **Confirm import** within 30 minutes. The server checks the same file and validates current attendance again. Exact duplicates are skipped; conflicting punches and changes to approved DTRs are blocked.
4. Open **Staff DTR**, inspect the month's slots, and approve the monthly DTR after review. Form 48 export and the payroll approval gate continue to use these records.

Morning entry at or before 08:00 is present; later entry is late. An afternoon-only entry is late under the existing rule. Exit-only records are incomplete and excluded from attendance-based days worked. Overtime slots store recorded times and do not grant overtime pay approval.

The attendance file is processed in memory and is not retained. Successful imports record the uploader, dates, counts, and SHA-256 checksum, with an audit log. Existing historical coordinate fields remain in the database for compatibility and are not used by attendance collection or dashboards.

## Setup and verification

From `backend/`:

```powershell
venv\Scripts\python.exe -m pip install -r requirements.txt
venv\Scripts\python.exe manage.py migrate
venv\Scripts\python.exe -m pytest core/tests/test_attendance_import.py core/tests/test_attendance.py core/tests/test_payroll.py
```

From `frontend/`: `npm.cmd run build`.
