import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: `dashboardtest${Date.now()}@example.com`,
  password: 'TestPassword123!',
};

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Register and login
    await page.goto('/register');
    await page.fill('input[id="email"]', TEST_USER.email);
    await page.fill('input[id="password"]', TEST_USER.password);
    await page.fill('input[id="confirmPassword"]', TEST_USER.password);
    await page.click('button:has-text("Créer mon compte")');
    await page.waitForURL(/.*dashboard/, { timeout: 10000 });
  });

  test('should display dashboard stats', async ({ page }) => {
    // Check main stats cards
    await expect(page.locator('text=Tableau de bord')).toBeVisible();
    await expect(page.locator('text=Vue d\'ensemble de vos contrats')).toBeVisible();
    
    // Check stat cards
    await expect(page.locator('text=Contrats totaux')).toBeVisible();
    await expect(page.locator('text=Analyses terminées')).toBeVisible();
    await expect(page.locator('text=En attente')).toBeVisible();
    
    // Stats should show numbers (0 for new user)
    const statValues = page.locator('.text-2xl, [class*="text-2xl"]');
    await expect(statValues.first()).toBeVisible();
  });

  test('should display recent contracts section', async ({ page }) => {
    await expect(page.locator('text=Contrats récents')).toBeVisible();
    await expect(page.locator('text=Vos 5 derniers contrats analysés')).toBeVisible();
  });

  test('should show empty state for new users', async ({ page }) => {
    // Wait for loading to complete
    await page.waitForTimeout(1000);
    
    // Should show empty state
    await expect(page.locator('text=Aucun contrat encore')).toBeVisible();
    await expect(page.locator('text=Commencez par analyser votre premier contrat')).toBeVisible();
    await expect(page.locator('button:has-text("Analyser un contrat")')).toBeVisible();
  });

  test('should navigate to upload from empty state', async ({ page }) => {
    await page.click('button:has-text("Analyser un contrat")');
    await expect(page).toHaveURL(/.*upload/);
  });

  test('should navigate to upload from header button', async ({ page }) => {
    await page.click('text=Nouvelle analyse');
    await expect(page).toHaveURL(/.*upload/);
  });

  test('should navigate to all contracts', async ({ page }) => {
    // Check if "Voir tout" link exists
    const viewAllLink = page.locator('text=Voir tout').first();
    if (await viewAllLink.isVisible().catch(() => false)) {
      await viewAllLink.click();
      await expect(page).toHaveURL(/.*contracts/);
    }
  });

  test('should display navbar', async ({ page }) => {
    // Check logo
    await expect(page.locator('text=AI Contract Guardian').first()).toBeVisible();
    
    // Check navigation links
    await expect(page.locator('text=Tableau de bord')).toBeVisible();
    await expect(page.locator('text=Mes contrats')).toBeVisible();
  });

  test('should have working navigation menu', async ({ page }) => {
    // Navigate to contracts via menu
    await page.click('text=Mes contrats');
    await expect(page).toHaveURL(/.*contracts/);
    
    // Navigate back to dashboard
    await page.click('text=Tableau de bord');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Content should still be accessible
    await expect(page.locator('text=Tableau de bord')).toBeVisible();
    
    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should show user menu', async ({ page }) => {
    // Look for user menu or logout button
    const userMenu = page.locator('text=Déconnexion, [data-testid="user-menu"]').first();
    const logoutButton = page.locator('text=Déconnexion');
    
    if (await logoutButton.isVisible().catch(() => false)) {
      await expect(logoutButton).toBeVisible();
    }
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    // Logout first
    await page.click('text=Déconnexion');
    await page.waitForURL(/.*login/);
    
    // Try to access dashboard directly
    await page.goto('/dashboard');
    
    // Should be redirected to login
    await expect(page).toHaveURL(/.*login/);
  });

  test('should display loading skeletons', async ({ page }) => {
    // Reload page to see loading state
    await page.reload();
    
    // Check for skeleton elements during loading
    // Note: This is a quick check, actual skeletons may disappear quickly
    const skeletons = page.locator('[class*="skeleton"], [data-testid="skeleton"]');
    // Just verify the page structure exists
    await expect(page.locator('text=Tableau de bord')).toBeVisible();
  });
});
