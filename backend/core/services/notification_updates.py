from ..models import Notification


def notify_employee(employee, actor, title, source_type, source_id):
    if employee.user_id and employee.user_id != actor.pk:
        Notification.objects.create(recipient_id=employee.user_id, title=title,
                                    source_type=source_type, source_id=source_id)
