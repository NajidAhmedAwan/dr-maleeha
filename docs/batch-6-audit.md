# Batch 6 Booking Flow Audit

Audited: 2026-05-25  
Viewport: 390px (iPhone 14 mobile-first)

## Bugs Found (5 total — proceeding to fix)

### Bug 1 — Photo upload is dead code / missing from real contact step [BLOCKER for Path C]
**Location:** `src/pages/Booking.jsx` lines 821–963 (`contactFormBody` variable)  
**Severity:** Blocker — Path C (Islamabad + media capture) cannot complete without this  
**Description:** The photo/voice/video upload UI is defined in `contactFormBody` but this variable is **never rendered** in either the desktop or mobile layout. The actual rendered contact step uses `contactContent` → `<ContactForm>` component, which has no media upload. Even if it were rendered, photos are gated behind `{isOnline && ...}` so they would only show for Online city, excluding Islamabad.  
**Fix:** Add a photo upload input with `data-testid="booking-media-upload"` directly inside `contactContent`, visible for all cities.

---

### Bug 2 — No `data-testid` on city card buttons [Playwright blocker]
**Location:** `src/pages/Booking.jsx` `renderCityCards()` function  
**Severity:** Required for reliable Playwright selectors per batch spec  
**Description:** City card `<button>` elements have no `data-testid`. Current tests work via `getByRole('button', {name:/karachi/i})` but the batch spec requires `booking-city-karachi`, `booking-city-islamabad`, `booking-city-online`.  
**Fix:** Add `data-testid={`booking-city-${loc.name.toLowerCase()}`}` to each city card button.

---

### Bug 3 — No `data-testid` on procedure/concern buttons [Playwright blocker]
**Location:** `src/pages/Booking.jsx` procedure rendering in both desktop and mobile layouts  
**Severity:** Required for reliable Playwright selectors  
**Description:** Procedure pills and online concern chips have no `data-testid`. Tests rely on `getByRole('button', {name:/botox/i})` which is fragile.  
**Fix:** Add `data-testid={`booking-procedure-${item.name.toLowerCase().replace(/[\s&]+/g,'-')}`}` to each procedure/concern button.

---

### Bug 4 — Online city shows `ONLINE_CONCERNS` not `PROCEDURES`; no "Consultation" item [Path B adaptation needed]
**Location:** `src/pages/Booking.jsx` line 517  
**Severity:** Low — flow works, but Path B test must use an actual Online concern (e.g. "General Concern") instead of "Consultation"  
**Description:** `const items = isOnline ? ONLINE_CONCERNS : PROCEDURES` means Online city shows a concern list, not the procedure list. "Consultation" does not exist in `ONLINE_CONCERNS`. Path B smoke test will use "General Concern" as the closest equivalent.  
**Fix:** No code change needed; Playwright test accounts for this.

---

### Bug 5 — `contactFormBody` is unreferenced dead code
**Location:** `src/pages/Booking.jsx` lines 821–963  
**Severity:** Low — no runtime effect, but bloats file and confuses the media-upload audit  
**Description:** The ~140-line inline contact form with media capture is never rendered; both desktop and mobile render use `contactContent` → `<ContactForm>`. The `handleConfirm` handler it would call is also superseded by `handleConfirmBooking`.  
**Fix:** Remove dead code in the same pass as Bug 1 fix to avoid confusion.

---

## Paths verified as unblocked after fixes

| Path | City | Procedure | Date selection | Media | Notes |
|------|------|-----------|---------------|-------|-------|
| A | Karachi | Botox | Any day (open all 7 days) | Not required | Clean path |
| B | Online | General Concern | Any day | Not required | No clinic address on confirmation |
| C | Islamabad | Acne Treatment | Tue/Thu/Sat only | Photo upload added by fix | Clinic address + Maps link on confirmation |
