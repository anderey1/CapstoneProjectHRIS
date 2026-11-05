# Frontend UI/UX source audit

Date: 2026-11-05. Basis: DESIGN.md and the current working tree.
Skills applied: caveman (lite), ui-taste (web audit), design-taste-frontend, and vercel-react-best-practices. The requested emil-design-eng, antislop, surgical-patch, and diagnosing-bugs skills were absent from the installed skill directory; existing audit guidance was used.

## Confirmed findings and corrections

| Priority | Surface | Evidence before correction | Correction |
| --- | --- | --- | --- |
| P1 | Login and account activation | Visible labels had no control association; password reveal buttons used `tabIndex={-1}`. | Added matching labels and control IDs; restored keyboard access and visible focus for reveal controls. |
| P1 | Applicant details | Labels were disconnected, 10px labels used 40% opacity, and 9px error messages were not associated with fields. | Used opaque slate labels, 12px error messages, matching IDs, `aria-invalid`, and error descriptions for every validated field. |
| P1 | Shared toast notifications | White text on amber-500 warning backgrounds lacked sufficient contrast; dismiss buttons had no accessible name. | Used DESIGN.md semantic colors and named dismiss buttons. Added alert/status semantics for messages. |
| P2 | Shared toast notifications | A 280px minimum width plus surrounding padding could exceed narrow available space; text containers could resist shrinking. | Bounded the stack to viewport width, removed minimum width, and allowed message wrapping. Rendered reflow remains unverified. |
| P2 | Application shell | Keyboard users had no skip link around repeated navigation. | Added a visible-on-focus skip link and focusable main target in both existing shell implementations. |
| P2 | Personnel directory | Search relied on a placeholder; two visible filter labels had no control association. | Named search and associated classification/station filters with their labels. |
| P2 | Account activation and applicant contact | Activation lacked autocomplete hints; mobile number used a text input. | Added appropriate account autocomplete hints and telephone input semantics. |

## Patterns preserved

The inspected navbar already closes its account menu on outside interaction, blur, and Escape, and restores focus on Escape. Pagination already exposes current page, loading announcements, retry, and 44px controls. Inspected personnel, recruitment, loan, and payslip lists already wrap tables in horizontal scroll containers. These patterns were retained. Their source does not establish rendered accessibility or responsive correctness.

## Coverage and limits

Source review covered routing, both shared shells, navbar, notification bell, pagination, toast provider, login, activation, applicant details, and portions of personnel, recruitment, leave, loan, and payslip pages. Fixes are limited to the confirmed defects above. Existing unrelated attendance and backend work was preserved.

This is a bounded source audit, not a complete visual or WCAG audit. No browser, viewport, role session, screen reader, touch device, network profile, or rendered dialog state was exercised. Performance, overlay clipping, actual responsive layout, full role workflows, and other feature forms remain unassessed. No build, lint, automated tests, or browser automation was run, following AGENTS.md for low-impact UI changes. Changes were inspected in the source diff; runtime behavior is unverified.


## Rendered follow-up: application form and administrative dashboard

Used installed Playwright Chromium against local Vite/Django servers. The agent-browser CLI and connected computer-use browsers were unavailable. Inspected application screenshots at 1440?900 and 390?844, plus the administrative dashboard at both sizes. This supersedes the source-only limitation above for these specific screens.

Confirmed and fixed:

- **P1, application mobile layout:** the right-aligned, nonshrinking format badge compressed document instructions into a very narrow column. Replaced that row with full-width instructions and format guidance beneath the input.
- **P1, upload interaction:** hidden file inputs with label-only triggers were absent from the keyboard path. Replaced them with visible native file inputs and named remove controls. Retained existing validation, accepted types, limits, and required documents.
- **P2, application typography:** document guidance and actions used 8?11px text. Raised guidance and file controls to 12?14px and simplified nested presentation. Removed the duplicate letter addressee block; its original instruction remains.
- **P2, application progress:** optional files counted toward ?Complete,? obscuring readiness for submission. Section progress now counts required documents and explicitly identifies optional sections.
- **P1, dashboard integrity:** an unconditional ?5 Stations Operational? badge contradicted the six populated station records. Both count displays now use actual station data; removed the fabricated fallback of five and the hardcoded station list.
- **P2, dashboard language:** ?Cockpit,? ?Decision Operations Center,? and ?Lvs/Lns/Pay? obscured ordinary tasks. Replaced these with plain dashboard wording and full item names. Changed ?awaiting review? to ?pending actions? because the total includes draft payrolls.

Checks completed: file selection produced a selected-file row and incremented required progress; removal removed the row; an invalid text file produced the existing rejection message. Neither inspected mobile page had document-level horizontal overflow. Dashboard rendered the data-derived six-station badge, removed the fake badge, and produced no JavaScript page errors in that run. No application was submitted and no personnel/payroll records were changed. No full build, lint, or test suite was run.

Captures: `outputs/ui-apply-before.png`, `outputs/ui-apply-mobile-before.png`, `outputs/ui-apply-mobile-after.png`, `outputs/ui-apply-desktop-after.png`, `outputs/ui-dashboard-loaded.png`, and `outputs/ui-dashboard-mobile-after.png`. The desktop application after-capture includes the exercised invalid-file state. Other feature screens and end-to-end role workflows still need rendered review; this pass does not certify the whole frontend.


## Approved minor visual cleanup

Simplified the administrative dashboard and public application form: sentence-case headings and actions, larger supporting text, fewer icon containers and badges, and flat document sections with dividers. Removed repeated dashboard branding and consolidated station information into a readable table instead of the chart plus duplicate tiles. Dashboard actions now say ?Review leaves,? ?Review loans,? and ?Open payroll.? Corrected the existing loan/payroll action destinations to the routes registered in App.jsx.

This cleanup received source-diff inspection only. No new screenshots, browser automation, build, lint, or automated tests were run, following AGENTS.md for minor layout/copy changes. Earlier screenshots document the preceding version and do not verify this cleanup.


## All-page follow-up

The later [pages-and-roles review](frontend-pages-and-roles.md) supersedes the limited coverage statements above. It records all route patterns, all six roles plus the administrator variant, preserved layouts, corrections, evidence and remaining untested states.
