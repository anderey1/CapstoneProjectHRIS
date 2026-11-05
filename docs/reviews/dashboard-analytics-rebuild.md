# Business operations dashboard rebuild

Rebuilt all role dashboards around database-backed analytics with a factual explanation, measure definition, reporting period, and next-action link under each chart. Kept the existing navigation and DepEd visual identity. Approved scope: all roles, business operations, optional AI explanations.

## Role views

- HR, Superintendent and Administrative: workforce, station deployment, attendance review, leave processing, loan processing, payroll processing, released payroll by month, performance record coverage, recruitment pipeline.
- Accountant: loan processing, payroll processing, released payroll by month.
- Teaching and Non-Teaching: their own attendance review, leave applications, loans, payroll processing/released payroll, and performance records. Scope filtering happens on the backend. No-profile accounts get empty personal data.

## Reporting and integrity

Personnel charts are current snapshots. Processing charts use all recorded history and count current record statuses. Released payroll shows the latest twelve recorded release months, in chronological order; missing historical release dates fall back to generation dates, disclosed in the chart. Payroll totals use Decimal. Daily attendance rows are not labeled employees/monthly forms; employee payroll rows are not labeled batches. All workforce roles are counted. Tied groups are described as tied. No staffing adequacy, creditworthiness, promotion or compliance conclusion is inferred.

No date filter or year-over-year comparison was invented for data that does not provide it. Each chart identifies its period. Charts retain readable numeric labels; monthly figures are also accessible as text. Empty, loading, retry, failed-AI and data-fallback states are supported.

## AI explanations

Requested explicitly per chart using the existing Gemini integration. A server-generated aggregate context is used rather than client-supplied records. No names, documents, medical details, employee IDs or personal payroll amounts are sent. Personal payroll explanations remain local. AI output is labeled and cannot approve or change records. Successful responses are cached for fifteen minutes per account and data snapshot. Missing credentials, provider failures and empty responses produce an honest data-based fallback. The existing legacy summary endpoint remains unchanged; the new dashboard does not use its optimistic failure message.

## Implementation

The existing four routed dashboard entry files delegate to `frontend/src/features/dashboard/OperationsDashboard.jsx`. Aggregate computation is in `backend/core/services/dashboard_analytics.py`. New authenticated endpoints are `dashboard/operations/` and `dashboard/operations/insight/<metric>/`. Existing endpoints, models, calculations and role memberships remain unchanged. No migrations or database writes were introduced.

## Validation

- `venv\Scripts\python.exe -m pytest core/tests/test_dashboard_operations.py -q`: 10 passed. Covers authentication, personal isolation, finance metric restrictions, missing profiles, complete workforce roles, released payroll amounts, tied categories, missing AI credentials, provider failure and aggregate-only prompts.
- `npm.cmd run build`: passed. Existing large-bundle and Leaflet image-path warnings remain.
- Playwright Chromium: all six seeded role dashboards rendered at 1440x1000 and 390x844, with no JavaScript page errors or document-level horizontal overflow. Captures and results are in `outputs/dashboard-rebuild/`.
- Simulated AI response and unavailable-provider responses confirmed the UI labels AI output and preserves factual insights. A forced analytics HTTP error showed retry/recovery UI. Provider success was mocked in tests; no live Gemini generation was used for verification.

The pre-existing Django processes on port 8000 were serving the old URL configuration. Browser verification used a fresh isolated Django process on port 8001 with test-browser API routing; normal app configuration was not changed. Restart the normal Django development server to activate the new endpoints. The isolated verification server is not a deployment.

No full backend suite, complete WCAG audit, production deployment or commits were performed. Existing unrelated attendance work remains in the working tree. Some role screenshots precede the final primary-link-color/tied-insight correction; the AI-state screenshot records the final link color.
