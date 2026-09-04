# Revision Specification: REV-06
## Title: Security Hardening: CORS Middleware Order, Role Sync, and Client-Side JWT Verification

### 1. Objective & Problem Statement
1. `corsheaders.middleware.CorsMiddleware` is at the very bottom of `MIDDLEWARE` in `settings.py`. This prevents CORS headers from attaching to 401 Unauthorized, 403 Forbidden, and 500 error responses, causing false network errors on the frontend.
2. In `backend/core/permissions.py`, `IsManagement` does not include `Role.ADMINISTRATIVE`, triggering 403 errors when administrative staff load the dashboard.
3. In `frontend/src/context/AuthContext.jsx`, user authorization state is read directly from `localStorage.getItem('user_role')`. Users can easily tamper with `localStorage` to view restricted management UI.
4. `frontend/src/pages/Login.jsx` uses `window.location.href = '/'` which causes an expensive full page reload instead of using client-side SPA routing.

### 2. Files to Modify
- [`backend/config/settings.py`](file:///C:/Users/user/Documents/CapstoneProjectHRIS_jerwin/backend/config/settings.py)
- [`backend/core/permissions.py`](file:///C:/Users/user/Documents/CapstoneProjectHRIS_jerwin/backend/core/permissions.py)
- [`frontend/src/context/AuthContext.jsx`](file:///C:/Users/user/Documents/CapstoneProjectHRIS_jerwin/frontend/src/context/AuthContext.jsx)
- [`frontend/src/pages/Login.jsx`](file:///C:/Users/user/Documents/CapstoneProjectHRIS_jerwin/frontend/src/pages/Login.jsx)

### 3. Step-by-Step Implementation Instructions

#### Step 1: Reorder Middleware in `backend/config/settings.py`
Move `corsheaders.middleware.CorsMiddleware` to the very top:
```python
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
```

#### Step 2: Synchronize `IsManagement` in `backend/core/permissions.py`
Add `Role.ADMINISTRATIVE`:
```python
class IsManagement(BaseRolePermission):
    """Matches frontend isManagement role check."""
    allowed_roles = [Role.HR, Role.ACCOUNTANT, Role.SUPERINTENDENT, Role.ADMINISTRATIVE]
```

#### Step 3: Decode JWT Payload in `frontend/src/context/AuthContext.jsx`
Implement safe base64 JWT payload decoding so the client-side role is extracted from the cryptographic token rather than arbitrary local storage:
```javascript
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

useEffect(() => {
  const token = localStorage.getItem('access_token');
  if (token) {
    const payload = parseJwt(token);
    if (payload && payload.exp * 1000 > Date.now()) {
      setUser({
        loggedIn: true,
        role: payload.role || 'TEACHING',
        username: payload.username,
      });
    } else {
      logout();
    }
  }
  setLoading(false);
}, []);
```

#### Step 4: SPA Routing in `frontend/src/pages/Login.jsx`
Replace `window.location.href = '/'` with `useNavigate`:
```javascript
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  // ...
  const handleSubmit = async (e) => {
    // ...
    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err) {
      // ...
    }
  };
```

### 4. Verification & Acceptance Criteria
1. When an unauthorized request occurs (401/403), the browser receives appropriate `Access-Control-Allow-Origin` headers and displays the API error message without a CORS error.
2. Users logged in with `ADMINISTRATIVE` role can successfully view `/api/dashboard/` without 403 errors.
3. Modifying `localStorage.setItem('user_role', 'HR')` on a Teaching account does not expose HR routes upon page reload.
4. Logging in transitions smoothly to the dashboard without a full browser reload.
