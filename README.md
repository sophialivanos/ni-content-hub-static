## Run locally

- Run locally: just open index.html

Tip: The SPA demo lives at `public/spa/index.html`. You can double‑click it or serve the folder with any static server.

## Deploy to GitHub Pages

- Deploy to GitHub Pages: Settings → Pages → Deploy from main → /root

If your `index.html` is not at the repo root, copy `public/spa/index.html` (and its `styles.css`, `app.js`) to the root or adjust your Pages source accordingly.

## Embed in Google Sites

- Embed in Google Sites: Insert → Embed → By URL

Use the public URL (e.g., GitHub Pages URL) to embed the app.

## Apps Script proxy (optional)

If `apps-script/` exists, you can deploy a minimal serverless proxy for external APIs.

### Deploy (6 steps)

1. Open `https://script.google.com` and create a new project.
2. Paste the contents of `apps-script/Code.gs` into the editor.
3. File → Project properties → Script properties: set any needed keys (e.g. `BING_SUBSCRIPTION_KEY`, `SERPER_API_KEY`, `CALENDARIFIC_API_KEY`, `LF_BEARER`).
4. Click Deploy → New deployment.
5. Select type: Web app. Set access to “Anyone with the link”. Deploy.
6. Copy the Web app URL (you’ll use this in the client).

### Sample client call

JavaScript example calling the proxy for insights (Bing/Serper):

```javascript
const GAS_URL = 'https://script.google.com/macros/s/DEPLOYMENT_ID/exec';

async function fetchInsights({ vertical, country, q, recency, limit = 12 }) {
  const r = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service: 'INSIGHTS',
      payload: { vertical, country, q, recency, limit },
    }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

// Usage
fetchInsights({ vertical: 'VPN', country: 'GB', recency: '7d' })
  .then(console.log)
  .catch(console.error);
```

Other services via the same proxy:
- Calendarific: `{ service: 'CALENDARIFIC', payload: { country, year, month } }`
- Bing direct: `{ service: 'BING', payload: { q, mkt, count, freshness } }`
- Serper.dev: `{ service: 'SERPER', payload: { q, gl, hl, num, time } }`
- LF workflow: `{ service: 'LF', payload: { base, name, args, return_prompt } }`

# ni-content-hub

