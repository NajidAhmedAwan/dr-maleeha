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
    // DateStrip shows 14 days so +10 is always visible without month navigation
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

const BASE_URL = process.env.TEST_ENV === 'live' ? 'https://dr-maleeha.vercel.app' : 'http://localhost:5173';

test.describe('Booking — contact form validation (Batch 3)', () => {
  async function navigateToContactStep(page) {
    await page.goto(`${BASE_URL}/booking`);
    await page.getByRole('button', { name: /karachi/i }).click();
    await page.getByRole('button', { name: /botox|consultation/i }).first().click();
    const future = new Date();
    future.setDate(future.getDate() + 5);
    await page.getByRole('button', { name: future.getDate().toString(), exact: true }).first().click();
    await page.locator('[data-testid="time-slot"]:not([disabled])').first().click();
    await page.waitForSelector('[data-testid="contact-form"]');
  }

  test('Empty submit shows name and phone errors', async ({ page }) => {
    await navigateToContactStep(page);
    await page.locator('[data-testid="submit-booking"]').click();
    await expect(page.locator('[data-testid="error-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-phone"]')).toBeVisible();
    await expect(page.locator('[data-testid="form-summary-error"]')).toBeVisible();
  });

  test('Invalid phone shows error', async ({ page }) => {
    await navigateToContactStep(page);
    await page.locator('[data-testid="input-name"]').fill('Ayesha Khan');
    await page.locator('[data-testid="input-phone"]').fill('12345');
    await page.locator('[data-testid="input-phone"]').blur();
    await expect(page.locator('[data-testid="error-phone"]')).toContainText(/valid pakistani mobile/i);
  });

  test('Invalid email shows error', async ({ page }) => {
    await navigateToContactStep(page);
    await page.locator('[data-testid="input-email"]').fill('not-an-email');
    await page.locator('[data-testid="input-email"]').blur();
    await expect(page.locator('[data-testid="error-email"]')).toBeVisible();
  });

  test('Empty email is allowed (optional field)', async ({ page }) => {
    await navigateToContactStep(page);
    await page.locator('[data-testid="input-name"]').fill('Ayesha Khan');
    await page.locator('[data-testid="input-phone"]').fill('03001234567');
    await page.locator('[data-testid="submit-booking"]').click();
    await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible();
  });

  test('Valid Pakistani phone formats accepted (0300, +92, with spaces)', async ({ page }) => {
    const validFormats = ['03001234567', '+923001234567', '0300 1234567'];
    for (const phone of validFormats) {
      await navigateToContactStep(page);
      await page.locator('[data-testid="input-name"]').fill('Test User');
      await page.locator('[data-testid="input-phone"]').fill(phone);
      await page.locator('[data-testid="input-phone"]').blur();
      // No error should appear
      await expect(page.locator('[data-testid="error-phone"]')).not.toBeVisible();
      // Clean up storage between iterations
      await page.evaluate(() => localStorage.clear());
    }
  });

  test('Name with digits is rejected', async ({ page }) => {
    await navigateToContactStep(page);
    await page.locator('[data-testid="input-name"]').fill('Ayesha123');
    await page.locator('[data-testid="input-name"]').blur();
    await expect(page.locator('[data-testid="error-name"]')).toContainText(/invalid characters/i);
  });

  test('Full valid form submits and reaches confirmation', async ({ page }) => {
    await navigateToContactStep(page);
    await page.locator('[data-testid="input-name"]').fill('Ayesha Khan');
    await page.locator('[data-testid="input-phone"]').fill('0300 1234567');
    await page.locator('[data-testid="input-email"]').fill('ayesha@example.com');
    await page.locator('[data-testid="submit-booking"]').click();
    await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible();
    await expect(page.locator('[data-testid="booking-reference"]')).toContainText(/^MAL-\d{4}$/);
  });
});

test.describe('Dashboard — real bookings (Batch 5)', () => {
  async function createOneBooking(page, { city = 'Karachi', name = 'Test Patient', phone = '03001234567' } = {}) {
    await page.goto(`${BASE_URL}/booking`);
    await page.getByRole('button', { name: new RegExp(city, 'i') }).click();
    // Online city shows concern buttons (not procedures); other cities show procedure buttons
    const procRegex = city === 'Online' ? /general concern|acne/i : /botox|consultation/i;
    await page.getByRole('button', { name: procRegex }).first().click();
    const future = new Date();
    future.setDate(future.getDate() + 5);
    await page.getByRole('button', { name: future.getDate().toString(), exact: true }).first().click();
    await page.locator('[data-testid="time-slot"]:not([disabled])').first().click();
    await page.locator('[data-testid="input-name"]').fill(name);
    await page.locator('[data-testid="input-phone"]').fill(phone);
    await page.locator('[data-testid="submit-booking"]').click();
    await page.waitForSelector('[data-testid="booking-confirmation"]');
  }

  test('Empty dashboard shows empty state for recent bookings', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.evaluate(() => {
      localStorage.removeItem('maleeha_confirmed_bookings');
      localStorage.removeItem('maleeha_dashboard_last_viewed');
    });
    await page.reload();
    await expect(page.locator('[data-testid="recent-bookings-empty"]')).toBeVisible();
  });

  test('Real booking appears in dashboard list', async ({ page }) => {
    await page.evaluate(() => localStorage.clear()).catch(() => {});
    await createOneBooking(page, { name: 'Ayesha Khan' });
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page.locator('[data-testid="recent-bookings-list"]')).toBeVisible();
    await expect(page.getByText('Ayesha Khan')).toBeVisible();
  });

  test('NEW badge appears on first dashboard view, gone after revisit', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`);
    await page.evaluate(() => localStorage.clear());
    await createOneBooking(page, { name: 'Fresh Patient' });
    // First dashboard visit — should show NEW
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page.locator('[data-testid="new-badge"]').first()).toBeVisible();
    // Wait > 1.5s for markDashboardViewed timer to fire
    await page.waitForTimeout(2000);
    // Second visit — NEW should be gone
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page.locator('[data-testid="new-badge"]')).not.toBeVisible();
  });

  test('Mock data still visible (real bookings ADD, not REPLACE)', async ({ page }) => {
    await page.evaluate(() => localStorage.clear()).catch(() => {});
    await page.goto(`${BASE_URL}/dashboard`);
    // At least one of the mock patient names should still be on the page
    const mockNames = ['Sara Khan', 'Fatima Ahmed', 'Ayesha Malik', 'Noor Hussain', 'Zara Siddiqui'];
    let found = false;
    for (const n of mockNames) {
      if (await page.getByText(n).first().isVisible().catch(() => false)) { found = true; break; }
    }
    expect(found).toBe(true);
  });

  test('Online booking shows in dashboard with Online indicator', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`);
    await page.evaluate(() => localStorage.clear());
    await createOneBooking(page, { city: 'Online', name: 'Online Test' });
    await page.goto(`${BASE_URL}/dashboard`);
    const card = page.locator('[data-testid^="booking-card-"]', { hasText: 'Online Test' });
    await expect(card).toBeVisible();
    await expect(card).toContainText('Online');
  });
});

test.describe('Booking — returning patient lookup (Batch 6)', () => {
  async function navigateToContactStep(page) {
    await page.goto(`${BASE_URL}/booking`);
    await page.getByRole('button', { name: /karachi/i }).first().click();
    await page.getByRole('button', { name: /botox|consultation/i }).first().click();
    const future = new Date();
    future.setDate(future.getDate() + 5);
    await page.getByRole('button', { name: future.getDate().toString(), exact: true }).first().click();
    await page.locator('[data-testid="time-slot"]:not([disabled])').first().click();
    await page.waitForSelector('[data-testid="contact-form"]');
  }

  test('Toggle reveals reference lookup panel', async ({ page }) => {
    await navigateToContactStep(page);
    await expect(page.locator('[data-testid="returning-patient-panel"]')).not.toBeVisible();
    await page.locator('[data-testid="toggle-returning-patient"]').click();
    await expect(page.locator('[data-testid="returning-patient-panel"]')).toBeVisible();
  });

  test('Valid mock reference (MAL-1042) pre-fills Sara Khan', async ({ page }) => {
    await navigateToContactStep(page);
    await page.locator('[data-testid="toggle-returning-patient"]').click();
    await page.locator('[data-testid="input-reference"]').fill('MAL-1042');
    await page.locator('[data-testid="submit-reference"]').click();
    await expect(page.locator('[data-testid="lookup-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="lookup-success"]')).toContainText('Sara Khan');
    await expect(page.locator('[data-testid="input-name"]')).toHaveValue('Sara Khan');
    // Phone may be formatted on display; assert it contains digits
    const phoneValue = await page.locator('[data-testid="input-phone"]').inputValue();
    expect(phoneValue.replace(/\D/g, '')).toContain('923001234001');
  });

  test('Invalid reference shows not-found message', async ({ page }) => {
    await navigateToContactStep(page);
    await page.locator('[data-testid="toggle-returning-patient"]').click();
    await page.locator('[data-testid="input-reference"]').fill('MAL-9999');
    await page.locator('[data-testid="submit-reference"]').click();
    await expect(page.locator('[data-testid="lookup-not-found"]')).toBeVisible();
    // Name field should remain empty
    await expect(page.locator('[data-testid="input-name"]')).toHaveValue('');
  });

  test('Loose reference format "1156" normalizes to MAL-1156 and finds Fatima', async ({ page }) => {
    await navigateToContactStep(page);
    await page.locator('[data-testid="toggle-returning-patient"]').click();
    await page.locator('[data-testid="input-reference"]').fill('1156');
    await page.locator('[data-testid="submit-reference"]').click();
    await expect(page.locator('[data-testid="input-name"]')).toHaveValue('Fatima Ahmed');
  });

  test('After lookup, returning patient can submit booking end-to-end', async ({ page }) => {
    await page.evaluate(() => localStorage.clear()).catch(() => {});
    await navigateToContactStep(page);
    await page.locator('[data-testid="toggle-returning-patient"]').click();
    await page.locator('[data-testid="input-reference"]').fill('MAL-1273');
    await page.locator('[data-testid="submit-reference"]').click();
    await expect(page.locator('[data-testid="input-name"]')).toHaveValue('Ayesha Malik');
    await page.locator('[data-testid="submit-booking"]').click();
    await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible();
  });

  test('Real booking reference is lookable after being saved', async ({ page }) => {
    // First, create a real booking
    await page.evaluate(() => localStorage.clear()).catch(() => {});
    await navigateToContactStep(page);
    await page.locator('[data-testid="input-name"]').fill('Real Test Patient');
    await page.locator('[data-testid="input-phone"]').fill('03007777777');
    await page.locator('[data-testid="input-email"]').fill('real@example.com');
    await page.locator('[data-testid="submit-booking"]').click();
    const reference = await page.locator('[data-testid="booking-reference"]').textContent();
    // Now start a new booking and try to look up that reference
    await navigateToContactStep(page);
    await page.locator('[data-testid="toggle-returning-patient"]').click();
    await page.locator('[data-testid="input-reference"]').fill(reference);
    await page.locator('[data-testid="submit-reference"]').click();
    await expect(page.locator('[data-testid="input-name"]')).toHaveValue('Real Test Patient');
  });
});

test.describe('Booking — mobile-first UX (Batch 7)', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14

  test('Date strip renders 14 pills', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByRole('button', { name: /karachi/i }).click();
    await page.getByRole('button', { name: /botox|consultation/i }).first().click();
    await expect(page.locator('[data-testid="date-strip"]')).toBeVisible();
    const pills = page.locator('[data-testid^="date-pill-"]');
    await expect(pills).toHaveCount(14);
  });

  test('Tapping a date pill reveals time slots', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByRole('button', { name: /karachi/i }).click();
    await page.getByRole('button', { name: /botox|consultation/i }).first().click();
    // Tap the third pill (skipping today and tomorrow to avoid same-day edge cases)
    await page.locator('[data-testid^="date-pill-"]').nth(3).click();
    await expect(page.locator('[data-testid="time-slot-strip"]')).toBeVisible();
    await expect(page.locator('[data-testid="time-slot"]')).toHaveCount(7);
  });

  test('Pick later date opens full-screen modal', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByRole('button', { name: /karachi/i }).click();
    await page.getByRole('button', { name: /botox|consultation/i }).first().click();
    await page.locator('[data-testid="open-date-picker"]').click();
    await expect(page.locator('[data-testid="date-picker-modal"]')).toBeVisible();
    // Modal should have 42 day cells
    await expect(page.locator('[data-testid^="picker-day-"]')).toHaveCount(42);
  });

  test('Modal Next month shifts forward', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByRole('button', { name: /karachi/i }).click();
    await page.getByRole('button', { name: /botox|consultation/i }).first().click();
    await page.locator('[data-testid="open-date-picker"]').click();
    const monthBefore = await page.locator('[data-testid="picker-month-label"]').textContent();
    await page.locator('[data-testid="picker-next"]').click();
    const monthAfter = await page.locator('[data-testid="picker-month-label"]').textContent();
    expect(monthBefore).not.toBe(monthAfter);
  });

  test('Picking date in modal closes it and selects that date in strip', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByRole('button', { name: /karachi/i }).click();
    await page.getByRole('button', { name: /botox|consultation/i }).first().click();
    await page.locator('[data-testid="open-date-picker"]').click();
    // Pick first available day in current month view
    await page.locator('[data-testid^="picker-day-"]:not([disabled])').first().click();
    await expect(page.locator('[data-testid="date-picker-modal"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="time-slot-strip"]')).toBeVisible();
  });

  test('Returning patient banner appears with prior booking', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`);
    await page.evaluate(() => {
      const prior = [{
        reference: 'MAL-7777', city: 'Karachi',
        procedure: { name: 'Botox', price: 30000 },
        slotIso: new Date(Date.now() - 86400000).toISOString(),
        contactDetails: { name: 'Past', phone: '+923001112222', email: '' },
        confirmedAt: new Date(Date.now() - 86400000).toISOString(),
      }];
      localStorage.setItem('maleeha_confirmed_bookings', JSON.stringify(prior));
      localStorage.removeItem('maleeha_booking_draft');
    });
    await page.reload();
    await expect(page.locator('[data-testid="returning-city-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="banner-accept"]')).toContainText('Karachi');
  });

  test('Banner Yes button skips to procedure step', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`);
    await page.evaluate(() => {
      const prior = [{
        reference: 'MAL-7777', city: 'Islamabad',
        procedure: { name: 'Botox', price: 30000 },
        slotIso: new Date().toISOString(),
        contactDetails: { name: 'Past', phone: '+923001112222', email: '' },
        confirmedAt: new Date().toISOString(),
      }];
      localStorage.setItem('maleeha_confirmed_bookings', JSON.stringify(prior));
      localStorage.removeItem('maleeha_booking_draft');
    });
    await page.reload();
    await page.locator('[data-testid="banner-accept"]').click();
    await expect(page.getByRole('button', { name: /botox|consultation/i }).first()).toBeVisible();
  });

  test('Banner Dismiss closes it', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`);
    await page.evaluate(() => {
      const prior = [{
        reference: 'MAL-7777', city: 'Karachi',
        procedure: { name: 'Botox', price: 30000 },
        slotIso: new Date().toISOString(),
        contactDetails: { name: 'Past', phone: '+923001112222', email: '' },
        confirmedAt: new Date().toISOString(),
      }];
      localStorage.setItem('maleeha_confirmed_bookings', JSON.stringify(prior));
      localStorage.removeItem('maleeha_booking_draft');
    });
    await page.reload();
    await page.locator('[data-testid="banner-dismiss"]').click();
    await expect(page.locator('[data-testid="returning-city-banner"]')).not.toBeVisible();
  });

  test('No horizontal page scroll on datetime step at 390px viewport', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByRole('button', { name: /karachi/i }).click();
    await page.getByRole('button', { name: /botox|consultation/i }).first().click();
    await page.locator('[data-testid^="date-pill-"]').nth(3).click();
    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalScroll).toBe(false);
  });
});
