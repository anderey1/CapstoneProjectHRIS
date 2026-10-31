import { test, expect } from '@playwright/test';

// Layout checks use a local session and mocked lists, without backend credentials.
test.beforeEach(async ({ page }) => {
  await page.route(/http:\/\/(localhost|127\.0\.0\.1):8000\/api\//, route =>
    route.fulfill({ json: { count: 0, results: [] } }));
  await page.addInitScript(() => {
    const payload = btoa(JSON.stringify({
      user_id: 1, role: 'HR', username: 'Layout Test', exp: 4102444800,
    }));
    localStorage.setItem('access_token', `test.${payload}.test`);
  });
});

async function expectSidebarFits(page) {
  const sidebar = page.locator('aside');
  await expect(sidebar).toBeVisible();
  await expect.poll(async () => {
    const box = await sidebar.boundingBox();
    return Math.abs(box.y) < 1 &&
      Math.abs(box.height - page.viewportSize().height) < 1 &&
      box.x >= 0 && box.x + box.width <= page.viewportSize().width;
  }).toBe(true);
  await expect(sidebar.getByRole('button', { name: 'Sign Out' })).toBeInViewport();
  const navigation = page.getByRole('navigation', { name: 'Main navigation', exact: true });
  await navigation.getByRole('link', { name: 'Activity Logs' }).scrollIntoViewIfNeeded();
  await expect(navigation.getByRole('link', { name: 'Activity Logs' })).toBeInViewport();
  expect(await navigation.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

test('desktop sidebar stays in the viewport when a long page scrolls', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await page.goto('/my-leaves');
  await expectSidebarFits(page);
  // Make the page tall regardless of the number of records returned.
  await page.locator('main').evaluate(el => {
    const content = document.createElement('div');
    content.style.height = '2000px';
    el.append(content);
  });
  await page.evaluate(() => window.scrollTo(0, 450));
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await expectSidebarFits(page);
});

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 1024, height: 360 },
]) {
  test(`sidebar fits ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/my-leaves');
    if (viewport.width < 1024) {
      await page.getByRole('button', { name: 'Open Navigation', exact: true }).click();
    }
    await expectSidebarFits(page);
  });
}

test('collapsed desktop sidebar expands on mobile and closes after navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await page.goto('/my-leaves');
  await page.locator('aside').getByRole('button', { name: 'Collapse sidebar' }).click();
  await expect.poll(async () => (await page.locator('aside').boundingBox()).width).toBe(80);
  await page.setViewportSize({ width: 390, height: 600 });
  await page.getByRole('button', { name: 'Open Navigation', exact: true }).click();
  await expectSidebarFits(page);
  await expect.poll(async () => (await page.locator('aside').boundingBox()).width).toBe(288);
  await page.getByRole('navigation', { name: 'Main navigation', exact: true })
    .getByRole('link', { name: 'My Leave Applications' }).click();
  await expect(page.locator('#main-drawer')).not.toBeChecked();
  await expect(page.locator('aside')).not.toBeInViewport();
});
