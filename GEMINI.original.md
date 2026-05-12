# CapstoneProjectHRIS - AI Development Guide

> Context for AI assistants. Read before code gen, refactor, or file mod. Align with constraints/conventions.

---

## Project Identity

**Title:** HRIS w/ HR Management + Descriptive Analytics for DepEd - Lucena City
**Client:** DepEd - Lucena City (gov agency, multiple schools)
**Type:** Capstone Project. Quality, features, innovation matter for defense.
**Current Phase:** Pre-oral prototype. Goal: demo innovation. Prioritize visible features. Show AI, GeoSpatial, PWA, Analytics concepts.

---

## Tech Stack

### Backend
- Django 6.x+ w/ DRF
- PostgreSQL
- JWT via `djangorestframework-simplejwt`
- `django-cors-headers`
- Gemini API via `google-genai`

### Frontend (To Be Initialized)
- React + Vite (.jsx/.js only. No TS/TSX)
- TanStack Query
- React Context (no Zustand)
- React Hook Form
- Axios w/ JWT refresh interceptors
- Tailwind CSS + DaisyUI
- Lucide React
- `vite-plugin-pwa` (required)
- Leaflet.js

### Mobile
- PWA for mobile. No React Native.
- No React Native.

---

## Current Codebase State

### What Exists (Backend)
- Models: `Employee`, `ProvidentLoan`, `LoanPayment`, `Payroll`, `AuditLog`
- JWT endpoints work
- API Endpoints:
  - `/api/employees/`
  - `/api/loans/`
  - GET `/api/dashboard/` (stats)
  - GET `/api/charts/loan-status/`
  - GET `/api/charts/department/`
  - POST `/api/loans/<id>/approve/` (admin)
  - POST `/api/payroll/generate/<employee_id>/`

### What Does NOT Exist Yet (Build These)
- Attendance model + QR gen/scan
- Leave management
- Performance rating
- Recruitment/applicant tracking
- Statutory payroll deductions
- Cutoff-based payroll
- Frontend (dir empty)
- AuditLog integration

### Known Issues
- Use `psycopg2-binary`. `psycopg2` fails.
- venv may need refresh

---

## Feature Specifications

### 1. Attendance — QR Code + Geo-Validation (GeoSpatial Innovation)
- Unique daily QR (time-limited)
- Capture GPS on scan
- Validate vs school location via Haversine. No PostGIS.
- Flag if >100m from school
- Flag short-interval duplicates
- Store: `employee`, `date`, `in/out`, `status`, `lat/lng`, `geo_flag`

### 2. Payroll — Cutoff-Based with Statutory Deductions (Core Feature)
- Semi-monthly: 1st–15th, 16th–end
- Earnings: salary, OT, allowances
- Deductions: SSS, PhilHealth, Pag-IBIG, tax, loans
- Net = earnings - deductions
- Payslip PDF export
- Support cutoff param in `/api/payroll/generate/<id>/`

### 3. Leave Management (Core Feature)
- Types: Sick, Vacation, Emergency
- Flow: Apply → Approve/Reject → Auto-deduct if unpaid
- Track annual balances
- Store: `employee`, `type`, `dates`, `status`, `reason`

### 4. Performance Rating (AI/ML Innovation)
- HR rates: punctuality, quality, behavior
- Auto-compute punctuality from attendance
- Gemini API gen perf summary
- Promotion flag: score + tenure + attendance
- Store: `employee`, `period`, `scores`, `rating`, AI summary, promo flag

### 5. Recruitment (Supporting Feature)
- Tracking: Applied → Screened → Interviewed → Hired/Rejected
- Store: `pos`, `name`, `contact`, `resume`, `status`, `notes`, `date`
- Kanban board on frontend

### 6. Descriptive Analytics Dashboard (Analytics Innovation)
- Extend chart endpoints
- Add: attendance trends, leave rate, payroll summary, perf distrib, loan health
- Gemini API gen HR summary from data
- Leaflet map: school locations + attendance markers

---

## Innovation Summary (For Defense Narrative)

| Requirement | Implementation |
|-------------|----------------|
| AI/ML | Gemini API summaries + reports; promotion eligibility |
| GeoSpatial | QR + Haversine; Leaflet map |
| PWA | React + Vite + PWA; offline view; push notes |
| Descriptive Analytics | Dashboard charts + Gemini summaries |

---

## Architecture Conventions

### Backend (Django/DRF)

- Model logic in `save()`
- Business logic in ViewSet actions/services. No serializers.
- Use DRF permission classes.
- Scope querysets. No unfiltered `.all()`.
- `@action` for POST state changes.
- GET never mutate state. Use POST/PATCH.
- Log state changes to AuditLog.
- Catch specific exceptions. No bare `except:`.
- Use constants/choices for roles.

### Frontend (React/Vite)

- Server state: TanStack Query only.
- Query keys in `queryKeys.js`
- `invalidateQueries` on mutation success.
- React Hook Form. Pass `handleSubmit` to `onSubmit`.
- Keep form state local. No prop-drilling.
- No hooks in handlers/conditionals.
- Single `activeModal` state for modals.
- Auth state: React Context.
- Axios w/ base URL + JWT interceptor.
- Extract UI to separate files. 1 file = 1 purpose. Split if >100 lines.

### File Structure (Backend)
```
config/
  settings.py
  urls.py
  wsgi.py / asgi.py
core/
  models.py         # All models
  views.py          # ViewSets + FBVs
  serializers.py    # All serializers
  permissions.py    # Custom permission classes
  urls.py           # Router + urlpatterns
  utils.py          # Haversine, QR generation, Gemini calls
  tests.py
```

### File Structure (Frontend)
```
src/
  api/
    axios.js          # Axios instance + interceptors
    queryKeys.js      # Centralized TanStack Query keys
  components/
    ui/               # Reusable UI (Button, Modal, Badge, etc.)
    features/         # Feature-specific components
  pages/              # Route-level components
  context/
    AuthContext.jsx
  hooks/              # Custom hooks
  utils/
    haversine.js      # Client-side distance calc (backup)
```

---

## API Design Conventions

- RESTful: plural nouns, no verbs in URLs.
- Mutation actions: POST only.
- Response shape for lists:
  ```json
  { "count": 10, "results": [...] }
  ```
- Response shape for errors:
  ```json
  { "detail": "...", "field_errors": { "field": ["error"] } }
  ```
- Payroll: POST `/api/payroll/generate/` body: `{ employee_id, cutoff }`
- Attendance: POST `/api/attendance/scan/` body: `{ qr_token, lat, lng }`
- Analytics: GET `/api/analytics/<metric>/`

---

## Gemini API Integration

- Use `google-genai` package.
- API key in `.env`
- Use for:
  1. Perf summary: scores + attendance -> English para.
  2. HR report: agg data -> exec summary.
- JSON input -> plain language output.
- Handle errors (fallback text).
- Location: `core/utils.py`

---

## Environment Variables (.env)
```
SECRET_KEY=
DEBUG=True
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=5432
GEMINI_API_KEY=
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

> Don't commit `.env`. Add to `.gitignore`.

---

## Build Priority

### Pre-Oral (Prototype — Demo-Ready)
- [ ] Frontend: React + Vite + Tailwind + DaisyUI
- [ ] Login + JWT flow
- [ ] Dashboard charts
- [ ] Attendance: QR UI + mock scan
- [ ] Perf Rating: Form + Gemini summary
- [ ] Analytics: 3 charts + Gemini report
- [ ] Geo map: Leaflet + school pin
- [ ] PWA manifest + SW

### Post Pre-Oral (Full Defense)
- [ ] Real QR scan + Haversine
- [ ] Leave management flow
- [ ] Payroll cutoffs + deductions
- [ ] Payslip PDF
- [ ] Recruitment kanban
- [ ] AuditLog integration
- [ ] Unit tests

---

## What NOT To Do

- No huge files. 1 component per file.
- No TS/TSX. Plain JS only.
- No PostGIS. Use Haversine.
- No Zustand. Use React Context.
- No useEffect for fetch. Use TanStack Query.
- No magic role strings. Use constants.
- No bare `except:`.
- No React Native. PWA is mobile.
- No logic in serializers. Use models/services.
- No GET for mutations.