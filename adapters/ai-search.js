/**
 * Adapter stub for ai-search external queries.
 *
 * How to call (client):
 *   POST https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
 *   Body JSON: { service: "BING"|"GOOGLE_CSE"|"BRAVE", query, country, fromISO, toISO, limit }
 *   The Apps Script will read secrets from Script Properties and forward to providers.
 */

/**
 * Placeholder that must be implemented via a secure GAS proxy or server.
 * @param {object} params
 */
export async function fetchAiSearch(/* params */) {
  throw new Error('Use GAS proxy');
}


