# Minimal Patch Plan: Fix Dashboard API Endpoint

## 1. Targeted Changes
Modify the query URL from `analytics/dashboard/` to `dashboard/` in two frontend page components:

### A. `frontend/src/pages/admin/AccountantDashboardPage.jsx` (Line 16)
```diff
-    queryFn: () => api.get('analytics/dashboard/').then(res => res.data)
+    queryFn: () => api.get('dashboard/').then(res => res.data)
```

### B. `frontend/src/pages/admin/SuperintendentDashboardPage.jsx` (Line 16)
```diff
-    queryFn: () => api.get('analytics/dashboard/').then(res => res.data)
+    queryFn: () => api.get('dashboard/').then(res => res.data)
```

## 2. Verification Protocol
1. Verify build passes without syntax errors:
   ```bash
   cd frontend
   npm.cmd run build
   ```
2. Verify lint passes:
   ```bash
   npx eslint src/pages/admin/AccountantDashboardPage.jsx src/pages/admin/SuperintendentDashboardPage.jsx
   ```
3. Runtime verification:
   Navigating to `/admin/accountant-dashboard` and `/admin/superintendent-dashboard` initiates `GET /api/dashboard/` and succeeds with HTTP 200.
