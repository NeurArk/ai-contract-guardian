import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const TEST_USER = {
  email: `flowtest${Date.now()}@example.com`,
  password: 'TestPassword123!',
};

function ensureTmpDir() {
  const tmpDir = '/tmp/playwright-test';
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  return tmpDir;
}

test.describe('Full flow (upload → analyzing → result)', () => {
  test('should let a user upload and reach contract detail', async ({ page }, testInfo) => {
    // Register
    await page.goto('/register');
    await page.fill('input[id="email"]', TEST_USER.email);
    await page.fill('input[id="password"]', TEST_USER.password);
    await page.fill('input[id="confirmPassword"]', TEST_USER.password);
    await page.click('button:has-text("Créer mon compte")');
    await page.waitForURL(/.*dashboard/, { timeout: 15000 });

    // Go to upload
    await page.getByRole('navigation').getByRole('link', { name: /nouvelle analyse/i }).click();
    await expect(page).toHaveURL(/.*contracts\/upload/);

    // Create a minimal PDF
    const tmpDir = ensureTmpDir();
    const pdfPath = path.join(tmpDir, `flow-${Date.now()}.pdf`);
    const pdfContent = `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n156\n%%EOF`;
    fs.writeFileSync(pdfPath, pdfContent);

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(pdfPath);

    // Launch analysis
    await page.click('button:has-text("Lancer l\'analyse")');

    // Should redirect to contract detail
    await page.waitForURL(/\/contracts\/[a-f0-9-]+/i, { timeout: 15000 });

    // Attach a screenshot so we can visually review the UI (even when passing)
    const shotPath = testInfo.outputPath('contract-detail.png');
    await page.screenshot({ path: shotPath, fullPage: true });
    await testInfo.attach('contract-detail', { path: shotPath, contentType: 'image/png' });

    // Either analysis is still running OR results are visible (analysis can be very fast in test env)
    const analyzing = page.locator('text=Analyse en cours');
    const resultsTabs = page.locator('text=Vue d\'ensemble');

    await expect(analyzing.or(resultsTabs)).toBeVisible({ timeout: 30000 });

    // Cleanup
    fs.unlinkSync(pdfPath);
  });
});
