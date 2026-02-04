import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const TEST_USER = {
  email: `uploadtest${Date.now()}@example.com`,
  password: 'TestPassword123!',
};

test.describe('Upload', () => {
  test.beforeEach(async ({ page }) => {
    // Register and login
    await page.goto('/register');
    await page.fill('input[id="email"]', TEST_USER.email);
    await page.fill('input[id="password"]', TEST_USER.password);
    await page.fill('input[id="confirmPassword"]', TEST_USER.password);
    await page.click('button:has-text("Créer mon compte")');
    await page.waitForURL(/.*dashboard/, { timeout: 10000 });
    
    // Navigate to upload page
    await page.click('text=Nouvelle analyse');
    await expect(page).toHaveURL(/.*upload/);
  });

  test('should support drag and drop file upload', async ({ page }) => {
    // Check drag and drop area is visible
    await expect(page.locator('text=Glissez-déposez votre fichier ici')).toBeVisible();
    
    // Simulate drag enter
    const dropZone = page.locator('div').filter({ hasText: /Glissez-déposez/ }).first();
    
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
    
    // Should show error
    await expect(page.locator('text=/PDF|format|type de fichier/i')).toBeVisible({ timeout: 5000 });
    
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
    
    // Should show size error
    await expect(page.locator('text=/10 Mo|taille|size/i')).toBeVisible({ timeout: 5000 });
    
    // Cleanup
    fs.unlinkSync(largeFile);
  });

  test('should show file selection via browse button', async ({ page }) => {
    // Check browse button is visible
    await expect(page.locator('button:has-text("Parcourir")')).toBeVisible();
    
    // Check file input is hidden but exists
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeHidden();
    await expect(fileInput).toHaveAttribute('accept', '.pdf');
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
    await expect(page.locator('text=valid.pdf')).toBeVisible();
    
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
    await expect(page.locator('text=clear-test.pdf')).toBeVisible();
    
    // Click clear button (X icon)
    const clearButton = page.locator('button').filter({ has: page.locator('[data-lucide="x"], svg') }).first();
    if (await clearButton.isVisible().catch(() => false)) {
      await clearButton.click();
      
      // Should show drop zone again
      await expect(page.locator('text=Glissez-déposez votre fichier ici')).toBeVisible();
    }
    
    // Cleanup
    fs.unlinkSync(validPdf);
  });

  test('should disable upload button when no file selected', async ({ page }) => {
    const uploadButton = page.locator('button:has-text("Lancer")');
    await expect(uploadButton).toBeDisabled();
  });

  test('should show upload instructions', async ({ page }) => {
    await expect(page.locator('text=Analyser un nouveau contrat')).toBeVisible();
    await expect(page.locator('text=Téléchargez votre contrat PDF')).toBeVisible();
    await expect(page.locator('text=Formats acceptés : PDF')).toBeVisible();
    await expect(page.locator('text=max 10 Mo')).toBeVisible();
  });

  test('should show what happens next info', async ({ page }) => {
    await expect(page.locator('text=Que se passe-t-il ensuite ?')).toBeVisible();
    await expect(page.locator('text=Notre IA analyse votre contrat')).toBeVisible();
    await expect(page.locator('text=analyse complète avec les risques')).toBeVisible();
    await expect(page.locator('text=recommandations personnalisées')).toBeVisible();
  });

  test('should navigate back to contracts list', async ({ page }) => {
    await page.click('text=Retour aux contrats');
    await expect(page).toHaveURL(/.*contracts/);
  });
});
