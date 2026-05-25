/**
 * Supabase integration tests — placeholder stubs for Batch 7a.
 *
 * These tests mirror the Batch 6 smoke Path A/B/C but submit against a real
 * (test) Supabase project so the full DB write path is exercised.
 *
 * UNSKIP when a test Supabase project is provisioned in Batch 7b:
 *   - Set TEST_SUPABASE_URL and TEST_SUPABASE_ANON_KEY in your test .env
 *   - Remove test.skip() from each test below
 */
import { test, expect } from '@playwright/test';

const hasSuapbase = !!process.env.TEST_SUPABASE_URL;

test.describe('Supabase integration — booking write path', () => {
  test.skip(!hasSuapbase, 'Skipped: TEST_SUPABASE_URL not set. Provision test Supabase project in Batch 7b.');
  test.use({ viewport: { width: 390, height: 844 } });

  // Helper shared by all three paths
  async function navigateToContact(page, { city, procedureTestId }) {
    const baseUrl = process.env.TEST_SUPABASE_URL
      ? `http://localhost:5173`
      : 'http://localhost:5173';
    await page.goto(`${baseUrl}/booking`);
    await page.getByRole('button', { name: new RegExp(city, 'i') }).first().click();
    await page.locator(`[data-testid="${procedureTestId}"]`).click();
    const future = new Date();
    future.setDate(future.getDate() + 5);
    await page.getByRole('button', { name: future.getDate().toString(), exact: true }).first().click();
    await page.locator('[data-testid="time-slot"]:not([disabled])').first().click();
    await page.waitForSelector('[data-testid="contact-form"]');
  }

  // UNSKIP when test Supabase project is provisioned in Batch 7b
  test.skip('Path A — Karachi Botox writes patient + booking to DB', async ({ page }) => {
    // UNSKIP when test Supabase project is provisioned in Batch 7b
    await navigateToContact(page, { city: 'Karachi', procedureTestId: 'booking-procedure-botox' });

    await page.locator('[data-testid="input-name"]').fill('Integration Test A');
    await page.locator('[data-testid="input-phone"]').fill('03001110001');
    await page.locator('[data-testid="input-email"]').fill('test-a@example.com');
    await page.locator('[data-testid="submit-booking"]').click();

    await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="booking-reference"]')).toContainText(/MAL-\d{4}/);
  });

  // UNSKIP when test Supabase project is provisioned in Batch 7b
  test.skip('Path B — Online General Concern writes patient + booking to DB', async ({ page }) => {
    // UNSKIP when test Supabase project is provisioned in Batch 7b
    await navigateToContact(page, { city: 'Online', procedureTestId: 'booking-procedure-general-concern' });

    await page.locator('[data-testid="input-name"]').fill('Integration Test B');
    await page.locator('[data-testid="input-phone"]').fill('03002220002');
    await page.locator('[data-testid="input-email"]').fill('test-b@example.com');
    await page.locator('[data-testid="submit-booking"]').click();

    await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="booking-reference"]')).toContainText(/MAL-\d{4}/);

    const addressLinks = page.locator('a[href*="maps.google.com"]');
    await expect(addressLinks).toHaveCount(0);
  });

  // UNSKIP when test Supabase project is provisioned in Batch 7b
  test.skip('Path C — Islamabad Acne Treatment with media upload writes to DB', async ({ page }) => {
    // UNSKIP when test Supabase project is provisioned in Batch 7b
    await navigateToContact(page, { city: 'Islamabad', procedureTestId: 'booking-procedure-acne-treatment' });

    const fileInput = page.locator('[data-testid="booking-media-upload"]');
    await fileInput.setInputFiles('./tests/fixtures/test-photo.jpg');

    await page.locator('[data-testid="input-name"]').fill('Integration Test C');
    await page.locator('[data-testid="input-phone"]').fill('03003330003');
    await page.locator('[data-testid="input-email"]').fill('test-c@example.com');
    await page.locator('[data-testid="submit-booking"]').click();

    await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="booking-reference"]')).toContainText(/MAL-\d{4}/);

    const mapsLink = page.locator('a[href*="maps.google.com"]');
    await expect(mapsLink.first()).toBeVisible();
    await expect(mapsLink.first()).toContainText(/Faisal Market|F-7/i);
  });
});
