// pages/api/ai-search.ts
import type { NextApiRequest, NextApiResponse } from "next";

/* ===================== Types ===================== */
type CanonicalVertical =
  | "Online Casino" | "Sports Betting" | "VPN" | "Credit Cards" | "Personal Loans"
  | "Web Hosting" | "Website Builders" | "Meal Delivery" | "Online Therapy"
  | "Life Insurance" | "Pet Insurance" | "Solar" | "Home Security"
  | "Car Insurance" | "Mortgage" | "Investments" | "Project Management" | "Background Checks";

type Item = {
  title: string;
  snippet: string;
  url: string;
  source?: string; // hostname
  date?: string;   // ISO
  tags?: string[];
};

type InsightCluster = {
  topic: string;          // concise label of the theme/trend
  summary: string;        // 1–2 sentences, precise/concise
  actions: string[];      // concrete, do-this-next
  sources: Item[];        // 2–4 top citations
};

type ApiPayload = {
  currentTrends: Item[];        // blended news/web
  redditAndATP: Item[];         // Reddit (ATP later)
  aggregatorSignals: Item[];    // comparison/competitor signals
  synthesis: InsightCluster[];  // ✨ actionable clusters
};

/* ===================== Env / providers ===================== */
/** Required for Bing */
const BING_API_KEY = process.env.BING_API_KEY || "";
/** Optional: Google Custom Search (strongly recommended) */
const GOOGLE_CSE_KEY = process.env.GOOGLE_CSE_KEY || "";
const GOOGLE_CSE_ID  = process.env.GOOGLE_CSE_ID  || "";
/** Optional: Brave Search API */
const BRAVE_API_KEY = process.env.BRAVE_API_KEY || "";

/* ===================== Localisation ===================== */
const MARKET_BY_COUNTRY: Record<string, string> = {
  GB: "en-GB", IE: "en-IE", US: "en-US", CA: "en-CA",
  FR: "fr-FR", RO: "ro-RO", SE: "sv-SE", MX: "es-MX",
  BR: "pt-BR", GR: "el-GR", DK: "da-DK", NL: "nl-NL",
};
const GL_BY_COUNTRY: Record<string, string> = {
  GB: "gb", IE: "ie", US: "us", CA: "ca",
  FR: "fr", RO: "ro", SE: "se", MX: "mx",
  BR: "br", GR: "gr", DK: "dk", NL: "nl",
};
const LR_BY_COUNTRY: Record<string, string> = {
  GB: "lang_en", IE: "lang_en", US: "lang_en", CA: "lang_en",
  FR: "lang_fr", RO: "lang_ro", SE: "lang_sv", MX: "lang_es",
  BR: "lang_pt", GR: "lang_el", DK: "lang_da", NL: "lang_nl",
};

function market(country: string) { return MARKET_BY_COUNTRY[country] || "en-US"; }
function gl(country: string)     { return GL_BY_COUNTRY[country] || "us"; }
function lr(country: string)     { return LR_BY_COUNTRY[country] || "lang_en"; }

function toISO(x: any) { try { return new Date(x).toISOString(); } catch { return undefined; } }
function host(u: string) { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return undefined; } }

/* ===================== Query Builder (hidden from users) ===================== */
const VERTICAL_SYNONYMS: Record<CanonicalVertical, string[]> = {
  "Online Casino": ["online casino", "slots online", "casino sites"],
  "Sports Betting": ["sports betting", "betting sites", "bookmakers"],
  "VPN": ["vpn", "virtual private network", "privacy"],
  "Credit Cards": ["credit cards", "best credit card", "rewards"],
  "Personal Loans": ["personal loans", "loan rates", "installment loans"],
  "Web Hosting": ["web hosting", "vps hosting", "wordpress hosting"],
  "Website Builders": ["website builder", "site builder", "no-code website"],
  "Meal Delivery": ["meal delivery", "meal kits", "prepared meals"],
  "Online Therapy": ["online therapy", "teletherapy", "mental health online"],
  "Life Insurance": ["life insurance", "term life", "whole life"],
  "Pet Insurance": ["pet insurance", "dog insurance", "cat insurance"],
  "Solar": ["solar panels", "home solar", "pv install"],
  "Home Security": ["home security", "alarm systems", "smart security"],
  "Car Insurance": ["car insurance", "auto insurance", "motor insurance"],
  "Mortgage": ["mortgage rates", "home loans", "refinance"],
  "Investments": ["investing", "index funds", "stock market"],
  "Project Management": ["project management software", "kanban", "scrum tools"],
  "Background Checks": ["background checks", "people search", "public records"],
};

function buildQueries(vertical: CanonicalVertical, country: string) {
  const base = (VERTICAL_SYNONYMS[vertical] || [vertical]).join(" OR ");
  const trends = `(${base}) (trend OR update OR news OR insights)`;
  const comps  = `(${base}) (best OR top OR compare OR vs)`;
  const reddit = `${base}`;
  return { trends, comps, reddit, mkt: market(country), gl: gl(country), lr: lr(country) };
}

/* ===================== Providers ===================== */
// ---- Bing (Web + News)
async function bingWeb(q: string, mkt: string, freshness: "Day"|"Week"|"Month", count=25): Promise<Item[]> {
  if (!BING_API_KEY) return [];
  const url = new URL("https://api.bing.microsoft.com/v7.0/search");
  url.searchParams.set("q", q);
  url.searchParams.set("mkt", mkt);
  url.searchParams.set("count", String(count));
  url.searchParams.set("freshness", freshness);
  const r = await fetch(url, { headers: { "Ocp-Apim-Subscription-Key": BING_API_KEY } });
  if (!r.ok) return [];
  const j = await r.json();
  const arr = j.webPages?.value ?? [];
  return arr
    .map((v: any) => ({ title: v.name, snippet: v.snippet || "", url: v.url, source: host(v.url), date: toISO(v.dateLastCrawled) }))
    .filter((i: Item) => !!i.url);
}
async function bingNews(q: string, mkt: string, freshness: "Day"|"Week"|"Month", count=40): Promise<Item[]> {
  if (!BING_API_KEY) return [];
  const url = new URL("https://api.bing.microsoft.com/v7.0/news/search");
  url.searchParams.set("q", q);
  url.searchParams.set("mkt", mkt);
  url.searchParams.set("count", String(count));
  url.searchParams.set("freshness", freshness);
  const r = await fetch(url, { headers: { "Ocp-Apim-Subscription-Key": BING_API_KEY } });
  if (!r.ok) return [];
  const j = await r.json();
  const arr = j.value ?? [];
  return arr
    .map((v: any) => ({ title: v.name, snippet: v.description || "", url: v.url, source: host(v.url), date: toISO(v.datePublished) }))
    .filter((i: Item) => !!i.url);
}

// ---- Google Custom Search (Web) — requires GOOGLE_CSE_KEY + GOOGLE_CSE_ID
function googleDateRestrict(fromISO: string, toISO: string) {
  const days = Math.max(1, Math.round((+new Date(toISO) - +new Date(fromISO)) / 86400000));
  if (days <= 1) return "d1";
  if (days <= 7) return "w1";
  return "m1";
}
async function googleWeb(q: string, country: string, fromISO: string, toISO: string, count=10): Promise<Item[]> {
  if (!GOOGLE_CSE_KEY || !GOOGLE_CSE_ID) return [];
  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", GOOGLE_CSE_KEY);
  url.searchParams.set("cx", GOOGLE_CSE_ID);
  url.searchParams.set("q", q);
  url.searchParams.set("gl", gl(country));
  url.searchParams.set("lr", lr(country));
  url.searchParams.set("num", String(count));
  url.searchParams.set("dateRestrict", googleDateRestrict(fromISO, toISO));
  const r = await fetch(url.toString());
  if (!r.ok) return [];
  const j = await r.json();
  const arr = j.items ?? [];
  return arr.map((v: any) => ({
    title: v.title,
    snippet: v.snippet || v.htmlSnippet?.replace(/<[^>]+>/g, "") || "",
    url: v.link,
    source: host(v.link),
    date: toISO(v?.pagemap?.metatags?.[0]?.["article:published_time"] || v.cacheId ? new Date() : undefined),
  })).filter((i: Item) => !!i.url);
}

// ---- Brave Search (optional)
async function braveWeb(q: string, country: string, count=20): Promise<Item[]> {
  if (!BRAVE_API_KEY) return [];
  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", q);
  url.searchParams.set("country", gl(country).toUpperCase());
  url.searchParams.set("count", String(count));
  const r = await fetch(url.toString(), { headers: { "X-Subscription-Token": BRAVE_API_KEY } });
  if (!r.ok) return [];
  const j = await r.json();
  const arr = j.web?.results ?? [];
  return arr.map((v: any) => ({
    title: v.title,
    snippet: v.description || "",
    url: v.url,
    source: host(v.url),
    date: toISO(v.page_fetched),
  })).filter((i: Item) => !!i.url);
}

// ---- Reddit (public JSON)
async function reddit(q: string, days: number): Promise<Item[]> {
  const t = days <= 1 ? "day" : days <= 7 ? "week" : "month";
  const url = new URL("https://www.reddit.com/search.json");
  url.searchParams.set("q", q);
  url.searchParams.set("sort", "top");
  url.searchParams.set("t", t);
  url.searchParams.set("limit", "25");
  const r = await fetch(url.toString(), { headers: { "User-Agent": "ni-content-hub/1.0" } });
  if (!r.ok) return [];
  const j = await r.json();
  const posts = j.data?.children ?? [];
  return posts.map((p: any) => {
    const d = p.data;
    return {
      title: d.title,
      snippet: d.selftext?.slice(0, 200) || d.title,
      url: `https://www.reddit.com${d.permalink}`,
      source: "reddit.com",
      date: toISO(d.created_utc * 1000),
    };
  });
}

/* ===================== Merge / Rank / Synthesis ===================== */
function dedupe(items: Item[]) {
  const seen = new Set<string>();
  return items.filter(it => {
    const key = (it.url || it.title).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
const DOMAIN_WEIGHTS: Record<string, number> = {
  "ft.com": 2.2, "bloomberg.com": 2.1, "reuters.com": 2.0, "bbc.co.uk": 2.0,
  "wsj.com": 2.0, "gov.uk": 2.0, "ec.europa.eu": 2.0, "oecd.org": 1.9,
};
function score(it: Item) {
  const w = DOMAIN_WEIGHTS[it.source || ""] || 1.0;
  const rec = it.date ? (Date.now() - new Date(it.date).getTime()) : 60 * 24 * 3600 * 1000; // default ~60d old
  const recency = Math.max(0, 1 - rec / (30 * 24 * 3600 * 1000)); // 30d window
  return w + recency;
}

const STOP = new Set([
  "the","a","an","and","or","of","for","to","in","on","with","by","from","vs","vs.","&","–","-",
  "2025","2024","best","top","new","update","news","guide","review","site","sites","app","apps"
]);

function tokens(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/[’'´`]/g,"'")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(t => t && !STOP.has(t));
}
function bigrams(ts: string[]) {
  const out: string[] = [];
  for (let i=0;i<ts.length-1;i++) out.push(`${ts[i]} ${ts[i+1]}`);
  return out;
}

function topTopics(items: Item[], k=4): string[] {
  const counts = new Map<string, number>();
  for (const it of items) {
    const t = tokens(it.title);
    for (const bg of bigrams(t)) counts.set(bg, (counts.get(bg)||0)+1);
  }
  return Array.from(counts.entries())
    .sort((a,b)=>b[1]-a[1])
    .slice(0, k*2) // collect extra; we'll validate below
    .map(([bg])=>bg);
}

const ACTION_TEMPLATES: Record<CanonicalVertical, string[]> = {
  "Website Builders": [
    "Add a comparison table focused on {topic} and templates.",
    "Update H1/DH1 to reflect {topic} phrasing used in this market.",
    "Insert 3 FAQs resolving setup time, pricing tiers, and SEO basics."
  ],
  "Web Hosting": [
    "Add a latency/uptime explainer tied to {topic}.",
    "Surface 'time-to-live' and migration steps above the fold.",
    "Publish a pricing explainer with real usage examples."
  ],
  "VPN": [
    "Add a streaming-compatibility matrix highlighting {topic}.",
    "Clarify logging and jurisdiction; add a quick privacy checklist.",
    "Create a 30-second plan picker for mobile users."
  ],
  "Sports Betting": [
    "Create a fixture-led hub for {topic} with odds explainers.",
    "Improve responsible prompts around stake sizing.",
    "Add a glossary/FAQ for market types and settlement rules."
  ],
  "Online Casino": [
    "Align game categories and RTP explainer around {topic}.",
    "Clarify verification, withdrawals and limits in an FAQ.",
    "Add a 'new this week' carousel tied to user interest."
  ],
  "Credit Cards": [
    "Ship a rewards calculator reflecting {topic} categories.",
    "Clarify eligibility and APR with a simple pre-qual flow.",
    "Add fee transparency tables and card-to-card comparisons."
  ],
  "Personal Loans": [
    "Publish a repayment timeline with {topic} examples.",
    "Explain soft vs hard checks; add pre-qual CTA.",
    "Add a debt-consolidation explainer with calculators."
  ],
  "Meal Delivery": [
    "Create a 5-step onboarding visual for {topic}.",
    "Add cook-time filters and dietary badges to category pages.",
    "Include a 'first week' plan with swaps and storage tips."
  ],
  "Online Therapy": [
    "Clarify therapist matching and wait times around {topic}.",
    "Add licensed credentials and privacy standards above the fold.",
    "Publish a 'first session' explainer to cut drop-off."
  ],
  "Life Insurance": [
    "Provide a needs calculator tied to {topic}.",
    "Clarify underwriting types and decision times.",
    "Surface real claim timelines and contact availability."
  ],
  "Pet Insurance": [
    "Add breed-specific cover tables centred on {topic}.",
    "Explain excess, co-pay and yearly limits in plain English.",
    "Publish a claim-step infographic for mobile."
  ],
  "Solar": [
    "Show ROI by roof type around {topic}.",
    "Add installer lead times and permit steps.",
    "Publish a simple maintenance checklist."
  ],
  "Home Security": [
    "Add package vs DIY comparison tied to {topic}.",
    "Clarify contracts and cancellation paths.",
    "Publish a camera placement guide."
  ],
  "Car Insurance": [
    "Add a coverage matrix emphasising {topic}.",
    "Explain no-claims impacts and excess options.",
    "Publish a claims timeline with required documents."
  ],
  "Mortgage": [
    "Publish a rate tracker for {topic}.",
    "Add eligibility explainers and fee transparency.",
    "Clarify remortgage/refi stages with timelines."
  ],
  "Investments": [
    "Add a costs-and-tracking explainer tied to {topic}.",
    "Clarify risk bands and time horizons.",
    "Publish a tax wrapper primer for this market."
  ],
  "Project Management": [
    "Ship a template gallery aimed at {topic}.",
    "Add 'time to value' proof with customer snippets.",
    "Publish an import/migration how-to."
  ],
  "Background Checks": [
    "Clarify legal bases and turnaround for {topic}.",
    "Add consent flows and data sources.",
    "Publish a dispute/correction process guide."
  ],
};

function actionsFor(vertical: CanonicalVertical, topic: string): string[] {
  const tpls = ACTION_TEMPLATES[vertical] || [
    "Add a comparison table centred on {topic}.",
    "Tighten H1/DH1 to match {topic} phrasing used by searchers.",
    "Add 3 FAQs addressing price, speed and guarantees."
  ];
  return tpls.map(s => s.replace("{topic}", topic));
}

function synthesize(vertical: CanonicalVertical, items: Item[], maxClusters=4): InsightCluster[] {
  if (!items.length) return [];
  const topics = topTopics(items, maxClusters);
  const clusters: InsightCluster[] = [];
  let used = 0;

  for (const topic of topics) {
    // pick top sources that mention the topic
    const topicItems = items
      .filter(it => (it.title?.toLowerCase()?.includes(topic)) || (it.snippet?.toLowerCase()?.includes(topic)))
      .sort((a,b)=>score(b)-score(a))
      .slice(0, 4);
    if (topicItems.length === 0) continue;

    const summary = `Rising coverage around “${topic}” indicates user interest converging on this theme in the selected period. Prioritise clarity, speed and proof to capture intent.`;
    const actions = actionsFor(vertical, topic);

    clusters.push({
      topic,
      summary,
      actions,
      sources: topicItems
    });
    used++;
    if (used >= maxClusters) break;
  }

  // Fallback: if bigrams were too sparse, seed at least one cluster with top items
  if (clusters.length === 0 && items.length) {
    const picks = items.sort((a,b)=>score(b)-score(a)).slice(0,4);
    clusters.push({
      topic: "Key developments",
      summary: "Notable updates across reputable sources in the selected period. Use these to refresh headlines, FAQs and examples.",
      actions: actionsFor(vertical, "key developments"),
      sources: picks
    });
  }

  return clusters;
}

/* ===================== Handler ===================== */
export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiPayload|{error:string}>) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const { vertical, country, dateFrom, dateTo } = req.body as {
    vertical: CanonicalVertical; country: string; dateFrom: string; dateTo: string;
  };
  if (!vertical || !country || !dateFrom || !dateTo) {
    return res.status(400).json({ error: "Missing vertical/country/dateFrom/dateTo" });
  }

  const { trends, comps, reddit: redditQ, mkt } = buildQueries(vertical, country);
  const days = Math.max(1, Math.round((+new Date(dateTo) - +new Date(dateFrom))/86400000));
  const freshness: "Day"|"Week"|"Month" = days <= 1 ? "Day" : days <= 7 ? "Week" : "Month";

  try {
    // Multi-engine concurrency
    const [
      bNews, bWeb, gWeb, brWeb,
      cNews, cWeb, gCompWeb, brCompWeb,
      rTop
    ] = await Promise.all([
      bingNews(trends, mkt, freshness, 40),
      bingWeb(trends, mkt, freshness, 25),
      googleWeb(trends, country, dateFrom, dateTo, 10),
      braveWeb(trends, country, 10),

      bingNews(comps, mkt, freshness, 20),
      bingWeb(comps, mkt, freshness, 15),
      googleWeb(comps, country, dateFrom, dateTo, 8),
      braveWeb(comps, country, 8),

      reddit(redditQ, days),
    ]);

    // Blend & rank
    const trendsBlend = dedupe([...bNews, ...bWeb, ...gWeb, ...brWeb]).sort((a,b)=>score(b)-score(a)).slice(0, 30);
    const compsBlend   = dedupe([...cNews, ...cWeb, ...gCompWeb, ...brCompWeb]).sort((a,b)=>score(b)-score(a)).slice(0, 25);
    const redditBlend  = dedupe(rTop).slice(0, 20);

    // Synthesis → concise, precise, actionable
    const synthesis = synthesize(vertical, trendsBlend, 4);

    const payload: ApiPayload = {
      currentTrends: trendsBlend,
      redditAndATP: redditBlend,
      aggregatorSignals: compsBlend,
      synthesis,
    };

    res.status(200).json(payload);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Search failed" });
  }
}