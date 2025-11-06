/**
 * Insights adapter stub.
 *
 * How to call (client):
 *   POST https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
 *   Content-Type: application/json
 *   {
 *     service: "INSIGHTS",
 *     payload: { vertical, country, q, recency, limit }
 *   }
 * The Apps Script should read provider keys (BING_SUBSCRIPTION_KEY, SERPER_API_KEY)
 * from Script Properties and execute provider calls.
 */

export async function fetchInsights(/* params */) {
  throw new Error('Use GAS proxy');
}


