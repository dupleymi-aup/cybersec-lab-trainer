# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: registration-2fa-binary.spec.ts >> Registration Flow >> should display registration page
- Location: e2e\registration-2fa-binary.spec.ts:4:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /регистрация/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: /регистрация/i })

```

```yaml
- link "Перейти к основному содержимому":
  - /url: "#main-content"
- link:
  - /url: /
- heading "CyberSec Lab" [level=1]
- paragraph: Information Security Trainer
- text: Register Create an account to start learning Full Name
- textbox "Full Name":
  - /placeholder: Ivan Ivanov
- text: Email
- textbox "Email":
  - /placeholder: example@mail.com
- text: Phone
- textbox "Phone":
  - /placeholder: +7 (999)...
- text: Role
- radiogroup:
  - radio "Student Study modules, take quizzes and complete lab work" [checked]
  - text: Student
  - paragraph: Study modules, take quizzes and complete lab work
  - radio "Teacher Track student progress, manage groups and view analytics"
  - text: Teacher
  - paragraph: Track student progress, manage groups and view analytics
  - 'radio "Administrator Full access: user management, database, system settings"'
  - text: Administrator
  - paragraph: "Full access: user management, database, system settings"
- text: Password
- textbox "Password":
  - /placeholder: At least 8 characters
- button "Show password"
- text: Confirm Password
- textbox "Confirm Password":
  - /placeholder: Repeat password
- button "Show password confirmation"
- button "Register"
- paragraph:
  - text: Already have an account?
  - link "Sign In":
    - /url: /login
- paragraph:
  - link "← Back to Home":
    - /url: /
- region "Notifications alt+T"
- button "Open Tanstack query devtools":
  - img
- alert
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Registration Flow', () => {
  4   |   test('should display registration page', async ({ page }) => {
  5   |     await page.goto('/register');
> 6   |     await expect(page.getByRole('heading', { name: /регистрация/i })).toBeVisible();
      |                                                                       ^ Error: expect(locator).toBeVisible() failed
  7   |   });
  8   | 
  9   |   test('should show validation errors for empty fields', async ({ page }) => {
  10  |     await page.goto('/register');
  11  |     await page.getByRole('button', { name: /зарегистрироваться/i }).click();
  12  |     // Should show validation error
  13  |     await expect(page.getByText(/заполните|обязательно/i)).toBeVisible({ timeout: 5000 });
  14  |   });
  15  | 
  16  |   test('should navigate to login from register', async ({ page }) => {
  17  |     await page.goto('/register');
  18  |     await page.getByRole('link', { name: /войти/i }).click();
  19  |     await expect(page).toHaveURL(/.*login/);
  20  |   });
  21  | });
  22  | 
  23  | test.describe('2FA Flow', () => {
  24  |   test('should show 2FA section in profile', async ({ page }) => {
  25  |     // Login first
  26  |     await page.goto('/');
  27  |     await page
  28  |       .getByLabel(/почта|телефон|email/i)
  29  |       .first()
  30  |       .fill('admin@cybersec.lab');
  31  |     await page
  32  |       .getByLabel(/пароль/i)
  33  |       .first()
  34  |       .fill('Admin@123');
  35  |     await page.getByRole('button', { name: /войти/i }).click();
  36  |     await expect(page.getByRole('heading', { name: /панель/i })).toBeVisible({ timeout: 10000 });
  37  | 
  38  |     // Navigate to profile
  39  |     await page.getByRole('button', { name: /профиль/i }).click();
  40  |     await expect(page.getByRole('heading', { name: /профиль/i })).toBeVisible();
  41  | 
  42  |     // Check 2FA section exists
  43  |     await expect(page.getByText(/двухфакторная/i)).toBeVisible();
  44  |   });
  45  | 
  46  |   test('should show 2FA setup button', async ({ page }) => {
  47  |     await page.goto('/');
  48  |     await page
  49  |       .getByLabel(/почта|телефон|email/i)
  50  |       .first()
  51  |       .fill('admin@cybersec.lab');
  52  |     await page
  53  |       .getByLabel(/пароль/i)
  54  |       .first()
  55  |       .fill('Admin@123');
  56  |     await page.getByRole('button', { name: /войти/i }).click();
  57  |     await expect(page.getByRole('heading', { name: /панель/i })).toBeVisible({ timeout: 10000 });
  58  | 
  59  |     await page.getByRole('button', { name: /профиль/i }).click();
  60  |     await expect(page.getByRole('heading', { name: /профиль/i })).toBeVisible();
  61  | 
  62  |     // Should have enable 2FA button
  63  |     await expect(page.getByRole('button', { name: /включить 2fa/i })).toBeVisible();
  64  |   });
  65  | });
  66  | 
  67  | test.describe('Binary & Reverse Engineering Module', () => {
  68  |   test.beforeEach(async ({ page }) => {
  69  |     await page.goto('/');
  70  |     await page
  71  |       .getByLabel(/почта|телефон|email/i)
  72  |       .first()
  73  |       .fill('admin@cybersec.lab');
  74  |     await page
  75  |       .getByLabel(/пароль/i)
  76  |       .first()
  77  |       .fill('Admin@123');
  78  |     await page.getByRole('button', { name: /войти/i }).click();
  79  |     await expect(page.getByRole('heading', { name: /панель/i })).toBeVisible({ timeout: 10000 });
  80  |   });
  81  | 
  82  |   test('should navigate to Binary & Reverse Engineering module', async ({ page }) => {
  83  |     await page.getByRole('button', { name: /Binary/i }).click();
  84  |     await expect(page.getByRole('heading', { name: /Binary.*Reverse/i })).toBeVisible();
  85  |   });
  86  | 
  87  |   test('should display challenges in Binary module', async ({ page }) => {
  88  |     await page.getByRole('button', { name: /Binary/i }).click();
  89  |     await expect(page.getByRole('heading', { name: /Binary.*Reverse/i })).toBeVisible();
  90  | 
  91  |     // Should show challenge content
  92  |     await expect(page.getByText(/hex|шестнадцатеричн/i)).toBeVisible();
  93  |   });
  94  | 
  95  |   test('should filter challenges by category', async ({ page }) => {
  96  |     await page.getByRole('button', { name: /Binary/i }).click();
  97  |     await expect(page.getByRole('heading', { name: /Binary.*Reverse/i })).toBeVisible();
  98  | 
  99  |     // Should show category filter buttons
  100 |     await expect(page.getByRole('button', { name: /все/i })).toBeVisible();
  101 |     await expect(page.getByRole('button', { name: /основы/i })).toBeVisible();
  102 |   });
  103 | });
  104 | 
```