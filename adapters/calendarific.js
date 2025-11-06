/**
 * Calendarific adapter stub.
 *
 * How to call (client):
 *   POST https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
 *   { service: "CALENDARIFIC", payload: { year, month, countries: ["United Kingdom", ...] } }
 * The Apps Script will inject your CALENDARIFIC_API_KEY from Script Properties
 * and call https://calendarific.com/api/v2/holidays.
 */

export async function fetchCalendarific(/* params */) {
  throw new Error('Use GAS proxy');
}


