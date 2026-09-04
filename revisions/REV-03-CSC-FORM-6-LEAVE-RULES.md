# Revision Specification: REV-03
## Title: CSC Form 6 Retrospective Filing Rules & Validation

### 1. Objective & Problem Statement
In `backend/core/views/leave.py`, the validation enforces:
```python
if start_date < today:
    raise ValidationError("Start date cannot be in the past.")
```
Under Civil Service Commission (CSC Form 6) rules, **Sick Leave** and **Emergency (Calamity) Leave** are filed *after* an illness or disaster, upon the employee's return to service. Blocking past dates prevents teachers and staff from legally filing legitimate sick leave requests.

### 2. Files to Modify
- [`backend/core/views/leave.py`](file:///C:/Users/user/Documents/CapstoneProjectHRIS_jerwin/backend/core/views/leave.py)
- [`backend/core/serializers/leave.py`](file:///C:/Users/user/Documents/CapstoneProjectHRIS_jerwin/backend/core/serializers/leave.py)

### 3. Step-by-Step Implementation Instructions

#### Step 1: Update Leave Validation Rules in `LeaveViewSet.perform_create`
Replace lines 66–82 with specific rule segregation:
```python
# 1. Past Date Rules
RETROSPECTIVE_LEAVES = ['sick', 'emergency', 'rehabilitation']

if leave_type not in RETROSPECTIVE_LEAVES:
    if start_date < today:
        raise ValidationError({"start_date": "Advance filing required. Start date cannot be in the past."})
    if end_date < today:
        raise ValidationError({"end_date": "End date cannot be in the past."})
else:
    # Retrospective leaves allowed up to 30 calendar days after the incident
    if (today - start_date).days > 30:
        raise ValidationError({
            "start_date": "Sick or Emergency leave must be filed within 30 calendar days upon return."
        })
    if end_date > today and leave_type == 'sick' and not serializer.validated_data.get('is_in_hospital'):
        # Routine sick leave is usually for past days unless scheduled hospitalization
        pass

# 2. Advance Filing CSC Requirements
if leave_type == 'vacation':
    if (start_date - today).days < 5:
        raise ValidationError({"start_date": "Vacation leave must be filed at least 5 days in advance."})

if leave_type == 'solo_parent':
    if (start_date - today).days < 5:
        raise ValidationError({"start_date": "Solo Parent leave must be filed at least 5 days in advance."})

# 3. Sick Leave Documentary Requirement (CSC Rule: > 5 days requires Medical Certificate)
working_days = calculate_working_days(start_date, end_date)
if leave_type == 'sick' and working_days > 5:
    if not serializer.validated_data.get('supporting_document'):
        raise ValidationError({
            "supporting_document": "A Medical Certificate (CS Form 41 / Physician Cert) is required for sick leaves exceeding 5 days."
        })
```

### 4. Verification & Acceptance Criteria
1. An employee filing a Sick Leave with `start_date` = 3 days ago is accepted.
2. An employee filing a Sick Leave with `start_date` = 45 days ago is rejected with a 30-day limit error.
3. An employee filing Vacation Leave for yesterday is rejected with an advance-filing error.
4. An employee filing Sick Leave for 6 working days without a supporting document is rejected with the medical certificate requirement error.
