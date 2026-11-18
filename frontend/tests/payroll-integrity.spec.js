import { test, expect } from '@playwright/test';

const cutoff = 'November 16-30, 2026';
const payroll = {
  id: 1, employee: 1, employee_name: 'Payroll Fixture', cutoff_period: cutoff,
  status: 'draft', basic_salary: '15000.00', gross_salary: '0.00',
  total_deductions: '0.00', net_salary: '0.00', pera: '0.00',
  gsis: '0.00', philhealth: '0.00', pagibig: '0.00', loans: '0.00', tax: '0.00',
};

async function mockPayroll(page, { role = 'ACCOUNTANT', records = [payroll], failSummary = false } = {}) {
  await page.clock.setFixedTime(new Date('2026-11-18T12:00:00'));
  await page.addInitScript(role => {
    const payload = btoa(JSON.stringify({ user_id: 1, employee_id: 1, role, exp: 9999999999 }));
    localStorage.setItem('access_token', `test.${payload}.test`);
  }, role);
  let failing = failSummary;
  const posts = [];
  await page.route(url => url.pathname.startsWith('/api/'), async route => {
    const url = new URL(route.request().url());
    const endpoint = url.pathname.replace('/api/', '');
    if (route.request().method() === 'POST') posts.push(endpoint);
    if (endpoint === 'employees/me/') return route.fulfill({ json: { id: 1, first_name: 'Payroll', last_name: 'Fixture' } });
    if (endpoint === 'payroll/' && !url.searchParams.has('cutoff_period') && failing) {
      return route.fulfill({ status: 500, json: { detail: 'Summary unavailable' } });
    }
    let results = endpoint === 'employees/' ? [{ id: 1, first_name: 'Payroll', last_name: 'Fixture', salary: '30000.00' }] : endpoint === 'payroll/' ? records : [];
    if (url.searchParams.has('cutoff_period')) results = results.filter(p => p.cutoff_period === url.searchParams.get('cutoff_period'));
    return route.fulfill({ json: { count: results.length, next: null, previous: null, results } });
  });
  return { posts, recover: () => { failing = false; } };
}

test('payroll shows recorded zeros, unavailable days, and page subtotal', async ({ page }) => {
  await mockPayroll(page);
  await page.goto('/payroll-management');
  await expect(page.getByLabel('Selected or recorded period')).toHaveValue(cutoff);
  const row = page.getByRole('row').filter({ hasText: 'Payroll Fixture' });
  await expect(row.getByRole('cell').nth(2)).toHaveText('Not available');
  await expect(row.getByRole('cell').nth(3)).toHaveText('₱0.00');
  await expect(page.getByText('Page subtotal (1 Personnel)')).toBeVisible();
  await page.getByLabel('Month', { exact: true }).selectOption('1');
  await page.getByLabel('Year', { exact: true }).fill('2028');
  await page.getByLabel('Semi-monthly period', { exact: true }).selectOption('2');
  await page.getByRole('button', { name: 'Select period', exact: true }).click();
  await expect(page.getByLabel('Selected or recorded period')).toHaveValue('February 16-29, 2028');
  await expect(page.getByRole('option', { name: /November 16-30, 2026/ })).toHaveCount(1);
});

test('summary failure blocks processing and retry restores authoritative data', async ({ page }) => {
  const state = await mockPayroll(page, { failSummary: true });
  await page.goto('/payroll-management');
  await expect(page.getByText('Could not load authoritative payroll or employee data.', { exact: false })).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole('button', { name: 'Recalculate', exact: true })).toBeDisabled();
  await expect(page.getByText('Calculate Division Payroll', { exact: true })).toHaveCount(0);
  expect(state.posts).toEqual([]);
  state.recover();
  await page.getByRole('button', { name: 'Retry payroll data' }).click();
  await expect(page.getByText('Could not load authoritative payroll or employee data.', { exact: false })).toHaveCount(0);
  await expect(page.getByRole('row').filter({ hasText: 'Payroll Fixture' })).toBeVisible();
});

test('missing recorded amounts do not fall back to basic salary or enable approval', async ({ page }) => {
  await mockPayroll(page, { role: 'SUPERINTENDENT', records: [{ ...payroll, gross_salary: null }] });
  await page.goto('/payroll-management');
  const row = page.getByRole('row').filter({ hasText: 'Payroll Fixture' });
  await expect(row.getByRole('cell').nth(3)).toHaveText('Not available');
  await expect(row.getByRole('button', { name: 'Approve payroll', exact: true })).toBeDisabled();
});

test('payslip preserves zeros without inventing allowances or department', async ({ page }) => {
  await mockPayroll(page, { role: 'TEACHING', records: [{ ...payroll, status: 'released', pera: null, pagibig: null }] });
  await page.goto('/my-payslips');
  const slip = page.locator('#printable-payslip');
  await expect(slip.getByText('PERA allowance').locator('..')).toHaveText(/Not available/);
  await expect(slip.getByText('Pag-IBIG Contribution').locator('..')).toHaveText(/Not available/);
  await expect(slip.getByText('Total Gross Compensation').locator('..')).toHaveText(/₱0.00/);
  await expect(slip.getByText('Net Take-Home Pay').locator('..')).toHaveText(/₱0.00/);
  await expect(slip.getByText('SDO Lucena City', { exact: true })).toHaveCount(0);
  await expect(slip.getByRole('button', { name: 'Download PDF payslip' })).toBeVisible();
});
