/**
 * Application z-index hierarchy.
 *
 * Never introduce a z-index between FLOATING_BAR (100) and MODAL_OVERLAY (200)
 * without updating this file first.
 *
 * Hierarchy (low → high):
 *   BASE → DROPDOWN → FLOATING_BAR
 *   → CHATBOT_BUTTON → CHATBOT_PANEL → STICKY_HEADER
 *   → MODAL_OVERLAY → MODAL_CONTENT → DRAWER
 *   → TOAST → TOOLTIP
 *
 * Chatbot intentionally sits BELOW modals so procedure/product modals
 * can appear over the chat panel.
 */
export const Z_INDEX = {
  BASE: 1,
  DROPDOWN: 50,
  FLOATING_BAR: 100,
  CHATBOT_BUTTON: 110,
  CHATBOT_PANEL: 111,
  STICKY_HEADER: 150,
  MODAL_OVERLAY: 200,
  MODAL_CONTENT: 201,
  DRAWER: 210,
  TOAST: 300,
  TOOLTIP: 400,
}
