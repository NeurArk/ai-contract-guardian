import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use */
  reporter: [['html', { open: 'never' }], ['list']],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video recording (optional, can be enabled for debugging) */
    video: process.env.RECORD_VIDEO ? 'on-first-retry' : 'off',
    
    /* Action timeout */
    actionTimeout: 15000,
    
    /* Navigation timeout */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    /* Test against mobile viewports */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Run a web server before starting the tests.
     - Local default: next dev (fast iteration)
     - CI / stable runs: build + start (reproducible, avoids dev flakiness)
  */
  webServer: {
    command:
      process.env.PW_WEB_SERVER_COMMAND ||
      (process.env.CI || process.env.PW_WEB_SERVER === 'prod'
        ? 'npm run build && npm run start'
        : 'npm run dev'),
    url: process.env.BASE_URL || 'http://localhost:3000',
    // In prod-mode tests, avoid reusing an already-running server if a fresh build just ran,
    // otherwise we can get mismatched chunk hashes (HTML from old server, files from new build).
    reuseExistingServer: !process.env.CI && process.env.PW_WEB_SERVER !== 'prod',
    timeout: 180000,
  },
});
