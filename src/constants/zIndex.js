/**
 * Application z-index hierarchy.
 *
 * Never introduce a z-index between FLOATING_BAR (100) and MODAL_OVERLAY (200)
 * without updating this file first.
 *
 * Hierarchy (low → high):
 *   BASE → DROPDOWN → FLOATING_BAR → STICKY_HEADER
 *   → MODAL_OVERLAY → MODAL_CONTENT → DRAWER
 *   → TOAST → TOOLTIP → CHATBOT_BUTTON → CHATBOT_WINDOW
 */
export const Z_INDEX = {
  BASE: 1,
  DROPDOWN: 50,
  FLOATING_BAR: 100,
  STICKY_HEADER: 150,
  MODAL_OVERLAY: 200,
  MODAL_CONTENT: 201,
  DRAWER: 210,
  TOAST: 300,
  TOOLTIP: 400,
  CHATBOT_BUTTON: 410,
  CHATBOT_WINDOW: 411,
}
