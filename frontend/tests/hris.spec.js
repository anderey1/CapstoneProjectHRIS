import { test, expect } from '@playwright/test';

/**
 * HRIS E2E Process Verification
 * 
 * Tests core business logic connectivity between Frontend and Backend.
 * Note: Assumes 'admin' / 'admin' credentials exist in the local database.
 */
test.describe('HRIS System Connectivity', () => {

  test.beforeEach(async ({ page }) => {
    // 1. Visit Login
    await page.goto('/login');
    
    // 2. Perform Login as Admin (Assuming admin:admin)
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button[type="submit"]');
    
    // 3. Verify Dashboard Load
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('Process: Staff Management Visibility', async ({ page }) => {
    // Navigate to Employees
    await page.click('text=Employees');
    await expect(page.locator('h1:has-text("Employees")')).toBeVisible();
    
    // Verify Data Table loaded (Wait for first row or empty state)
    const tableRow = page.locator('table tbody tr').first();
    await expect(tableRow).toBeVisible();
  });

  test('Process: Attendance Monitoring', async ({ page }) => {
    // Navigate to Daily Records
    await page.click('text=Attendance');
    await expect(page.locator('h1:has-text("Daily Records")')).toBeVisible();
    
    // Verify Map is rendered
    await expect(page.locator('.leaflet-container')).toBeVisible();
  });

  test('Process: Payroll Management Flow', async ({ page }) => {
    // Navigate to Payroll
    await page.click('text=Payroll');
    await expect(page.locator('h1:has-text("Payroll Management")')).toBeVisible();
    
    // Verify Generation Step is present
    await expect(page.locator('text=1. Generate Draft')).toBeVisible();
  });

  test('Process: Loan Application Review', async ({ page }) => {
    // Navigate to Loans
    await page.click('text=Loans');
    await expect(page.locator('h1:has-text("Loan Review")')).toBeVisible();
    
    // Verify Status Tabs are present
    await expect(page.locator('button:has-text("Pending")')).toBeVisible();
  });

});
