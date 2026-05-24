import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './',
  timeout: 60 * 1000,
  workers: 1,

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'relatorio_erros_ia.json' }]
  ],

  webServer: {
    command: 'cmd.exe /c npx http-server -p 8081 -c-1',
    url: 'http://127.0.0.1:8081/index.html',
    reuseExistingServer: true,
    timeout: 60 * 1000
  },

  use: {
    baseURL: 'http://127.0.0.1:8081',
    headless: false,   // 👀 MOSTRA O CHROME
    slowMo: 700,       // 🐢 PASSO A PASSO (bonitão)
    trace: 'on',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ],
});
