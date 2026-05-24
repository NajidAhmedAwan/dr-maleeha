# Animation Keyframe Prefix Convention

All `@keyframes` rules must be prefixed by their component area to avoid collisions.

| Prefix   | Component area                      | Example                |
|----------|-------------------------------------|------------------------|
| `app-`   | Shared / global (index.css)         | `app-modal-in`         |
| `nl-`    | Newsletter (AIAssistant → Newsletter)| `nl-fade-slide-up`    |
| `bk-`    | Booking flow (Booking.jsx)          | `bk-confetti-fall`     |
| `dash-`  | Dashboard (Dashboard.jsx)           | `dash-kpi-count`       |
| `cb-`    | Chatbot widget (ChatbotWidget.jsx)  | `cb-slide-up`          |
| `hp-`    | Homepage (Home.jsx)                 | `hp-hero-in`           |

**Rules:**
- Define the keyframe in the same file (or `<style>` block) where it is used.
- Shared keyframes used across 3+ components belong in `index.css` with `app-` prefix.
- Never add a component-specific keyframe to `index.css` — keep it inline.
