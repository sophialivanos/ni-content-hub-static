/**
 * LF workflow adapter stub.
 *
 * How to call (client):
 *   POST https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
 *   { service: "LF", payload: { base, name, args, bearer } }
 * The Apps Script should add Authorization header (Bearer) and forward to
 * `${base}/${encodeURIComponent(name)}`.
 */

export async function runLfWorkflow(/* { base, name, args, bearer } */) {
  throw new Error('Use GAS proxy');
}


