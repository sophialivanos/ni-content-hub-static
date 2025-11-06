# Apps Script Proxy – Quick Deploy

1. Open `https://script.google.com` and create a new project.
2. Copy the contents of `Code.gs` into the editor (replace any starter code).
3. File → Project properties → Script properties: add needed secrets, e.g.:
   - `BING_SUBSCRIPTION_KEY`
   - `SERPER_API_KEY`
   - `CALENDARIFIC_API_KEY`
   - `LF_BEARER` (optional)
4. Click Deploy → New deployment → Select type: Web app.
5. Set access to “Anyone with the link” (or your preferred audience) and deploy.
6. Copy the Web app URL (`GAS_URL`) – you’ll use it from the client.

## Minimal client example

```javascript
const GAS_URL = 'https://script.google.com/macros/s/DEPLOYMENT_ID/exec';

async function callProxy() {
  const r = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      // Generic proxy payload
      url: 'https://api.example.com',
      payload: { q: 'test' },
      headers: { Authorization: 'Bearer <SECRET>' },
    }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

callProxy().then(console.log).catch(console.error);
```

Tip: For project-specific adapters (e.g., Insights, Calendarific), use the structured `service` + `payload` contract shown in the root `README.md`.


