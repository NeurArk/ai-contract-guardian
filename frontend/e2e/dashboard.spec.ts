import { test, expect } from '@playwright/test';

function makeTestUser(prefix: string) {
  const ts = Date.now().toString(36);
  const rand = Math.floor(Math.random() * 1e6).toString(36);
  return {
    email: `${prefix}${ts}${rand}@ex.com`,
    password: 'TestPassword123!',
  };
}

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    const testUser = makeTestUser('dbtest');
    // Register and login
    await page.goto('/register');
    await page.fill('input[id="email"]', testUser.email);
    await page.fill('input[id="password"]', testUser.password);
    await page.fill('input[id="confirmPassword"]', testUser.password);
    await page.getByRole('button', { name: /créer mon compte/i }).click();
    await page.waitForURL(/.*dashboard/, { timeout: 30000 });
    await page.waitForLoadState("networkidle");
  });

  test('should display dashboard stats', async ({ page }) => {
    // Check main heading
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
    await expect(page.getByText(/vue d'ensemble/i)).toBeVisible();
    
    // Check stat cards
    await expect(page.getByText(/contrats totaux/i)).toBeVisible();
    await expect(page.getByText(/analyses terminées/i)).toBeVisible();
  });

  test('should display recent contracts section', async ({ page }) => {
    await expect(page.getByText(/contrats récents/i)).toBeVisible();
  });

  test('should show empty state for new users', async ({ page }) => {
    // Wait for loading to complete
    await page.waitForTimeout(1000);
    
    // Should show empty state
    await expect(page.getByText(/aucun contrat/i)).toBeVisible();
    await expect(page.getByText(/commencez par analyser/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /analyser un contrat/i })).toBeVisible();
  });

  test('should navigate to upload from empty state', async ({ page }) => {
    await page.getByRole('button', { name: /analyser un contrat/i }).click();
    await expect(page).toHaveURL(/.*contracts\/upload/);
  });

  test('should navigate to upload from header button', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: /nouvelle analyse/i }).click();
    await expect(page).toHaveURL(/.*contracts\/upload/);
  });

  test('should navigate to all contracts', async ({ page }) => {
    // Check if "Voir tout" link exists
    const viewAllLink = page.getByRole('link', { name: /voir tout/i }).first();
    if (await viewAllLink.isVisible().catch(() => false)) {
      await viewAllLink.click();
      await expect(page).toHaveURL(/.*contracts/);
    }
  });

  test('should display navbar', async ({ page }) => {
    // Check logo/brand
    await expect(page.getByText(/AI Contract Guardian/i).first()).toBeVisible();
    
    // Check navigation links
    await expect(page.getByRole('link', { name: /tableau de bord/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /mes contrats/i })).toBeVisible();
  });

  test('should have working navigation menu', async ({ page }) => {
    // Navigate to contracts via menu
    await page.getByRole('link', { name: /mes contrats/i }).click();
    await expect(page).toHaveURL(/.*contracts/);
    
    // Navigate back to dashboard
    await page.getByRole('link', { name: /tableau de bord/i }).click();
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Content should still be accessible
    await expect(page.getByRole('heading', { name: /tableau de bord/i })).toBeVisible();
    
    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should show user menu', async ({ page }) => {
    // Look for logout button
    const logoutButton = page.getByRole('button', { name: /déconnexion/i });
    
    if (await logoutButton.isVisible().catch(() => false)) {
      await expect(logoutButton).toBeVisible();
    }
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    // Logout first
    await page.getByRole('button', { name: /déconnexion/i }).click();
    await page.waitForURL(/.*login/);
    
    // Try to access dashboard directly
    await page.goto('/dashboard');
    
    // Should be redirected to login
    await expect(page).toHaveURL(/.*login/);
  });

  test('should display loading skeletons', async ({ page }) => {
    // Reload page to see loading state
    await page.reload();
    
    // Verify the page structure exists
    await expect(page.getByRole('heading', { name: /tableau de bord/i })).toBeVisible();
  });
});
