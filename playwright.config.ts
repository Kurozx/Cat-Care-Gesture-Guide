import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/ui', timeout: 180000, workers: 1,
  use: { baseURL: 'http://localhost:8081', viewport: { width: 393, height: 852 }, locale: 'th-TH', timezoneId: 'Asia/Bangkok', channel: 'chrome', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: { command: 'npx expo start --port 8081 --localhost', url: 'http://localhost:8081', timeout: 180000, reuseExistingServer: true, env: { CI: '1' } },
  reporter: [['list'], ['html', { open: 'never', outputFolder: '../artifacts/ui-report' }]],
  outputDir: '../artifacts/ui-results',
});
