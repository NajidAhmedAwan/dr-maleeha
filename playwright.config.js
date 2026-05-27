import { defineConfig } from '@playwright/test';
import fs from 'node:fs';

const isLive = process.env.TEST_ENV === 'live';
const bypassToken = isLive
  ? (process.env.VERCEL_AUTOMATION_BYPASS_SECRET ||
     (fs.existsSync('.vercel-bypass-token') ? fs.readFileSync('.vercel-bypass-token', 'utf8').trim() : null))
  : null;

if (isLive && !bypassToken) {
  throw new Error(
    'Live tests require VERCEL_AUTOMATION_BYPASS_SECRET env var or .vercel-bypass-token file. See 9b.5 docs.'
  );
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 60_000,
  reporter: [['html'], ['list']],

  use: {
    baseURL: isLive ? 'https://dr-maleeha.vercel.app' : 'http://localhost:5173',
    viewport: { width: 390, height: 844 },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    extraHTTPHeaders: bypassToken ? { 'x-vercel-protection-bypass': bypassToken } : {},
  },

  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],

  webServer: isLive ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
