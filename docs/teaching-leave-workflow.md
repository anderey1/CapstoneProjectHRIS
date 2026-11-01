# Teaching leave workflow

New teaching applications follow:

Teacher submits → School Administrative Assistant II checks → Assigned principal approves and uploads a signature → Records Unit receives and forwards → HR completes processing.

## Account setup

Use Personnel Directory → edit a staff record → Employment → Leave processing assignments.

1. Give the Administrative Assistant II an active account, the checking duty, and the correct school under Workplace. A teacher does not need an individual checker assignment. Applications enter the school's checking queue. The first authorized assistant who checks one is recorded as its checker.
2. Give the principal an active account and select them as each teacher's Principal / Immediate Supervisor.
3. Give Records Unit staff active accounts and the Records Unit receiving duty.
4. HR staff use the existing HR role.

These duties reuse the existing account roles. They do not require new role categories. Assignments and processing duties cannot be changed through an employee's self service profile.

## Processing

Teaching staff, assistants, principals, and records staff use My Leave Applications. Processing staff see a Leave Processing Queue tab. HR can also use Leave Approvals.

The principal uploads a PNG or JPEG signature image, up to 2 MB, and explicitly confirms approval. The signature, signer, signing time, and action history belong to that application.

Records staff can enter an optional receiving reference before forwarding to HR. Credits are deducted once, when HR completes processing. Earlier stages do not deduct credits.

Processors can return applications with a correction reason. Teachers use Track application → Correct & resubmit. The application keeps its number and history. Resubmission starts checking again and requires a fresh principal signature. Earlier signing actions retain their signature attachment in the history.

Each processor sees the stages they are allowed to act on. Assistants without a direct assignment see only applications queued for their school. Receiving staff see the division's Records queue. Applicants cannot process their own applications.

## Existing applications

Applications filed before this change retain their existing route. Non-teaching leave continues through HR and Superintendent. New teaching applications use the school route.

## Verification

From `backend/`: `venv\Scripts\python.exe -m pytest core/tests/test_leave.py core/tests/test_teaching_leave_workflow.py`.

From `frontend/`: `npx.cmd playwright test tests/teaching-leave.spec.js` and `npm.cmd run build`.
