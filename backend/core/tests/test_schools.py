from unittest.mock import patch

import pytest
from django.contrib.auth import get_user_model
from django.db.models.deletion import ProtectedError
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken

from core.models import AuditLog, Role, School

pytestmark = pytest.mark.django_db
VALUES = {'name': 'Defense Test School', 'latitude': '13.937200', 'longitude': '121.617200', 'radius_meters': 150}


@pytest.fixture
def client():
    return APIClient()


@pytest.mark.parametrize('role', list(Role.values))
@pytest.mark.parametrize('method', ['post', 'put', 'patch', 'delete'])
def test_non_superuser_cannot_write(client, mock_school, role, method):
    user = get_user_model().objects.create_user(username='ordinary', role=role)
    client.force_authenticate(user)
    url = '/api/schools/' if method == 'post' else f'/api/schools/{mock_school.pk}/'
    assert getattr(client, method)(url, VALUES, format='json').status_code == 403
    mock_school.refresh_from_db()
    assert mock_school.name != VALUES['name']
    assert School.objects.count() == 1
    assert not AuditLog.objects.exists()


def test_principal_reads_but_cannot_write(client, supervisor_user, mock_school):
    client.force_authenticate(supervisor_user)
    assert client.get('/api/schools/').status_code == 200
    assert client.get(f'/api/schools/{mock_school.pk}/').status_code == 200
    assert client.patch(f'/api/schools/{mock_school.pk}/', VALUES).status_code == 403


@pytest.mark.parametrize('method', ['get', 'post', 'put', 'patch', 'delete'])
def test_anonymous_denied(client, mock_school, method):
    url = '/api/schools/' if method in ('get', 'post') else f'/api/schools/{mock_school.pk}/'
    assert getattr(client, method)(url, VALUES).status_code == 401


@pytest.mark.parametrize('role', [Role.ADMINISTRATIVE, Role.TEACHING])
def test_superuser_crud_and_audit(client, admin_user, role):
    admin_user.role = role
    admin_user.save()
    client.force_authenticate(admin_user)
    response = client.post('/api/schools/', VALUES, format='json')
    assert response.status_code == 201, response.data
    url = f'/api/schools/{response.data["id"]}/'
    assert client.patch(url, {'name': 'Edited School'}, format='json').status_code == 200
    assert client.put(url, {**VALUES, 'name': 'Replaced School'}, format='json').status_code == 200
    assert client.delete(url).status_code == 204
    assert not School.objects.exists()
    assert AuditLog.objects.filter(user=admin_user).count() == 4


def test_assigned_school_cannot_be_deleted(client, admin_user, teacher_employee):
    school = teacher_employee.school
    client.force_authenticate(admin_user)
    response = client.delete(f'/api/schools/{school.pk}/')
    assert response.status_code == 409
    teacher_employee.refresh_from_db()
    assert teacher_employee.school_id == school.pk
    assert not AuditLog.objects.exists()
    with pytest.raises(ProtectedError):
        school.delete()


@pytest.mark.parametrize('field,value', [
    ('name', ''), ('name', ' '), ('name', 'x' * 101),
    ('latitude', '90.000001'), ('latitude', '-90.000001'),
    ('longitude', '180.000001'), ('longitude', '-180.000001'),
    ('radius_meters', 0), ('radius_meters', -1), ('radius_meters', '1.5'),
])
def test_invalid_school_rejected(client, admin_user, field, value):
    client.force_authenticate(admin_user)
    response = client.post('/api/schools/', {**VALUES, field: value}, format='json')
    assert response.status_code == 400
    assert field in response.data
    assert not School.objects.exists()


@pytest.mark.parametrize('action', ['create', 'update', 'delete'])
def test_audit_failure_rolls_back_mutation(client, admin_user, mock_school, action):
    client.force_authenticate(admin_user)
    url = f'/api/schools/{mock_school.pk}/'
    with patch('core.views.employee.reference.AuditLog.objects.create', side_effect=RuntimeError('audit unavailable')):
        with pytest.raises(RuntimeError):
            if action == 'create':
                client.post('/api/schools/', VALUES, format='json')
            elif action == 'update':
                client.patch(url, {'name': 'Changed'}, format='json')
            else:
                client.delete(url)
    assert School.objects.count() == 1
    mock_school.refresh_from_db()
    assert mock_school.name != 'Changed'


def test_token_superuser_flag_and_live_permission(client, admin_user, mock_school):
    response = client.post('/api/token/', {'username': admin_user.username, 'password': 'password123'})
    assert response.status_code == 200
    assert response.data['is_superuser'] is True
    token = response.data['access']
    assert AccessToken(token)['is_superuser'] is True
    admin_user.is_superuser = False
    admin_user.save()
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    assert client.patch(f'/api/schools/{mock_school.pk}/', {'name': 'Denied'}).status_code == 403


def test_ordinary_token_flag_false(client, hr_user):
    response = client.post('/api/token/', {'username': hr_user.username, 'password': 'password123'})
    assert response.status_code == 200
    assert response.data['is_superuser'] is False
    assert AccessToken(response.data['access'])['is_superuser'] is False


def test_django_admin_restricts_school_writes(admin_user, hr_user):
    from django.contrib import admin
    from django.contrib.auth.models import Permission
    from django.test import RequestFactory

    hr_user.is_staff = True
    hr_user.save()
    hr_user.user_permissions.add(*Permission.objects.filter(content_type__model='school'))
    school_admin = admin.site._registry[School]
    request = RequestFactory().get('/admin/core/school/')
    for user, expected in [(hr_user, False), (admin_user, True)]:
        request.user = user
        assert school_admin.has_add_permission(request) is expected
        assert school_admin.has_change_permission(request) is expected
        assert school_admin.has_delete_permission(request) is expected


def test_create_school_requires_only_name(client, admin_user):
    client.force_authenticate(admin_user)
    response = client.post('/api/schools/', {'name': 'School without GPS'}, format='json')
    assert response.status_code == 201, response.data
    school = School.objects.get(pk=response.data['id'])
    assert school.latitude is None
    assert school.longitude is None
