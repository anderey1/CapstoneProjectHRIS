import { test, expect } from '@playwright/test';

async function mockNotifications(page, { failFirstDismissal = false } = {}) {
  const task = { key: 'leave:21', title: 'Review leave application #21', path: '/my-payslips' };
  const update = { id: 42, title: 'Payroll released', source_type: 'payroll', created_at: '2026-11-01T12:00:00Z', read_at: null };
  const dismissed = new Set();
  let attempts = 0;
  await page.addInitScript(() => {
    const payload = btoa(JSON.stringify({ user_id: 999, role: 'HR', exp: 9999999999 }));
    localStorage.setItem('access_token', `test.${payload}.test`);
  });
  await page.route(url => url.pathname.startsWith('/api/'), async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/notifications/dismiss/') {
      attempts += 1;
      if (failFirstDismissal && attempts === 1) {
        return route.fulfill({ status: 500, json: { detail: 'Unavailable' } });
      }
      const data = route.request().postDataJSON();
      dismissed.add(data.task_key || data.notification_id);
      return route.fulfill({ status: 204 });
    }
    if (path === '/api/notifications/summary/') {
      return route.fulfill({ json: { unread_updates: dismissed.has(42) ? 0 : 1, action_required: dismissed.has(task.key) ? 0 : 1 } });
    }
    if (path === '/api/notifications/tasks/' || path === '/api/notifications/') {
      const item = path.endsWith('/tasks/') ? task : update;
      const results = dismissed.has(item.key || item.id) ? [] : [item];
      return route.fulfill({ json: { count: results.length, results } });
    }
    return route.fulfill({ json: { count: 0, results: [], summary: {} } });
  });
  await page.goto('/my-loans');
  return { dismissed };
}

for (const tab of ['tasks', 'updates']) {
  test(`clicking ${tab} persists dismissal, updates the count, and opens the destination`, async ({ page }) => {
    const { dismissed } = await mockNotifications(page);
    await page.getByRole('button', { name: /^Notifications:/ }).click();
    if (tab === 'updates') await page.getByRole('button', { name: /^Updates/ }).click();
    const title = tab === 'tasks' ? 'Review leave application #21' : 'Payroll released';
    const notification = page.getByRole('button', { name: new RegExp(title) });
    if (tab === 'tasks') {
      await notification.focus();
      await page.keyboard.press('Enter');
    } else {
      await notification.click();
    }
    await expect(page).toHaveURL('/my-payslips');
    expect(dismissed.has(tab === 'tasks' ? 'leave:21' : 42)).toBe(true);
    const counts = tab === 'tasks' ? /1 unread updates, 0 actions required/ : /0 unread updates, 1 actions required/;
    await expect(page.getByRole('button', { name: counts })).toBeVisible();
    await page.getByRole('button', { name: /^Notifications:/ }).click();
    await expect(notification).toHaveCount(0);
    await page.reload();
    await page.getByRole('button', { name: /^Notifications:/ }).click();
    if (tab === 'updates') await page.getByRole('button', { name: /^Updates/ }).click();
    await expect(notification).toHaveCount(0);
    await expect(page.getByText(tab === 'tasks' ? 'No new tasks.' : 'No updates.', { exact: true })).toBeVisible();
  });
}

test('a failed dismissal keeps the notification available for retry', async ({ page }) => {
  await mockNotifications(page, { failFirstDismissal: true });
  await page.getByRole('button', { name: /^Notifications:/ }).click();
  const notification = page.getByRole('button', { name: /Review leave application #21/ });
  await notification.click();
  await expect(page.getByRole('alert')).toHaveText('Could not dismiss notification. Try again.');
  await expect(notification).toBeEnabled();
  await expect(page).toHaveURL('/my-loans');
  await notification.click();
  await expect(page).toHaveURL('/my-payslips');
});
