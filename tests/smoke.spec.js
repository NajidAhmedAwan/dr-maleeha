import { test, expect } from '@playwright/test';

test.describe('Homepage @smoke', () => {
  test('loads with hero carousel', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Maleeha/i);
    await expect(page.locator('text=/In Your Face/i').first()).toBeVisible();
  });

  test('no Lahore appears anywhere', async ({ page }) => {
    await page.goto('/');
    const body = await page.locator('body').innerText();
    expect(body.toLowerCase()).not.toContain('lahore');
  });

  test('procedure cards render', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=/Botox/i').first()).toBeVisible();
    await expect(page.locator('text=/Hydrafacial/i').first()).toBeVisible();
  });

  test('How It Works appears before procedures', async ({ page }) => {
    await page.goto('/');
    const howItWorks = await page.locator('text=/How It Works/i').first().boundingBox();
    const botox = await page.locator('text=/Botox/i').first().boundingBox();
    expect(howItWorks.y).toBeLessThan(botox.y);
  });
});

test.describe('Booking flow @smoke', () => {
  test('booking page loads with 3 cities only', async ({ page }) => {
    await page.goto('/booking');
    await expect(page.locator('text=/Karachi/i')).toBeVisible();
    await expect(page.locator('text=/Islamabad/i')).toBeVisible();
    await expect(page.locator('text=/Online/i')).toBeVisible();
    await expect(page.locator('text=/Lahore/i')).toHaveCount(0);
  });
});

test.describe('Dashboard @smoke', () => {
  test('dashboard loads', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Brands portal @smoke', () => {
  test('brands page loads', async ({ page }) => {
    await page.goto('/brands');
    await expect(page.locator('body')).toBeVisible();
  });
});
