import { test, expect } from '@playwright/test';

async function mockSession(page, handler) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    const payload = btoa(JSON.stringify({
      user_id: 90, employee_id: 90, role: 'HR', username: 'UI Test', exp: 4102444800,
    }));
    localStorage.setItem('access_token', `test.${payload}.test`);
  });
  await page.route(url => url.pathname.startsWith('/api/'), async route => {
    if (handler && await handler(route)) return;
    await route.fulfill({ json: { count: 0, results: [], summary: {} } });
  });
  return errors;
}

test('mobile navigation contains focus, closes with Escape, and restores its trigger', async ({ page }) => {
  const errors = await mockSession(page);
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/my-leaves');
  const trigger = page.getByRole('button', { name: 'Open navigation', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Main navigation', exact: true });
  await expect(dialog).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  for (let index = 0; index < 20; index += 1) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('notification panel fits a narrow viewport and closes back to its trigger', async ({ page }) => {
  const errors = await mockSession(page, async route => {
    if (new URL(route.request().url()).pathname.endsWith('/notifications/summary/')) {
      await route.fulfill({ json: { unread_updates: 0, action_required: 0 } });
      return true;
    }
    return false;
  });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/my-leaves');
  const trigger = page.getByRole('button', { name: /^Notifications:/ });
  await trigger.click();
  const panel = page.getByRole('region', { name: 'Notifications', exact: true });
  await expect(panel).toBeVisible();
  await expect(panel.getByText('No tasks requiring action', { exact: true })).toBeVisible();
  const box = await panel.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(320);
  expect(await panel.evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(255, 255, 255)');
  await panel.getByRole('button', { name: 'Close notifications' }).focus();
  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(errors).toEqual([]);
});

test('attendance failures show a retry rather than an empty record', async ({ page }) => {
  let failed = true;
  await mockSession(page, async route => {
    if (new URL(route.request().url()).pathname === '/api/attendance/') {
      await route.fulfill(failed
        ? { status: 503, json: { detail: 'Unavailable' } }
        : { json: { count: 0, results: [] } });
      return true;
    }
    return false;
  });
  await page.goto('/attendance');
  await expect(page.getByRole('heading', { name: 'Attendance records could not load' })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/No attendance records for this month/)).toHaveCount(0);
  failed = false;
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByText(/No attendance records for this month/)).toBeVisible();
});

test('employee names are keyboard links and leave balances keep their precision', async ({ page }) => {
  const employee = {
    id: 21, first_name: 'Test', last_name: 'Employee', position: null, department: null,
    leave_balance: '12.75', date_hired: null, user_details: { email: '' },
  };
  const errors = await mockSession(page, async route => {
    if (new URL(route.request().url()).pathname === '/api/employees/') {
      await route.fulfill({ json: { count: 1, results: [employee] } });
      return true;
    }
    return false;
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/employees');
  const main = page.getByRole('main');
  await expect(main.getByText('12.75 credits', { exact: true })).toBeVisible();
  await expect(main.getByText('Teacher I', { exact: true })).toHaveCount(0);
  const name = main.getByRole('link', { name: 'Test Employee', exact: true }).filter({ visible: true });
  await expect(name).toHaveAttribute('href', '/employees/21');
  await name.focus();
  await expect(name).toBeFocused();
  expect(errors).toEqual([]);
});

test('PDS import exposes a labelled chooser and applies reviewed extraction to the employee form', async ({ page }) => {
  const errors = await mockSession(page, async route => {
    if (new URL(route.request().url()).pathname === '/api/pds/extract/') {
      await route.fulfill({ json: { extracted_data: { first_name: 'Extracted', last_name: 'Employee' } } });
      return true;
    }
    return false;
  });
  await page.goto('/employees');
  const trigger = page.getByRole('button', { name: 'Add Existing Employee' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'New Employee Record' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Import PDS', exact: true }).click();
  await dialog.getByLabel('PDS document (PDF)', { exact: true }).setInputFiles({
    name: 'test-pds.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF'),
  });
  await dialog.getByRole('button', { name: 'Extract details', exact: true }).click();
  await expect(dialog.getByLabel('First name', { exact: true })).toHaveValue('Extracted');
  await dialog.getByRole('button', { name: 'Apply to employee form' }).click();
  await expect(dialog.getByRole('button', { name: 'Import PDS', exact: true })).toBeVisible();
  await expect(dialog.locator('input[name="first_name"]')).toHaveValue('Extracted');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(errors).toEqual([]);
});

async function mockProfile(page, documents = []) {
  return mockSession(page, async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/employees/me/') {
      await route.fulfill({ json: {
        id: 90, first_name: 'Profile', last_name: 'Fixture', umid_id: 'TEST-ID',
        user_details: { role: 'HR', email: '' }, education: [], family: [], work_experience: [], eligibilities: [],
      } });
      return true;
    }
    if (path === '/api/employee-documents/') {
      await route.fulfill({ json: { count: documents.length, results: documents } });
      return true;
    }
    return false;
  });
}

test('an ID number without an attachment cannot produce a verified card or fake download', async ({ page }) => {
  const errors = await mockProfile(page);
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'No workstation recorded' })).toBeVisible();
  await expect(page.getByText(/13\.9374, 121\.6171/)).toHaveCount(0);
  await page.getByRole('button', { name: 'Government IDs', exact: true }).click();
  await page.getByRole('button', { name: 'Attachment details', exact: true }).first().click();
  const dialog = page.getByRole('dialog', { name: 'UMID Card', exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/No attachment is available/)).toBeVisible();
  await expect(dialog.getByRole('link')).toHaveCount(0);
  await expect(dialog.getByText('Verified', { exact: true })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Attachment details', exact: true }).first()).toBeFocused();
  expect(errors).toEqual([]);
});

test('a saved ID attachment previews its actual file', async ({ page }) => {
  const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aC1sAAAAASUVORK5CYII=';
  const errors = await mockProfile(page, [{
    id: 14, employee: 90, document_type: 'umid_id', file_name: 'uploaded-id.png',
    file_url: image, verified: false, uploaded_at: '2026-11-18T08:00:00Z',
  }]);
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Government IDs', exact: true }).click();
  await page.getByRole('button', { name: 'Preview attachment', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'UMID Card', exact: true });
  await expect(dialog.getByRole('img', { name: 'UMID Card', exact: true })).toHaveAttribute('src', image);
  await expect(dialog.getByRole('link', { name: 'Download attachment' })).toHaveAttribute('href', image);
  const download = page.waitForEvent('download');
  await dialog.getByRole('link', { name: 'Download attachment' }).click();
  expect((await download).suggestedFilename()).toBe('uploaded-id.png');
  await dialog.getByRole('button', { name: 'Close preview', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('loan review is a labelled native dialog with keyboard dismissal', async ({ page }) => {
  const errors = await mockSession(page, async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/loans/') {
      await route.fulfill({ json: { count: 1, results: [{
        id: 21, employee: 21, employee_name: 'Loan Fixture', status: 'pending',
        loan_amount: '10000.00', monthly_payment: '900.00', total_amount: '10800.00',
        interest_rate: '8.00', term_months: 12, purpose: 'general', date_applied: '2026-11-01',
      }] } });
      return true;
    }
    return false;
  });
  await page.goto('/loan-management');
  const trigger = page.getByRole('button', { name: 'Review', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Provident Fund Loan Review', exact: true });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate(element => element.tagName)).toBe('DIALOG');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(errors).toEqual([]);
});

for (const scenario of [
  { path: '/recruitment', trigger: 'Encode Applicant Profile', dialog: 'Register Applicant' },
  { path: '/my-performance', trigger: 'Submit Signed IPCRF Portfolio', dialog: 'Encode RPMS / IPCRF Evaluation' },
]) {
  test(`${scenario.path} opens the accessible feature dialog`, async ({ page }) => {
    const errors = await mockSession(page);
    await page.goto(scenario.path);
    const trigger = page.getByRole('button', { name: scenario.trigger, exact: true });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: scenario.dialog, exact: true });
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate(element => element.tagName)).toBe('DIALOG');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect(errors).toEqual([]);
  });
}

test('ID verification submits the saved document ID and displays the refreshed server status', async ({ page }) => {
  const document = {
    id: 14, employee: 90, document_type: 'umid_id', file_name: 'uploaded-id.pdf',
    file_url: 'http://localhost:8000/media/uploaded-id.pdf', verified: false, uploaded_at: '2026-11-18T08:00:00Z',
  };
  const writes = [];
  const errors = await mockSession(page, async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/api/employees/me/') {
      await route.fulfill({ json: { id: 90, first_name: 'Profile', last_name: 'Fixture', user_details: { role: 'HR' } } });
      return true;
    }
    if (path === '/api/employee-documents/14/verify/') {
      writes.push(request.postDataJSON());
      document.verified = request.postDataJSON().verified;
      await route.fulfill({ json: document });
      return true;
    }
    if (path === '/api/employee-documents/') {
      await route.fulfill({ json: { count: 1, results: [document] } });
      return true;
    }
    return false;
  });
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Government IDs', exact: true }).click();
  await expect(page.getByText('Status: Document not verified', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Verify document', exact: true }).click();
  await expect(page.getByText('Status: Document verified', { exact: true })).toBeVisible();
  expect(writes).toEqual([{ verified: true }]);
  expect(errors).toEqual([]);
});

test('profile editing has labelled readable fields and restores focus on a narrow screen', async ({ page }, testInfo) => {
  const errors = await mockProfile(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/profile');
  const trigger = page.getByRole('button', { name: 'Edit Profile', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const firstName = dialog.getByLabel('First Name', { exact: true });
  await expect(firstName).toHaveValue('Profile');
  expect(await firstName.evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(14);
  expect((await firstName.boundingBox()).height).toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: testInfo.outputPath('profile-form-mobile.png') });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(errors).toEqual([]);
});
