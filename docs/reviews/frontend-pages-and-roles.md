# Frontend pages and roles: UI review

Reviewed 2026-11-05 against DESIGN.md. Existing page layouts were retained wherever practical. Changes focus on typography, visual hierarchy, mobile fit, labels, and dialog reachability.

## Coverage

Playwright Chromium against local Vite/Django, with real seeded accounts and unmodified role claims. Desktop: 1440 x 1000. Mobile viewport: 390 x 844 (browser emulation, not a physical phone).

Every route pattern in App.jsx was visited: the dashboard; attendance; DTR; profile; employee detail; personal loans, leaves, payslips and performance; personnel directory; loan, payroll, leave, attendance, DTR, performance and recruitment management; activity logs; login; account activation; public application. Employee detail was exercised using each account's own employee ID. `/attendance` intentionally reuses the DTR page.

| Account / role | Pages rendered at both sizes | Restricted routes redirected |
| --- | ---: | ---: |
| HR | 18 | 0 |
| ACCOUNTANT | 13 | 5 |
| SUPERINTENDENT | 18 | 0 |
| ADMINISTRATIVE | 18 | 0 |
| ADMIN_SUPERUSER | 18 | 0 |
| TEACHING | 9 | 9 |
| NON_TEACHING | 9 | 9 |
| PUBLIC | 3 | 0 |

Total: 129 account/route checks, including 106 rendered pages and 23 restricted-route redirects. Each rendered page was captured at desktop and mobile sizes. This verifies observed frontend routing, not backend authorization.

Additional states: 99 reached form, dialog, menu, filter and profile-tab states across the six roles. Two expected triggers were unavailable in the seeded data: Non-Teaching had no IPCRF record to open; Superintendent's leave queue exposed review actions rather than the tested ?View Docket? action. These are coverage limits, not failures. Checked all eight profile tabs where shown. Opened loan, leave, IPCRF, profile, applicant and rating forms; loan/leave/performance details; personnel filters; and the DTR export menu where available. No business form was submitted, approved, deleted or paid.

## Findings and fixes

| Priority | Finding | Correction |
| --- | --- | --- |
| P1 | Long IPCRF form/detail dialogs could extend above the mobile viewport, hiding their headings and close controls. | Constrained panels to viewport height, made their bodies scroll, and kept headers/footers visible. Confirmed the close buttons are within the 844px viewport and clickable. |
| P2 | Applicant-entry name/contact fields remained in three/two columns on narrow screens. | Stack these fields on mobile; preserve the existing columns from the small breakpoint upward. Bound the form to the viewport with internal scrolling. |
| P2 | Text in lists, summaries, form help and document names was frequently 8?11px, extra-bold or faded. | Raised these treatments to 12px and reduced extreme weight/tracking. Retained larger content typography, color states and existing layout structures. |
| P2 | Large forced-uppercase headings and lengthy page titles overwhelmed routine tasks. | Removed forced caps from primary headings and clarified loan, payslip, performance, personnel, activity-log and role-dashboard titles. |
| P2 | Repeated institutional lines and unconditional ?station active? / ?real-time audit active? badges added noise or implied unsupported live state. | Removed those repeated lines and the specific unsupported badges. Preserved official policy/form references and actual record statuses. |
| P2 | Loan fields, date/search filters, and some icon-only close controls lacked explicit accessible names. | Added label associations, filter names and close-button names without changing role rules or submissions. |
| P2 | Two-column mobile currency summaries left little room for amounts. | Stack employee-dashboard and personal-loan summary cards below 640px; retain their existing desktop grids. |

There are duplicate performance and applicant components under `components/features/` and `features/*/components/`. The pages still import some older copies. UI corrections were applied to both copies rather than changing imports or transferring behavior between implementations.

## Preserved

Personnel/list tables, payroll workflow columns, profile tabs and sidebar, review forms, dashboards' main card groups, navigation, DepEd colors, official form terminology, monetary calculations, backend behavior and role membership. Clean attendance-management layouts were reviewed and retained. This was not a global layout replacement.

## Evidence and verification

- `outputs/all-pages-ui/after/coverage.json`: route outcomes, page text, links, buttons, viewport widths and JavaScript errors.
- `outputs/all-pages-ui/after/`: full-page captures and role contact sheets for visual review.
- `outputs/all-pages-ui/states/coverage.json`: reached and unavailable interaction states.
- `outputs/all-pages-ui/states/ipcrf-details-fixed.png`, `ipcrf-form-fixed.png`, and `applicant-form-fixed.png`: final captures after fixing dialog bounds. These supersede the earlier dialog captures in the state sweep.
- `outputs/all-pages-ui/receipt.json`: source hashes and scoped verification counts.

No JavaScript page errors or document-level horizontal overflow were recorded in the 106 rendered page checks. Wide administrative tables retain their existing internal horizontal scrolling; this result does not claim every table column is visible simultaneously on mobile. Final focused dialog checks confirmed all three corrected close controls were on screen and usable, without document-level horizontal overflow.

The full route sweep and state sweep preceded the final dialog corrections; those dialogs were rechecked separately. Final minor filter-name and payroll-title edits received source inspection. No build, lint, backend tests or full automated suite was run for this UI pass. Browser inspection was used because the requested work explicitly includes auditing all rendered pages and roles.

## Limits

This is a broad visual/UI pass, not complete WCAG certification, a permissions audit, or an end-to-end business-workflow test. No real screen reader, physical touch device, zoom/device matrix, network/performance profile, print/PDF output, successful account activation, successful application submission, approval/rejection, payroll mutation, or arbitrary other-employee access was exercised. Existing populated and empty states were inspected; not every possible error/loading/data variant was forced. Remaining concerns in those categories need their own targeted work. Some old duplicate components and verbose official labels remain; they were not removed through a structural refactor.
