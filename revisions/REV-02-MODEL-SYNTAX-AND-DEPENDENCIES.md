# Revision Specification: REV-02
## Title: Employee Model Syntax Cleanup & Dependency Normalization

### 1. Objective & Problem Statement
1. `backend/core/models/employee.py` has corrupted lines (175–182) containing duplicate `__str__` methods and an unreachable `super().save(*args, **kwargs)` call.
2. `backend/core/utils/pdf_generator.py` relies on `reportlab`, but `reportlab` is completely absent from `backend/requirements.txt`.
3. `requirements.txt` contains a duplicate deprecated package: `rest-framework-simplejwt==0.0.2`.

### 2. Files to Modify
- [`backend/core/models/employee.py`](file:///C:/Users/user/Documents/CapstoneProjectHRIS_jerwin/backend/core/models/employee.py)
- [`backend/requirements.txt`](file:///C:/Users/user/Documents/CapstoneProjectHRIS_jerwin/backend/requirements.txt)

### 3. Step-by-Step Implementation Instructions

#### Step 1: Clean Up `backend/core/models/employee.py`
Inspect lines 162 to 182:
```python
    def save(self, *args, **kwargs):
        # 1. If position is provided, try to auto-match the Salary Grade
        if self.position and not self.salary_grade:
            matched_sg = SalaryGrade.objects.filter(label__icontains=self.position.strip()).first()
            if matched_sg:
                self.salary_grade = matched_sg

        # 2. Auto-sync salary with SalaryGrade amount if linked
        if self.salary_grade:
            self.salary = self.salary_grade.amount
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
```
**Action:** Delete lines 177 to 182 entirely (`super().save()` below `__str__` and duplicate `__str__`).

#### Step 2: Update `backend/requirements.txt`
1. Add `reportlab>=4.1.0` (required by `pdf_generator.py`).
2. Remove line: `rest-framework-simplejwt==0.0.2`.
3. Ensure `djangorestframework_simplejwt==5.5.1` remains as the official package.

### 4. Verification & Acceptance Criteria
1. Running `python manage.py check` executes without Python syntax or model errors.
2. In a clean virtualenv, `pip install -r requirements.txt` succeeds and `from reportlab.platypus import SimpleDocTemplate` imports cleanly without error.
