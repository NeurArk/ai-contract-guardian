import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

function makeTestUser(prefix: string) {
  // Keep the email short (backend constraint).
  const ts = Date.now().toString(36);
  const rand = Math.floor(Math.random() * 1e6).toString(36);
  return {
    email: `${prefix}${ts}${rand}@ex.com`,
    password: 'TestPassword123!',
  };
}

function ensureTmpDir() {
  const tmpDir = '/tmp/playwright-test';
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  return tmpDir;
}

function writeMinimalPdf(outPath: string) {
  const pdfContent = `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n156\n%%EOF`;
  fs.writeFileSync(outPath, pdfContent);
}

test.describe('Pilot lifecycle (export data + delete account)', () => {
  test('register → upload → contract detail → export → delete → token cleared', async ({ page }) => {
    test.setTimeout(120_000);

    const user = makeTestUser('pilot');

    // Register
    await page.goto('/register');
    await page.fill('input[id="email"]', user.email);
    await page.fill('input[id="password"]', user.password);
    await page.fill('input[id="confirmPassword"]', user.password);
    await page.getByRole('checkbox', { name: /je suis un professionnel/i }).check();
    await page.getByRole('button', { name: /créer mon compte/i }).click();
    await page.waitForURL(/.*dashboard/, { timeout: 60_000 });

    // Upload
    await page.getByRole('navigation').getByRole('link', { name: /nouvelle analyse/i }).click();
    await expect(page).toHaveURL(/.*contracts\/upload/);

    // Accept legal disclaimer (required)
    await page.getByRole('checkbox').click();
    await expect(page.getByText(/vous avez pris connaissance/i)).toBeVisible({ timeout: 10_000 });

    const tmpDir = ensureTmpDir();
    const pdfPath = path.join(tmpDir, `pilot-${Date.now()}.pdf`);
    writeMinimalPdf(pdfPath);

    await page.locator('input[type="file"]').setInputFiles(pdfPath);
    await expect(page.getByText(path.basename(pdfPath))).toBeVisible();

    await page.getByRole('button', { name: /lancer l'analyse/i }).click();

    // Contract detail
    await page.waitForURL(/\/contracts\/[a-f0-9-]+/i, { timeout: 60_000 });
    await expect(
      page.getByRole('link', { name: /retour aux contrats/i })
    ).toBeVisible({ timeout: 30_000 });

    // Export + delete account
    await page.goto('/account');
    await expect(page.getByRole('heading', { name: /mon compte/i })).toBeVisible();

    const [exportResponse] = await Promise.all([
      page.waitForResponse((resp) => {
        return (
          resp.url().includes('/api/v1/users/me/export') &&
          resp.request().method() === 'GET'
        );
      }),
      page.getByRole('button', { name: /exporter mes données/i }).click(),
    ]);

    expect(exportResponse.ok()).toBeTruthy();
    await expect(page.getByText(/export généré/i)).toBeVisible({ timeout: 10_000 });

    page.once('dialog', (dialog) => dialog.accept());

    const [deleteResponse] = await Promise.all([
      page.waitForResponse((resp) => {
        return (
          resp.url().includes('/api/v1/users/me') &&
          resp.request().method() === 'DELETE'
        );
      }),
      page.getByRole('button', { name: /supprimer mon compte/i }).click(),
    ]);

    expect(deleteResponse.ok()).toBeTruthy();

    await expect(page).toHaveURL(/\/(login|register)/, { timeout: 30_000 });

    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();

    // Protected pages should bounce to /login after account deletion.
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/, { timeout: 30_000 });

    fs.unlinkSync(pdfPath);
  });
});
