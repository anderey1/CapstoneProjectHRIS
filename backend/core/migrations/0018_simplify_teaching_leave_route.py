from django.db import migrations


NOTE = 'Teaching route updated to Principal approval and HR completion.'


def forward(apps, schema_editor):
    LeaveRequest = apps.get_model('core', 'LeaveRequest')
    LeaveAction = apps.get_model('core', 'LeaveAction')
    database = schema_editor.connection.alias
    for old_status, new_status in (
        ('pending_checking', 'pending_supervisor'),
        ('pending_records', 'pending_hr'),
    ):
        for leave in LeaveRequest.objects.using(database).filter(workflow='teaching', status=old_status):
            LeaveAction.objects.using(database).create(
                leave_id=leave.pk, actor_name='System', from_status=old_status,
                to_status=new_status, note=NOTE,
            )
            leave.status = new_status
            leave.save(using=database, update_fields=['status'])


def backward(apps, schema_editor):
    LeaveRequest = apps.get_model('core', 'LeaveRequest')
    LeaveAction = apps.get_model('core', 'LeaveAction')
    database = schema_editor.connection.alias
    for action in LeaveAction.objects.using(database).filter(note=NOTE, actor_name='System'):
        if LeaveAction.objects.using(database).filter(leave_id=action.leave_id, id__gt=action.pk).exists():
            continue
        LeaveRequest.objects.using(database).filter(
            pk=action.leave_id, workflow='teaching', status=action.to_status,
        ).update(status=action.from_status)
        action.delete(using=database)


class Migration(migrations.Migration):
    dependencies = [('core', '0017_merge_recruitment_and_leave')]

    operations = [migrations.RunPython(forward, backward)]
