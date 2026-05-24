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

test.describe('Booking — slots + deposit (Batch 1)', () => {
  test('Islamabad shows 7 slots on a Tuesday', async ({ page }) => {
    await page.goto('/booking');
    await page.getByRole('button', { name: /islamabad/i }).click();
    // Pick a procedure so datetime step renders
    await page.getByRole('button', { name: /botox|consultation/i }).first().click();
    // Navigate calendar to next Tuesday and click it
    const nextTuesday = getNextWeekday(2); // 2 = Tuesday
    await page.getByRole('button', { name: nextTuesday.day.toString(), exact: true }).first().click();
    // Expect 7 slot buttons rendered (all SLOT_HOURS for a non-today open day)
    const slots = page.locator('[data-testid="time-slot"]');
    await expect(slots).toHaveCount(7);
  });

  test('Islamabad shows closed message on a Wednesday', async ({ page }) => {
    await page.goto('/booking');
    await page.getByRole('button', { name: /islamabad/i }).click();
    await page.getByRole('button', { name: /botox|consultation/i }).first().click();
    const nextWednesday = getNextWeekday(3);
    // Wednesday cells are visually dimmed; click via force in case of pointer-events guard
    await page.getByRole('button', { name: nextWednesday.day.toString(), exact: true }).first().click({ force: true }).catch(() => {});
    await expect(page.getByText(/closed on this day/i)).toBeVisible();
  });

  test('Karachi same-day shows 100% deposit with warning pill', async ({ page }) => {
    await page.goto('/booking');
    await page.getByRole('button', { name: /karachi/i }).click();
    await page.getByRole('button', { name: /botox|consultation/i }).first().click();
    // Pick today — use force in case today's cell is in the mock FULL_DAYS set
    const today = new Date().getDate();
    await page.getByRole('button', { name: today.toString(), exact: true }).first().click({ force: true });
    // Pick the last available slot
    const slots = page.locator('[data-testid="time-slot"]:not([disabled])');
    const slotCount = await slots.count();
    if (slotCount === 0) test.skip(true, 'No bookable same-day slots remain at test time');
    await slots.last().click();
    await expect(page.getByText(/same-day booking/i)).toBeVisible();
    await expect(page.getByText(/100%/)).toBeVisible();
  });

  test('Online 10-days-out shows 50% deposit', async ({ page }) => {
    await page.goto('/booking');
    await page.getByRole('button', { name: /online/i }).click();
    // Online uses ONLINE_CONCERNS — pick "Acne & Breakouts" which matches /acne/i
    await page.getByRole('button', { name: /acne/i }).first().click();
    const future = new Date();
    future.setDate(future.getDate() + 10);
    // Navigate to the correct month if needed
    const currentMonth = new Date().getMonth();
    const targetMonth  = future.getMonth();
    if (targetMonth !== currentMonth) {
      await page.getByRole('button', { name: '›' }).click();
    }
    await page.getByRole('button', { name: future.getDate().toString(), exact: true }).first().click();
    const slots = page.locator('[data-testid="time-slot"]:not([disabled])');
    await slots.first().click();
    await expect(page.getByText(/50%/)).toBeVisible();
    await expect(page.getByText(/same-day booking/i)).not.toBeVisible();
  });
});

// Helper: returns { day, date } for the next occurrence of a given JS weekday (0=Sun..6=Sat)
function getNextWeekday(targetDay) {
  const d = new Date();
  const diff = (targetDay - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return { day: d.getDate(), date: d };
}
