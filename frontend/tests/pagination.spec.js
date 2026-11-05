import { test, expect } from '@playwright/test';

const fixtures = Array.from({ length: 13 }, (_, index) => {
  const id = index + 1;
  return {
    id, first_name: 'Pagination', last_name: `Fixture ${String(id).padStart(2, '0')}`,
    employee: 999, employee_name: `Pagination Fixture ${String(id).padStart(2, '0')}`,
    department: 'Instructional', position: 'Teacher I', position_applied: 'Teacher I',
    school_details: { id: 1, name: 'Pagination Test School' },
    user_details: { id: 100 + id, role: 'TEACHING', email: `fixture${id}@example.test`, username: `fixture${id}` },
    status: 'pending', purpose: 'general', loan_amount: '12000.00', monthly_payment: '1000.00',
    total_amount: '12000.00', current_balance: '12000.00', term_months: 12,
    basic_salary: '20000.00', gross_salary: '21000.00', total_deductions: '1000.00', net_salary: '20000.00',
    gsis: '900.00', philhealth: '100.00', pagibig: '0.00', tax: '0.00', loans: '0.00', pera: '1000.00',
    cutoff_period: 'May 1-15, 2026', date_applied: '2026-10-01', date_generated: '2026-10-01',
    date: `${new Date().toISOString().slice(0, 7)}-${String(id).padStart(2, '0')}`,
    period: 'Q1 2026', quality_score: 5, behavior_score: 5, punctuality_score: 5,
    leave_type: 'vacation', start_date: '2026-10-01', end_date: '2026-10-02',
    working_days_applied: '2.0', can_approve: true, actions: [],
    timestamp: '2026-10-01T09:00:00+08:00', action: `Viewed employee ${id}`, user_name: 'Test HR', user_role: 'HR',
  };
});

async function mockAPI(page) {
  await page.addInitScript(() => {
    const payload = btoa(JSON.stringify({ user_id: 999, employee_id: 999, role: 'HR', username: 'pagination-test', exp: 9999999999 }));
    localStorage.setItem('access_token', `test.${payload}.test`);
  });
  const requests = [];
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    if (!url.pathname.startsWith('/api/')) return route.continue();
    const endpoint = url.pathname.replace('/api/', '');
    requests.push({ endpoint, params: Object.fromEntries(url.searchParams) });
    if (endpoint === 'employees/me/') {
      return route.fulfill({ json: { id: 999, first_name: 'Test', last_name: 'HR', is_supervisor: true, vacation_leave_balance: 15, sick_leave_balance: 15 } });
    }
    if (endpoint === 'employees/1/' && route.request().method() === 'DELETE') return route.fulfill({ status: 204 });
    const resource = endpoint.split('/')[0];
    let rows = fixtures.map(row => ({ ...row,
      status: resource === 'leaves' ? 'pending_hr' : resource === 'attendance' ? 'present' : resource === 'applicants' ? 'applied' : resource === 'payroll' ? 'draft' : row.status,
    }));
    if (endpoint === 'schools/') rows = fixtures.map(row => ({ id: row.id, name: `Pagination School ${row.id}` }));
    if (endpoint === 'salary-grades/') rows = fixtures.map(row => ({ id: row.id, grade: row.id, amount: '27000.00' }));
    if (endpoint === 'employees/leave-staff/') rows = fixtures.map(row => ({ id: row.id, name: row.employee_name, leave_duty: '', school: 1 }));
    const summary = { total: 13, teaching: 13, non_teaching: 0, roles: ['TEACHING'], departments: ['Instructional'],
      statuses: { pending: 13, pending_hr: 13, applied: 13, draft: 13 }, pending: 13, action_required: 13,
      present: 13, late: 0, flagged: 0, outstanding: 13, verySatisfactory: 0, eligible: 0,
      periods: ['Q1 2026'], operators: 1, recent: 13, critical: 0 };
    const search = url.searchParams.get('search')?.toLowerCase();
    if (search) rows = rows.filter(row => `${row.first_name} ${row.last_name} ${row.employee_name} ${row.department}`.toLowerCase().includes(search));
    const number = Number(url.searchParams.get('page') || 1);
    const result = { count: rows.length, next: number * 10 < rows.length ? `${url.origin}${url.pathname}?page=${number + 1}` : null,
      previous: number > 1 ? `${url.origin}${url.pathname}?page=${number - 1}` : null,
      results: rows.slice((number - 1) * 10, number * 10), page_size: 10, summary };
    return route.fulfill({ json: result });
  });
  return requests;
}

for (const [path, label] of [
  ['/employees', 'employees'], ['/loan-management', 'loans'], ['/payroll-management', 'payroll records'],
  ['/leave-management', 'leave applications'], ['/attendance-management', 'attendance records'],
  ['/performance-management', 'performance reviews'], ['/recruitment', 'applicants'], ['/audit-logs', 'audit records'],
  ['/my-loans', 'loans'], ['/my-payslips', 'payslips'], ['/my-performance', 'performance reviews'],
  ['/my-leaves', 'personal leave applications'], ['/attendance', 'attendance records'],
]) {
  test(`${path} navigates between DRF pages`, async ({ page }) => {
    await mockAPI(page);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(path);
    const nav = page.getByRole('navigation', { name: `${label} pagination`, exact: true });
    await expect(nav.getByText('Page 1 of 2', { exact: true })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Previous', exact: true })).toBeDisabled();
    await nav.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(nav.getByText('Page 2 of 2', { exact: true })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
    await nav.getByRole('button', { name: 'Previous', exact: true }).click();
    await expect(nav.getByText('Page 1 of 2', { exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('employee search resets page and searches the entire directory', async ({ page }) => {
  const requests = await mockAPI(page);
  await page.goto('/employees');
  const nav = page.getByRole('navigation', { name: 'employees pagination', exact: true });
  await nav.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(nav.getByText('Page 2 of 2')).toBeVisible();
  await page.getByPlaceholder('Search by personnel name, plantilla position, or station...').fill('Fixture 13');
  await expect(nav.getByText('Page 1 of 1')).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: 'Pagination Fixture 13' })).toBeVisible();
  expect(requests.some(request => request.endpoint === 'employees/' && request.params.search === 'Fixture 13' && request.params.page === '1')).toBe(true);
});

test('payroll dropdowns load employees from every page', async ({ page }) => {
  const requests = await mockAPI(page);
  // HR can view payroll; the accountant role enables its employee selector.
  await page.addInitScript(() => {
    const payload = btoa(JSON.stringify({ user_id: 999, role: 'ACCOUNTANT', exp: 9999999999 }));
    localStorage.setItem('access_token', `test.${payload}.test`);
  });
  await page.goto('/payroll-management');
  await expect(page.getByRole('option').filter({ hasText: 'Pagination Fixture 13' })).toHaveCount(1);
  expect(requests.some(request => request.endpoint === 'employees/' && request.params.page === '2')).toBe(true);
});

test('pagination stays usable at mobile width and supports keyboard navigation', async ({ page }) => {
  await mockAPI(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/employees');
  const nav = page.getByRole('navigation', { name: 'employees pagination', exact: true });
  const next = nav.getByRole('button', { name: 'Next', exact: true });
  await next.focus();
  await expect(next).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(nav.getByText('Page 2 of 2')).toBeVisible();
  const box = await nav.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(375);
  await page.screenshot({ path: 'test-results/pagination-mobile.png' });
});

test('failed pages expose Retry and preserve working navigation after recovery', async ({ page }) => {
  await mockAPI(page);
  let failing = true;
  await page.route('**/api/employees/?**', async route => {
    if (failing) return route.fulfill({ status: 500, json: { detail: 'Pagination test failure' } });
    return route.fallback();
  });
  await page.goto('/employees');
  const nav = page.getByRole('navigation', { name: 'employees pagination', exact: true });
  await expect(nav.getByRole('alert')).toHaveText(/Could not load employees/, { timeout: 20000 });
  failing = false;
  await nav.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(nav.getByText('Page 1 of 2')).toBeVisible();
});
