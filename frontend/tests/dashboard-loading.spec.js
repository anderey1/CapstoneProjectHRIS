import { test, expect } from '@playwright/test';

test('a missing analytics endpoint stops loading and allows a manual retry', async ({ page }) => {
  await page.addInitScript(() => {
    const payload = btoa(JSON.stringify({ user_id: 999, role: 'HR', username: 'dashboard-test', exp: 9999999999 }));
    localStorage.setItem('access_token', `test.${payload}.test`);
  });
  let requests = 0;
  await page.route('**/api/**', async route => {
    if (new URL(route.request().url()).pathname === '/api/dashboard/operations/') {
      requests += 1;
      return route.fulfill({ status: 404, json: { detail: 'Not found.' } });
    }
    return route.fulfill({ json: { results: [], count: 0 } });
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Dashboard could not load' })).toBeVisible();
  await expect(page.getByText('Loading dashboard analytics…')).toBeHidden();
  await expect.poll(() => requests).toBe(1);
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect.poll(() => requests).toBe(2);
});
