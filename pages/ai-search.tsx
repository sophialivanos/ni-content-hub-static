// pages/ai-search.tsx
import React, { useMemo, useState } from "react";
import { Loader2, RefreshCw, Sparkles, Image as ImageIcon, Download } from "lucide-react";
import { CANONICAL_VERTICALS, CanonicalVertical } from "../lib/verticals";

/* ---------- Types ---------- */
type RecencyPreset = "24h" | "7d" | "30d" | "custom";

type InsightItem = {
  title: string;
  snippet: string;
  url?: string;
  source?: string;     // domain
  date?: string;       // ISO
  tags?: string[];
};

type InsightResponse = {
  currentTrends: InsightItem[];
  redditAndATP: InsightItem[];
  aggregatorSignals: InsightItem[];
  suggestedFAQs: string[];
  pageUpdates: string[];
  suggestedVisuals: string[];
  // future: idosBrief: ...
};

type OptimiseOutput = {
  improvedTitle: string;
  tightenedIntro: string; // ~150 words answering key question fast
  suggestedH2: string[];  // prompt-style, AI-friendly headings
  suggestedFAQs: string[]; // 6–10 short FAQs
  warnings: string[];     // notes based on checklist
};

/* ---------- Constants ---------- */
const COUNTRIES = [
  { code: "GB", label: "United Kingdom" },
  { code: "IE", label: "Ireland" },
  { code: "US", label: "United States" },
  { code: "CA", label: "Canada" },
  { code: "FR", label: "France" },
  { code: "RO", label: "Romania" },
  { code: "SE", label: "Sweden" },
  { code: "MX", label: "Mexico" },
  { code: "BR", label: "Brazil" },
  { code: "GR", label: "Greece" },
  { code: "DK", label: "Denmark" },
  { code: "NL", label: "Netherlands" },
];

const todayISO = () => new Date().toISOString().slice(0, 10);

/* ---------- Utils ---------- */
function resolveRange(preset: RecencyPreset, from: string, to: string) {
  if (preset === "custom") return { from, to };
  const end = new Date();
  const start = new Date();
  if (preset === "24h") start.setDate(end.getDate() - 1);
  if (preset === "7d") start.setDate(end.getDate() - 7);
  if (preset === "30d") start.setDate(end.getDate() - 30);
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  };
}

function fmtDate(d?: string) {
  try {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return d || "";
  }
}


/* ---------- Stub (safe demo until API is wired) ---------- */
function demoResults(_: {
  vertical: CanonicalVertical;
  country: string;
  from: string;
  to: string;
}): InsightResponse {
  // Keep this intentionally generic to avoid fabricating facts.
  const tag = _?.vertical;
  return {
    currentTrends: [
      { title: "Intent clusters & seasonality", snippet: "Volume shifts, comparison queries, and pricing checks trend upward in selected window.", url: undefined, source: "demo", date: _.to, tags: [tag] },
      { title: "Trust & proof elements", snippet: "Users gravitate to pages with transparent policies, expert quotes, and recent updates.", source: "demo", date: _.to, tags: [tag] },
    ],
    redditAndATP: [
      { title: "Community topics", snippet: "Recurring questions reveal gaps for FAQs and plain-English explainers.", source: "demo", date: _.to, tags: [tag] },
    ],
    aggregatorSignals: [
      { title: "Comparators' playbook", snippet: "Heavy use of tables, badges, and mobile-first snippets.", source: "demo", date: _.to, tags: [tag] },
    ],
    suggestedFAQs: [
      "How do I compare options quickly?",
      "What fees or gotchas should I expect?",
      "What’s the cancellation or return policy?",
    ],
    pageUpdates: [
      "Tighten H1 + DH1 to match user phrasing in the selected country.",
      "Add an up-to-date comparison table with concise pros/cons.",
      "Make CTAs persistent on mobile; shorten forms.",
    ],
    suggestedVisuals: [
      "Checklist graphic explaining the decision steps",
      "Before/After card showing value gained",
      "Country-specific trust bar (licenses, support hours, policies)",
    ],
  };
}

/* ---------- Optimiser (uses insights + checklist) ---------- */
function optimiseFromInsights(
  btc: string,
  insights: InsightResponse,
  vertical: CanonicalVertical,
  country: string
): OptimiseOutput {
  const trimmed = (btc || "").trim();

  // Title: prefer a strong, concise, benefit-first variant
  const improvedTitle = trimmed.split(/[\n\.]/)[0]?.slice(0, 80) || `${vertical}: A fast, practical starter plan`;

  // Intro: ensure the first ~150 words answer directly (simplified synthesis using insights)
  const keyPoint = insights.currentTrends[0]?.snippet || insights.aggregatorSignals[0]?.snippet || "Get to the point quickly with clear, practical steps.";
  const tightenedIntro = [
    `Here’s the short answer for ${vertical} in ${country}: ${keyPoint}`,
    "Use the quick checklist below, then expand into details.",
  ].join(" ");

  // Headings follow Definition → Context → Practical → Pitfalls/FAQs
  const suggestedH2 = [
    `What is ${vertical}? (clear definition)`,
    `What’s changing now? (context & trends)`,
    `How to do it right (step-by-step)`,
    `Common mistakes to avoid`,
    `FAQs (voice-search ready)`,
  ];

  // FAQs: combine existing suggestions + short-tail variants
  const baseFaqs = insights.suggestedFAQs?.slice(0, 8) || [];
  const extraFaqs = [
    `Is ${vertical.toLowerCase()} worth it in ${country}?`,
    `How long does ${vertical.toLowerCase()} take?`,
  ];
  const suggestedFAQs = Array.from(new Set([...baseFaqs, ...extraFaqs])).slice(0, 10);

  // Warnings / guidance based on checklist
  const warnings: string[] = [];
  if (trimmed.length < 400) warnings.push("Content is short; target 1500–2000+ characters.");
  if (!/\n\n|\n- |<ul>|<h2>/i.test(trimmed)) warnings.push("Add structure: H2/H3, bullets, tables where helpful.");
  warnings.push(
    "Ensure first ~150 words answer the core question.",
    "Use local phrasing and voice suitable for TTS/voice answers.",
    "Include: ‘AI was used… with human validation and proofreading.’",
  );

  return { improvedTitle, tightenedIntro, suggestedH2, suggestedFAQs, warnings };
}

/* ---------- UI bits ---------- */
const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
    <h3 className="text-slate-900 font-semibold mb-2">{title}</h3>
    <div className="text-slate-700">{children}</div>
  </section>
);

const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700">
    {children}
  </span>
);

/* ---------- Page ---------- */
export default function AISearchPage() {
  const [vertical, setVertical] = useState<CanonicalVertical>("Online Casino");
  const [country, setCountry] = useState("GB");

  const [preset, setPreset] = useState<RecencyPreset>("7d");
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [data, setData] = useState<InsightResponse | null>(null);
  const [btcInput, setBtcInput] = useState("");
  const [optimised, setOptimised] = useState<OptimiseOutput | null>(null);

  const resolved = useMemo(() => resolveRange(preset, from, to), [preset, from, to]);

  const runSearch = async () => {
    setError("");
    setLoading(true);
    setData(null);
    setOptimised(null);
    try {
      // Demo-only results until API is wired
      const demo = demoResults({ vertical, country, from: resolved.from, to: resolved.to });
      setData(demo);
      // When API is ready, replace with fetch to /api/ai-search
      // const r = await fetch("/api/ai-search", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     vertical,
      //     country,
      //     dateFrom: resolved.from,
      //     dateTo: resolved.to,
      //   }),
      // });
      // const j = await r.json();
      // if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      // setData(j);
    } catch (e: any) {
      setError(e?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };
  async function runInsights(form: { vertical: string; country: string; q?: string; recency?: "24h"|"7d"|"30d" }) {
    const r = await fetch("/api/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!r.ok) throw new Error((await r.json()).error || "failed");
    return r.json(); // { meta, results: EngineItem[] }
  }
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-5 mb-6 shadow-sm">
        <div className="text-sm opacity-80">AIO + AIM</div>
        <div className="text-lg md:text-xl font-semibold">
          Select a vertical, country and date period. We’ll surface trends, research insights, and content opportunities.
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1.5fr_auto_auto_auto_auto] gap-3">
          {/* Vertical */}
          <label className="flex flex-col">
            <span className="text-sm font-semibold mb-1">Vertical</span>
            <select
              className="border rounded px-3 py-2"
              value={vertical}
              onChange={(e) => setVertical(e.target.value as CanonicalVertical)}
            >
              {CANONICAL_VERTICALS.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </label>

          {/* Country */}
          <label className="flex flex-col">
            <span className="text-sm font-semibold mb-1">Country</span>
            <select
              className="border rounded px-3 py-2"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </label>

          {/* Date preset */}
          <label className="flex flex-col">
            <span className="text-sm font-semibold mb-1">Recency</span>
            <select
              className="border rounded px-3 py-2"
              value={preset}
              onChange={(e) => setPreset(e.target.value as RecencyPreset)}
            >
              <option value="24h">Past 24 hours</option>
              <option value="7d">Past 7 days</option>
              <option value="30d">Past 30 days</option>
              <option value="custom">Custom range…</option>
            </select>
          </label>

          {/* From / To (only when custom) */}
          {preset === "custom" && (
            <>
              <label className="flex flex-col">
                <span className="text-sm font-semibold mb-1">From</span>
                <input
                  type="date"
                  className="border rounded px-3 py-2"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  disabled={preset !== "custom"}
                />
              </label>
              <label className="flex flex-col">
                <span className="text-sm font-semibold mb-1">To</span>
                <input
                  type="date"
                  className="border rounded px-3 py-2"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  disabled={preset !== "custom"}
                />
              </label>
            </>
          )}
          {/* Action button inline */}
          <div className="flex items-end">
            <button
              onClick={runSearch}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 text-white font-semibold disabled:opacity-60"
              title="Find Trends & Insights"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "Finding…" : "Find Trends & Insights"}
            </button>
          </div>
        </div>
        {/* Summary badges removed per request */}
      </div>

      {/* Results */}
      {error && (
        <div className="text-red-700 bg-red-50 border border-red-200 rounded-md p-3 mb-3">
          {error}
        </div>
      )}

      {data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Current trends">
            <ul className="space-y-2">
              {data.currentTrends.map((it, i) => (
                <li key={i} className="flex flex-col">
                  <span className="font-medium text-slate-900">{it.title}</span>
                  <span className="text-slate-700">{it.snippet}</span>
                  {it.url && (
                    <a href={it.url} target="_blank" rel="noreferrer" className="text-indigo-700 text-sm underline mt-1">
                      {it.source || it.url}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Reddit + AnswerThePublic research">
            <ul className="space-y-2">
              {data.redditAndATP.map((it, i) => (
                <li key={i} className="flex flex-col">
                  <span className="font-medium text-slate-900">{it.title}</span>
                  <span className="text-slate-700">{it.snippet}</span>
                  {it.url && (
                    <a href={it.url} target="_blank" rel="noreferrer" className="text-indigo-700 text-sm underline mt-1">
                      {it.source || it.url}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Aggregator/competitor signals">
            <ul className="space-y-2">
              {data.aggregatorSignals.map((it, i) => (
                <li key={i} className="flex flex-col">
                  <span className="font-medium text-slate-900">{it.title}</span>
                  <span className="text-slate-700">{it.snippet}</span>
                  {it.url && (
                    <a href={it.url} target="_blank" rel="noreferrer" className="text-indigo-700 text-sm underline mt-1">
                      {it.source || it.url}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Suggested FAQs">
            <ul className="list-disc pl-5 space-y-1">
              {data.suggestedFAQs.map((q, i) => <li key={i}>{q}</li>)}
            </ul>
          </Card>

          <Card title="Page update suggestions">
            <ul className="list-disc pl-5 space-y-1">
              {data.pageUpdates.map((q, i) => <li key={i}>{q}</li>)}
            </ul>
          </Card>

          <Card title="Suggested images & infographics">
            <ul className="list-disc pl-5 space-y-1">
              {data.suggestedVisuals.map((q, i) => <li key={i}>{q}</li>)}
            </ul>
          </Card>

          {/* Placeholder for Ido’s brief (kept invisible until you enable) */}
          {/* <Card title="Ido’s AIO URL brief (coming soon)">
            <div className="text-slate-600">Placeholder</div>
          </Card> */}
        </div>
      ) : (
        <div className="text-slate-500">Run a search to populate insights.</div>
      )}

      {/* Optimise BTC / Page Copy (appears only after insights) */}
      {data && (
        <section id="optimise-section" className="mt-6 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-slate-900 font-semibold mb-2">Optimise BTC / Page Copy (AI Search Ready)</div>
          <p className="text-sm text-slate-700 mb-3">
            Paste your BTC or a key page section. Optimisation follows the AI Content Optimization Checklist
            (first ~150 words answer, layered H2s, mobile-friendly bullets, and voice-ready FAQs).
          </p>
          <textarea
            className="w-full border rounded px-3 py-2 text-sm"
            rows={6}
            placeholder="Paste BTC or page content to optimise…"
            value={btcInput}
            onChange={(e) => setBtcInput(e.target.value)}
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => setOptimised(optimiseFromInsights(btcInput, data, vertical, country))}
              className="px-3 py-2 rounded bg-indigo-600 text-white font-semibold"
            >
              Optimise
            </button>
            <button
              onClick={() => setBtcInput("")}
              className="px-3 py-2 rounded border font-semibold"
            >
              Clear
            </button>
          </div>

          {optimised && (
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <div className="font-semibold">Improved Title</div>
                  <div className="text-slate-800">{optimised.improvedTitle}</div>
                </div>
                <div>
                  <div className="font-semibold">Tightened Intro</div>
                  <p className="text-slate-700 text-sm">{optimised.tightenedIntro}</p>
                </div>
                <div>
                  <div className="font-semibold">Suggested H2</div>
                  <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                    {optimised.suggestedH2.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="font-semibold">Extra FAQs</div>
                  <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                    {optimised.suggestedFAQs.map((q, i) => <li key={i}>{q}</li>)}
                  </ul>
                </div>
                <div className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                  <div className="font-medium mb-1">Checklist reminders</div>
                  <ul className="list-disc pl-5 text-sm">
                    {optimised.warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
                <div className="text-xs text-slate-500">
                  AI was used in the creation of this content, along with human validation and proofreading.
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {data && (
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-slate-900 text-white font-semibold disabled:opacity-60"
            title="Optimise content"
            onClick={() => document.getElementById("optimise-section")?.scrollIntoView({ behavior: "smooth" })}
          >
            <RefreshCw className="h-4 w-4" />
            Optimise
          </button>

          <button
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white font-semibold disabled:opacity-60"
            title="Create Infographic"
            onClick={() => alert("Infographic generation will plug into the image pipeline.")}
          >
            <ImageIcon className="h-4 w-4" />
            Create Infographic
          </button>

          <button
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 disabled:opacity-60"
            title="Regenerate Infographic"
            onClick={() => alert("Regenerate with a different style/layout.")}
          >
            <RefreshCw className="h-4 w-4" />
            Regenerate Infographic
          </button>
        </div>
      )}

      {/* Export (CSV of visible results) */}
      <div className="mt-6">
        <button
          disabled={!data}
          onClick={() => {
            if (!data) return;
            const rows = [
              ["section","title","snippet","url","source","date"].join(","),
              ...["currentTrends","redditAndATP","aggregatorSignals"].flatMap((k) =>
                (data as any)[k].map((it: InsightItem) =>
                  [k, it.title, it.snippet, it.url || "", it.source || "", it.date || ""]
                    .map((v) => JSON.stringify(v))
                    .join(",")
                )
              ),
            ].join("\n");
            const blob = new Blob([rows], { type: "text/csv;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = Object.assign(document.createElement("a"), {
              href: url,
              download: `ai-insights-${vertical}-${country}-${resolved.from}-to-${resolved.to}.csv`,
            });
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 text-white font-semibold disabled:opacity-60"
          title="Export CSV"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>
    </div>
  );
}