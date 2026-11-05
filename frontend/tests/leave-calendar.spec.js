import { test, expect } from '@playwright/test';

test.use({ timezoneId: 'America/Los_Angeles' });

async function openApplication(page, { unavailable = false } = {}) {
  await page.clock.install({ time: new Date('2026-11-04T16:05:00Z') });
  await page.addInitScript(() => {
    localStorage.setItem('access_token', `test.${btoa(JSON.stringify({ user_id: 1, role: 'TEACHING', exp: 4102444800 }))}.test`);
  });
  await page.route(/http:\/\/(localhost|127\.0\.0\.1):8000\/api\//, async route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/leaves/calendar/')) {
      if (unavailable || url.searchParams.get('year') !== '2026') {
        return route.fulfill({ status: 400, json: ['Leave calendar is not available. Ask HR to update it.'] });
      }
      return route.fulfill({ json: {
        year: 2026, today: '2026-11-05', coverage: 'reviewed', version: 'test',
        holidays: [{ date: '2026-11-30', label: 'Bonifacio Day', category: 'regular', scope: 'national' }],
      } });
    }
    if (url.pathname.endsWith('/employees/me/')) {
      return route.fulfill({ json: { id: 1, sick_leave_balance: '15', vacation_leave_balance: '15' } });
    }
    return route.fulfill({ json: { count: 0, results: [], summary: {} } });
  });
  await page.goto('/my-leaves');
  await page.getByRole('button', { name: 'File CSC Form No. 6' }).click();
  return page.getByRole('dialog', { name: 'Apply for leave', exact: true });
}

test('Manila filing boundary excludes today, preserves vacation advance rule and allows tomorrow', async ({ page }) => {
  const dialog = await openApplication(page);
  await expect(dialog.locator('[name="start_date"]')).toHaveAttribute('min', '2026-11-10');
  await dialog.locator('[name="leave_type"]').selectOption('sick');
  await expect(dialog.locator('[name="start_date"]')).toHaveAttribute('min', '2026-10-06');
  await dialog.getByRole('button', { name: 'Choose start date' }).click();
  const picker = dialog.getByRole('region', { name: 'Start date calendar', exact: true });
  await expect(picker.getByRole('button', { name: '2026-11-05: Today (filing date)', exact: true })).toBeDisabled();
  await picker.screenshot({ path: 'test-results/leave-picker-today-disabled.png' });
  await picker.getByRole('button', { name: 'Close calendar', exact: true }).click();
  await dialog.locator('[name="start_date"]').fill('2026-11-05');
  await dialog.locator('[name="end_date"]').fill('2026-11-06');
  await expect(dialog.getByRole('alert')).toContainText("Today's date cannot be selected");
  await expect(dialog.getByRole('button', { name: 'Submit application', exact: true })).toBeDisabled();
  await dialog.locator('[name="start_date"]').fill('2026-11-06');
  await expect(dialog.getByRole('status')).toContainText('1 working day requested');
  await expect(dialog.getByRole('button', { name: 'Submit application', exact: true })).toBeEnabled();
  await dialog.screenshot({ path: 'test-results/leave-calendar-next-day.png' });
});

test('preview excludes holidays and weekends but calendar-day leave includes them', async ({ page }) => {
  const dialog = await openApplication(page);
  await dialog.locator('[name="start_date"]').fill('2026-11-27');
  await dialog.locator('[name="end_date"]').fill('2026-12-01');
  await expect(dialog.getByRole('status')).toContainText('2 working days requested');
  await expect(dialog.getByText('2026-11-30: Bonifacio Day')).toBeVisible();
  await dialog.getByRole('status').scrollIntoViewIfNeeded();
  await dialog.screenshot({ path: 'test-results/leave-calendar-holiday.png' });
  await dialog.locator('[name="start_date"]').fill('2026-11-30');
  await dialog.locator('[name="end_date"]').fill('2026-11-30');
  await expect(dialog.getByRole('alert')).toContainText('no working days');
  await expect(dialog.getByRole('button', { name: 'Submit application', exact: true })).toBeDisabled();
  await dialog.locator('[name="leave_type"]').selectOption('maternity');
  await dialog.locator('[name="start_date"]').fill('2026-11-27');
  await expect(dialog.getByRole('status')).toContainText('4 calendar days requested');
});

test('unavailable calendar blocks unchecked working-day submission and offers retry', async ({ page }) => {
  const dialog = await openApplication(page, { unavailable: true });
  await expect(dialog.getByRole('alert')).toContainText('calendar');
  await expect(dialog.getByRole('button', { name: 'Submit application', exact: true })).toBeDisabled();
  await expect(dialog.getByRole('button', { name: 'Retry calendar' })).toBeVisible();
});

test('unsupported cross-year range has no unchecked duration', async ({ page }) => {
  const dialog = await openApplication(page);
  await dialog.locator('[name="start_date"]').fill('2026-12-29');
  await dialog.locator('[name="end_date"]').fill('2027-01-04');
  await expect(dialog.getByRole('alert')).toContainText('calendar');
  await expect(dialog.getByRole('button', { name: 'Submit application', exact: true })).toBeDisabled();
});

test('mobile form preserves keyboard access and fits the screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const dialog = await openApplication(page);
  await dialog.locator('[name="leave_type"]').selectOption('sick');
  await dialog.locator('[name="start_date"]').fill('2026-11-06');
  await dialog.locator('[name="end_date"]').fill('2026-11-06');
  await expect(dialog.getByRole('status')).toContainText('1 working day requested');
  expect(await dialog.locator('.modal-box').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await dialog.getByRole('button', { name: 'Submit application', exact: true }).focus();
  await page.keyboard.press('Tab');
  expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
  await dialog.screenshot({ path: 'test-results/leave-calendar-mobile.png' });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});

test('picker disables weekends and holidays, preserves calendar-day selection', async ({ page }) => {
  const dialog = await openApplication(page);
  await dialog.getByRole('button', { name: 'Choose start date' }).click();
  const picker = dialog.getByRole('region', { name: 'Start date calendar', exact: true });
  await expect(picker.getByRole('button', { name: '2026-11-28: Weekend', exact: true })).toBeDisabled();
  await expect(picker.getByRole('button', { name: '2026-11-30: Bonifacio Day', exact: true })).toBeDisabled();
  await picker.scrollIntoViewIfNeeded();
  await picker.screenshot({ path: 'test-results/leave-picker-gray-dates.png' });
  await picker.getByRole('button', { name: '2026-11-27', exact: true }).click();
  await expect(dialog.locator('[name="start_date"]')).toHaveValue('2026-11-27');
  await dialog.getByRole('button', { name: 'Choose end date' }).click();
  const endPicker = dialog.getByRole('region', { name: 'End date calendar', exact: true });
  await expect(endPicker.getByRole('button', { name: '2026-11-30: Bonifacio Day', exact: true })).toBeDisabled();
  await endPicker.getByRole('button', { name: 'Close calendar', exact: true }).click();
  await dialog.locator('[name="leave_type"]').selectOption('maternity');
  await dialog.getByRole('button', { name: 'Choose end date' }).click();
  await expect(endPicker.getByRole('button', { name: '2026-11-30: Bonifacio Day', exact: true })).toBeEnabled();
  await endPicker.getByRole('button', { name: '2026-11-30: Bonifacio Day', exact: true }).click();
  await expect(dialog.locator('[name="end_date"]')).toHaveValue('2026-11-30');
  await dialog.locator('[name="leave_type"]').selectOption('vacation');
  await expect(dialog.getByRole('alert')).toContainText('Choose working days');
  await expect(dialog.getByRole('button', { name: 'Submit application', exact: true })).toBeDisabled();
});

test('picker keyboard skips non-working dates and Escape closes only the calendar', async ({ page }) => {
  const dialog = await openApplication(page);
  await dialog.locator('[name="start_date"]').fill('2026-11-27');
  await dialog.getByRole('button', { name: 'Choose start date' }).click();
  const picker = dialog.getByRole('region', { name: 'Start date calendar', exact: true });
  const friday = picker.getByRole('button', { name: '2026-11-27', exact: true });
  expect(await dialog.locator('dialog[open]').evaluate(element => element.matches(':modal'))).toBe(true);
  await expect(friday).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(picker.getByRole('button', { name: '2026-11-26', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(picker).toHaveCount(0);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Choose start date' })).toBeFocused();
});

test('typed invalid, weekend, and early dates cannot bypass picker rules', async ({ page }) => {
  const dialog = await openApplication(page);
  const start = dialog.locator('[name="start_date"]');
  await start.fill('2026-02-31');
  await expect(dialog.getByRole('alert')).toContainText('valid date');
  await start.fill('2026-11-09');
  await expect(dialog.getByRole('alert')).toContainText('filing rules');
  await start.fill('2026-11-28');
  await dialog.locator('[name="end_date"]').fill('2026-12-01');
  await expect(dialog.getByRole('alert')).toContainText('Choose working days');
  await expect(dialog.getByRole('button', { name: 'Submit application', exact: true })).toBeDisabled();
});

test('month without reviewed holidays stays unavailable and navigation can recover', async ({ page }) => {
  const dialog = await openApplication(page);
  await dialog.getByRole('button', { name: 'Choose start date' }).click();
  const picker = dialog.getByRole('region', { name: 'Start date calendar', exact: true });
  await picker.getByRole('button', { name: 'Next month', exact: true }).click();
  await picker.getByRole('button', { name: 'Next month', exact: true }).click();
  await expect(picker.getByRole('alert')).toContainText('calendar unavailable');
  await expect(picker.getByRole('button', { name: '2027-01-04', exact: true })).toBeDisabled();
  await picker.getByRole('button', { name: 'Previous month', exact: true }).click();
  await expect(picker.getByRole('button', { name: '2026-12-01', exact: true })).toBeEnabled();
});

test('mobile calendar fits and Escape returns focus to its trigger', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const dialog = await openApplication(page);
  await dialog.getByRole('button', { name: 'Choose start date' }).click();
  const picker = dialog.getByRole('region', { name: 'Start date calendar', exact: true });
  await expect(picker.getByRole('button', { name: '2026-11-30: Bonifacio Day', exact: true })).toBeDisabled();
  await picker.scrollIntoViewIfNeeded();
  expect(await picker.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await picker.screenshot({ path: 'test-results/leave-picker-mobile.png' });
  await page.keyboard.press('Escape');
  await expect(picker).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: 'Choose start date' })).toBeFocused();
});
