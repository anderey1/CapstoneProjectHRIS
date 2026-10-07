# Diagnosis Report: 404 Not Found on `/api/analytics/dashboard/`

## 1. Symptom & Environment
- **Error**: `GET http://localhost:8000/api/analytics/dashboard/ 404 (Not Found)`
- **Origin Call**: `frontend/src/pages/admin/AccountantDashboardPage.jsx:16`
- **Secondary Occurrence**: `frontend/src/pages/admin/SuperintendentDashboardPage.jsx:16`

## 2. Root Cause Analysis
1. **Backend Route Registration (`backend/core/urls.py`)**:
   - `path('dashboard/', dashboard_stats, name='dashboard_stats')` -> maps to `/api/dashboard/`.
   - `path('analytics/<str:metric>/', analytics_detail, name='analytics_detail')` -> maps to `/api/analytics/<metric>/`.
2. **Backend Dispatch (`backend/core/views/analytics.py:142-177`)**:
   - `analytics_detail` only recognizes metrics: `'attendance'`, `'schools'`, `'leave'`, `'payroll'`, `'performance'`, `'loans'`, `'departments'`, `'recruitment'`.
   - Any other metric (such as `'dashboard'`) falls into `else:` and returns:
     ```json
     {"detail": "Metric not found. Available: attendance, schools, leave, payroll, performance, loans, departments, recruitment"}
     ```
     with HTTP status `404 Not Found`.
3. **Frontend Mismatch**:
   - `AdminDashboard.jsx:61` correctly calls `api.get('dashboard/')`.
   - `AccountantDashboardPage.jsx:16` incorrectly prepends `analytics/`: `api.get('analytics/dashboard/')`.
   - `SuperintendentDashboardPage.jsx:16` also incorrectly calls `api.get('analytics/dashboard/')`.

## 3. Scope of Impact
- Only 2 files in the entire codebase call `analytics/dashboard/`:
  - `frontend/src/pages/admin/AccountantDashboardPage.jsx`
  - `frontend/src/pages/admin/SuperintendentDashboardPage.jsx`
- Backend endpoints require no modifications.
