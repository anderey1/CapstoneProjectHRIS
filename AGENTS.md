# AGENTS.md

Full-stack HRIS for DepEd Lucena City Division. Django REST API in [backend](backend), React 19 + Vite frontend in [frontend](frontend). Design constraints in [DESIGN.md](DESIGN.md).

## Commands

Backend (venv is `backend/venv`; the repo-root `venv/` has no Django installed):

```bash
cd backend
venv\Scripts\python.exe manage.py migrate
venv\Scripts\python.exe manage.py runserver
venv\Scripts\python.exe manage.py seed_demo_data   # demo users, all password123
```

Backend tests — **must run from `backend/`**. `pytest.ini` lives there, so running from repo root fails with `ImproperlyConfigured: settings are not configured`.

```bash
cd backend
venv\Scripts\python.exe -m pytest                      # 76 tests, ~5.5 min
venv\Scripts\python.exe -m pytest core/tests/test_leave.py          # single file
venv\Scripts\python.exe -m pytest -k atomic                          # by name
```

`pytest.exe` invoked directly produces no output on this shell. Use `python -m pytest`.

Frontend:

```bash
cd frontend
npm install
npm run dev      # 5173
npm run build    # passes
npm run lint     # FAILS today: 147 errors, 2 warnings
npx playwright test   # 4 E2E specs, config auto-starts dev server
```

`npm` is blocked by PowerShell execution policy; use `npm.cmd`.

### Lint is red at baseline

`npm run lint` reports 147 pre-existing errors, dominated by `react-hooks/set-state-in-effect`. Do not treat lint output as a regression signal and do not try to fix all of it as part of an unrelated change. Judge your diff by whether it *adds* errors. `npm run build` is the green gate.

Playwright specs assume an `admin` / `admin` account on a running backend. `seed_demo_data` creates `admin` / `password123` instead, so the E2E suite only passes against a database where that password was changed.

## Environment and settings

- Settings fail closed. `backend/config/settings.py` raises `ImproperlyConfigured` unless `DJANGO_ENV` is `development` or `production`, and requires `SECRET_KEY` when production. `DEBUG` defaults to `False`, so an unset environment resolves to production and refuses to boot. Copy `backend/.env.example` to `backend/.env`; `load_dotenv` reads only `backend/.env`.
- `core/tests/test_settings.py` asserts this by shelling out to `manage.py check` with `PYTHON_DOTENV_DISABLED=true`. Changes to settings env handling must keep those subprocess tests passing.
- Frontend API base is `import.meta.env.VITE_API_URL` with a hardcoded fallback of `http://localhost:8000/api/`. There is no Vite dev proxy, so backend and frontend run as separate origins and CORS must allow `http://localhost:5173`.
- `GEMINI_API_KEY` is required for PDS PDF extraction (`backend/core/utils/__init__.py`); missing key returns `None, "API key missing"`. `EMAIL_HOST_USER`/`EMAIL_HOST_PASSWORD` fall back to Django's console email backend when unset.
- Media files are served only when `DEBUG` is true (`backend/config/urls.py`).

## Backend architecture

- Single Django app `core`, split by feature into `models/`, `serializers/`, `views/`, `services/`, `utils/`. Each subpackage `__init__.py` re-exports its public names; import from `core.models`, not the leaf modules.
- Custom user is `core.User` (`AUTH_USER_MODEL = 'core.User'`), subclassing `AbstractUser` with a `role` field. Six roles in `core/models/employee.py`: `HR`, `ACCOUNTANT`, `SUPERINTENDENT`, `TEACHING`, `NON_TEACHING`, `ADMINISTRATIVE`.
- `MANAGEMENT_ROLES` is defined once in `backend/core/models/employee.py` and mirrors `IsManagement` in `backend/core/permissions.py` and `MANAGEMENT_ROLES` in `frontend/src/App.jsx`. **Changing role membership means editing all three.**
- Permission classes are role-list subclasses of `BaseRolePermission` in `backend/core/permissions.py`, attached per-view or per-`@action` via `permission_classes`. Scope filtering belongs in `get_queryset`, not in the UI.
- Auth is SimpleJWT only (`/api/token/`, `/api/token/refresh/`). `MyTokenObtainPairView` adds role claims to the token.
- DRF `PageNumberPagination` with `PAGE_SIZE = 10` is global, so every list endpoint returns `{count, results}`. Frontend hooks defensively unwrap with `Array.isArray(res.data) ? res.data : res.data.results || []`. Add a new `?page=` passthrough when the UI needs it.
- Non-CRUD endpoints use `@action` on an existing ViewSet (`register-existing`, `pending-registrations`, `approve-registration`, `me`, `change-password`, `verify`). Register routes in `backend/core/urls.py`; the analytics endpoint is one consolidated `analytics/<str:metric>/` dispatch, not per-chart routes.
- Balance-deduction and payroll writes wrap mutations in `transaction.atomic()` (see `views/leave.py`, `views/loan.py`, `views/payroll.py`). Keep that wrapping; rollback tests assert it.
- Writes to state-changing endpoints log an `AuditLog`. Note `AuditLog.save()` silently drops the row unless the actor's role is in its hardcoded allowlist — do not add new roles without updating it.
- Payroll math is `PayrollCalculator` in `backend/core/services/payroll.py`, using DepEd semi-monthly constants (GSIS 9%, PhilHealth, Pag-IBIG, TRAIN). All money is `Decimal`, never float.
- 14 migrations exist in `backend/core/migrations/`. Model changes require `makemigrations`.
- Gemini-based PDS extraction lives in `backend/core/utils/__init__.py` alongside unrelated math helpers; `core/utils/pdf/` holds ReportLab generators exposed through `core/utils/pdf_generator.py`.

## Frontend architecture

- Routes are declarative in `frontend/src/App.jsx`, nested under a `ProtectedRoute` + `MainLayout` shell, with role tiers as layout routes. `ProtectedRoute` accepts either children or acts as an `<Outlet />` parent.
- Data lives in feature hooks under `frontend/src/features/<feature>/hooks/` using TanStack Query with keys from `frontend/src/api/queryKeys.js`. Add query keys there rather than inline strings.
- `frontend/src/api/axios.js` attaches the Bearer token and handles 401 refresh via `token/refresh/`, clearing storage and hard-redirecting to `/login` on failure.
- Styling is Tailwind v4 + daisyUI 5. `frontend/src/index.css` is the single config site: `@plugin "daisyui"` with `themes: light --default`, then `@theme` tokens. There is no `tailwind.config.js`; add new tokens in `@theme`, not in JS.
- DepEd palette is fixed in `index.css` and `DESIGN.md`: primary `#0038a8`, accent `#fcd116`, error `#b91c1c`, slate neutrals. WCAG AA contrast and keyboard access are explicit requirements, and "no fake statistics or decorative placeholder cards" is a stated integrity rule.
- `vite-plugin-pwa` generates a service worker on build (`registerType: 'autoUpdate'`). Build output lands in `frontend/dist`.
- E2E specs live in `frontend/tests/`, not `src/`.

## Session communication mode

- Every session starts and stays in **caveman lite** to save tokens. Load the `caveman` skill and set level `lite` at session start, before any other work.
- Lite rules: no filler, no hedging, no pleasantries, no tool-call narration, no progress notes between tool calls. Keep articles, full sentences, correct grammar, exact technical terms, code blocks, commands, and error strings verbatim.
- Fire tool calls direct. Emit text before a call only to clarify, warn about security or irreversible work, or resolve ambiguity.
- Levels change only when the user asks (`/caveman full|ultra|off`). Never end the session with a recap or summary the user did not request.

## Reply style

- Write plain and short. Say it in the fewest words that still carry the meaning.
- Skip jargon, acronyms, and specialist terms unless the user already uses them. Say "the file that lists employee records" before "the model layer", and "the test suite" before "regression coverage".
- Lead with the answer. One short paragraph, not a bulleted essay, unless the user asks for a list.
- Keep code, file paths, commands, and error messages exactly as they are. Those are never simplified.
- If a reply runs past a screen, cut the parts the user did not ask for.

## Implementing a feature

- When the request is a new feature or behavior change, load the `grill-me` skill and interview the user **before** writing code. Pin down scope, the DepEd/CSC form or policy the behavior must match, role permissions, and the acceptance condition. Do not start implementing from an ambiguous ask.
- Skip the interview only for mechanical work: bug fixes with a known cause, refactors, renames, or changes the user already specified precisely.

## Working conventions

- **Scoped Testing**: When fixing bugs or adding new features, execute only the targeted test suite or test cases within the scope of the changes/fixes (e.g. `venv\Scripts\python.exe -m pytest core/tests/test_<feature>.py` or `-k <test_name>`). Do not run the full 5.5-minute suite unless explicitly requested.
- **Installed Skills Usage**: Proactively load and use relevant installed skills for every task:
  - Bug fixes and narrow patches: load `surgical-patch` or `diagnosing-bugs`.
  - Feature implementation & product slices: load `lean-build` and `tdd`.
  - UI/UX polish and frontend refinements: load `ui-taste`, `emil-design-eng`, and `antislop` suite.
  - Verification & QA: load `verify-and-stop` or `agent-browser`.
- Work in the layer that owns the change: backend for API and model logic, frontend for UI and data display.
- Keep serializer output and frontend consumption aligned when changing either side; both halves usually need edits in one change.
- New backend tests go in `backend/core/tests/` as `test_<feature>.py`. Reuse fixtures from `backend/core/tests/conftest.py` (`hr_user`, `teacher_employee`, `supervisor_user`, `mock_school`, `salary_grade_11`) instead of constructing records inline.
- Preserve existing folder and naming organization before adding new abstractions. There is no CI; local `npm run build` plus targeted pytest is the verification path.
- Do not commit secrets. `backend/.env` and `backend/db.sqlite3` are gitignored; `.env.example` is tracked.
- The working tree is currently dirty: form PDFs and `revision.txt` moved from the repo root into `docs/`, images into `assets/`, `test_api.py` into `scripts/`, and tracked `anti-slop/` audits are deleted. Confirm intended state before staging.

