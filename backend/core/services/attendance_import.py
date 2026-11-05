"""Deterministic DTR slot validation for spreadsheet imports. Never saves source files."""
from collections import defaultdict
from datetime import date, datetime, time


from ..models import Attendance, Employee, BiometricEmployeeMapping

from .attendance_files import HEADERS, read_upload

SLOTS = ('am_in', 'am_out', 'pm_in', 'pm_out', 'ot_in', 'ot_out')


def identifier(value):
    if value is None or isinstance(value, bool):
        return ''
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value).strip()


def preview_rows(rows, lock=False):
    """Resolve identifiers, validate merged days, and return changes without writing."""
    agency = defaultdict(list)
    for employee in Employee.objects.all():
        if employee.agency_employee_no:
            agency[employee.agency_employee_no].append(employee)
    mappings = {(m.source_id, m.biometric_id): m.employee for m in BiometricEmployeeMapping.objects.select_related('employee')}
    groups, errors, duplicates = {}, [], 0
    entries = []
    for number, values in enumerate(rows, 2):
        if not any(v is not None and v != '' for v in values):
            continue
        try:
            if any(isinstance(v, str) and v.startswith('=') for v in values):
                raise ValueError('Formulas are not accepted.')
            external, kind, source = (identifier(v) for v in values[:3])
            if not external:
                raise ValueError('Employee identifier is required.')
            if kind == 'AGENCY_EMPLOYEE_NO':
                matches = agency.get(external, [])
                if len(matches) != 1:
                    raise ValueError('Unknown or ambiguous agency employee number.')
                employee = matches[0]
            elif kind == 'BIOMETRIC_ID':
                employee = mappings.get((source, external))
                if not source or not employee:
                    raise ValueError('Create a source/biometric ID mapping first.')
            else:
                raise ValueError('Invalid identifier_type.')
            day = values[3]
            if isinstance(day, datetime):
                day = day.date()
            if not isinstance(day, date):
                day = date.fromisoformat(str(day))
            stamp = values[4]
            if isinstance(stamp, datetime):
                stamp = stamp.time()
            if not isinstance(stamp, time):
                stamp = time.fromisoformat(str(stamp))
            if stamp.tzinfo or stamp.microsecond:
                raise ValueError('Use local times with whole seconds.')
            slot = identifier(values[5]).lower()
            if slot not in SLOTS:
                raise ValueError('Invalid punch_type.')
            key = (employee.pk, day)
            if key not in groups:
                qs = Attendance.objects.select_for_update() if lock else Attendance.objects
                current = qs.filter(employee=employee, date=day).first()
                groups[key] = {'employee': employee, 'date': day, 'current': current,
                               'slots': {s: getattr(current, s, None) for s in SLOTS}, 'changes': {}}
            group = groups[key]
            previous = group['slots'][slot]
            if previous is not None and previous != stamp:
                raise ValueError('Conflicting punch: existing time will not be overwritten.')
            if previous == stamp:
                duplicates += 1
            elif group['current'] and group['current'].is_dtr_approved:
                raise ValueError('Approved DTR is locked. Resolve through HR before importing changes.')
            else:
                group['slots'][slot] = stamp
                group['changes'][slot] = stamp
            entries.append({'row': number, 'employee': str(employee), 'date': day.isoformat(),
                            'punch_type': slot.upper(), 'time': stamp.isoformat()})
        except (ValueError, TypeError, IndexError) as exc:
            errors.append({'row': number, 'detail': str(exc)})
    warnings = []
    for group in groups.values():
        ordered = [group['slots'][slot] for slot in SLOTS if group['slots'][slot] is not None]
        if any(a >= b for a, b in zip(ordered, ordered[1:])):
            errors.append({'row': None, 'detail': f'{group["employee"]} {group["date"]}: punches must be chronological.'})
        missing = [slot.upper() for slot in SLOTS[:4] if group['slots'][slot] is None]
        if missing:
            warnings.append({'employee': str(group['employee']), 'date': group['date'].isoformat(), 'missing': missing})
    if not entries and not errors:
        errors.append({'row': None, 'detail': 'File contains no attendance punches.'})
    result = {'rows': entries, 'errors': errors, 'warnings': warnings, 'duplicates': duplicates,
              'new_punches': sum(len(g['changes']) for g in groups.values()), 'can_import': bool(entries) and not errors}
    return result, groups
