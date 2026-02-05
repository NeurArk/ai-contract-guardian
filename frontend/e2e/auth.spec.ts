import { test, expect } from '@playwright/test';

function makeTestUser(prefix: string) {
  // Short unique suffix to stay under 50 chars total (backend constraint).
  const ts = Date.now().toString(36); // base36, shorter than decimal
  const rand = Math.floor(Math.random() * 1e6).toString(36);
  return {
    email: `${prefix}${ts}${rand}@ex.com`,
    password: 'TestPassword123!',
  };
}

const TEST_USER = makeTestUser('test');

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should register a new user successfully', async ({ page }) => {
    // Navigate to register page
    await page.getByRole('link', { name: /créer un compte/i }).click();
    await expect(page).toHaveURL(/.*register/);

    // Fill registration form
    await page.fill('input[id="email"]', TEST_USER.email);
    await page.fill('input[id="password"]', TEST_USER.password);
    await page.fill('input[id="confirmPassword"]', TEST_USER.password);

    // Submit form
    await page.getByRole('button', { name: /créer mon compte/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    
    // Should show dashboard heading
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    const user = makeTestUser('login');

    // First register a user (setup)
    await page.goto('/register');
    await page.fill('input[id="email"]', user.email);
    await page.fill('input[id="password"]', user.password);
    await page.fill('input[id="confirmPassword"]', user.password);
    await page.getByRole('button', { name: /créer mon compte/i }).click();
    await page.waitForURL(/.*dashboard/, { timeout: 15000 });
    
    // Logout - use button role or specific selector
    await page.getByRole('button', { name: /déconnexion/i }).click();
    await expect(page).toHaveURL(/.*login/);

    // Login with valid credentials
    await page.fill('input[id="email"]', user.email);
    await page.fill('input[id="password"]', user.password);
    await page.getByRole('button', { name: /se connecter/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // Navigate to login and wait for form
    await page.goto('/login');
    await page.waitForSelector('input[id="email"]', { timeout: 10000 });

    // Fill with invalid credentials
    await page.fill('input[id="email"]', 'invalid@example.com');
    await page.fill('input[id="password"]', 'wrongpassword');

    // Submit form
    await page.getByRole('button', { name: /se connecter/i }).click();

    // Should show error alert (backend returns "Email ou mot de passe incorrect")
    await expect(page.locator('[data-slot="alert"]')).toContainText(/email ou mot de passe|erreur|network/i, { timeout: 5000 });
    
    // Should stay on login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('should logout successfully', async ({ page }) => {
    // Register and login first
    await page.goto('/register');
    const uniqueEmail = `logouttest${Date.now()}@example.com`;
    await page.fill('input[id="email"]', uniqueEmail);
    await page.fill('input[id="password"]', TEST_USER.password);
    await page.fill('input[id="confirmPassword"]', TEST_USER.password);
    await page.getByRole('button', { name: /créer mon compte/i }).click();
    await page.waitForURL(/.*dashboard/, { timeout: 30000 });
    await page.waitForLoadState("networkidle");

    // Click logout
    await page.getByRole('button', { name: /déconnexion/i }).click();

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
    
    // Login form should be visible
    await expect(page.getByText('Connexion')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/register');
    await page.waitForSelector('input[id="email"]', { timeout: 10000 });
    
    // Fill with invalid email
    // Use an email that passes native HTML validation but fails Zod validation
    await page.fill('input[id="email"]', 'a@b.c');
    await page.fill('input[id="password"]', TEST_USER.password);
    await page.fill('input[id="confirmPassword"]', TEST_USER.password);
    
    // Submit form
    await page.getByRole('button', { name: /créer mon compte/i }).click();
    
    // Should show validation error (react-hook-form zod message)
    await expect(page.locator('text=/email invalide/i')).toBeVisible();
  });

  test('should validate password length', async ({ page }) => {
    await page.goto('/register');
    await page.waitForSelector('input[id="email"]', { timeout: 10000 });
    
    // Fill with short password
    await page.fill('input[id="email"]', TEST_USER.email);
    await page.fill('input[id="password"]', '123');
    await page.fill('input[id="confirmPassword"]', '123');
    
    // Submit form
    await page.getByRole('button', { name: /créer mon compte/i }).click();
    
    // Should show validation error
    await expect(page.locator('text=/8 caractères|at least 8/i')).toBeVisible();
  });

  test('should validate password confirmation match', async ({ page }) => {
    await page.goto('/register');
    await page.waitForSelector('input[id="email"]', { timeout: 10000 });
    
    // Fill with mismatched passwords
    await page.fill('input[id="email"]', TEST_USER.email);
    await page.fill('input[id="password"]', TEST_USER.password);
    await page.fill('input[id="confirmPassword"]', 'DifferentPassword123!');
    
    // Submit form
    await page.getByRole('button', { name: /créer mon compte/i }).click();
    
    // Should show validation error
    await expect(page.locator('text=/ne correspondent pas|don\'t match/i')).toBeVisible();
  });
});
