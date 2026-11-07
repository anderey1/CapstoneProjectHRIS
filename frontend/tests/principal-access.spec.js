import { test, expect } from '@playwright/test';

async function openPrincipalPage(page, path) {
  const principal = { id: 7, first_name: 'School', last_name: 'Principal', school: 1, is_supervisor: false, user_details: { id: 7, role: 'PRINCIPAL' } };
  const teacher = { id: 12, first_name: 'School', last_name: 'Teacher', school: 1, school_details: { id: 1, name: 'Assigned School' }, position: 'Teacher I', user_details: { id: 12, role: 'TEACHING' }, family: [], education: [], eligibilities: [], work_experience: [] };
  const leave = { id: 21, employee: 12, employee_name: 'School Teacher', workflow: 'teaching', status: 'pending_supervisor', can_approve: true, leave_type: 'sick', start_date: '2026-11-02', end_date: '2026-11-03', working_days_applied: '2.0', actions: [] };
  const requests = [];
  await page.addInitScript(() => {
    const payload = btoa(JSON.stringify({ user_id: 7, employee_id: 7, username: 'principal', role: 'PRINCIPAL', exp: 9999999999 }));
    localStorage.setItem('access_token', `test.${payload}.test`);
  });
  await page.route(url => url.pathname.startsWith('/api/'), async route => {
    const url = new URL(route.request().url());
    const endpoint = url.pathname;
    requests.push({ path: endpoint, method: route.request().method() });
    if (endpoint === '/api/employees/me/') return route.fulfill({ json: principal });
    if (endpoint === '/api/employees/12/') return route.fulfill({ json: teacher });
    if (endpoint === '/api/employees/') return route.fulfill({ json: { count: 1, results: [teacher], summary: { total: 1, teaching: 1, roles: ['TEACHING'], departments: [] } } });
    if (endpoint === '/api/leaves/21/approve/') {
      const body = route.request().postData();
      expect(body).toContain('name="signature"');
      expect(body).toContain('name="signature_confirmed"');
      leave.status = 'pending_hr';
      leave.can_approve = false;
      return route.fulfill({ json: { status: 'pending_hr', message: 'Approved and signed by principal; forwarded to HR' } });
    }
    if (endpoint === '/api/leaves/21/reject/') {
      const data = route.request().postDataJSON();
      expect(data.disapproval_reason).toBe('Please revise the dates.');
      leave.status = 'rejected';
      leave.can_approve = false;
      return route.fulfill({ json: { status: 'rejected', message: 'Leave request rejected' } });
    }
    if (endpoint === '/api/leaves/') {
      const team = url.searchParams.get('scope') === 'team';
      const pending = ['pending_supervisor', 'pending_hr', 'pending_superintendent'].includes(leave.status);
      const results = team && (url.searchParams.get('status') !== 'pending' || pending) ? [leave] : [];
      return route.fulfill({ json: { count: results.length, results, summary: { total: results.length, pending: pending ? results.length : 0, action_required: leave.can_approve ? results.length : 0, statuses: {} } } });
    }
    if (endpoint === '/api/notifications/summary/') return route.fulfill({ json: { unread_updates: 0, action_required: 0 } });
    return route.fulfill({ json: { count: 0, results: [], summary: {} } });
  });
  await page.goto(path);
  return { requests };
}

test('principal has a read-only school directory and no registration controls', async ({ page }) => {
  const { requests } = await openPrincipalPage(page, '/employees?tab=pending');
  await expect(page.getByRole('heading', { name: 'School teachers', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'School Teachers', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Add Existing Employee|Edit|Delete|Pending Account Activations/ })).toHaveCount(0);
  expect(requests.some(request => /pending-registrations|rejected-registrations/.test(request.path))).toBe(false);
  await page.getByRole('row').filter({ hasText: 'School Teacher' }).click();
  await expect(page).toHaveURL('/employees/12');
  await expect(page.getByRole('heading', { name: 'School Teacher', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Edit|Upload|Verify|Delete/ })).toHaveCount(0);
});

test('principal can open the processing queue and disapprove with a reason', async ({ page }) => {
  await openPrincipalPage(page, '/my-leaves?tab=approvals');
  await expect(page.getByRole('button', { name: 'Leave Processing Queue' })).toBeVisible();
  await page.getByRole('button', { name: 'Review application', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Approve & sign', exact: true })).toBeVisible();
  await expect(page.getByLabel('Principal signature image (PNG or JPEG, up to 2 MB)')).toBeVisible();
  await page.getByLabel('Reason (required for correction or disapproval)').fill('Please revise the dates.');
  await page.getByRole('button', { name: 'Disapprove', exact: true }).click();
  await expect(page.getByText('No team leave applications in this view.', { exact: true })).toBeVisible();
});

test('principal cannot open division loan management', async ({ page }) => {
  await openPrincipalPage(page, '/loan-management');
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('link', { name: 'Loan Processing Center', exact: true })).toHaveCount(0);
});

test('principal approval requires signature and forwards the application to HR', async ({ page }) => {
  await openPrincipalPage(page, '/my-leaves?tab=approvals');
  await page.getByRole('button', { name: 'Review application', exact: true }).click();
  await page.getByRole('button', { name: 'Approve & sign', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Upload your signature and confirm approval.');
  await page.getByLabel('Principal signature image (PNG or JPEG, up to 2 MB)').setInputFiles({
    name: 'signature.png', mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64'),
  });
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Approve & sign', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Review application', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'View Docket', exact: true }).click();
  await expect(page.getByText(/Awaiting the assigned processor/)).toBeVisible();
});
