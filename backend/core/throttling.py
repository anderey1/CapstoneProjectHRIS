from rest_framework.throttling import AnonRateThrottle, UserRateThrottle

class AuthRateThrottle(AnonRateThrottle):
    """Throttles authentication, registration, and password change attempts."""
    scope = 'auth'


class AIRateThrottle(UserRateThrottle):
    """Throttles outbound AI generation and extraction requests."""
    scope = 'ai'
