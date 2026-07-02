# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: registration-2fa-binary.spec.ts >> Registration Flow >> should show validation errors for empty fields
- Location: e2e\registration-2fa-binary.spec.ts:9:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /зарегистрироваться/i })
    - locator resolved to <button type="submit" data-slot="button" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive text-primary-f…>Зарегистрироваться</button>
  - attempting click action
    - waiting for element to be visible, enabled and stable
  - element was detached from the DOM, retrying

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e6] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e7]:
      - img [ref=e8]
    - generic [ref=e11]:
      - button "Open issues overlay" [ref=e12]:
        - generic [ref=e13]:
          - generic [ref=e14]: "0"
          - generic [ref=e15]: "1"
        - generic [ref=e16]: Issue
      - button "Collapse issues badge" [ref=e17]:
        - img [ref=e18]
  - link "Перейти к основному содержимому" [ref=e20] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e22]:
    - generic [ref=e23]:
      - link [ref=e24] [cursor=pointer]:
        - /url: /
        - img [ref=e25]
      - heading "CyberSec Lab" [level=1] [ref=e27]
      - paragraph [ref=e28]: Information Security Trainer
    - generic [ref=e29]:
      - generic [ref=e30]:
        - generic [ref=e31]: Register
        - generic [ref=e32]: Create an account to start learning
      - generic [ref=e33]:
        - generic [ref=e34]:
          - generic [ref=e35]:
            - generic [ref=e36]: Full Name
            - textbox "Full Name" [ref=e37]:
              - /placeholder: Ivan Ivanov
          - generic [ref=e38]:
            - generic [ref=e39]:
              - generic [ref=e40]: Email
              - textbox "Email" [ref=e41]:
                - /placeholder: example@mail.com
            - generic [ref=e42]:
              - generic [ref=e43]: Phone
              - textbox "Phone" [ref=e44]:
                - /placeholder: +7 (999)...
          - generic [ref=e45]:
            - generic [ref=e46]: Role
            - radiogroup [ref=e47]:
              - generic [ref=e48] [cursor=pointer]:
                - radio "Student Study modules, take quizzes and complete lab work" [checked] [ref=e49]:
                  - img [ref=e50]
                - radio [checked]
                - generic [ref=e52]:
                  - generic [ref=e53]:
                    - img [ref=e54]
                    - generic [ref=e57]: Student
                  - paragraph [ref=e58]: Study modules, take quizzes and complete lab work
              - generic [ref=e59] [cursor=pointer]:
                - radio "Teacher Track student progress, manage groups and view analytics" [ref=e60]
                - radio
                - generic [ref=e61]:
                  - generic [ref=e62]:
                    - img [ref=e63]
                    - generic [ref=e68]: Teacher
                  - paragraph [ref=e69]: Track student progress, manage groups and view analytics
              - generic [ref=e70] [cursor=pointer]:
                - 'radio "Administrator Full access: user management, database, system settings" [ref=e71]'
                - radio
                - generic [ref=e72]:
                  - generic [ref=e73]:
                    - img [ref=e74]
                    - generic [ref=e77]: Administrator
                  - paragraph [ref=e78]: "Full access: user management, database, system settings"
          - generic [ref=e79]:
            - generic [ref=e80]: Password
            - generic [ref=e81]:
              - textbox "Password" [ref=e82]:
                - /placeholder: At least 8 characters
              - button "Show password" [ref=e83]:
                - img [ref=e84]
          - generic [ref=e87]:
            - generic [ref=e88]: Confirm Password
            - generic [ref=e89]:
              - textbox "Confirm Password" [ref=e90]:
                - /placeholder: Repeat password
              - button "Show password confirmation" [ref=e91]:
                - img [ref=e92]
          - button "Register" [ref=e95]
        - generic [ref=e96]:
          - paragraph [ref=e97]:
            - text: Already have an account?
            - link "Sign In" [ref=e98] [cursor=pointer]:
              - /url: /login
          - paragraph [ref=e99]:
            - link "← Back to Home" [ref=e100] [cursor=pointer]:
              - /url: /
  - region "Notifications alt+T"
  - generic [ref=e101]:
    - img [ref=e103]
    - button "Open Tanstack query devtools" [ref=e151] [cursor=pointer]:
      - img [ref=e152]
  - alert [ref=e200]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Registration Flow', () => {
  4   |   test('should display registration page', async ({ page }) => {
  5   |     await page.goto('/register');
  6   |     await expect(page.getByRole('heading', { name: /регистрация/i })).toBeVisible();
  7   |   });
  8   | 
  9   |   test('should show validation errors for empty fields', async ({ page }) => {
  10  |     await page.goto('/register');
> 11  |     await page.getByRole('button', { name: /зарегистрироваться/i }).click();
      |                                                                     ^ Error: locator.click: Test timeout of 30000ms exceeded.
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