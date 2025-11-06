/**
 * Lightweight analytics helpers (browser-only).
 * No env usage; pass `debug=true` to print in dev.
 */

/**
 * Push an event into a generic dataLayer and gtag if present.
 * @param {string} event
 * @param {Record<string, any>=} payload
 * @param {boolean=} debug - when true, logs to console
 */
export function track(event, payload = {}, debug = false) {
  if (typeof window === 'undefined') return;
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...payload });
    if (typeof window.gtag === 'function') {
      window.gtag('event', event, payload);
    }
    if (debug) console.log('[track]', event, payload);
  } catch (_) {
    // ignore
  }
}

/**
 * Simple pageview helper.
 * @param {string} path
 * @param {boolean=} debug
 */
export function pageview(path, debug = false) {
  track('page_view', { page_path: path }, debug);
}


