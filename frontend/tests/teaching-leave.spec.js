import { test, expect } from '@playwright/test';
import { Buffer } from 'node:buffer';
import calendar from '../../backend/core/data/leave_calendar/2026.json' with { type: 'json' };

const signaturePng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB1kAAAAASUVORK5CYII=', 'base64');

async function setup(page, actor, status) {
  const roles = { teacher: 'TEACHING', principal: 'TEACHING', checker: 'NON_TEACHING', records: 'NON_TEACHING', hr: 'HR' };
  const ids = { teacher: 1, checker: 2, principal: 3, records: 4, hr: 5 };
  const past = new Date();
  past.setDate(past.getDate() - ((past.getDay() + 6) % 7) - 7);
  const startDate = past.toISOString().slice(0, 10);
  past.setDate(past.getDate() + 1);
  const leave = {
    id: 21, employee: 1, employee_name: 'Maria Teacher', department: 'Instructional',
    workflow: 'teaching', status, leave_type: 'sick', working_days_applied: '2.0',
    start_date: startDate, end_date: past.toISOString().slice(0, 10),
    date_applied: new Date().toISOString(), illness_details: 'Flu',
    can_approve: actor !== 'teacher', assigned_checker_name: 'Ana Assistant',
    assigned_principal_name: 'Juan Principal', vacation_balance: '15', sick_balance: '15',
    correction_reason: status === 'returned' ? 'Clarify the illness details.' : '',
    actions: [],
  };
  const requests = [];
  await page.addInitScript(({ id, role }) => {
    localStorage.setItem('access_token', `test.${btoa(JSON.stringify({ user_id: id, role, username: 'Test Staff', exp: 4102444800 }))}.test`);
  }, { id: ids[actor], role: roles[actor] });
  await page.route(/http:\/\/(localhost|127\.0\.0\.1):8000\/api\//, async route => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (pathname.endsWith('/leaves/calendar/')) {
      return route.fulfill({ json: { ...calendar, today: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()) } });
    }
    if (request.method() !== 'GET') {
      requests.push({ path: pathname, body: request.postDataBuffer()?.toString() || '' });
      if (pathname.endsWith('/approve/')) {
        const next = { pending_checking: 'pending_supervisor', pending_supervisor: 'pending_records', pending_records: 'pending_hr', pending_hr: 'approved' };
        leave.status = next[leave.status];
        leave.can_approve = false;
      } else if (request.method() === 'PATCH') {
        leave.status = 'pending_checking';
      }
      return route.fulfill({ json: { message: 'Application processed', status: leave.status } });
    }
    if (pathname.endsWith('/employees/me/')) {
      return route.fulfill({ json: {
        id: ids[actor], is_supervisor: actor === 'principal',
        leave_duty: ['checker', 'records'].includes(actor) ? actor : '',
        vacation_leave_balance: '15', sick_leave_balance: '15',
      } });
    }
    return route.fulfill({ json: { count: 1, next: null, results: [leave] } });
  });
  return { leave, requests };
}

async function openQueue(page) {
  await page.goto('/my-leaves');
  await page.getByRole('button', { name: 'Leave Processing Queue' }).click();
  await page.getByRole('button', { name: 'Review application', exact: true }).click();
}

for (const width of [390, 1280]) {
  test(`principal uploads and confirms a signature at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const { requests } = await setup(page, 'principal', 'pending_supervisor');
    await openQueue(page);
    const approve = page.getByRole('button', { name: 'Approve & sign', exact: true });
    await approve.click();
    await expect(page.getByRole('alert')).toHaveText('Upload your signature and confirm approval.');
    expect(requests).toHaveLength(0);
    await page.getByLabel('Principal signature image', { exact: false }).setInputFiles({ name: 'principal.png', mimeType: 'image/png', buffer: signaturePng });
    await expect(page.getByAltText('Your signature preview')).toBeVisible();
    await page.getByRole('checkbox', { name: 'This is my signature.' }).check();
    await approve.click();
    await expect(page.getByRole('button', { name: 'Approve & sign', exact: true })).toHaveCount(0);
    expect(requests).toHaveLength(1);
    expect(requests[0].path).toBe('/api/leaves/21/approve/');
    expect(requests[0].body).toContain('name="signature"; filename="principal.png"');
    expect(requests[0].body).toContain('name="signature_confirmed"');
    expect(requests[0].body).toContain('pending_supervisor');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('Assistant II can check and forward without signing or disapproving', async ({ page }) => {
  const { requests } = await setup(page, 'checker', 'pending_checking');
  await openQueue(page);
  await expect(page.getByRole('button', { name: 'Disapprove', exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Principal signature image', { exact: false })).toHaveCount(0);
  await page.getByRole('button', { name: 'Check & forward to Principal', exact: true }).click();
  await expect.poll(() => requests.length).toBe(1);
  expect(requests[0].body).toContain('pending_checking');
});

test('Records Unit receives with a reference and forwards to HR', async ({ page }) => {
  const { requests } = await setup(page, 'records', 'pending_records');
  await openQueue(page);
  await page.getByLabel('Records reference (optional)').fill('REC-2026-001');
  await page.getByRole('button', { name: 'Receive & forward to HR', exact: true }).click();
  await expect.poll(() => requests.length).toBe(1);
  expect(requests[0].body).toContain('REC-2026-001');
});

test('teacher tracks a returned application and resubmits corrections', async ({ page }) => {
  const { requests } = await setup(page, 'teacher', 'returned');
  await page.goto('/my-leaves');
  await page.getByRole('button', { name: 'Track application #21' }).click();
  await expect(page.getByRole('region', { name: 'Application progress', exact: true })).toContainText('Clarify the illness details.');
  await page.getByRole('button', { name: 'Correct & resubmit', exact: true }).click();
  await expect(page.locator('[name="illness_details"]')).toHaveValue('Flu');
  await page.locator('[name="illness_details"]').fill('Flu with fever');
  await page.getByRole('button', { name: 'Resubmit application', exact: true }).click();
  await expect.poll(() => requests.length).toBe(1);
  expect(requests[0].path).toBe('/api/leaves/21/');
  expect(requests[0].body).toContain('Flu with fever');
});

test('HR completes teaching leave without forwarding to superintendent', async ({ page }) => {
  const { requests } = await setup(page, 'hr', 'pending_hr');
  await page.goto('/leave-management');
  await page.getByRole('button', { name: 'Review & Sign', exact: true }).click();
  await page.getByRole('button', { name: 'Complete HR processing', exact: true }).click();
  await expect.poll(() => requests.length).toBe(1);
  expect(requests[0].body).toContain('pending_hr');
});

for (const width of [320, 390, 768, 1280]) {
  test(`leave application remains usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 740 });
    await setup(page, 'teacher', 'pending_checking');
    await page.goto('/my-leaves');
    const trigger = page.getByRole('button', { name: 'File CSC Form No. 6' });
    await trigger.click();
    const modal = page.getByRole('dialog', { name: 'Apply for leave', exact: true });
    await expect(modal).toBeVisible();
    await expect(modal.locator('[name="leave_type"]')).toBeFocused();
    const submit = modal.getByRole('button', { name: 'Submit application', exact: true });
    await expect(submit).toBeInViewport();
    await modal.locator('form').evaluate(element => { element.scrollTop = element.scrollHeight; });
    await expect(submit).toBeInViewport();
    expect(await modal.locator('.modal-box').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await submit.focus();
    await page.keyboard.press('Tab');
    expect(await modal.evaluate(element => element.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
}

test('leave attachments match the selection and selected files can be removed', async ({ page }) => {
  await setup(page, 'teacher', 'pending_checking');
  await page.goto('/my-leaves');
  await page.getByRole('button', { name: 'File CSC Form No. 6' }).click();
  const modal = page.getByRole('dialog', { name: 'Apply for leave', exact: true });
  await modal.locator('[name="leave_type"]').selectOption('paternity');
  await expect(modal.getByText('2 required documents for this application.', { exact: false })).toBeVisible();
  const marriage = modal.locator('[name="paternity_marriage_contract"]');
  await expect(marriage).toHaveAttribute('required', '');
  await marriage.setInputFiles({ name: 'marriage.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7') });
  await expect(modal.getByText('marriage.pdf (1 KB)', { exact: true })).toBeVisible();
  await modal.getByRole('button', { name: 'Remove Marriage contract' }).click();
  await expect(marriage).toHaveValue('');
  await modal.locator('[name="leave_type"]').selectOption('rehabilitation');
  await expect(modal.locator('input[type="file"][required]')).toHaveCount(4);
  await modal.locator('[name="leave_type"]').selectOption('vacation');
  await modal.getByRole('radio', { name: 'Abroad', exact: true }).check();
  await expect(modal.locator('[name="travel_authority_document"]')).toHaveAttribute('required', '');
  await expect(modal.locator('[name="clearance_document"]')).toHaveAttribute('required', '');
});

test('maternity counts calendar days and invalid date order is explained', async ({ page }) => {
  await setup(page, 'teacher', 'pending_checking');
  await page.goto('/my-leaves');
  await page.getByRole('button', { name: 'File CSC Form No. 6' }).click();
  const modal = page.getByRole('dialog', { name: 'Apply for leave', exact: true });
  await modal.locator('[name="leave_type"]').selectOption('maternity');
  const start = new Date();
  start.setDate(start.getDate() + 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  await modal.locator('[name="start_date"]').fill(start.toISOString().slice(0, 10));
  await modal.locator('[name="end_date"]').fill(end.toISOString().slice(0, 10));
  await expect(modal.getByRole('status')).toContainText('7 calendar days requested');
  start.setDate(start.getDate() - 1);
  await modal.locator('[name="end_date"]').fill(start.toISOString().slice(0, 10));
  await expect(modal.getByRole('alert')).toHaveText('End date must be on or after the start date.');
  await expect(modal.getByRole('button', { name: 'Submit application', exact: true })).toBeDisabled();
});
