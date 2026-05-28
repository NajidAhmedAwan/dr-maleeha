import fs from 'node:fs';
import { chromium } from '@playwright/test';
import { loadBypassToken } from './bypass-token.js';

const LIVE_URL = 'https://dr-maleeha.vercel.app';
const WARMUP_TIMEOUT = 90_000;
const STATE_FILE = '.pw-warmup-state.json';

export default async function globalSetup() {
  if (process.env.TEST_ENV !== 'live') return;

  const token = loadBypassToken();
  if (!token) return;

  // Seed empty state so test contexts never crash if warmup fails or is skipped
  fs.writeFileSync(STATE_FILE, JSON.stringify({ cookies: [], origins: [] }));

  console.log('Vercel checkpoint warmup: starting...');
  const start = Date.now();

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      extraHTTPHeaders: { 'x-vercel-protection-bypass': token },
    });
    const page = await context.newPage();

    // Navigate once and let the WASM challenge run uninterrupted.
    // Re-navigating would abort the in-flight WASM proof-of-work before it
    // submits, so we instead poll page.title() without touching the page.
    await page.goto(LIVE_URL + '/').catch(() => {});

    let resolved = false;
    const deadline = start + WARMUP_TIMEOUT;

    while (Date.now() < deadline) {
      await page.waitForTimeout(1_500);
      try {
        const title = await page.title();
        if (!title.includes('Security Checkpoint')) {
          resolved = true;
          break;
        }
      } catch {
        // "Execution context was destroyed" means the challenge JS navigated
        // the page away — i.e., the challenge completed. Poll once more after
        // the new page settles to confirm we're on the actual app.
        await page.waitForTimeout(1_500);
        try {
          const title = await page.title();
          resolved = !title.includes('Security Checkpoint');
        } catch {
          // Still mid-navigation; will retry on next loop iteration
        }
        if (resolved) break;
      }
    }

    if (resolved) {
      // Capture cookies (including any Vercel bypass cookie set by the challenge)
      // so every test context inherits them via use.storageState.
      await context.storageState({ path: STATE_FILE });
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`Vercel checkpoint warmup: complete in ${elapsed}s`);
    } else {
      console.error(
        'Vercel checkpoint warmup FAILED after 90s — live tests will likely fail. Check token validity in .vercel-bypass-token.',
      );
    }

    await context.close();
  } finally {
    await browser.close();
  }
}
