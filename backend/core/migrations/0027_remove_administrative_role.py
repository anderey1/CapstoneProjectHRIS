import core.models.employee
from django.db import migrations, models


def remove_administrative_role(apps, schema_editor):
    """Remove the retired demo account and migrate roles without granting new privileges."""
    alias = schema_editor.connection.alias
    User = apps.get_model('core', 'User')
    users = User.objects.using(alias)
    users.filter(username='elena.torres', is_superuser=False).delete()
    users.filter(role='ADMINISTRATIVE', is_superuser=True).update(role='')
    users.filter(username='admin', is_superuser=True).update(role='')
    users.filter(role='ADMINISTRATIVE', is_superuser=False).update(role='NON_TEACHING')


class Migration(migrations.Migration):
    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
        ('core', '0026_principal_school_access'),
    ]

    operations = [
        # Deliberately irreversible: restore a database backup to recover the deleted demo account.
        migrations.RunPython(remove_administrative_role),
        migrations.AlterModelManagers(
            name='user',
            managers=[('objects', core.models.employee.UserManager())],
        ),
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                blank=True,
                choices=[
                    ('HR', 'HR Staff'), ('ACCOUNTANT', 'Accountant'),
                    ('SUPERINTENDENT', 'Superintendent'), ('TEACHING', 'Teaching Staff'),
                    ('NON_TEACHING', 'Non-Teaching Staff'), ('PRINCIPAL', 'School Principal'),
                ],
                default='TEACHING',
                max_length=20,
            ),
        ),
        migrations.AddConstraint(
            model_name='user',
            constraint=models.CheckConstraint(
                condition=models.Q(is_superuser=True) | ~models.Q(role=''),
                name='staff_role_required',
            ),
        ),
    ]
