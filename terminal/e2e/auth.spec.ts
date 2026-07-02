import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page when not authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/CyberSec Lab/);
    // Should show login form
    await expect(page.getByRole('heading', { name: /CyberSec Lab/i })).toBeVisible();
  });

  test('should login with default admin credentials', async ({ page }) => {
    await page.goto('/');
    // Fill login form
    await page.getByLabel(/почта|телефон|email/i).first().fill('admin@cybersec.lab');
    await page.getByLabel(/пароль/i).first().fill('Admin@123');
    await page.getByRole('button', { name: /войти/i }).click();

    // Should navigate to dashboard
    await expect(page.getByRole('heading', { name: /панель/i })).toBeVisible({ timeout: 10000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/почта|телефон|email/i).first().fill('wrong@test.com');
    await page.getByLabel(/пароль/i).first().fill('wrongpassword');
    await page.getByRole('button', { name: /войти/i }).click();

    // Should show error toast
    await expect(page.getByText(/неверный/i)).toBeVisible({ timeout: 5000 });
  });
});
