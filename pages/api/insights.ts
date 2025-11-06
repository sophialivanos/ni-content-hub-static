// pages/api/insights.ts
import type { NextApiRequest, NextApiResponse } from "next";

// ---- ENV KEYS (set these in Vercel Project Settings > Environment Variables) ----
// BING_SUBSCRIPTION_KEY:  your Bing Web Search v7 key
// SERPER_API_KEY:         your Serper.dev key (Google results)
//
// Optional: tighten markets via country mapping below.

type EngineItem = {
  title: string;
  snippet: string;
  url: string;
  source: string;     // domain
  favicon: string;    // google favicon service
  date?: string;      // ISO if available
  tags: string[];     // [vertical, country]
  confidence: number; // 0..1 simple heuristic
};

type InsightsRequest = {
  vertical: string;                 // required
  country: string;                  // ISO-2 (e.g., GB, US, FR) - required
  q?: string;                       // optional free-text
  recency?: "24h" | "7d" | "30d";   // optional
  limit?: number;                   // optional, default 12
};

const BANNED = /\b(win big|bonus|promos?|free money)\b/i; // compliance clean-up

const TRUST: Record<string, number> = {
  "bbc.co.uk": 0.9, "ft.com": 0.9, "reuters.com": 0.9, "bloomberg.com": 0.9,
  "theguardian.com": 0.85, "wsj.com": 0.9, "apnews.com": 0.85, "forbes.com": 0.7,
  "gov.uk": 0.95, "europa.eu": 0.95, "who.int": 0.95,
};

const COUNTRY_TO_MKT: Record<string, string> = {
  GB: "en-GB", IE: "en-IE", US: "en-US", CA: "en-CA",
  FR: "fr-FR", RO: "ro-RO", SE: "sv-SE", MX: "es-MX", BR: "pt-BR",
  GR: "el-GR", DK: "da-DK", NL: "nl-NL",
};

const COUNTRY_TO_GL: Record<string, string> = {
  GB: "gb", IE: "ie", US: "us", CA: "ca",
  FR: "fr", RO: "ro", SE: "se", MX: "mx", BR: "br",
  GR: "gr", DK: "dk", NL: "nl",
};

const COUNTRY_TO_HL: Record<string, string> = {
  GB: "en", IE: "en", US: "en", CA: "en",
  FR: "fr", RO: "ro", SE: "sv", MX: "es", BR: "pt",
  GR: "el", DK: "da", NL: "nl",
};

function recencyToBing(r?: InsightsRequest["recency"]) {
  if (r === "24h") return "Day";
  if (r === "7d") return "Week";
  if (r === "30d") return "Month";
  return undefined;
}
function recencyToSerper(r?: InsightsRequest["recency"]) {
  // Serper supports a `time` param: d = day, w = week, m = month
  if (r === "24h") return "d";
  if (r === "7d") return "w";
  if (r === "30d") return "m";
  return undefined;
}

function buildQuery({ vertical, country, q }: { vertical: string; country: string; q?: string }) {
  // Users don’t see operators; keep it natural but specific
  // You can tune this later per-vertical.
  const bits = [vertical.trim(), "trends", "insights", country.trim()];
  if (q && q.trim()) bits.push(q.trim());
  return bits.join(" ");
}

function domainFromUrl(u: string) {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; }
}
function faviconFor(u: string) {
  try {
    const d = new URL(u).hostname;
    return `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(d)}`;
  } catch { return ""; }
}
function sanitiseSnippet(s: string) {
  if (!s) return s;
  return s.replace(BANNED, ""); // basic compliance scrub
}

function scoreDomain(domain: string): number {
  if (!domain) return 0.4;
  // simple trust seed with floor/ceiling
  return Math.max(0.3, Math.min(1, TRUST[domain] ?? 0.6));
}

function dedupe(items: EngineItem[]): EngineItem[] {
  const seen = new Set<string>();
  const out: EngineItem[] = [];
  for (const it of items) {
    // strip UTM etc
    let key = it.url;
    try {
      const u = new URL(it.url);
      u.searchParams.delete("utm_source"); u.searchParams.delete("utm_medium");
      u.searchParams.delete("utm_campaign"); u.searchParams.delete("gclid");
      key = u.origin + u.pathname + (u.search ? "?" + u.searchParams.toString() : "");
    } catch { /* noop */ }
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

// --------------------------- Providers ---------------------------

async function fetchBing(q: string, country: string, recency?: InsightsRequest["recency"], count = 10): Promise<EngineItem[]> {
  const key = process.env.BING_SUBSCRIPTION_KEY;
  if (!key) return [];
  const mkt = COUNTRY_TO_MKT[country] || "en-US";
  const freshness = recencyToBing(recency);
  const u = new URL("https://api.bing.microsoft.com/v7.0/search");
  u.searchParams.set("q", q);
  u.searchParams.set("mkt", mkt);
  u.searchParams.set("count", String(count));
  u.searchParams.set("responseFilter", "Webpages");
  if (freshness) u.searchParams.set("freshness", freshness);

  const r = await fetch(u.toString(), {
    headers: { "Ocp-Apim-Subscription-Key": key },
  });
  if (!r.ok) return [];
  const data = await r.json();

  const web = data?.webPages?.value || [];
  return web.map((w: any): EngineItem => {
    const url = w.url as string;
    const source = domainFromUrl(url);
    return {
      title: w.name || "",
      snippet: sanitiseSnippet(w.snippet || ""),
      url,
      source,
      favicon: faviconFor(url),
      date: w.datePublished || w.dateLastCrawled || undefined,
      tags: [],
      confidence: scoreDomain(source) * 0.95, // Bing tends to be clean; slight boost
    };
  });
}

async function fetchSerper(q: string, country: string, recency?: InsightsRequest["recency"], num = 10): Promise<EngineItem[]> {
  const key = process.env.SERPER_API_KEY;
  if (!key) return [];
  const gl = COUNTRY_TO_GL[country] || "us";
  const hl = COUNTRY_TO_HL[country] || "en";
  const time = recencyToSerper(recency);

  const r = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q,
      gl, hl,
      num,
      time,           // 'd' | 'w' | 'm' (Serper supports this)
      autocorrect: true,
    }),
  });
  if (!r.ok) return [];
  const data = await r.json();
  const items = (data?.organic || []) as any[];

  return items.map((it: any): EngineItem => {
    const url = (it.link || it.url) as string;
    const source = domainFromUrl(url);
    return {
      title: it.title || "",
      snippet: sanitiseSnippet(it.snippet || it.description || ""),
      url,
      source,
      favicon: faviconFor(url),
      date: it.date || undefined,
      tags: [],
      confidence: scoreDomain(source), // base trust
    };
  });
}

// --------------------------- Handler ---------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    vertical,
    country,
    q = "",
    recency,
    limit = 12,
  } = (req.body || {}) as InsightsRequest;

  if (!vertical || !country) {
    return res.status(400).json({ error: "vertical and country are required" });
  }

  const query = buildQuery({ vertical, country, q });

  try {
    const [bing, serper] = await Promise.allSettled([
      fetchBing(query, country, recency, limit),
      fetchSerper(query, country, recency, limit),
    ]);

    const merged: EngineItem[] = dedupe([
      ...(bing.status === "fulfilled" ? bing.value : []),
      ...(serper.status === "fulfilled" ? serper.value : []),
    ])
      .slice(0, limit)
      .map((r) => ({
        ...r,
        tags: [vertical, country],
      }));

    return res.status(200).json({
      meta: {
        query,
        vertical,
        country,
        recency: recency || null,
        engines: {
          bing: bing.status === "fulfilled" ? bing.value.length : 0,
          serper: serper.status === "fulfilled" ? serper.value.length : 0,
        },
        total: merged.length,
      },
      results: merged,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "search failed" });
  }
}