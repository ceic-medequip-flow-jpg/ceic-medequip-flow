import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 120000,
  workers: 1,

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'qa-reports/latest/playwright-results.json' }]
  ],

  use: {
    baseURL: 'http://127.0.0.1:5173',
    headless: false,
    launchOptions: {
      slowMo: 700
    },
    video: 'on',
    screenshot: 'only-on-failure',
    trace: 'on'
  },

  webServer: {
    command: 'npm.cmd run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
    timeout: 120000
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome']
      }
    }
  ]
});
