# Modularization verification

Date: 2026-11-01. Original revision: `f0fc4670f1bfa3e84e1e26b0aa1fb138bb90ef24`.

## Result

The affected workflows retain their tested behavior after code extraction. Roles, workflow rules, API URLs, serializers, calculations, models, and database schema were preserved. No migrations, dependency changes, commits, or production data changes were made.

| Evidence | Original code | Reorganized code |
| --- | --- | --- |
| Existing affected backend tests | 99 passed across baseline runs | 99 passed in one run |
| Real HTTP loan and payroll journey | 1 passed using original viewsets from Git | 1 passed |
| New onboarding tests | Original operation checked by source comparison | 3 passed |
| Existing browser checks plus new workflow checks | 25 passed (18 existing + 7 new) | 25 passed |
| Router configuration | 120 entries captured | All 120 match |
| Extracted Python definitions | 68 definitions | Equivalent syntax, signatures, decorators, and resolved import targets |
| Recruitment status operation | Original function | Equivalent after expanding the extracted service calls |
| Frontend production build | Passed | Passed |
| ESLint on affected frontend hooks and new test files | Not used as baseline | 0 errors, 0 warnings |
| Django startup check | Original app exercised by tests | No issues |
| Migration check | Models untouched | No changes detected |

The 99 existing tests plus three onboarding tests and one HTTP test give **103 passing backend tests** for this scope. They were run in scoped groups, rather than the entire repository suite.

The first baseline attempt passed 77 tests and could not set up 22 tests because pytest could not access an existing Windows temporary directory. Retrying with an explicit, fresh folder under `backend/test-results/` resolved that environment issue. The remaining 28 tests passed, including six overlapping tests.

## What changed

See [code organization](../code-organization.md) for ownership by file.

* Employee, leave, loan, and payroll endpoint files became feature packages with small ViewSet composition files and focused HTTP action modules.
* Recruitment delegates account and personnel creation to an onboarding service. PDS detail copying and document transfer have a separate owner. Existing transaction boundaries and notification timing were retained.
* The shared utility file became focused attendance, geofencing, date, PDS, and summary modules. Its existing public imports remain available.
* Loan and payroll hooks retain their public return values while delegating queries, mutations, and payroll downloads to focused hooks.

Already focused backend modules and existing page markup were retained. This is an organizational extraction, not a claim that every large function has been redesigned.

## Real HTTP evidence

`test_workflow_http.py` starts Django's real HTTP test server and uses a disposable test database. It obtains JWTs through the login endpoint and sends requests over a network socket. The same test passed against original viewsets loaded from the baseline revision and against the current code.

| Request or assertion | Original | Current |
| --- | --- | --- |
| Unauthenticated loan list | 401 | 401 |
| Four account logins | 200 each | 200 each |
| Employee creates pending loan | 201 | 201 |
| Checklist reports missing documents | 200 | 200 |
| Employee attempts loan verification | 403 | 403 |
| HR verifies loan | 200, verified | 200, verified |
| Superintendent approves loan | 200, approved | 200, approved |
| Accountant releases funds | 200, released | 200, released |
| Accountant posts manual repayment | 201, one repayment | 201, one repayment |
| Accountant generates payroll | 201, draft | 201, draft |
| Accountant attempts payroll approval | 403 | 403 |
| Superintendent approves payroll | 200, approved | 200, approved |
| Accountant releases payroll | 200, released; second repayment posted | Same |
| Repeated payroll release | 400; repayment count remains two | Same |
| Employee downloads released payslip | 200, PDF bytes | 200, PDF bytes |
| Accountant downloads General Payroll Sheet | 200, PDF bytes | 200, PDF bytes |
| Accountant downloads Disbursement Voucher | 200, PDF bytes | 200, PDF bytes |

This check caught an internal relative import in the moved payslip method. It was corrected to resolve to `core.utils.pdf_generator`. The source comparison now resolves relative imports before comparison, so it detects this class of extraction mistake.

## Other behavior checked

Existing backend tests cover attendance time slots and school boundaries, leave filing and both routing paths, signatures and correction submissions, leave credit rollback, employee registration, document verification and transfer, recruitment scoring, PDS provider failure handling, role restrictions, payroll calculations, loan allocation, duplicate payment protection, and bulk release rollback.

The three new onboarding tests check copied PDS records and verified documents, usable generated credentials, duplicate email handling without another account, and rollback when document transfer fails.

The 25 browser tests execute Chromium against the real React app with mocked API responses. They cover responsive navigation, teaching leave processing and attachments, four loan hook mutations and query refreshes, and three payroll screen actions and query refreshes. They are frontend interaction checks, not a combined browser and live backend test.

Payroll screenshots produced by the browser checks:

* [Draft](../../frontend/test-results/workflow-modularization-pa-82e76-cutoff-and-refresh-behavior-chromium/payroll-draft.png)
* [Approved](../../frontend/test-results/workflow-modularization-pa-1f477-cutoff-and-refresh-behavior-chromium/payroll-approved.png)
* [Released](../../frontend/test-results/workflow-modularization-pa-2a971-cutoff-and-refresh-behavior-chromium/payroll-released.png)

These show test data and the existing release labels. They do not demonstrate a bank transfer.

## Reproduce

From the repository root:

```powershell
backend\venv\Scripts\python.exe scripts/verify_modularization.py --source-ref f0fc4670
backend\venv\Scripts\python.exe backend/manage.py check
backend\venv\Scripts\python.exe backend/manage.py makemigrations --check --dry-run
```

From `backend/`, create the test artifact parent once, then run the affected suites:

```powershell
New-Item -ItemType Directory -Force -Path test-results | Out-Null
venv\Scripts\python.exe -m pytest core/tests/test_attendance.py core/tests/test_leave.py core/tests/test_teaching_leave_workflow.py core/tests/test_loan.py core/tests/test_payroll.py core/tests/test_register_existing.py core/tests/test_employee_document.py core/tests/test_recruitment.py core/tests/test_pds.py core/tests/test_audit_rbac.py core/tests/test_onboarding.py core/tests/test_workflow_http.py -q --basetemp=test-results/modularization-check -p no:cacheprovider
```

Replay the HTTP journey against the original viewsets in the test process:

```powershell
venv\Scripts\python.exe -m pytest -p core.tests.baseline_routes --baseline-ref=f0fc4670 core/tests/test_workflow_http.py -q -s --basetemp=test-results/modularization-original-check -p no:cacheprovider
```

From `frontend/`:

```powershell
npm.cmd run build
npx.cmd eslint src/features/loans/hooks src/features/payroll/hooks tests/workflow-modularization.spec.js tests/fixtures/workflow-hooks.jsx
npx.cmd playwright test tests/sidebar-layout.spec.js tests/teaching-leave.spec.js tests/workflow-modularization.spec.js --reporter=line --workers=2
```

JUnit evidence from this session is retained locally under the ignored `backend/test-results/modularization-evidence/` directory. Browser screenshots are also ignored test artifacts and will be recreated by the browser tests.

## Limits and existing behavior

* External Gemini, email delivery, and banking services were not exercised.
* The legacy `frontend/tests/hris.spec.js` suite assumes local database credentials and old screen labels. It was not used for this verification.
* Full repository lint remains outside this scope. Existing build warnings about browser data, map image paths, and bundle size remain.
* The existing loan management screen passes permission arrays to a helper that expects a permission name, hiding action buttons. This was observed before the refactor and preserved. Loan mutation behavior was verified through a dedicated public hook caller, and loan endpoints were verified through real HTTP.
* Source and route comparisons complement the runtime tests; they do not prove every possible input or concurrency schedule. Existing rollback and retry tests cover the affected financial safeguards.

## Unused file cleanup

A subsequent reference audit removed six confirmed unused frontend files:

| Deleted file | Evidence |
| --- | --- |
| `frontend/src/components/common/Can.jsx` | No imports, route references, or test consumers |
| `frontend/src/components/features/attendance/AttendanceStats.jsx` | No importers; active attendance screens render their own statistics |
| `frontend/src/features/auth/ProtectedRoute.jsx` | Unused forwarding file; `App.jsx` imports the real component from `components/ProtectedRoute.jsx` |
| `frontend/src/features/loans/components/LoanCard.jsx` | Only exported from the feature index; neither loan screen consumes it |
| `frontend/src/features/loans/components/LoanStats.jsx` | Only exported from the feature index; neither loan screen consumes it |
| `frontend/src/features/loans/components/LoanDetailsModal.jsx` | Only consumed by the unused LoanCard and exported from the feature index; active screens have their own details views |

The three obsolete loan exports were removed with their files. Static imports, reexports, routes, test imports, and dynamic loading patterns were checked. Backend compatibility modules, package initializers, migrations, fixtures, verification scripts, tests, documents, and source assets were retained.

Verification after cleanup: production build passed, ESLint on the edited index passed, and all 25 scoped browser checks passed. The compiled JavaScript is identical to the precleanup build after substituting its CSS asset filename. CSS decreased from 164.85 kB to 160.62 kB. Comparing individual CSS selectors found no changed declarations for retained selectors; the 27 removed selectors had no exact class token references in active source files. The temporary comparison build was removed after inspection.
