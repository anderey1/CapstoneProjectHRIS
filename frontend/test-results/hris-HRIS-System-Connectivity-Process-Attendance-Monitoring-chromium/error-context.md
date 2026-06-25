# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: hris.spec.js >> HRIS System Connectivity >> Process: Attendance Monitoring
- Location: tests\hris.spec.js:43:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h1:has-text("Daily Records")')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('h1:has-text("Daily Records")')

```

```yaml
- link "DepEd Lucena HR Management":
  - /url: /
- text: System Ready
- button "admin TEACHING avatar":
  - text: admin TEACHING
  - img "avatar"
- main:
  - heading "Check In / Out" [level=1]
  - paragraph: Wednesday, June 24
  - paragraph: Station
  - paragraph: Main Office
  - heading "Time Clock Recorder" [level=2]
  - paragraph: Click the button below to submit your daily clock stamp
  - button "Submit Attendance Log"
  - text: Standard DTR Logging Active Location services disabled (defaulting coordinates)
  - heading "Recent Activity" [level=3]
  - table:
    - rowgroup:
      - row "Date AM In/Out PM In/Out OT In/Out Status":
        - columnheader "Date"
        - columnheader "AM In/Out"
        - columnheader "PM In/Out"
        - columnheader "OT In/Out"
        - columnheader "Status"
    - rowgroup:
      - row "No attendance history":
        - cell "No attendance history"
- img "Seal"
- heading "DEPED HRIS" [level=2]
- paragraph: Lucena Division
- navigation:
  - heading "Main" [level=3]
  - link "Home":
    - /url: /
  - heading "Time & Leave" [level=3]
  - link "Attendance":
    - /url: /attendance
  - link "Daily Record":
    - /url: /dtr
  - link "Leaves":
    - /url: /leave
  - heading "Money" [level=3]
  - link "Payroll":
    - /url: /payroll
  - heading "Settings" [level=3]
  - link "My Profile":
    - /url: /profile
- text: a
- paragraph: admin
- paragraph: TEACHING
- button "Sign Out"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * HRIS E2E Process Verification
  5  |  * 
  6  |  * Tests core business logic connectivity between Frontend and Backend.
  7  |  * Note: Assumes 'admin' / 'admin' credentials exist in the local database.
  8  |  */
  9  | test.describe('HRIS System Connectivity', () => {
  10 | 
  11 |   test.beforeEach(async ({ page }) => {
  12 |     // Print console logs and request/response failures
  13 |     page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  14 |     page.on('requestfailed', req => console.log('BROWSER REQUEST FAILED:', req.url(), req.failure()?.errorText));
  15 |     page.on('response', res => {
  16 |       if (res.status() >= 400) {
  17 |         console.log('BROWSER API ERROR:', res.url(), res.status());
  18 |       }
  19 |     });
  20 | 
  21 |     // 1. Visit Login
  22 |     await page.goto('/login');
  23 |     
  24 |     // 2. Perform Login as Admin (Assuming admin:admin)
  25 |     await page.fill('input[name="username"]', 'admin');
  26 |     await page.fill('input[name="password"]', 'admin');
  27 |     await page.click('button[type="submit"]');
  28 |     
  29 |     // 3. Verify Dashboard Load
  30 |     await expect(page).toHaveURL('/', { timeout: 10000 });
  31 |   });
  32 | 
  33 |   test('Process: Staff Management Visibility', async ({ page }) => {
  34 |     // Navigate to Employees
  35 |     await page.click('text=Employees');
  36 |     await expect(page.locator('h1:has-text("Employees")')).toBeVisible();
  37 |     
  38 |     // Verify Data Table loaded (Wait for first row or empty state)
  39 |     const tableRow = page.locator('table tbody tr').first();
  40 |     await expect(tableRow).toBeVisible();
  41 |   });
  42 | 
  43 |   test('Process: Attendance Monitoring', async ({ page }) => {
  44 |     // Navigate to Daily Records
  45 |     await page.click('text=Attendance');
> 46 |     await expect(page.locator('h1:has-text("Daily Records")')).toBeVisible();
     |                                                                ^ Error: expect(locator).toBeVisible() failed
  47 |     
  48 |     // Verify Map is rendered
  49 |     await expect(page.locator('.leaflet-container')).toBeVisible();
  50 |   });
  51 | 
  52 |   test('Process: Payroll Management Flow', async ({ page }) => {
  53 |     // Navigate to Payroll
  54 |     await page.click('text=Payroll');
  55 |     await expect(page.locator('h1:has-text("Payroll Management")')).toBeVisible();
  56 |     
  57 |     // Verify Generation Step is present
  58 |     await expect(page.locator('text=1. Generate Draft')).toBeVisible();
  59 |   });
  60 | 
  61 |   test('Process: Loan Application Review', async ({ page }) => {
  62 |     // Navigate to Loans
  63 |     await page.click('text=Loans');
  64 |     await expect(page.locator('h1:has-text("Loan Review")')).toBeVisible();
  65 |     
  66 |     // Verify Status Tabs are present
  67 |     await expect(page.locator('button:has-text("Pending")')).toBeVisible();
  68 |   });
  69 | 
  70 | });
  71 | 
```