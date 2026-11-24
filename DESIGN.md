# Design direction

Scope: DepEd Lucena City Division HRIS dashboard and app shell.

## Palette

- Primary: `#0038a8` (DepEd blue). Used for actions, the current state, and figures that need weight.
- Secondary: `#0a225c` (DepEd navy). Used for hover and the next level of hierarchy.
- Accent: `#fcd116` (DepEd yellow). Used once per screen at the key moment, never as small text.
- Status: `#15803d` success, `#b45309` warning, `#b91c1c` error. Used only on a real status.
- Neutrals: slate 50 to 900 for surfaces, borders, and body text.

Chart series use blue, navy, sky, and slate. Yellow stays out of charts so it keeps its accent role.

## Typography

Inter is the body typeface. It is already the app token, stays legible at 11px and 12px in dense records, and does not add a personality the division has not chosen.

Numbers use `tabular-nums` on the sans stack. Monospace is reserved for identifiers such as Agency ID and Salary Grade. Wide tracking and uppercase labels are not used by default; they slow scanning and read as decoration.

## Dials

ENERGY 1 / RHYTHM 2 / MOTION 1.

This is a government operations dashboard. People scan real records and act on exceptions. The first chart spans two columns as the focal point. Motion appears only while data loads and when a control has focus.

## Component decisions

- KPI cards share one size because they are compared side by side. The value and label carry the difference.
- Chart colors come from one array in `dashboardConfig.js` so every chart reads as the same system.
- Empty, loading, and error states name the cause and give the next action.
- AI explanations label their source and state their limit. They never approve a record or establish compliance.
