from django.db.migrations.loader import MigrationLoader
from django.db import connection
from django.apps import apps
from importlib import import_module
from types import SimpleNamespace

import pytest


def test_migration_graph_loads_without_database():
    loader = MigrationLoader(None)

    loader.graph.validate_consistency()
    assert loader.detect_conflicts() == {}


@pytest.mark.django_db
@pytest.mark.parametrize('old_status,new_status', [
    ('pending_checking', 'pending_supervisor'),
    ('pending_records', 'pending_hr'),
])
def test_teaching_route_migration_preserves_standard_requests_and_balances(
    teacher_employee, non_teaching_employee, old_status, new_status,
):
    LeaveRequest = apps.get_model('core', 'LeaveRequest')
    migration = import_module('core.migrations.0018_simplify_teaching_leave_route')
    schema_editor = SimpleNamespace(connection=connection)
    data = dict(leave_type='sick', start_date='2026-11-02', end_date='2026-11-03',
                working_days_applied=2, status=old_status)
    teaching = LeaveRequest.objects.create(employee=teacher_employee, workflow='teaching', **data)
    standard = LeaveRequest.objects.create(employee=non_teaching_employee, workflow='standard', **data)
    balance = teacher_employee.sick_leave_balance

    migration.forward(apps, schema_editor)
    migration.forward(apps, schema_editor)

    teaching.refresh_from_db()
    standard.refresh_from_db()
    teacher_employee.refresh_from_db()
    assert teaching.status == new_status
    assert standard.status == old_status
    assert teacher_employee.sick_leave_balance == balance
    assert teaching.actions.count() == 1
    assert teaching.actions.get().from_status == old_status

    migration.backward(apps, schema_editor)
    teaching.refresh_from_db()
    assert teaching.status == old_status
    assert teaching.actions.count() == 0
