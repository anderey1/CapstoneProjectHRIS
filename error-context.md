# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: hris.spec.js >> HRIS Core Workflows >> Employee applies for Leave
- Location: tests\hris.spec.js:22:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=Leaves')

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e9]:
    - generic [ref=e10]:
      - img [ref=e12]
      - heading "DEPED LUCENA HRIS" [level=1] [ref=e15]
      - paragraph [ref=e18]: Secure Access Gateway
    - generic [ref=e19]:
      - generic [ref=e20]:
        - text: Username
        - generic [ref=e21]:
          - generic:
            - img
          - textbox "Official username" [ref=e22]
      - generic [ref=e23]:
        - generic [ref=e24]:
          - generic [ref=e25]: Password
          - button "Forgot Access?" [ref=e26]
        - generic [ref=e27]:
          - generic:
            - img
          - textbox "Account password" [ref=e28]
          - button [ref=e29]:
            - img [ref=e30]
      - button "Sign In to Portal" [ref=e33] [cursor=pointer]:
        - img [ref=e34]
        - text: Sign In to Portal
    - generic [ref=e37]:
      - generic [ref=e40]: Preview Build 2.0.4
      - paragraph [ref=e41]: Authorized Personnel Only. All access attempts are logged for security audit.
  - paragraph [ref=e43]: © 2026 DepEd Lucena City Division
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('HRIS Core Workflows', () => {
  4  |   
  5  |   test('Login and Dashboard access', async ({ page }) => {
  6  |     // 1. Visit Login
  7  |     await page.goto('/login');
  8  |     
  9  |     // 2. Perform Login (Assuming admin:password setup)
  10 |     await page.fill('input[name="username"]', 'admin');
  11 |     await page.fill('input[name="password"]', 'admin');
  12 |     await page.click('button[type="submit"]');
  13 |     
  14 |     // 3. Verify Redirect to Home
  15 |     await expect(page).toHaveURL('/');
  16 |     
  17 |     // 4. Check KPI cards visible
  18 |     await expect(page.locator('h1:has-text("Home")')).toBeVisible();
  19 |     await expect(page.locator('text=Total Staff')).toBeVisible();
  20 |   });
  21 | 
  22 |   test('Employee applies for Leave', async ({ page }) => {
  23 |     // Login as employee
  24 |     await page.goto('/login');
  25 |     await page.fill('input[name="username"]', 'teacher1');
  26 |     await page.fill('input[name="password"]', 'teacher1');
  27 |     await page.click('button[type="submit"]');
  28 |     
  29 |     // Navigate to Leave
> 30 |     await page.click('text=Leaves');
     |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  31 |     await expect(page.locator('h1:has-text("My Leaves")')).toBeVisible();
  32 |     
  33 |     // Open Modal
  34 |     await page.click('button:has-text("Apply")');
  35 |     
  36 |     // Fill form
  37 |     await page.selectOption('select[name="leave_type"]', 'sick');
  38 |     // Set future dates to avoid overlap with existing test data if any
  39 |     const tomorrow = new Date();
  40 |     tomorrow.setDate(tomorrow.getDate() + 5);
  41 |     const dayAfter = new Date();
  42 |     dayAfter.setDate(dayAfter.getDate() + 6);
  43 |     
  44 |     await page.fill('input[name="start_date"]', tomorrow.toISOString().split('T')[0]);
  45 |     await page.fill('input[name="end_date"]', dayAfter.toISOString().split('T')[0]);
  46 |     await page.fill('textarea[name="reason"]', 'E2E Testing');
  47 |     
  48 |     // Submit
  49 |     await page.click('button[type="submit"]');
  50 |     
  51 |     // Check for success alert
  52 |     page.on('dialog', async dialog => {
  53 |       expect(dialog.message()).toContain('success');
  54 |       await dialog.accept();
  55 |     });
  56 |   });
  57 | 
  58 |   test('Supervisor reviews and approves Loan', async ({ page }) => {
  59 |     // Login as supervisor
  60 |     await page.goto('/login');
  61 |     await page.fill('input[name="username"]', 'supervisor');
  62 |     await page.fill('input[name="password"]', 'supervisor');
  63 |     await page.click('button[type="submit"]');
  64 |     
  65 |     // Navigate to Loans Management
  66 |     await page.click('text=Loans');
  67 |     await expect(page.locator('h1:has-text("Loan Review")')).toBeVisible();
  68 |     
  69 |     // Check "Wait Release" tab exists for Accountant role visibility
  70 |     await expect(page.locator('button:has-text("Wait Release")')).toBeVisible();
  71 |   });
  72 | 
  73 | });
  74 | 
```