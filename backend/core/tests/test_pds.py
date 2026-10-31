from unittest.mock import Mock

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

from core.models import PDSUpload


PDS_URL = "/api/pds/extract/"


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def valid_pdf():
    return lambda name="pds.pdf", content_type="application/pdf": SimpleUploadedFile(
        name,
        b"%PDF-1.7\nmock PDS content\n%%EOF",
        content_type=content_type,
    )


@pytest.fixture
def media_root(tmp_path, settings):
    settings.MEDIA_ROOT = tmp_path
    return tmp_path


@pytest.mark.django_db
def test_pds_extraction_requires_authentication(client, valid_pdf, monkeypatch):
    provider = Mock(return_value=({"first_name": "Ana"}, None))
    monkeypatch.setattr("core.views.pds.extract_pds_data", provider)

    response = client.post(PDS_URL, {"file": valid_pdf()}, format="multipart")

    assert response.status_code == 401
    provider.assert_not_called()
    assert PDSUpload.objects.count() == 0


@pytest.mark.django_db
def test_pds_extraction_allows_hr_only(
    client, superintendent_user, valid_pdf, monkeypatch
):
    provider = Mock(return_value=({"first_name": "Ana"}, None))
    monkeypatch.setattr("core.views.pds.extract_pds_data", provider)
    client.force_authenticate(user=superintendent_user)

    response = client.post(PDS_URL, {"file": valid_pdf()}, format="multipart")

    assert response.status_code == 403
    provider.assert_not_called()
    assert PDSUpload.objects.count() == 0


@pytest.mark.django_db
def test_pds_extraction_rejects_missing_file(client, hr_user, monkeypatch):
    provider = Mock(return_value=({"first_name": "Ana"}, None))
    monkeypatch.setattr("core.views.pds.extract_pds_data", provider)
    client.force_authenticate(user=hr_user)

    response = client.post(PDS_URL, {}, format="multipart")

    assert response.status_code == 400
    assert response.data == {"error": "No file uploaded."}
    provider.assert_not_called()
    assert PDSUpload.objects.count() == 0


@pytest.mark.django_db
def test_pds_extraction_rejects_disallowed_upload_before_storage(
    client, hr_user, valid_pdf, monkeypatch
):
    provider = Mock(return_value=({"first_name": "Ana"}, None))
    monkeypatch.setattr("core.views.pds.extract_pds_data", provider)
    client.force_authenticate(user=hr_user)

    response = client.post(
        PDS_URL,
        {"file": valid_pdf(name="pds.txt", content_type="text/plain")},
        format="multipart",
    )

    assert response.status_code == 400
    assert response.data == {"error": "Invalid PDS file."}
    provider.assert_not_called()
    assert PDSUpload.objects.count() == 0


@pytest.mark.django_db
def test_pds_extraction_rejects_disallowed_content_type_before_storage(
    client, hr_user, valid_pdf, monkeypatch
):
    provider = Mock(return_value=({"first_name": "Ana"}, None))
    monkeypatch.setattr("core.views.pds.extract_pds_data", provider)
    client.force_authenticate(user=hr_user)

    response = client.post(
        PDS_URL,
        {"file": valid_pdf(name="pds.pdf", content_type="text/plain")},
        format="multipart",
    )

    assert response.status_code == 400
    assert response.data == {"error": "Invalid PDS file."}
    provider.assert_not_called()
    assert PDSUpload.objects.count() == 0


@pytest.mark.django_db
def test_pds_extraction_rejects_oversized_upload_before_storage(
    client, hr_user, monkeypatch, settings
):
    provider = Mock(return_value=({"first_name": "Ana"}, None))
    monkeypatch.setattr("core.views.pds.extract_pds_data", provider)
    settings.PDS_UPLOAD_MAX_SIZE_MB = 1
    client.force_authenticate(user=hr_user)
    oversized = SimpleUploadedFile(
        "pds.pdf",
        b"%PDF-" + (b"x" * (1024 * 1024)),
        content_type="application/pdf",
    )

    response = client.post(PDS_URL, {"file": oversized}, format="multipart")

    assert response.status_code == 400
    assert response.data == {"error": "Invalid PDS file."}
    provider.assert_not_called()
    assert PDSUpload.objects.count() == 0


@pytest.mark.django_db
def test_pds_extraction_succeeds_for_valid_pdf(
    client, hr_user, valid_pdf, monkeypatch, media_root
):
    provider = Mock(return_value=({"first_name": "Ana"}, None))
    monkeypatch.setattr("core.views.pds.extract_pds_data", provider)
    client.force_authenticate(user=hr_user)

    response = client.post(PDS_URL, {"file": valid_pdf()}, format="multipart")

    assert response.status_code == 200
    assert response.data["extracted_data"] == {"first_name": "Ana"}
    upload = PDSUpload.objects.get(pk=response.data["upload_id"])
    assert upload.status == "SUCCESS"
    provider.assert_called_once_with(b"%PDF-1.7\nmock PDS content\n%%EOF")
    assert upload.file.name.startswith("pds_uploads/")


@pytest.mark.django_db
def test_pds_extraction_provider_failure_is_safe_and_marks_upload_failed(
    client, hr_user, valid_pdf, monkeypatch, media_root
):
    provider = Mock(return_value=(None, "provider secret and traceback"))
    monkeypatch.setattr("core.views.pds.extract_pds_data", provider)
    client.force_authenticate(user=hr_user)

    response = client.post(PDS_URL, {"file": valid_pdf()}, format="multipart")

    assert response.status_code == 502
    assert response.data == {"error": "PDS extraction failed."}
    assert "provider secret" not in response.content.decode()
    upload = PDSUpload.objects.get()
    assert upload.status == "FAILED"


@pytest.mark.django_db
def test_pds_extraction_provider_exception_is_safe_and_marks_upload_failed(
    client, hr_user, valid_pdf, monkeypatch, media_root
):
    def fail(_file_bytes):
        raise RuntimeError("provider secret and traceback")

    monkeypatch.setattr("core.views.pds.extract_pds_data", fail)
    client.force_authenticate(user=hr_user)

    response = client.post(PDS_URL, {"file": valid_pdf()}, format="multipart")

    assert response.status_code == 502
    assert response.data == {"error": "PDS extraction failed."}
    assert "provider secret" not in response.content.decode()
    upload = PDSUpload.objects.get()
    assert upload.status == "FAILED"
