import pytest
from rest_framework.test import APIClient
from django.core.cache import cache

@pytest.mark.django_db
def test_auth_rate_throttle_blocks_excessive_token_requests():
    """Security test: AuthRateThrottle triggers HTTP 429 on excessive login attempts."""
    cache.clear()
    client = APIClient()
    
    # 10 attempts per minute are permitted for the 'auth' scope
    for _ in range(10):
        res = client.post('/api/token/', {'username': 'invalid_user', 'password': 'bad_password'}, format='json')
        assert res.status_code == 401

    # 11th attempt within the same minute window must be throttled with HTTP 429
    throttled_res = client.post('/api/token/', {'username': 'invalid_user', 'password': 'bad_password'}, format='json')
    assert throttled_res.status_code == 429
    assert 'throttled' in throttled_res.data['detail'].lower()
