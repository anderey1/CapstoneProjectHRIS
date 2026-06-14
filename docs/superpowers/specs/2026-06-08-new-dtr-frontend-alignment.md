# Design Spec: New DTR Frontend Alignment
**Date:** 2026-06-08

## Overview
Backend migration `0026_rename_time_in_attendance_am_in_and_more.py` renamed attendance fields. Frontend components still use legacy keys (`time_in`, `time_out`), resulting in `--:--` displays.

## Target Changes

### 1. `frontend/src/pages/shared/Attendance.jsx`
- Update table headers to include AM, PM, and OT columns.
- Update table rows to display `am_in/out`, `pm_in/out`, and `ot_in/out`.
- Use vertical stacking for in/out pairs to maintain density.

### 2. `frontend/src/pages/employee/EmployeeDashboard.jsx`
- Update table rows in the "Recent Activity" section.
- Display `am_in` and `pm_out` (or similar representative slots) to keep the dashboard preview compact.
- Fix key access from `rec.time_in` to new fields.

## Data Mapping
- Legacy `time_in` -> `am_in`
- Legacy `time_out` -> `am_out`
- New: `pm_in`, `pm_out`, `ot_in`, `ot_out`

## Verification Plan
- [ ] Check `Attendance.jsx` displays multiple slots.
- [ ] Check `EmployeeDashboard.jsx` displays valid times instead of `--:--`.
- [ ] Verify geo-flag still works with the new layout.
