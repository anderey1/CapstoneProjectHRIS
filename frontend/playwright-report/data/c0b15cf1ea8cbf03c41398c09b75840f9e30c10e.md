# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: hris.spec.js >> HRIS System Connectivity >> Process: Loan Application Review
- Location: tests\hris.spec.js:61:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=Loans')

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - generic [ref=e6]:
      - link "DepEd Lucena HR Management" [ref=e8] [cursor=pointer]:
        - /url: /
        - generic [ref=e9]: DepEd Lucena
        - generic [ref=e10]: HR Management
      - generic [ref=e14]: System Ready
      - button "admin TEACHING avatar" [ref=e17] [cursor=pointer]:
        - generic [ref=e18]:
          - generic [ref=e19]: admin
          - generic [ref=e20]: TEACHING
        - img "avatar" [ref=e23]
        - img [ref=e24]
    - main [ref=e26]:
      - generic [ref=e28]:
        - generic [ref=e29]:
          - img [ref=e31]
          - generic [ref=e34]:
            - generic [ref=e35]:
              - generic [ref=e36]:
                - img [ref=e37]
                - text: "Service Status: Active"
              - generic [ref=e40]:
                - heading "MABUHAY, admin" [level=1] [ref=e41]
                - paragraph [ref=e42]: System User • Management
              - generic [ref=e43]:
                - link "Clock In/Out" [ref=e44] [cursor=pointer]:
                  - /url: /attendance
                  - img [ref=e45]
                  - text: Clock In/Out
                - link "Request Leave" [ref=e48] [cursor=pointer]:
                  - /url: /leave
            - generic [ref=e49]:
              - generic [ref=e50]:
                - img [ref=e51]
                - text: Division Office
              - generic [ref=e54]:
                - generic [ref=e55]:
                  - paragraph [ref=e56]: Leaves
                  - paragraph [ref=e57]: "0"
                - generic [ref=e59]:
                  - paragraph [ref=e60]: Step
                  - paragraph [ref=e61]: SG N/A
        - generic [ref=e62]:
          - generic [ref=e63]:
            - generic [ref=e64]:
              - generic [ref=e65]:
                - img [ref=e67]
                - heading "Net Pay History" [level=3] [ref=e70]
              - link "View All" [ref=e71] [cursor=pointer]:
                - /url: /payroll
                - text: View All
                - img [ref=e72]
            - generic [ref=e75]:
              - img [ref=e76]
              - paragraph [ref=e79]: No payroll records yet
            - paragraph [ref=e82]: Your net salary trend reflects regular semi-monthly disbursements and statutory deductions.
          - generic [ref=e83]:
            - generic [ref=e84]:
              - img [ref=e86]
              - heading "Leave Credits" [level=3] [ref=e89]
            - generic [ref=e90]:
              - generic [ref=e92]:
                - paragraph [ref=e93]: Vacation Leave
                - paragraph [ref=e94]: 0DAYS
              - generic [ref=e97]:
                - paragraph [ref=e98]: Sick Leave
                - paragraph [ref=e99]: 0DAYS
            - generic [ref=e101]:
              - generic [ref=e102]:
                - paragraph [ref=e103]: Total Available
                - paragraph [ref=e104]: 0 Credits
              - paragraph [ref=e105]: Based on the latest Civil Service Commission standardized balances.
          - generic [ref=e106]:
            - generic [ref=e107]:
              - img [ref=e109]
              - generic [ref=e112]:
                - paragraph [ref=e113]: Service Rank
                - paragraph [ref=e114]: System User
            - generic [ref=e115]:
              - img [ref=e117]
              - generic [ref=e120]:
                - paragraph [ref=e121]: Primary School
                - paragraph [ref=e122]: Division Office
            - generic [ref=e123]:
              - img [ref=e125]
              - generic [ref=e128]:
                - paragraph [ref=e129]: Work Shift
                - paragraph [ref=e130]: Standard 8:00 - 5:00
  - generic [ref=e131]:
    - generic "close sidebar"
    - generic [ref=e132]:
      - generic [ref=e134]:
        - img "Seal" [ref=e136]
        - generic [ref=e137]:
          - heading "DEPED HRIS" [level=2] [ref=e138]
          - paragraph [ref=e139]: Lucena Division
      - navigation [ref=e140]:
        - generic [ref=e141]:
          - heading "Main" [level=3] [ref=e142]
          - link "Home" [ref=e144] [cursor=pointer]:
            - /url: /
            - generic [ref=e145]:
              - img [ref=e147]
              - generic [ref=e152]: Home
            - img [ref=e153]
        - generic [ref=e155]:
          - heading "Time & Leave" [level=3] [ref=e156]
          - generic [ref=e157]:
            - link "Attendance" [ref=e158] [cursor=pointer]:
              - /url: /attendance
              - generic [ref=e159]:
                - img [ref=e161]
                - generic [ref=e164]: Attendance
              - img [ref=e165]
            - link "Daily Record" [ref=e167] [cursor=pointer]:
              - /url: /dtr
              - generic [ref=e168]:
                - img [ref=e170]
                - generic [ref=e173]: Daily Record
              - img [ref=e174]
            - link "Leaves" [ref=e176] [cursor=pointer]:
              - /url: /leave
              - generic [ref=e177]:
                - img [ref=e179]
                - generic [ref=e182]: Leaves
              - img [ref=e183]
        - generic [ref=e185]:
          - heading "Money" [level=3] [ref=e186]
          - link "Payroll" [ref=e188] [cursor=pointer]:
            - /url: /payroll
            - generic [ref=e189]:
              - img [ref=e191]
              - generic [ref=e194]: Payroll
            - img [ref=e195]
        - generic [ref=e197]:
          - heading "Settings" [level=3] [ref=e198]
          - link "My Profile" [ref=e200] [cursor=pointer]:
            - /url: /profile
            - generic [ref=e201]:
              - img [ref=e203]
              - generic [ref=e207]: My Profile
            - img [ref=e208]
      - generic [ref=e210]:
        - generic [ref=e211]:
          - generic [ref=e213]: a
          - generic [ref=e214]:
            - paragraph [ref=e215]: admin
            - paragraph [ref=e216]: TEACHING
        - button "Sign Out" [ref=e217] [cursor=pointer]:
          - img [ref=e218]
          - generic [ref=e221]: Sign Out
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
  46 |     await expect(page.locator('h1:has-text("Daily Records")')).toBeVisible();
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
> 63 |     await page.click('text=Loans');
     |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  64 |     await expect(page.locator('h1:has-text("Loan Review")')).toBeVisible();
  65 |     
  66 |     // Verify Status Tabs are present
  67 |     await expect(page.locator('button:has-text("Pending")')).toBeVisible();
  68 |   });
  69 | 
  70 | });
  71 | 
```