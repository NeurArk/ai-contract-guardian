import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: `test${Date.now()}@example.com`,
  password: 'TestPassword123!',
};

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should register a new user successfully', async ({ page }) => {
    // Navigate to register page
    await page.click('text=Créer un compte');
    await expect(page).toHaveURL(/.*register/);

    // Fill registration form
    await page.fill('input[id="email"]', TEST_USER.email);
    await page.fill('input[id="password"]', TEST_USER.password);
    await page.fill('input[id="confirmPassword"]', TEST_USER.password);

    // Submit form
    await page.click('button:has-text("Créer mon compte")');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    
    // Should show dashboard content
    await expect(page.locator('text=Tableau de bord')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    // First register a user (setup)
    await page.goto('/register');
    await page.fill('input[id="email"]', TEST_USER.email);
    await page.fill('input[id="password"]', TEST_USER.password);
    await page.fill('input[id="confirmPassword"]', TEST_USER.password);
    await page.click('button:has-text("Créer mon compte")');
    await page.waitForURL(/.*dashboard/, { timeout: 10000 });
    
    // Logout
    await page.click('text=Déconnexion');
    await expect(page).toHaveURL(/.*login/);

    // Login with valid credentials
    await page.fill('input[id="email"]', TEST_USER.email);
    await page.fill('input[id="password"]', TEST_USER.password);
    await page.click('button:has-text("Se connecter")');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    await expect(page.locator('text=Tableau de bord')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');

    // Fill with invalid credentials
    await page.fill('input[id="email"]', 'invalid@example.com');
    await page.fill('input[id="password"]', 'wrongpassword');

    // Submit form
    await page.click('button:has-text("Se connecter")');

    // Should show error message
    await expect(page.locator('text=/Erreur de connexion|identifiants incorrects/i')).toBeVisible({ timeout: 5000 });
    
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
    await page.click('button:has-text("Créer mon compte")');
    await page.waitForURL(/.*dashboard/, { timeout: 10000 });

    // Click logout
    await page.click('text=Déconnexion');

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
    
    // Login form should be visible
    await expect(page.locator('text=Connexion')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/register');
    
    // Fill with invalid email
    await page.fill('input[id="email"]', 'not-an-email');
    await page.fill('input[id="password"]', TEST_USER.password);
    await page.fill('input[id="confirmPassword"]', TEST_USER.password);
    
    // Submit form
    await page.click('button:has-text("Créer mon compte")');
    
    // Should show validation error
    await expect(page.locator('text=Email invalide')).toBeVisible();
  });

  test('should validate password length', async ({ page }) => {
    await page.goto('/register');
    
    // Fill with short password
    await page.fill('input[id="email"]', TEST_USER.email);
    await page.fill('input[id="password"]', '123');
    await page.fill('input[id="confirmPassword"]', '123');
    
    // Submit form
    await page.click('button:has-text("Créer mon compte")');
    
    // Should show validation error
    await expect(page.locator('text=/8 caractères|at least 8/i')).toBeVisible();
  });

  test('should validate password confirmation match', async ({ page }) => {
    await page.goto('/register');
    
    // Fill with mismatched passwords
    await page.fill('input[id="email"]', TEST_USER.email);
    await page.fill('input[id="password"]', TEST_USER.password);
    await page.fill('input[id="confirmPassword"]', 'DifferentPassword123!');
    
    // Submit form
    await page.click('button:has-text("Créer mon compte")');
    
    // Should show validation error
    await expect(page.locator('text=/ne correspondent pas|don\'t match/i')).toBeVisible();
  });
});
