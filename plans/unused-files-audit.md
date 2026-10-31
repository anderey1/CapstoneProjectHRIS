# Unused file audit

Reviewed 2026-10-31. Groups A and C were subsequently approved and deleted. Groups B, D, and E were retained. Frontend ignore rules now exclude generated Playwright reports and test results.

Scope: tracked project files and visible project files outside dependency, environment, cache, and build output directories. Checked frontend imports from `src/main.jsx`, route rendering, CSS and public asset references, Vite and Playwright configuration, backend import paths, Django discovery, fixtures, and root document references. This is a static audit, not proof of external or manual usage. No application tests were run. ESLint confirmed the two unused page imports in `frontend/src/App.jsx`.

## A. Strong deletion candidates (15 files)

These have no application callers, contain only placeholder content, or are redundant copies. Removing files that represent unfinished features also removes that implementation for future reuse.

| File | Evidence |
| --- | --- |
| `frontend/src/pages/Loans.jsx` | No importers or route. Active loan routes use `MyLoans` and `LoanManagement` in `App.jsx:13–14,72–76`. Shared loan components remain active. |
| `frontend/src/pages/admin/PerformanceReview.jsx` | No importers or route. Active performance routes use `MyIPCRF` and `IPCRFManagement`. |
| `frontend/src/components/features/performance/PerformanceFormModal.jsx` | Its only importer is the unused `PerformanceReview.jsx:6`. Remove with that page. |
| `frontend/src/components/features/attendance/DailyQRDisplay.jsx` | No importers or rendering references. |
| `frontend/src/utils/faceAuth.js` | No importers. Searches for its exported functions find only definitions and internal calls in this file. |
| `frontend/src/utils/haversine.js` | No importers. `calculateDistance` has no callers. |
| `backend/core/constants.py` | Two placeholder comments only; no backend imports. Do not confuse with the active frontend constants module. |
| `backend/core/serializers/pds.py` | Both serializer classes have no callers and are not re-exported. Active `views/pds.py` uses the model and extraction utility directly. Keep the PDS models and other PDS files. |
| `frontend/src/assets/hero.png` | No import, CSS, HTML, or configuration references. |
| `frontend/src/assets/react.svg` | No references. Template asset. |
| `frontend/src/assets/vite.svg` | No references. Template asset. |
| `frontend/public/icons.svg` | No filename or symbol usage references. Unused template icon sprite. Public URLs can still be accessed directly outside the application. |
| `Deped2.png` | Root copy has no runtime references and is byte identical to the active `frontend/public/Deped2.png`. Keep the public copy. |
| `Deped logo.png` | Root copy has no runtime references and is byte identical to the active `frontend/public/Deped logo.png`. Keep the public copy. |
| `d.txt` | One line containing a saved conversation launch command; no references. Optional personal note rather than application input. |

## B. Disabled feature implementations (6 files)

High confidence that these pages are not rendered. They remain statically imported, so their removal also requires removing the two unused imports at `frontend/src/App.jsx:23,28`. The `/location-tracking` and `/schools` routes currently redirect to `/` in that file.

| File | Evidence |
| --- | --- |
| `frontend/src/pages/admin/LocationTracking.jsx` | Imported but never rendered; ESLint confirms unused binding. |
| `frontend/src/components/features/attendance/AttendanceMap.jsx` | Only importer is `LocationTracking.jsx:6`. |
| `frontend/src/pages/admin/SchoolManagement.jsx` | Imported but never rendered; ESLint confirms unused binding. |
| `frontend/src/components/features/school/SchoolMap.jsx` | Only importer is the disabled school page. Contains module initialization for Leaflet icons. |
| `frontend/src/components/features/school/SchoolList.jsx` | Only importer is the disabled school page. |
| `frontend/src/components/features/school/SchoolFormModal.jsx` | Only importer is the disabled school page. |

Choose these only if you no longer want the saved school management and location tracking interfaces. Keep shared models, APIs, Leaflet dependencies, and profile map functionality, which remain active elsewhere.

## C. Generated Playwright output (10 tracked files)

These are previous test results, not the tests or configuration. `frontend/playwright.config.js:10` enables the HTML reporter. A future test run can generate fresh results; deleting these loses the existing run history.

- `frontend/playwright-report/index.html`
- `frontend/playwright-report/data/139da1da1388a9c2109a7b72e055d1ac5f83e570.md`
- `frontend/playwright-report/data/736a372ffcc5d28b841e03196fdb65c408abbac1.md`
- `frontend/playwright-report/data/c0b15cf1ea8cbf03c41398c09b75840f9e30c10e.md`
- `frontend/playwright-report/data/fc6831921a0a0a8d969c45f9da8ab6b630794707.md`
- `frontend/test-results/.last-run.json`
- `frontend/test-results/hris-HRIS-System-Connectiv-65203-ess-Loan-Application-Review-chromium/error-context.md`
- `frontend/test-results/hris-HRIS-System-Connectiv-b9c66-Staff-Management-Visibility-chromium/error-context.md`
- `frontend/test-results/hris-HRIS-System-Connectiv-d565f-ess-Payroll-Management-Flow-chromium/error-context.md`
- `frontend/test-results/hris-HRIS-System-Connectivity-Process-Attendance-Monitoring-chromium/error-context.md`

If selected, remove these output directories and add `/playwright-report/` and `/test-results/` to the frontend ignore file so results do not keep returning to Git. Keep `frontend/tests/hris.spec.js` and `frontend/playwright.config.js`.

## D. Obsolete fixture (1 file)

`backend/core/fixtures/ipcrf_data.json` refers to `core.ipcrfkra` and `core.ipcrfobjective`, which do not exist in current model definitions or migrations. No loader references it. It is not loadable against the current model registry as written. Keep only if useful as historical material or a planned restoration source.

## E. Root reference documents (4 files, manual decision)

No application code references these files. The backend PDF generator constructs documents with ReportLab rather than opening these root PDFs. Their value as reference forms cannot be determined from imports.

- `ANNEX-E-IPCRF-3.xlsx`
- `ANNEX-H-1-CS-Form-No.-212-Revised-2025-Personal-Data-Sheet.pdf`
- `CS-Form-No.-6-Revised-2020-Application-for-Leave-Secured.pdf`
- `form_48_DTR.pdf`

## Files deliberately retained

- Django migrations, package `__init__.py` files, `admin.py`, `apps.py`, `manage.py`, ASGI/WSGI modules, settings, and URL configuration are discovered or invoked entrypoints.
- `test_api.py` is a runnable API smoke test with a `__main__` entrypoint and a pytest matching function. Tests do not need importers.
- `backend/core/fixtures/demo_data.json` and `salary_grades.json` can be loaded manually through Django. Lack of imports does not establish that they are unused.
- `frontend/public/favicon.svg` is referenced by HTML and the PWA manifest. Public logo copies are actively displayed.
- Both employee and recruitment `PDSUploadForm.jsx` files have live callers; similar names alone do not make either unused.
- The database and `backend/media/` may contain active application records and uploads. Their contents and record relationships were not inspected, so no orphan media determination was made.
- Dependency installations, the Python environment, build output, and Python caches were excluded from source deletion candidates. `backend/.pytest_cache` could not be read due to permissions.
- README, lockfile, configuration, and tracked tests are project tooling or documentation, not dead application modules.

## Selection

The user approved A and C only. All 15 files in A and both generated report directories in C (10 tracked files) have been removed. No dependencies, disabled feature implementations, fixtures, reference forms, tests, database records, or uploads were removed.

## Second verification

Rechecked after the user asked about system impact. All removals were simulated in disposable copies; application source, database, and uploaded documents were left intact.

| Check | Result |
| --- | --- |
| Original backend `manage.py check` | Passed, no issues. |
| Temporary backend baseline `manage.py check` | Passed, no issues. |
| Temporary backend with group A backend files and group D fixture omitted | Passed, no issues. |
| Temporary frontend baseline production build | Passed. |
| Temporary frontend with group A frontend files omitted | Passed. JavaScript output is byte identical after normalizing the changed CSS filename embedded in it. |
| Temporary frontend with A and B omitted, with the two obsolete imports removed | Passed. |

Tailwind scans even unused source files for class names. Removing A therefore trims generated CSS. Comparing parsed CSS showed only removed rules, with no changes to rules that remained; the removed selectors correspond to unused loading, badge, border, hover, and responsive text styles. No active source references to those removed class names were found. The B build also removes disabled module initialization and additional styles, so its JavaScript is expected to change.

All three frontend builds emitted the same existing unresolved Leaflet image warnings and large bundle warning. These were present in the baseline and are not introduced by these removals.

Conclusion: A and C are low risk for current application behavior. B requires the import cleanup and discards disabled interfaces. D removes an obsolete manual data source. E removes reference material rather than runtime input. These checks establish build and startup compatibility, not exhaustive browser, role, workflow, or external consumer coverage. No full application workflow tests or database writes were performed.

## Completed cleanup verification

After applying the approved A and C cleanup:

- `npm.cmd run build` passed in `frontend/`, with the same pre-existing Leaflet image and large bundle warnings.
- `venv/Scripts/python.exe manage.py check` passed in `backend/`, reporting no issues.
- `git diff --check` passed.
- The actual Git deletion list exactly matches the 25 approved tracked files from A and C.
- Ignore rules match both generated Playwright output directories.
- Retained B and D candidates, root reference documents, active public logos, test source/configuration, and the database still exist.

No full browser workflow tests were run. Changes are uncommitted.
