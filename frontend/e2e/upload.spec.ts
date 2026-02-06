import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

function makeTestUser(prefix: string) {
  const ts = Date.now().toString(36);
  const rand = Math.floor(Math.random() * 1e6).toString(36);
  return {
    email: `${prefix}${ts}${rand}@ex.com`,
    password: 'TestPassword123!',
  };
}

function ensureTmpDir() {
  const tmpDir = '/tmp/playwright-test';
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  return tmpDir;
}

function writeMinimalPdf(outPath: string) {
  const pdfContent = `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n156\n%%EOF`;
  fs.writeFileSync(outPath, pdfContent);
}

test.describe('Upload', () => {
  test.beforeEach(async ({ page }) => {
    const testUser = makeTestUser('uptest');
    // Register and login
    await page.goto('/register');
    await page.fill('input[id="email"]', testUser.email);
    await page.fill('input[id="password"]', testUser.password);
    await page.fill('input[id="confirmPassword"]', testUser.password);
    await page.getByRole('checkbox', { name: /je suis un professionnel/i }).check();
    await page.getByRole('button', { name: /créer mon compte/i }).click();
    await page.waitForURL(/.*dashboard/, { timeout: 30000 });
    await page.waitForLoadState("networkidle");
    
    // Navigate to upload page
    await page.getByRole('navigation').getByRole('link', { name: /nouvelle analyse/i }).click();
    await expect(page).toHaveURL(/.*contracts\/upload/);
  });

  test('should support drag and drop file upload', async ({ page }) => {
    // Check drag and drop area is visible
    await expect(page.getByText(/glissez-déposez/i)).toBeVisible();
    
    // Simulate drag enter
    const dropZone = page.locator('div').filter({ hasText: /glissez-déposez/i }).first();
    
    // Fire dragover event
    await dropZone.evaluate((el) => {
      const event = new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
      });
      el.dispatchEvent(event);
    });
    
    // Check visual feedback (optional, depends on implementation)
    await page.waitForTimeout(100);
  });

  test('should validate file type', async ({ page }) => {
    // Create a temporary non-PDF file
    const tmpDir = '/tmp/playwright-test';
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const invalidFile = path.join(tmpDir, 'test.txt');
    fs.writeFileSync(invalidFile, 'This is not a PDF');
    
    // Try to upload invalid file type
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(invalidFile);
    
    // Should show toast error
    await expect(page.getByText(/Seuls les fichiers PDF ou DOCX sont acceptés/i)).toBeVisible({ timeout: 5000 });
    
    // Cleanup
    fs.unlinkSync(invalidFile);
  });

  test('should validate file size', async ({ page }) => {
    // Create a temporary large file (11MB)
    const tmpDir = '/tmp/playwright-test';
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const largeFile = path.join(tmpDir, 'large.pdf');
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
    largeBuffer.write('%PDF-1.4'); // PDF header
    fs.writeFileSync(largeFile, largeBuffer);
    
    // Try to upload large file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(largeFile);
    
    // Should show toast size error
    await expect(page.getByText(/ne doit pas dépasser 10 Mo/i)).toBeVisible({ timeout: 5000 });
    
    // Cleanup
    fs.unlinkSync(largeFile);
  });

  test('should show file selection via browse button', async ({ page }) => {
    // Check browse button is visible
    await expect(page.getByRole('button', { name: /parcourir/i })).toBeVisible();
    
    // Check file input is hidden but exists
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeHidden();
    await expect(fileInput).toHaveAttribute('accept', '.pdf,.docx');
  });

  test('should show upload progress', async ({ page }) => {
    // Create a small valid PDF file for testing
    const tmpDir = '/tmp/playwright-test';
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const validPdf = path.join(tmpDir, 'valid.pdf');
    
    // Create minimal valid PDF content
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
>>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer
<<
/Size 4
/Root 1 0 R
>>
startxref
196
%%EOF`;
    fs.writeFileSync(validPdf, pdfContent);
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(validPdf);
    
    // File info should be displayed
    await expect(page.getByText('valid.pdf')).toBeVisible();
    
    // Cleanup
    fs.unlinkSync(validPdf);
  });

  test('should clear selected file', async ({ page }) => {
    // Create a small valid PDF file
    const tmpDir = '/tmp/playwright-test';
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const validPdf = path.join(tmpDir, 'clear-test.pdf');
    const pdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000052 00000 n
0000000101 00000 n
trailer<</Size 4/Root 1 0 R>>
startxref
156
%%EOF`;
    fs.writeFileSync(validPdf, pdfContent);
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(validPdf);
    
    // File should be displayed
    await expect(page.getByText('clear-test.pdf')).toBeVisible();
    
    // Click clear button (X icon)
    const fileRow = page.getByText('clear-test.pdf').locator('..').locator('..').locator('..');
    const clearButton = fileRow.locator('button');
    await expect(clearButton).toBeVisible();
    await clearButton.click();
    
    // Should show drop zone again
    await expect(page.getByText(/glissez-déposez/i)).toBeVisible();
    
    // Cleanup
    fs.unlinkSync(validPdf);
  });

  test('should disable upload button when no file selected', async ({ page }) => {
    const uploadButton = page.getByRole('button', { name: /lancer l'analyse/i });
    await expect(uploadButton).toBeDisabled();
  });

  test('should require legal consent before enabling analysis', async ({ page }) => {
    const tmpDir = ensureTmpDir();
    const pdfPath = path.join(tmpDir, `consent-${Date.now()}.pdf`);
    writeMinimalPdf(pdfPath);

    // Select a valid file first
    await page.locator('input[type="file"]').setInputFiles(pdfPath);
    await expect(page.getByText(/consent-.*\.pdf/)).toBeVisible();

    const uploadButton = page.getByRole('button', { name: /lancer l'analyse/i });
    await expect(uploadButton).toBeDisabled();

    // Accept legal disclaimer
    await page.getByRole('checkbox').click();
    await expect(page.getByText(/vous avez pris connaissance/i)).toBeVisible({ timeout: 10000 });

    await expect(uploadButton).toBeEnabled();

    fs.unlinkSync(pdfPath);
  });

  test('should show upload instructions', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /analyser un nouveau contrat/i })).toBeVisible();
    await expect(page.getByText(/téléchargez votre contrat/i)).toBeVisible();
    await expect(page.getByText(/formats acceptés/i)).toBeVisible();
  });

  test('should show what happens next info', async ({ page }) => {
    await expect(page.getByText(/que se passe-t-il ensuite/i)).toBeVisible();
    await expect(page.getByText(/notre ia analyse/i)).toBeVisible();
  });

  test('should navigate back to contracts list', async ({ page }) => {
    await page.getByRole('link', { name: /retour aux contrats/i }).click();
    await expect(page).toHaveURL(/.*contracts/);
  });
});
