import { test, expect } from '@playwright/test';

const buildChart = (key, title, unit, total, data, path, action) => ({
  key,
  title,
  unit,
  total,
  data,
  path,
  action,
  period: 'Test reporting period',
  insight: `Recorded ${title.toLowerCase()}.`,
  note: 'Figures come from recorded dashboard data.',
});

const CHARTS = {
  workforce: buildChart('workforce', 'Workforce composition', 'personnel', 5, [{ name: 'Teaching Staff', value: 5 }], '/employees', 'Open personnel directory'),
  stations: buildChart('stations', 'Personnel by station', 'personnel', 5, [{ name: 'Lucena City National High School', value: 5 }], '/employees', 'Review station assignments'),
  attendance: buildChart('attendance', 'Attendance review status', 'daily records', 4, [{ name: 'Approved daily records', value: 3 }, { name: 'Awaiting review', value: 1 }], '/attendance-management', 'Review attendance'),
  leaves: buildChart('leaves', 'Leave processing pipeline', 'applications', 3, [{ name: 'Pending HR', value: 3 }], '/leave-management', 'Review leave applications'),
  loans: buildChart('loans', 'Provident loan pipeline', 'applications', 2, [{ name: 'Pending', value: 2 }], '/loan-management', 'Review loan applications'),
  payroll_status: buildChart('payroll_status', 'Payroll processing pipeline', 'employee payroll records', 2, [{ name: 'Draft', value: 2 }], '/payroll-management', 'Open payroll'),
  payroll: buildChart('payroll', 'Released payroll by month', 'PHP', '0.00', [{ name: 'Nov 2026', value: '0.00' }], '/payroll-management', 'Open payroll'),
  recruitment: buildChart('recruitment', 'Recruitment pipeline', 'applicants', 1, [{ name: 'Applied / Submitted', value: 1 }], '/recruitment', 'Open applicant board'),
};

function chartsForRole(role) {
  if (role === 'ACCOUNTANT') return [CHARTS.payroll_status, CHARTS.payroll, CHARTS.loans];
  if (role === 'SUPERINTENDENT') return [CHARTS.workforce, CHARTS.leaves, CHARTS.attendance, CHARTS.payroll_status];
  if (['TEACHING', 'NON_TEACHING', 'PRINCIPAL'].includes(role)) return [CHARTS.attendance, CHARTS.leaves, CHARTS.loans, CHARTS.payroll, CHARTS.payroll_status];
  return [CHARTS.workforce, CHARTS.attendance, CHARTS.leaves, CHARTS.recruitment, CHARTS.stations, CHARTS.payroll_status];
}

async function setup(page, { role = 'HR', admin = false, failTasks = false, failAnalytics = false, empty = false } = {}) {
  await page.addInitScript(({ role, admin }) => {
    const payload = btoa(JSON.stringify({ user_id: 999, role, is_superuser: admin, exp: 9999999999 }));
    localStorage.setItem('access_token', `test.${payload}.test`);
  }, { role, admin });
  const requests = { tasks: 0, analytics: 0, explanations: 0 };
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let tasksFail = failTasks;
  let analyticsFail = failAnalytics;
  await page.route(url => url.pathname.startsWith('/api/'), async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/dashboard/operations/') {
      requests.analytics++;
      return route.fulfill(analyticsFail ? { status: 503, json: {} } : { json: {
        scope: ['TEACHING', 'NON_TEACHING', 'PRINCIPAL'].includes(role) ? 'personal' : 'division',
        as_of: '2026-11-18T08:00:00Z',
        charts: empty ? [] : chartsForRole(role),
      } });
    }
    if (url.pathname === '/api/notifications/tasks/') {
      requests.tasks++;
      const secondPage = url.searchParams.get('page') === '2';
      return route.fulfill(tasksFail ? { status: 503, json: {} } : { json: {
        count: empty ? 0 : 11,
        results: empty ? [] : [{ key: `leave:${secondPage ? 11 : 1}`, title: `Review leave application #${secondPage ? 11 : 1}`, path: '/my-leaves', module: 'leave' }],
      } });
    }
    if (url.pathname.includes('/dashboard/operations/insight/')) {
      requests.explanations++;
      return route.fulfill(requests.explanations === 1 ? { status: 503, json: {} } : {
        json: { source: 'ai', text: 'Explanation for the selected chart.' },
      });
    }
    return route.fulfill({ json: { count: 0, results: [], action_required: 0, unread_updates: 0 } });
  });
  return { requests, errors, recover: () => { tasksFail = false; analyticsFail = false; } };
}

for (const scenario of [
  { role: 'HR', title: 'HR operations dashboard', link: 'Personnel and registrations', path: '/employees', firstChart: 'Workforce composition', absentChart: 'Provident loan pipeline' },
  { role: 'ACCOUNTANT', title: 'Finance dashboard', link: 'Payroll preparation and release', path: '/payroll-management', firstChart: 'Released payroll by month', absentChart: 'Workforce composition' },
  { role: 'SUPERINTENDENT', title: 'Division operations dashboard', link: 'Payroll approval', path: '/payroll-management', firstChart: 'Workforce composition', absentChart: 'Provident loan pipeline' },
  { role: 'PRINCIPAL', title: 'School workspace', link: 'Staff leave approvals', path: '/my-leaves?tab=approvals', firstChart: 'Attendance review status', absentChart: 'Workforce composition' },
  { role: 'TEACHING', title: 'My dashboard', link: 'My leave applications', path: '/my-leaves', firstChart: 'Attendance review status', absentChart: 'Workforce composition' },
  { role: 'NON_TEACHING', title: 'My dashboard', link: 'My payslips', path: '/my-payslips', firstChart: 'Attendance review status', absentChart: 'Workforce composition' },
  { role: '', admin: true, title: 'System administration dashboard', link: 'Schools', path: '/schools', firstChart: 'Workforce composition', absentChart: 'Provident loan pipeline' },
]) {
  test(`${scenario.role || 'superuser'} gets role charts before the queue`, async ({ page }) => {
    const { errors } = await setup(page, scenario);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: scenario.title, exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Role snapshot', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: scenario.firstChart, exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: scenario.absentChart, exact: true })).toHaveCount(0);
    const work = page.getByRole('navigation', { name: 'Your workspace' });
    await expect(work.getByRole('link', { name: scenario.link, exact: true })).toHaveAttribute('href', scenario.path);
    const task = page.getByRole('link', { name: 'Review leave application #1 Open', exact: true });
    await expect(task).toBeVisible();
    const charts = page.getByRole('heading', { name: 'Role-specific charts', exact: true });
    expect((await charts.boundingBox()).y).toBeLessThan((await task.boundingBox()).y);
    await task.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/my-leaves$/);
    expect(errors).toEqual([]);
  });
}

test('all role charts show their figures and request explanations only on demand', async ({ page }) => {
  const { requests, errors } = await setup(page, { role: 'ACCOUNTANT' });
  await page.goto('/');
  expect(requests.explanations).toBe(0);
  await expect(page.getByRole('heading', { name: 'Payroll processing pipeline', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Provident loan pipeline', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Explain with AI' })).toBeHidden();
  const payroll = page.getByRole('region', { name: 'Released payroll by month', exact: true });
  await payroll.getByText('View monthly figures', { exact: true }).click();
  await expect(payroll.locator('span.tabular-nums', { hasText: '₱0.00' })).toBeVisible();
  await payroll.getByText('Optional explanation', { exact: true }).click();
  await payroll.getByRole('button', { name: 'Explain with AI' }).click();
  await expect(payroll.getByText(/AI explanation could not load/)).toBeVisible();
  await payroll.getByRole('button', { name: 'Explain with AI' }).click();
  await expect(payroll.getByText('Explanation for the selected chart.')).toBeVisible();
  const loans = page.getByRole('region', { name: 'Provident loan pipeline', exact: true });
  await expect(loans.getByText('Explanation for the selected chart.')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('queue pagination and refresh load current server records', async ({ page }) => {
  const { requests, errors } = await setup(page);
  await page.goto('/');
  const pager = page.getByRole('navigation', { name: 'Review queue pages' });
  await pager.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('link', { name: 'Review leave application #11 Open' })).toBeVisible();
  await expect(pager.getByRole('button', { name: 'Next' })).toBeDisabled();
  await pager.getByRole('button', { name: 'Previous' }).click();
  await expect(page.getByRole('link', { name: 'Review leave application #1 Open', exact: true })).toBeVisible();
  const before = { ...requests };
  await page.getByRole('button', { name: 'Refresh data' }).click();
  await expect.poll(() => requests.tasks).toBeGreaterThan(before.tasks);
  await expect.poll(() => requests.analytics).toBeGreaterThan(before.analytics);
  expect(errors).toEqual([]);
});

for (const failed of ['tasks', 'analytics']) {
  test(`${failed} failure leaves the other dashboard section usable`, async ({ page }) => {
    const state = await setup(page, { failTasks: failed === 'tasks', failAnalytics: failed === 'analytics' });
    await page.goto('/');
    if (failed === 'tasks') {
      await expect(page.getByText('Your review queue could not load.')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Role-specific charts', exact: true })).toBeVisible();
    } else {
      await expect(page.getByRole('heading', { name: 'Dashboard could not load' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Review leave application #1 Open', exact: true })).toBeVisible();
    }
    state.recover();
    await page.getByRole('button', { name: failed === 'tasks' ? 'Retry review queue' : 'Retry', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Role-specific charts', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Review leave application #1 Open', exact: true })).toBeVisible();
    expect(state.errors).toEqual([]);
  });
}

test('empty dashboard and mobile layout stay usable', async ({ page }, testInfo) => {
  const { errors } = await setup(page, { role: 'TEACHING', empty: true });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  await expect(page.getByText('No tasks in this queue', { exact: true })).toBeVisible();
  await expect(page.getByText(/No chart records are available for this account yet/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('dashboard-mobile-empty.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('populated charts fit narrow screens', async ({ page }, testInfo) => {
  const { errors } = await setup(page, { role: 'ACCOUNTANT' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Released payroll by month', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Payroll processing pipeline', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Provident loan pipeline', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('dashboard-mobile.png'), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: testInfo.outputPath('dashboard-desktop.png'), fullPage: true });
  expect(errors).toEqual([]);
});
