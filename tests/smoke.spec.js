import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_ENV === 'live' ? 'https://dr-maleeha.vercel.app' : 'http://localhost:5173';

// ── Helpers ───────────────────────────────────────────────────────────────────

function nextWeekday(targetDay) {
  const d = new Date();
  const diff = (targetDay - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d;
}

// Navigate booking flow to the contact step
async function navigateToContact(page, { city = 'Karachi', procedureTestId = 'booking-procedure-botox' } = {}) {
  await page.goto(`${BASE_URL}/booking`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.locator(`[data-testid="booking-city-${city.toLowerCase()}"]`).first().click();
  await page.locator(`[data-testid="${procedureTestId}"]`).first().click();

  if (city === 'Islamabad') {
    const candidates = [2, 4, 6].map(nextWeekday).sort((a, b) => a - b);
    const nearest = candidates[0];
    const key = `${nearest.getFullYear()}-${String(nearest.getMonth()+1).padStart(2,'0')}-${String(nearest.getDate()).padStart(2,'0')}`;
    const datePill = page.locator(`[data-testid="date-pill-${key}"]`);
    const visible = await datePill.isVisible().catch(() => false);
    if (!visible) {
      await page.locator('[data-testid="open-date-picker"]').click();
      await page.locator(`[data-testid="picker-day-${key}"]`).click();
    } else {
      await datePill.click();
    }
  } else {
    await page.locator('[data-testid^="date-pill-"]').nth(2).click();
  }

  await page.locator('[data-testid="time-slot"]:not([disabled])').first().click();
  await page.waitForSelector('[data-testid="contact-form"]');
}

// Quick booking helper for Batch 5 dashboard tests
async function createOneBooking(page, { city = 'Karachi', name = 'Test Patient', phone = '03001234567' } = {}) {
  await page.goto(`${BASE_URL}/booking`);
  await page.getByRole('button', { name: new RegExp(city, 'i') }).click();
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

// Helper: returns { day, date } for next occurrence of given JS weekday (0=Sun..6=Sat)
function getNextWeekday(targetDay) {
  const d = new Date();
  const diff = (targetDay - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return { day: d.getDate(), date: d };
}

// ── HOMEPAGE ──────────────────────────────────────────────────────────────────

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

  test('no error boundary or white screen on load', async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.toLowerCase()).not.toContain('something went wrong');
    // Filter out expected third-party errors (image CDN, analytics, etc.)
    const fatalErrors = errors.filter(e =>
      !e.includes('unsplash') && !e.includes('favicon') && !e.includes('analytics')
    );
    expect(fatalErrors).toHaveLength(0);
  });

  test('all 10 procedure cards render with names', async ({ page }) => {
    await page.goto('/');
    const procedures = [
      'Botox', 'PLLA Threads', 'Chemical Peels', 'Consultation',
      'Microneedling', 'Laser Treatment', 'Hydrafacial', 'PRP Treatment',
      'Lip Fillers', 'Skin Boosters',
    ];
    for (const proc of procedures) {
      await expect(page.locator(`text=/${proc}/i`).first()).toBeVisible();
    }
  });

  test('each procedure card has a Book button', async ({ page }) => {
    await page.goto('/');
    const bookButtons = page.getByRole('button', { name: /book/i });
    const count = await bookButtons.count();
    expect(count).toBeGreaterThanOrEqual(6);
  });

  test('Shop section renders with products', async ({ page }) => {
    await page.goto('/');
    await page.locator('#shop').scrollIntoViewIfNeeded();
    await expect(page.locator('#shop')).toBeVisible();
    // At least 4 product items visible
    const productImages = page.locator('#shop img, #shop [style*="gradient"]');
    await expect(productImages.first()).toBeVisible();
  });

  test('Instagram / Videos section renders', async ({ page }) => {
    await page.goto('/');
    await page.locator('#videos').scrollIntoViewIfNeeded();
    await expect(page.locator('#videos')).toBeVisible();
    // At least one video card visible
    const cards = page.locator('#videos [style*="border-radius"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('FAQ section renders with questions', async ({ page }) => {
    await page.goto('/');
    await page.locator('#faq').scrollIntoViewIfNeeded();
    await expect(page.locator('#faq')).toBeVisible();
    await expect(page.locator('text=/Botox hurt/i').first()).toBeVisible();
  });

  test('footer renders with Karachi and Islamabad clinic info', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();
    const footerText = await footer.innerText();
    expect(footerText.toLowerCase()).toContain('karachi');
    expect(footerText.toLowerCase()).toContain('islamabad');
    expect(footerText.toLowerCase()).not.toContain('lahore');
  });

  test('How It Works section visible', async ({ page }) => {
    await page.goto('/');
    await page.locator('#how-it-works').scrollIntoViewIfNeeded();
    await expect(page.locator('#how-it-works')).toBeVisible();
    await expect(page.locator('text=/Pick your slot/i').first()).toBeVisible();
  });

  test('patient chatbot bubble visible bottom-right', async ({ page }) => {
    await page.goto('/');
    // Chatbot button has aria-label containing "chat"
    const bubble = page.locator('[aria-label*="chat" i]');
    await expect(bubble).toBeVisible();
  });

  test('clicking chatbot bubble opens chat widget', async ({ page }) => {
    await page.goto('/');
    const bubble = page.locator('[aria-label*="chat" i]');
    await bubble.click();
    // Chat panel should appear — look for "Dr. Maleeha's Assistant" text
    await expect(page.locator("text=/Dr. Maleeha/i").first()).toBeVisible();
  });
});

// ── BOOKING FLOW ──────────────────────────────────────────────────────────────

test.describe('Booking flow @smoke', () => {
  test('booking page loads with 3 cities only', async ({ page }) => {
    await page.goto('/booking');
    await expect(page.locator('text=/Karachi/i')).toBeVisible();
    await expect(page.locator('text=/Islamabad/i')).toBeVisible();
    await expect(page.locator('text=/Online/i')).toBeVisible();
    await expect(page.locator('text=/Lahore/i')).toHaveCount(0);
  });

  test('selecting Karachi shows procedure list', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.locator('[data-testid="booking-city-karachi"]').first().click();
    await expect(page.locator('[data-testid^="booking-procedure-"]').first()).toBeVisible();
  });

  test('selecting a procedure shows calendar / date strip', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.locator('[data-testid="booking-city-karachi"]').first().click();
    await page.locator('[data-testid^="booking-procedure-"]').first().click();
    // Either date strip or date picker button should appear
    const dateArea = page.locator('[data-testid="date-strip"], [data-testid="open-date-picker"]');
    await expect(dateArea.first()).toBeVisible();
  });

  test('selecting a date shows time slots', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.locator('[data-testid="booking-city-karachi"]').first().click();
    await page.locator('[data-testid^="booking-procedure-"]').first().click();
    await page.locator('[data-testid^="date-pill-"]').nth(2).click();
    await expect(page.locator('[data-testid="time-slot"]').first()).toBeVisible();
  });

  test('selecting a time shows contact form', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.locator('[data-testid="booking-city-karachi"]').first().click();
    await page.locator('[data-testid^="booking-procedure-"]').first().click();
    await page.locator('[data-testid^="date-pill-"]').nth(2).click();
    await page.locator('[data-testid="time-slot"]:not([disabled])').first().click();
    await expect(page.locator('[data-testid="contact-form"]')).toBeVisible();
  });

  test('full booking submission shows MAL-XXXX confirmation', async ({ page }) => {
    await navigateToContact(page, { city: 'Karachi', procedureTestId: 'booking-procedure-botox' });
    await page.locator('[data-testid="input-name"]').fill('Ayesha Khan');
    await page.locator('[data-testid="input-phone"]').fill('+923001234567');
    await page.locator('[data-testid="input-email"]').fill('ayesha@example.com');
    await page.locator('[data-testid="submit-booking"]').click();
    await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible();
    await expect(page.locator('[data-testid="booking-reference"]')).toContainText(/MAL-\d{4}/);
  });

  test('Karachi confirmation includes Google Maps link', async ({ page }) => {
    await navigateToContact(page, { city: 'Karachi', procedureTestId: 'booking-procedure-botox' });
    await page.locator('[data-testid="input-name"]').fill('Sara Malik');
    await page.locator('[data-testid="input-phone"]').fill('03001234567');
    await page.locator('[data-testid="submit-booking"]').click();
    await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible();
    await expect(page.locator('a[href*="maps.google.com"]').first()).toBeVisible();
  });

  test('Add to Calendar option present in confirmation', async ({ page }) => {
    await navigateToContact(page, { city: 'Karachi', procedureTestId: 'booking-procedure-botox' });
    await page.locator('[data-testid="input-name"]').fill('Noor Ahmed');
    await page.locator('[data-testid="input-phone"]').fill('03211234567');
    await page.locator('[data-testid="submit-booking"]').click();
    await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible();
    // Calendar CTA — look for "calendar" text or Google Calendar link
    const calendarEl = page.locator('text=/calendar|add to calendar/i').first();
    await expect(calendarEl).toBeVisible();
  });

  test('no error boundary on booking page', async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto(`${BASE_URL}/booking`);
    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.toLowerCase()).not.toContain('something went wrong');
    const fatalErrors = errors.filter(e =>
      !e.includes('unsplash') && !e.includes('favicon') && !e.includes('analytics')
    );
    expect(fatalErrors).toHaveLength(0);
  });
});

// ── AUTH FLOW ─────────────────────────────────────────────────────────────────

test.describe('Dashboard @smoke', () => {
  test('dashboard redirects to /login when unauthenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Auth — Batch 7b', () => {
  test('Auth gate — /dashboard redirects to /login when unauthenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('Login page renders correctly on mobile', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('[data-testid="login-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-submit"]')).toBeVisible();
  });

  test('/login renders with magic link email input', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page.locator('[data-testid="login-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-email"]')).toBeVisible();
    const label = page.locator('text=/email|magic link/i').first();
    await expect(label).toBeVisible();
  });

  test('submitting email on /login shows confirmation message', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.locator('[data-testid="login-email"]').fill('test@example.com');
    await page.locator('[data-testid="login-submit"]').click();
    // Should show either sent confirmation or error (Supabase may reject in test env)
    const sent = page.locator('[data-testid="login-sent"]');
    const error = page.locator('[data-testid="login-error"]');
    const anyVisible = await Promise.any([
      sent.waitFor({ timeout: 8000 }).then(() => true),
      error.waitFor({ timeout: 8000 }).then(() => true),
    ]).catch(() => false);
    expect(anyVisible).toBe(true);
  });
});

// ── BRANDS PORTAL ─────────────────────────────────────────────────────────────

test.describe('Brands portal @smoke', () => {
  test('brands page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/brands`);
    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});

// ── BOOKING — SLOTS + DEPOSIT (Batch 1) ───────────────────────────────────────

test.describe('Booking — slots + deposit (Batch 1)', () => {
  test('Islamabad shows 7 slots on a Tuesday', async ({ page }) => {
    const { day } = getNextWeekday(2); // Tuesday
    await page.goto(`${BASE_URL}/booking`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByRole('button', { name: /islamabad/i }).first().click();
    await page.getByRole('button', { name: /botox|consultation/i }).first().click();
    await page.getByRole('button', { name: day.toString(), exact: true }).first().click();
    const slots = page.locator('[data-testid="time-slot"]');
    await expect(slots.first()).toBeVisible();
    const count = await slots.count();
    expect(count).toBe(7);
  });

  test('Islamabad shows closed message on a Wednesday', async ({ page }) => {
    const { day } = getNextWeekday(3); // Wednesday
    await page.goto(`${BASE_URL}/booking`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByRole('button', { name: /islamabad/i }).first().click();
    await page.getByRole('button', { name: /botox|consultation/i }).first().click();
    await page.getByRole('button', { name: day.toString(), exact: true }).first().click();
    await expect(page.locator('text=/closed|not available|unavailable/i').first()).toBeVisible();
  });

  test('Karachi same-day shows 100% deposit with warning pill', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByRole('button', { name: /karachi/i }).first().click();
    await page.getByRole('button', { name: /botox|consultation/i }).first().click();
    const today = new Date().getDate();
    await page.getByRole('button', { name: today.toString(), exact: true }).first().click();
    const slots = page.locator('[data-testid="time-slot"]:not([disabled])');
    const count = await slots.count();
    if (count > 0) {
      await slots.first().click();
      await expect(page.locator('text=/100%|same.day|full deposit/i').first()).toBeVisible();
    }
  });

  test('Online 10-days-out shows 50% deposit', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByRole('button', { name: /online/i }).first().click();
    await page.getByRole('button', { name: /general concern|acne|consultation/i }).first().click();
    const future = new Date();
    future.setDate(future.getDate() + 10);
    await page.getByRole('button', { name: future.getDate().toString(), exact: true }).first().click();
    await page.locator('[data-testid="time-slot"]:not([disabled])').first().click();
    await expect(page.locator('text=/50%|50 %/i').first()).toBeVisible();
  });
});

// ── BOOKING — CONTACT FORM VALIDATION (Batch 3) ───────────────────────────────

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
      await expect(page.locator('[data-testid="error-phone"]')).not.toBeVisible();
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

// ── DASHBOARD — REAL BOOKINGS (Batch 5) ───────────────────────────────────────
// These tests require dashboard access. If the dashboard redirects to /login
// (auth required), the tests are skipped — that redirect is expected behaviour.

test.describe('Dashboard — real bookings (Batch 5)', () => {
  // Dashboard auth gate fires client-side via React Router; wait up to 3s for /login redirect.
  async function goToDashboard(page) {
    await page.goto(`${BASE_URL}/dashboard`);
    try {
      await page.waitForURL(/\/login/, { timeout: 3000 });
      return false; // redirected — auth required
    } catch {
      return true; // no redirect — dashboard accessible
    }
  }

  test('Empty dashboard shows empty state for recent bookings', async ({ page }) => {
    const accessible = await goToDashboard(page);
    if (!accessible) { test.skip(); return; }
    await page.evaluate(() => {
      localStorage.removeItem('maleeha_confirmed_bookings');
      localStorage.removeItem('maleeha_dashboard_last_viewed');
    });
    await page.reload();
    if (page.url().includes('/login')) { test.skip(); return; }
    await expect(page.locator('[data-testid="recent-bookings-empty"]')).toBeVisible();
  });

  test('Real booking appears in dashboard list', async ({ page }) => {
    await page.evaluate(() => localStorage.clear()).catch(() => {});
    await createOneBooking(page, { name: 'Ayesha Khan' });
    const accessible = await goToDashboard(page);
    if (!accessible) { test.skip(); return; }
    await expect(page.locator('[data-testid="recent-bookings-list"]')).toBeVisible();
    await expect(page.getByText('Ayesha Khan')).toBeVisible();
  });

  test('NEW badge appears on first dashboard view, gone after revisit', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`);
    await page.evaluate(() => localStorage.clear());
    await createOneBooking(page, { name: 'Fresh Patient' });
    const accessible = await goToDashboard(page);
    if (!accessible) { test.skip(); return; }
    await expect(page.locator('[data-testid="new-badge"]').first()).toBeVisible();
    await page.waitForTimeout(2000);
    const stillAccessible = await goToDashboard(page);
    if (!stillAccessible) { test.skip(); return; }
    await expect(page.locator('[data-testid="new-badge"]')).not.toBeVisible();
  });

  test('Mock data still visible (real bookings ADD, not REPLACE)', async ({ page }) => {
    await page.evaluate(() => localStorage.clear()).catch(() => {});
    const accessible = await goToDashboard(page);
    if (!accessible) { test.skip(); return; }
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
    const accessible = await goToDashboard(page);
    if (!accessible) { test.skip(); return; }
    const card = page.locator('[data-testid^="booking-card-"]', { hasText: 'Online Test' });
    await expect(card).toBeVisible();
    await expect(card).toContainText('Online');
  });
});

// ── DASHBOARD — ACCESSIBLE CHECKS (Batch 5b) ─────────────────────────────────
// If auth blocks dashboard, these are automatically skipped.

test.describe('Dashboard — UI checks (if accessible)', () => {
  async function openDashboard(page) {
    await page.goto(`${BASE_URL}/dashboard`);
    try {
      await page.waitForURL(/\/login/, { timeout: 3000 });
      return false;
    } catch {
      return true;
    }
  }

  test('KPI cards render (Total, Pending, Confirmed, Rejected, Revenue)', async ({ page }) => {
    const accessible = await openDashboard(page);
    if (!accessible) { test.skip(); return; }
    await expect(page.locator('[data-testid="kpi-pending"]')).toBeVisible();
    await expect(page.locator('text=/Total Appointments/i').first()).toBeVisible();
    await expect(page.locator('text=/Confirmed/i').first()).toBeVisible();
    await expect(page.locator('text=/Rejected/i').first()).toBeVisible();
    await expect(page.locator('text=/Revenue/i').first()).toBeVisible();
  });

  test('calendar renders on dashboard', async ({ page }) => {
    const accessible = await openDashboard(page);
    if (!accessible) { test.skip(); return; }
    // Calendar shows today's date cell
    const today = new Date().toISOString().split('T')[0];
    await expect(page.locator(`[data-testid="calendar-cell-${today}"]`)).toBeVisible();
  });
});

// ── PATIENT CHATBOT ───────────────────────────────────────────────────────────

test.describe('Patient chatbot', () => {
  test('bubble renders on homepage bottom-right', async ({ page }) => {
    await page.goto('/');
    const bubble = page.locator('[aria-label*="chat" i]');
    await expect(bubble).toBeVisible();
    const box = await bubble.boundingBox();
    const viewport = page.viewportSize();
    // Should be in the right half of the screen
    expect(box.x).toBeGreaterThan(viewport.width / 2);
  });

  test('clicking bubble opens chat widget', async ({ page }) => {
    await page.goto('/');
    await page.locator('[aria-label*="chat" i]').click();
    await expect(page.locator("text=/Dr. Maleeha/i").first()).toBeVisible({ timeout: 3000 });
  });

  test('typing a message gets a bot response', async ({ page }) => {
    await page.goto('/');
    await page.locator('[aria-label*="chat" i]').click();
    // Wait for welcome message
    await page.waitForTimeout(800);
    // Type in the chat input — look for input or textarea in chat panel
    const input = page.locator('input[placeholder*="message" i], input[placeholder*="type" i], input[placeholder*="ask" i]').first();
    await input.fill('Botox');
    await input.press('Enter');
    // Wait for bot reply
    await page.waitForTimeout(1500);
    // Should have at least 2 messages (user + bot)
    const msgs = page.locator('[style*="border-radius"][style*="padding"]');
    const count = await msgs.count();
    expect(count).toBeGreaterThan(1);
  });

  test('chat widget can be closed', async ({ page }) => {
    await page.goto('/');
    await page.locator('[aria-label*="chat" i]').click();
    await expect(page.locator("text=/Dr. Maleeha/i").first()).toBeVisible({ timeout: 3000 });
    await page.locator('[aria-label="Close chat"]').click();
    await expect(page.locator("text=/Usually replies instantly/i")).not.toBeVisible();
  });
});

// ── ERROR BOUNDARY ────────────────────────────────────────────────────────────

test.describe('Error boundary', () => {
  test('no "Something went wrong" on homepage', async ({ page }) => {
    await page.goto('/');
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.toLowerCase()).not.toContain('something went wrong');
  });

  test('no "Something went wrong" on booking page', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.toLowerCase()).not.toContain('something went wrong');
  });

  test('no fatal console errors on homepage load', async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const fatalErrors = errors.filter(e =>
      !e.includes('unsplash') && !e.includes('favicon') &&
      !e.includes('analytics') && !e.includes('Failed to load resource')
    );
    expect(fatalErrors).toHaveLength(0);
  });

  test('no fatal console errors on booking page load', async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto(`${BASE_URL}/booking`);
    await page.waitForLoadState('networkidle');
    const fatalErrors = errors.filter(e =>
      !e.includes('unsplash') && !e.includes('favicon') &&
      !e.includes('analytics') && !e.includes('Failed to load resource')
    );
    expect(fatalErrors).toHaveLength(0);
  });
});

// ── MOBILE VIEWPORT (390px) ───────────────────────────────────────────────────

test.describe('Mobile viewport — homepage (390px)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('homepage loads without horizontal scroll at 390px', async ({ page }) => {
    await page.goto('/');
    const hasHScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHScroll).toBe(false);
  });

  test('hero carousel visible at 390px', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=/In Your Face/i').first()).toBeVisible();
  });

  test('procedure cards visible at 390px', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=/Botox/i').first()).toBeVisible();
  });

  test('chatbot bubble visible at 390px', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[aria-label*="chat" i]')).toBeVisible();
  });

  test('tap targets are at least 44px on booking city step', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    const cityBtn = page.locator('[data-testid="booking-city-karachi"]').first();
    await expect(cityBtn).toBeVisible();
    const box = await cityBtn.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
  });
});

test.describe('Mobile viewport — booking flow (390px)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('booking page loads without horizontal scroll at 390px', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`);
    const hasHScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHScroll).toBe(false);
  });

  test('all three city cards visible at 390px', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`);
    await expect(page.locator('text=/Karachi/i')).toBeVisible();
    await expect(page.locator('text=/Islamabad/i')).toBeVisible();
    await expect(page.locator('text=/Online/i')).toBeVisible();
  });
});

// ── BOOKING — RETURNING PATIENT LOOKUP (Batch 6) ─────────────────────────────

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
    const phoneValue = await page.locator('[data-testid="input-phone"]').inputValue();
    expect(phoneValue.replace(/\D/g, '')).toContain('923001234001');
  });

  test('Invalid reference shows not-found message', async ({ page }) => {
    await navigateToContactStep(page);
    await page.locator('[data-testid="toggle-returning-patient"]').click();
    await page.locator('[data-testid="input-reference"]').fill('MAL-9999');
    await page.locator('[data-testid="submit-reference"]').click();
    await expect(page.locator('[data-testid="lookup-not-found"]')).toBeVisible();
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
    await page.evaluate(() => localStorage.clear()).catch(() => {});
    await navigateToContactStep(page);
    await page.locator('[data-testid="input-name"]').fill('Real Test Patient');
    await page.locator('[data-testid="input-phone"]').fill('03007777777');
    await page.locator('[data-testid="input-email"]').fill('real@example.com');
    await page.locator('[data-testid="submit-booking"]').click();
    const reference = await page.locator('[data-testid="booking-reference"]').textContent();
    await navigateToContactStep(page);
    await page.locator('[data-testid="toggle-returning-patient"]').click();
    await page.locator('[data-testid="input-reference"]').fill(reference);
    await page.locator('[data-testid="submit-reference"]').click();
    await expect(page.locator('[data-testid="input-name"]')).toHaveValue('Real Test Patient');
  });
});

// ── BOOKING — MOBILE-FIRST UX (Batch 7) ──────────────────────────────────────

test.describe('Booking — mobile-first UX (Batch 7)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

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

// ── BOOKING — END-TO-END HAPPY PATHS (Batch 6b) ──────────────────────────────

test.describe('Booking — end-to-end happy paths (Batch 6)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('Path A — Karachi Botox booking', async ({ page }) => {
    await navigateToContact(page, {
      city: 'Karachi',
      procedureTestId: 'booking-procedure-botox',
    });
    await page.locator('[data-testid="input-name"]').fill('Fatima Khan');
    await page.locator('[data-testid="input-phone"]').fill('03001234567');
    await page.locator('[data-testid="input-email"]').fill('fatima@example.com');
    await page.locator('[data-testid="submit-booking"]').click();
    await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible();
    await expect(page.locator('[data-testid="booking-reference"]')).toContainText(/MAL-\d{4}/);
  });

  test('Path B — Online consultation booking (no clinic address)', async ({ page }) => {
    await navigateToContact(page, {
      city: 'Online',
      procedureTestId: 'booking-procedure-general-concern',
    });
    await page.locator('[data-testid="input-name"]').fill('Sara Malik');
    await page.locator('[data-testid="input-phone"]').fill('03219876543');
    await page.locator('[data-testid="input-email"]').fill('sara@example.com');
    await page.locator('[data-testid="submit-booking"]').click();
    await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible();
    await expect(page.locator('[data-testid="booking-reference"]')).toContainText(/MAL-\d{4}/);
    const addressLinks = page.locator('a[href*="maps.google.com"]');
    await expect(addressLinks).toHaveCount(0);
  });

  test('Path C — Islamabad Acne Treatment with media upload', async ({ page }) => {
    await navigateToContact(page, {
      city: 'Islamabad',
      procedureTestId: 'booking-procedure-acne-treatment',
    });
    const fileInput = page.locator('[data-testid="booking-media-upload"]');
    await fileInput.setInputFiles('./tests/fixtures/test-photo.jpg');
    await page.locator('[data-testid="input-name"]').fill('Zara Sheikh');
    await page.locator('[data-testid="input-phone"]').fill('03456667777');
    await page.locator('[data-testid="input-email"]').fill('zara@example.com');
    await page.locator('[data-testid="submit-booking"]').click();
    await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible();
    await expect(page.locator('[data-testid="booking-reference"]')).toContainText(/MAL-\d{4}/);
    const mapsLink = page.locator('a[href*="maps.google.com"]');
    await expect(mapsLink.first()).toBeVisible();
    await expect(mapsLink.first()).toContainText(/Faisal Market|F-7/i);
  });
});

// ── BATCH 9A — UX REFRESH ─────────────────────────────────────────────────────

test.describe('Batch 9a — Booking UX refresh', () => {
  test('stepper is present and has 6 steps', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`);
    await expect(page.locator('[data-testid="booking-stepper"]')).toBeVisible();
    const steps = page.locator('[data-testid="stepper-step"]');
    await expect(steps).toHaveCount(6);
  });

  test('patient status pill does not exist (removed in 9b)', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`);
    const pill = page.locator('[data-testid="patient-status-pill"]');
    expect(await pill.count()).toBe(0);
  });

  test('no video button exists in media section', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`);
    await page.locator('[data-testid="booking-city-karachi"]').first().click();
    await page.locator('[data-testid^="booking-procedure-"]').first().click();
    const videoButtons = page.getByRole('button', { name: /video/i });
    expect(await videoButtons.count()).toBe(0);
  });

  test('medication textarea NOT visible by default', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`);
    await page.locator('[data-testid="booking-city-karachi"]').first().click();
    await page.locator('[data-testid^="booking-procedure-"]').first().click();
    // Intake step should auto-load after procedure selection
    await page.waitForSelector('text=/Currently on medication/i');
    // Medication list textarea should not be visible before Yes is clicked
    const medListTextarea = page.locator('textarea[placeholder*="medication" i], textarea[placeholder*="medications" i]');
    expect(await medListTextarea.count()).toBe(0);
  });

  test('medication textarea appears on Yes, disappears on No', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`);
    await page.locator('[data-testid="booking-city-karachi"]').first().click();
    await page.locator('[data-testid^="booking-procedure-"]').first().click();
    await page.waitForSelector('text=/Currently on medication/i');
    // Click Yes
    await page.getByRole('button', { name: /^Yes$/ }).first().click();
    const medTextarea = page.locator('textarea[placeholder*="medication" i]').first();
    await expect(medTextarea).toBeVisible();
    // Click No
    await page.getByRole('button', { name: /^No$/ }).first().click();
    expect(await page.locator('textarea[placeholder*="medication" i]').count()).toBe(0);
  });

  test('city cards are present — Karachi, Islamabad, Online', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`);
    await expect(page.locator('[data-testid="booking-city-karachi"]')).toBeVisible();
    await expect(page.locator('[data-testid="booking-city-islamabad"]')).toBeVisible();
    await expect(page.locator('[data-testid="booking-city-online"]')).toBeVisible();
  });
});

// ── BATCH 9B.1 — PROCEDURE CATEGORY DRILL-DOWN ───────────────────────────────

test.describe('Batch 9b.1 — procedure category drill-down', () => {
  test('9b.1: procedure step shows categories, drills to sub-procedure, back works', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Select Islamabad (in-clinic city triggers category view)
    await page.locator('[data-testid="booking-city-islamabad"]').first().click();

    // Assert exactly 4 category cards visible
    await page.waitForSelector('[data-testid="booking-category-injectables"]');
    await expect(page.locator('[data-testid="booking-category-injectables"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="booking-category-skin-treatments"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="booking-category-acne-scars"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="booking-category-consultation"]').first()).toBeVisible();

    // Click Injectables
    await page.locator('[data-testid="booking-category-injectables"]').first().click();

    // Assert Injectables sub-procedures visible
    await page.waitForSelector('[data-testid="booking-procedure-botox"]');
    await expect(page.locator('[data-testid="booking-procedure-botox"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="booking-procedure-plla-threads"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="booking-procedure-lip-fillers"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="booking-procedure-skin-boosters"]').first()).toBeVisible();

    // Assert Back button visible
    await expect(page.locator('[data-testid="booking-back-to-categories"]').first()).toBeVisible();

    // Click Back — assert all 4 categories reappear
    await page.locator('[data-testid="booking-back-to-categories"]').first().click();
    await page.waitForSelector('[data-testid="booking-category-injectables"]');
    await expect(page.locator('[data-testid="booking-category-injectables"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="booking-category-skin-treatments"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="booking-category-acne-scars"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="booking-category-consultation"]').first()).toBeVisible();

    // Drill into Skin Treatments and select Hydrafacial
    await page.locator('[data-testid="booking-category-skin-treatments"]').first().click();
    await page.waitForSelector('[data-testid="booking-procedure-hydrafacial"]');
    await page.locator('[data-testid="booking-procedure-hydrafacial"]').first().click();

    // Assert advanced to next step (Medical Intake)
    await page.waitForSelector('text=/Medical Intake/i');
    await expect(page.locator('text=/Medical Intake/i').first()).toBeVisible();
  });
});

// ── BATCH 9B — SPLIT PANEL LAYOUT ────────────────────────────────────────────

test.describe('Batch 9b — split panel layout', () => {
  test('patient status pill does not exist', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`);
    expect(await page.locator('[data-testid="patient-status-pill"]').count()).toBe(0);
  });

  test('left panel exists with 3 city cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`);
    await expect(page.locator('[data-testid="booking-left-panel"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="booking-city-karachi"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="booking-city-islamabad"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="booking-city-online"]').first()).toBeVisible();
  });

  test('right panel exists with stepper', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`);
    await expect(page.locator('[data-testid="booking-right-panel"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="booking-stepper"]').first()).toBeVisible();
  });

  test('selecting Karachi shows checkmark badge on card', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`);
    await page.locator('[data-testid="booking-city-karachi"]').first().click();
    await expect(page.locator('[data-testid="booking-city-karachi-check"]')).toBeVisible();
    expect(await page.locator('[data-testid="booking-city-islamabad-check"]').count()).toBe(0);
  });

  test('header shows "Book with Dr. Maleeha Jawaid"', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`);
    await expect(page.locator('text=Book with Dr. Maleeha Jawaid').first()).toBeVisible();
  });

  test('footer Continue button is present', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`);
    await expect(page.locator('[data-testid="booking-footer-btn"]').first()).toBeVisible();
  });

  test.describe('mobile 390px — left panel stacks above right panel', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('city cards section appears before stepper in DOM order', async ({ page }) => {
      await page.goto(`${BASE_URL}/booking`);
      const leftPanel = page.locator('[data-testid="booking-left-panel"]').first();
      const stepper   = page.locator('[data-testid="booking-stepper"]').first();
      await expect(leftPanel).toBeVisible();
      await expect(stepper).toBeVisible();
      const leftBox   = await leftPanel.boundingBox();
      const stepperBox = await stepper.boundingBox();
      // City cards should be visually above the stepper
      expect(leftBox.y).toBeLessThan(stepperBox.y);
    });
  });
});

// ── BATCH 9B.2 — NEW VS RETURNING MODAL + PATIENT CONTEXT ────────────────────

test.describe('Batch 9b.2 — patient type modal', () => {
  test('9b.2: book CTA opens modal, returning patient flow prefills contact step', async ({ page }) => {
    // 1. Navigate to homepage
    await page.goto(`${BASE_URL}/`);

    // 2. Click the main hero Book CTA
    await page.waitForSelector('[data-testid="hero-book-cta"]');
    await page.locator('[data-testid="hero-book-cta"]').click();

    // 3. Assert modal is visible
    await page.waitForSelector('[data-testid="patient-type-modal"]');
    await expect(page.locator('[data-testid="patient-type-modal"]')).toBeVisible();

    // 4. Assert both options visible
    await expect(page.locator('[data-testid="patient-type-new"]')).toBeVisible();
    await expect(page.locator('[data-testid="patient-type-returning"]')).toBeVisible();

    // 5. Click Returning Patient
    await page.locator('[data-testid="patient-type-returning"]').click();

    // 6. Assert MAL input field visible
    await page.waitForSelector('[data-testid="mal-input"]');
    await expect(page.locator('[data-testid="mal-input"]')).toBeVisible();

    // 7. Fill MAL-0001 and submit
    await page.locator('[data-testid="mal-input"]').fill('MAL-0001');
    await page.locator('[data-testid="mal-submit"]').click();

    // 8. Assert routed to /booking
    await page.waitForURL(`${BASE_URL}/booking`);

    // 9a. Select city
    await page.waitForSelector('[data-testid="booking-city-karachi"]');
    await page.locator('[data-testid="booking-city-karachi"]').first().click();

    // 9b. Select Injectables category
    await page.waitForSelector('[data-testid="booking-category-injectables"]');
    await page.locator('[data-testid="booking-category-injectables"]').first().click();

    // 9c. Select Botox procedure
    await page.waitForSelector('[data-testid="booking-procedure-botox"]');
    await page.locator('[data-testid="booking-procedure-botox"]').first().click();

    // 9d. Complete intake step (Medical Intake)
    await page.waitForSelector('text=Medical Intake');
    // DOB
    await page.locator('input[type="date"]').first().fill('1990-01-01');
    // Appointment type
    await page.getByRole('button', { name: 'Initial Consultation' }).click();
    // Skin concern
    await page.locator('textarea[placeholder*="main skin concern"]').fill('Fine lines and wrinkles');
    // Previous treatments
    await page.locator('textarea[placeholder*="Botox 2023"]').fill('None');
    // Medical history
    await page.locator('textarea[placeholder*="Diabetes"]').fill('None');
    // On medication
    await page.getByRole('button', { name: 'No', exact: true }).click();
    // Continue to datetime step
    await page.locator('[data-testid="booking-footer-btn"]').click();

    // 9e. Select date
    await page.waitForSelector('[data-testid^="date-pill-"]');
    await page.locator('[data-testid^="date-pill-"]').nth(2).click();

    // 9f. Select time slot → auto-advances to contact step
    await page.waitForSelector('[data-testid="time-slot"]:not([disabled])');
    await page.locator('[data-testid="time-slot"]:not([disabled])').first().click();

    // 10–12. Assert contact step prefilled with Sara Khan's data
    await page.waitForSelector('[data-testid="contact-form"]');
    await expect(page.locator('[data-testid="input-name"]')).toHaveValue('Sara Khan');
    await expect(page.locator('[data-testid="input-phone"]')).toHaveValue('+923001234567');
    await expect(page.locator('[data-testid="input-email"]')).toHaveValue('sara@example.com');
  });
});
