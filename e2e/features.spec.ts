import { test, expect } from '@playwright/test';

test.describe('Core Features', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/');
    await page
      .getByLabel(/почта|телефон|email/i)
      .first()
      .fill('admin@cybersec.lab');
    await page
      .getByLabel(/пароль/i)
      .first()
      .fill('Admin@123');
    await page.getByRole('button', { name: /войти/i }).click();
    await expect(page.getByRole('heading', { name: /панель/i })).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to OWASP Top 10 module', async ({ page }) => {
    await page.getByRole('button', { name: /OWASP/i }).click();
    await expect(page.getByRole('heading', { name: /OWASP Top 10/i })).toBeVisible();
  });

  test('should navigate to SQL Injection lab', async ({ page }) => {
    await page.getByRole('button', { name: /SQL/i }).click();
    await expect(page.getByRole('heading', { name: /SQL/i })).toBeVisible();
  });

  test('should navigate to Quiz system', async ({ page }) => {
    await page.getByRole('button', { name: /квиз|тест/i }).click();
    await expect(page.getByRole('heading', { name: /квиз|тестирование/i })).toBeVisible();
  });

  test('should display sidebar with all modules', async ({ page }) => {
    const sidebar = page.getByRole('navigation');
    await expect(sidebar).toBeVisible();

    // Check key modules are present
    await expect(sidebar.getByText(/OWASP/i)).toBeVisible();
    await expect(sidebar.getByText(/SQL/i)).toBeVisible();
    await expect(sidebar.getByText(/XSS/i)).toBeVisible();
    await expect(sidebar.getByText(/CSRF/i)).toBeVisible();
    await expect(sidebar.getByText(/квиз|тест/i)).toBeVisible();
  });

  test('should access profile page', async ({ page }) => {
    await page.getByRole('button', { name: /профиль/i }).click();
    await expect(page.getByRole('heading', { name: /профиль/i })).toBeVisible();
  });
});
