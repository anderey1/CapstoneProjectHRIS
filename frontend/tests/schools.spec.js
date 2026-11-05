import { test, expect } from '@playwright/test';

// Local seeded demo accounts; override for a different development database.
async function signIn(page, request, username) {
  const response = await request.post('http://localhost:8000/api/token/', {
    data: { username, password: process.env.SCHOOL_TEST_PASSWORD || 'password123' },
  });
  expect(response.ok()).toBeTruthy();
  const tokens = await response.json();
  await page.goto('/login');
  await page.evaluate(data => {
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    localStorage.setItem('username', data.username);
    localStorage.setItem('user_role', data.role);
  }, tokens);
  await page.goto('/schools');
  return tokens;
}

test('super admin can manage schools on desktop and mobile', async ({ page, request }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const tokens = await signIn(page, request, 'admin');
  const name = `Defense school ${Date.now()}`;
  let id;
  try {
    await expect(page.getByRole('heading', { name: 'Schools', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Add school', exact: true }).click();
    await page.getByLabel('School name', { exact: true }).fill(name);
    await expect(page.getByLabel('Attendance radius (meters)', { exact: true })).toHaveCount(0);
    await expect(page.getByLabel('Latitude', { exact: true })).toHaveCount(0);
    const created = page.waitForResponse(response => response.url().endsWith('/api/schools/') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Save school' }).click();
    const response = await created;
    expect(response.status()).toBe(201);
    id = (await response.json()).id;
    await expect(page.getByRole('dialog')).not.toBeVisible();
    // Find the new school even when the database contains multiple pages.
    while (!(await page.getByRole('button', { name: `Edit ${name}`, exact: true }).count())) {
      const next = page.getByRole('button', { name: 'Next', exact: true });
      await expect(next).toBeEnabled();
      await next.click();
      await expect(page.getByRole('status').filter({ hasText: 'Loading schools' })).not.toBeVisible();
    }
    await page.getByRole('button', { name: `Edit ${name}`, exact: true }).click();
    await page.getByLabel('School name', { exact: true }).fill(`${name} edited`);
    await page.getByRole('button', { name: 'Save school' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: name })).toContainText(`${name} edited`);
    await page.reload();
    // Reload starts at page one; use a direct request to prove persisted editing.
    const saved = await request.get(`http://localhost:8000/api/schools/${id}/`, { headers: { Authorization: `Bearer ${tokens.access}` } });
    expect((await saved.json()).name).toBe(`${name} edited`);
    await page.screenshot({ path: testInfo.outputPath('schools-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await expect(page.getByRole('button', { name: 'Add school', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    await page.screenshot({ path: testInfo.outputPath('schools-mobile.png'), fullPage: true });
    while (!(await page.getByRole('button', { name: `Delete ${name} edited`, exact: true }).count())) {
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await expect(page.getByRole('status').filter({ hasText: 'Loading schools' })).not.toBeVisible();
    }
    await page.getByRole('button', { name: `Delete ${name} edited`, exact: true }).click();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.getByRole('row').filter({ hasText: name })).toBeVisible();
    await page.getByRole('button', { name: `Delete ${name} edited`, exact: true }).click();
    await page.getByRole('button', { name: 'Delete school', exact: true }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: name })).toHaveCount(0);
    expect(errors).toEqual([]);
  } finally {
    if (id) await request.delete(`http://localhost:8000/api/schools/${id}/`, { headers: { Authorization: `Bearer ${tokens.access}` } });
  }
});

test('assigned school deletion shows a recoverable error', async ({ page, request }) => {
  await signIn(page, request, 'admin');
  await page.getByRole('button', { name: 'Delete LCNHS', exact: true }).click();
  await page.getByRole('button', { name: 'Delete school', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Reassign all personnel before deleting this school.');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: 'LCNHS' })).toBeVisible();
});

for (const username of ['principal_lcnhs', 'hr_lucena']) {
  test(`${username} cannot access school management`, async ({ page, request }) => {
    const tokens = await signIn(page, request, username);
    await expect(page).toHaveURL('http://localhost:5173/');
    await expect(page.getByRole('link', { name: 'Schools', exact: true })).toHaveCount(0);
    const response = await request.post('http://localhost:8000/api/schools/', {
      headers: { Authorization: `Bearer ${tokens.access}` },
      data: { name: 'Forbidden school', latitude: '13.9', longitude: '121.6', radius_meters: 100 },
    });
    expect(response.status()).toBe(403);
  });
}
