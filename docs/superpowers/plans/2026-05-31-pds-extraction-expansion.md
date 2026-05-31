# Plan: Expand PDS Extraction & Frontend Auto-Fill

Enhance the PDS (Personal Data Sheet) extraction feature to include Family Background, Education, Eligibility, and Work Experience, and ensure these are automatically populated in the employee registration form.

## Changes

### Backend

#### 1. `backend/core/utils.py`
- Update `extract_pds_data` prompt to include the following structured fields:
  - `family` (Section II): `relationship`, `surname`, `first_name`, `date_of_birth`, `occupation`.
  - `education` (Section III): `level`, `school_name`, `degree_course`, `year_graduated`.
  - `eligibilities` (Section IV): `service`, `rating`, `date_of_exam`.
  - `work_experience` (Section V): `position_title`, `agency`, `date_from`, `date_to`, `monthly_salary`, `is_gov_service`.

### Frontend

#### 2. `frontend/src/components/features/employees/PersonnelFormModal.jsx`
- Update `handlePDSExtraction` to map the new array fields (`family`, `education`, `eligibilities`, `work_experience`) to the form state using `setValue`.
- Ensure dates are formatted correctly for input fields.

## Verification

### Automated Tests
- Run backend tests (if any for PDS) or create a mock extraction test.
- Run frontend Playwright tests to ensure the modal still functions.

### Manual Verification
1. Upload a valid PDS PDF in the "Add Staff" modal.
2. Verify that the basic information is filled.
3. Switch to the "PDS Sections" tab.
4. Verify that Family, Education, Eligibility, and Work Experience fields are correctly pre-filled with data from the PDF.
