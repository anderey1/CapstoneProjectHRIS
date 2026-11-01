import { test, expect } from '@playwright/test';

// Exercise rendered screens and outgoing requests without altering the local database.
async function session(page, role, handleRequest) {
  await page.addInitScript(role => {
    const payload = btoa(JSON.stringify({
      user_id: 90, employee_id: 90, role, username: 'Workflow Test', exp: 4102444800,
    }));
    localStorage.setItem('access_token', `test.${payload}.test`);
  }, role);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route(/http:\/\/(localhost|127\.0\.0\.1):8000\/api\//, handleRequest);
  return errors;
}

for (const scenario of [
  { role: 'ACCOUNTANT', initial: 'pending', action: 'verify', next: 'verified', button: 'Verify' },
  { role: 'SUPERINTENDENT', initial: 'verified', action: 'approve', next: 'approved', button: 'Approve' },
  { role: 'ACCOUNTANT', initial: 'approved', action: 'release-funds', next: 'released', button: 'Release' },
  { role: 'ACCOUNTANT', initial: 'pending', action: 'reject', next: 'rejected', button: 'Reject' },
]) {
  test(`loan ${scenario.action} keeps its request and refresh behavior`, async ({ page }) => {
    const loan = {
      id: 21, employee_name: 'Maria Santos', department: 'Instructional',
      loan_amount: '10000.00', monthly_payment: '900.00', total_amount: '10800.00',
      interest_rate: '8.00', term_months: 12, purpose: 'general',
      date_applied: '2026-05-01', status: scenario.initial, payments: [],
    };
    const requests = [];
    const errors = await session(page, scenario.role, async route => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      if (request.method() === 'POST') {
        requests.push({ path, body: request.postDataJSON() });
        loan.status = scenario.next;
        return route.fulfill({ json: { message: 'Processed', status: loan.status } });
      }
      if (path.endsWith('/checklist/')) {
        return route.fulfill({ json: { all_required_submitted: true, checklist: [] } });
      }
      if (path.endsWith('/documents/')) return route.fulfill({ json: [] });
      return route.fulfill({ json: { count: 1, results: [loan] } });
    });
    await page.goto('/tests/fixtures/workflow-hooks.html');
    await expect(page.getByLabel('Loan status')).toHaveText(scenario.initial);
    await page.getByRole('button', { name: scenario.button, exact: true }).click();
    await expect(page.getByLabel('Loan status')).toHaveText(scenario.next);
    expect(requests).toHaveLength(1);
    expect(requests[0].path).toBe(`/api/loans/21/${scenario.action}/`);
    if (scenario.action === 'reject') expect(requests[0].body).toEqual({ remarks: 'Missing signature' });
    if (scenario.action === 'approve') expect(requests[0].body).toEqual({ remarks: 'Documents checked' });
    expect(errors).toEqual([]);
  });
}

for (const scenario of [
  { role: 'ACCOUNTANT', initial: null, action: 'bulk_generate', next: 'draft', button: 'Calculate Division Payroll' },
  { role: 'SUPERINTENDENT', initial: 'draft', action: 'bulk_approve', next: 'approved', button: 'Certify & Sign General Payroll (Form 7)' },
  { role: 'ACCOUNTANT', initial: 'approved', action: 'bulk_release', next: 'released', button: 'Disburse & Credit Salaries to LandBank ATM' },
]) {
  test(`payroll ${scenario.action} keeps its cutoff and refresh behavior`, async ({ page }, testInfo) => {
    const payroll = {
      id: 31, employee: 21, employee_name: 'Maria Santos', department: 'Instructional',
      cutoff_period: 'May 1-15, 2026', basic_salary: '13500.00', gross_salary: '14500.00',
      total_deductions: '2500.00', net_salary: '12000.00', status: scenario.initial,
    };
    let records = scenario.initial ? [payroll] : [];
    const requests = [];
    const errors = await session(page, scenario.role, async route => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      if (request.method() === 'POST') {
        requests.push({ path, body: request.postDataJSON() });
        payroll.status = scenario.next;
        records = [payroll];
        return route.fulfill({ json: { message: 'Processed', generated: 1, updated: 0, skipped: [] } });
      }
      if (path.endsWith('/employees/')) {
        return route.fulfill({ json: { count: 1, results: [{ id: 21, first_name: 'Maria', last_name: 'Santos' }] } });
      }
      return route.fulfill({ json: { count: records.length, results: records } });
    });
    page.on('dialog', dialog => dialog.accept());
    await page.goto('/payroll-management');
    await page.getByRole('button', { name: scenario.button, exact: true }).click();
    await expect.poll(() => requests.length).toBe(1);
    expect(requests[0]).toEqual({
      path: `/api/payroll/${scenario.action}/`, body: { cutoff_period: 'May 1-15, 2026' },
    });
    await expect(page.getByRole('button', { name: scenario.button, exact: true })).toHaveCount(0);
    await expect(page.locator('tbody')).toContainText('Maria Santos');
    await page.screenshot({ path: testInfo.outputPath(`payroll-${scenario.next}.png`), fullPage: true });
    expect(errors).toEqual([]);
  });
}
