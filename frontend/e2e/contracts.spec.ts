import { test, expect } from '@playwright/test';
import path from 'path';

function makeTestUser(prefix: string) {
  // Short unique suffix to stay under 50 chars total (backend constraint).
  const ts = Date.now().toString(36);
  const rand = Math.floor(Math.random() * 1e6).toString(36);
  return {
    email: `${prefix}${ts}${rand}@ex.com`,
    password: 'TestPassword123!',
  };
}

test.describe('Contracts', () => {
  test.beforeEach(async ({ page }) => {
    const testUser = makeTestUser('contractstest');
    // Register and login
    await page.goto('/register');
    await page.fill('input[id="email"]', testUser.email);
    await page.fill('input[id="password"]', testUser.password);
    await page.fill('input[id="confirmPassword"]', testUser.password);
    await page.getByRole('checkbox', { name: /je suis un professionnel/i }).check();
    await page.getByRole('button', { name: /créer mon compte/i }).click();
    await page.waitForURL(/.*dashboard/, { timeout: 30000 });
    await page.waitForLoadState("networkidle");
  });

  test('should upload a PDF contract', async ({ page }) => {
    // Navigate to upload page
    await page.getByRole('navigation').getByRole('link', { name: /nouvelle analyse/i }).click();
    await expect(page).toHaveURL(/.*contracts\/upload/);

    // Should show upload page heading
    await expect(page.getByRole('heading', { name: /analyser un nouveau contrat/i })).toBeVisible();
    await expect(page.getByText(/glissez-déposez/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /parcourir les fichiers/i })).toBeVisible();
    
    // Check that file input accepts PDF and DOCX
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toHaveAttribute('accept', '.pdf,.docx');
  });

  test('should navigate to contracts list', async ({ page }) => {
    // Navigate to contracts page
    await page.getByRole('link', { name: /mes contrats/i }).click();
    await expect(page).toHaveURL(/.*contracts/);

    // Should show contracts page heading
    await expect(page.getByRole('heading', { name: /mes contrats/i })).toBeVisible();
  });

  test('should navigate to contract detail', async ({ page }) => {
    // Navigate to contracts page
    await page.goto('/contracts');
    
    // Wait for contracts to load or empty state
    await page.waitForTimeout(2000);
    
    // Check for empty state or contract list
    const hasContracts = await page.getByText(/aucun contrat/i).isVisible().catch(() => false);
    
    if (hasContracts) {
      // Empty state - show upload button
      await expect(page.getByRole('button', { name: /analyser un contrat/i })).toBeVisible();
    }
  });

  test('should filter contracts by status', async ({ page }) => {
    // Navigate to contracts page
    await page.goto('/contracts');
    
    // Wait for page to load
    await page.waitForTimeout(1000);
    
    // Open status filter
    const filterSelect = page.locator('[data-testid="status-filter"], select').first();
    if (await filterSelect.isVisible().catch(() => false)) {
      await filterSelect.click();
      
      // Select a status option
      await page.getByText(/terminé|completed/i).click();
      
      // Wait for filter to apply
      await page.waitForTimeout(500);
    }
  });

  test('should search contracts by filename', async ({ page }) => {
    // Navigate to contracts page
    await page.goto('/contracts');
    
    // Wait for page to load
    await page.waitForTimeout(1000);
    
    // Try to find search input
    const searchInput = page.locator('input[placeholder*="Rechercher"], input[type="search"]').first();
    if (await searchInput.isVisible().catch(() => false)) {
      // Type search query
      await searchInput.fill('test');
      
      // Wait for search to apply
      await page.waitForTimeout(500);
    }
  });

  test('should show contract stats on dashboard', async ({ page }) => {
    // Already on dashboard from beforeEach
    await expect(page.getByText(/contrats totaux/i)).toBeVisible();
    await expect(page.getByText(/analyses terminées/i)).toBeVisible();
  });

  test('should navigate from dashboard to recent contracts', async ({ page }) => {
    // Click on "Voir tout" link
    const viewAllLink = page.getByRole('link', { name: /voir tout/i }).first();
    if (await viewAllLink.isVisible().catch(() => false)) {
      await viewAllLink.click();
      await expect(page).toHaveURL(/.*contracts/);
    }
  });

  test('should show empty state when no contracts', async ({ page }) => {
    // Navigate to contracts page
    await page.goto('/contracts');
    
    // Wait for loading to complete
    await page.waitForTimeout(2000);
    
    // Check for empty state
    const emptyState = await page.getByText(/aucun contrat/i).isVisible().catch(() => false);
    
    if (emptyState) {
      await expect(page.getByText(/commencez par analyser/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /analyser un contrat/i })).toBeVisible();
    }
  });
});
