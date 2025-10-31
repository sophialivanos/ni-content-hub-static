// pages/events.tsx
import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Loader2, Download } from "lucide-react";

// ---------- Types ----------
type SuggestionBuckets = {
  H1?: string[];
  DH1?: string[];
  H2?: string[];
  "Article headline"?: string[];
  "Ribbon Copy"?: string[];
  "BTC paragraph"?: string; // single paragraph
};

type RelevantEvent = {
  name: string;
  date: string; // YYYY-MM-DD
  description?: string;
  relevantVerticals?: string[] | string;
  relevanceExplanation?: string;
  bestPractices?: string[] | string;
  contentSuggestions?: SuggestionBuckets;
  _country?: string;     // from API
  _rawType?: string[];   // from API
};

type ApiResponse = {
  month: number;
  year: number;
  countries: string[];
  events: RelevantEvent[];
  count: number;
};

// ---------- Static data ----------
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const COUNTRIES = [
  { code: "", label: "" }, // blank first option for "All countries"
  { code: "GB", label: "United Kingdom" },
  { code: "IE", label: "Ireland" },
  { code: "CA", label: "Canada" },
  { code: "US", label: "United States" },
  { code: "FR", label: "France" },
  { code: "RO", label: "Romania" },
  { code: "SE", label: "Sweden" },
  { code: "MX", label: "Mexico" },
  { code: "BR", label: "Brazil" },
  { code: "GR", label: "Greece" },
  { code: "DK", label: "Denmark" },
  { code: "NL", label: "Netherlands" },
];

const VERTICALS = [
  "Accounting Software","Anti-Virus","Anti-Virus AU","Anti-Virus BR","Anti-Virus FR",
  "Anti-Virus RU","Anti-Virus UK","Background Checks","Banking FR","Bingo","Braces",
  "Business Applications Hub","Business Insurance","Business Loans","Business VoIP",
  "Cappsool- Pet Food","Car Insurance","Car Loans","Car Selling","Car Selling UK",
  "Car Warranty","Casino CA","Casino MX","Casino RO","Casino SE","Casino UK","Casino US",
  "CCP","CCP/POS","Contact Lenses","Credit Cards","Credit Cards FR","CRM","Cyber Security Hub",
  "Data Analysis Software","Dating","Dating AU","Dating BE DUTCH","Dating BE FR","Dating CA",
  "Dating DE","Dating ES","Dating FR","Dating IT","Dating NL","Dating UK","Dating US",
  "Debt Consolidation","Debt Funnel","DNA","E-Commerce","ED","Editing Apps","Flower Delivery",
  "Gold and Silver","Hair Loss","Hearing Aid","Home LG Insurance","Home Security","Home Warranty",
  "Hosting","Hosting AU","HS","HW","ID Theft","IDT","In-App","Internet Providers","Investments",
  "Invoicing","Lab Grown Diamonds","Language Learning","Legal Services","Life Insurance",
  "Life Insurance (Fintech)","LLC","Marketing Tools Hub","MAS","Meal Delivery","Medical Alerts",
  "Mobile Plans","Money Transfer","Mortgage","Mortgage HE","Mortgage Loans","Mortgage Purchase",
  "Mortgage Refinance","Mortgage Reverse","Mortgages (Fintech)","Moving Companies","Online Banking",
  "Online Degrees","Online Therapy","Parental control","Password manager","Payroll","Personal Loans",
  "Personal Loans FR","Personal Loans Funnel","Pet food Delivery  (Cappsool unique)",
  "Pet Insurance","Pet Insurance (Fintech)","Pet Subscription Boxes (Cappsool unique)",
  "PGR (Pro Group Racing)","Poker","POS","Printing Services","Private Student Loans",
  "Project Management","Psychic Reading","Remote Access","Renters Insurance","Resume Builders",
  "Slots UK","Solar","Sport Betting AU","Sport Betting FR","Sport Betting IE","Sport Betting RO",
  "Sport Betting SE","Sport Betting UK","Sport BR","Sport CA","Student Loans (Fintech)",
  "Student Loans Refinance","Tax Relief","Tax Software","Tech Bootcamps","Teeth Whitening",
  "Telecom FR","Top Offers FR (PL FR Funnel) - Floa","Top10","Top10/Dating","Top10/Dating-ca",
  "Travel Insurance","TV Services","TV Streaming","Vitamins","VOIP","VPN","VPN DE","VPN FR",
  "VPN IT","VPN NL","VPN PT","VPN SP","Walk-in Tubs","Web Design","Web Hosting (SaaS)",
  "Website Builders","Website Builders (SaaS)","Weight Loss","Weight loss plans","WSB",
];

// ---------- Utils ----------
const fmtDate = (iso: string) => {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return iso; }
};

const toArray = <T,>(v: T | T[] | undefined): T[] =>
  Array.isArray(v) ? v : v ? [v] : [];

const Pill = ({ children, tone = "indigo" }: { children: React.ReactNode; tone?: "indigo"|"blue"|"amber"|"emerald" }) => {
  const colours: Record<string,string> = {
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    amber: "bg-amber-100 text-amber-800 border-amber-200",
    emerald: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${colours[tone]} mr-2`}>
      {children}
    </span>
  );
};

// ---------- Expandable event row ----------
function EventRow({ ev }: { ev: RelevantEvent }) {
  const [open, setOpen] = useState(false);

  const verticals = useMemo(() => {
    const raw = ev.relevantVerticals;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : raw.split(",").map(s => s.trim()).filter(Boolean);
  }, [ev.relevantVerticals]);

  const best = useMemo(() => {
    const b = ev.bestPractices;
    if (!b) return [];
    if (Array.isArray(b)) return b.filter(Boolean);
    return b.split(/[.;]\s+|\n|, (?=\d\.)/g).map(s => s.trim()).filter(Boolean);
  }, [ev.bestPractices]);

  function exportThis() {
    const payload = JSON.stringify(ev, null, 2);
    const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: `${ev.name.replace(/\s+/g, "_")}-${ev.date}.json`,
    });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-50"
      >
        <div className="flex items-center gap-3">
          {open ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
          <div className="font-semibold text-slate-900">
            {ev.name}
            {ev._country ? <span className="text-xs text-slate-500 ml-2">({ev._country})</span> : null}
          </div>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">
          {fmtDate(ev.date)}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2 my-2">
              {toArray(ev._rawType).map(t => (
                <Pill key={t} tone="indigo">{t}</Pill>
              ))}
            </div>
            <button
              onClick={exportThis}
              className="text-xs px-2 py-1 rounded border border-slate-300 hover:bg-slate-50"
              title="Export this event as JSON"
            >
              Export JSON
            </button>
          </div>

          {ev.description && <p className="text-slate-700 mb-3">{ev.description}</p>}

          {(ev.relevanceExplanation || verticals.length > 0) && (
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 mb-4">
              <div className="text-xs uppercase font-semibold text-indigo-700 mb-2">Relevance</div>
              {verticals.length > 0 && (
                <div className="mb-2 text-slate-700">
                  <span className="text-xs text-slate-600 mr-2">Relevant verticals:</span>
                  {verticals.map(v => (
                    <span key={v} className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-white border border-indigo-200 text-indigo-700 mr-1 mb-1">
                      {v}
                    </span>
                  ))}
                </div>
              )}
              {ev.relevanceExplanation && (
                <div className="text-slate-700">{ev.relevanceExplanation}</div>
              )}
            </div>
          )}

          {best.length > 0 && (
            <div className="mb-4">
              <div className="font-semibold text-slate-900 mb-2">Best Practices</div>
              <ol className="list-decimal pl-5 space-y-1">
                {best.map((b, i) => <li key={i} className="text-slate-700">{b}</li>)}
              </ol>
            </div>
          )}

          {ev.contentSuggestions && (
            <div>
              <div className="font-semibold text-slate-900 mb-2">Content Suggestions</div>

              {ev.contentSuggestions.H1?.length ? (
                <div className="mb-3">
                  <Pill>H1</Pill>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700">
                    {ev.contentSuggestions.H1.map((x, i) => <li key={i}>{x}</li>)}
                  </ul>
                </div>
              ) : null}

              {ev.contentSuggestions.DH1?.length ? (
                <div className="mb-3">
                  <Pill>DH1</Pill>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700">
                    {ev.contentSuggestions.DH1.map((x, i) => <li key={i}>{x}</li>)}
                  </ul>
                </div>
              ) : null}

              {ev.contentSuggestions.H2?.length ? (
                <div className="mb-3">
                  <Pill>H2</Pill>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700">
                    {ev.contentSuggestions.H2.map((x, i) => <li key={i}>{x}</li>)}
                  </ul>
                </div>
              ) : null}

              {ev.contentSuggestions["Article headline"]?.length ? (
                <div className="mb-3">
                  <Pill tone="blue">ARTICLE</Pill>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700">
                    {ev.contentSuggestions["Article headline"].map((x, i) => <li key={i}>{x}</li>)}
                  </ul>
                </div>
              ) : null}

              {ev.contentSuggestions["Ribbon Copy"]?.length ? (
                <div className="mb-3">
                  <Pill tone="amber">RIBBON</Pill>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700">
                    {ev.contentSuggestions["Ribbon Copy"].map((x, i) => <li key={i}>{x}</li>)}
                  </ul>
                </div>
              ) : null}

              {ev.contentSuggestions["BTC paragraph"] ? (
                <div className="mb-1">
                  <Pill tone="emerald">BTC</Pill>
                  <p className="text-slate-700">{ev.contentSuggestions["BTC paragraph"]}</p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Page ----------
export default function EventsPage() {
  const now = new Date();
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]); // [] = all
  const [vertical, setVertical] = useState<string | "">("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [events, setEvents] = useState<RelevantEvent[]>([]);

  function handleCountryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    // keep blanks out of state to represent "all countries"
    const vals = Array.from(e.target.selectedOptions).map(o => o.value).filter(Boolean);
    setSelectedCountries(vals);
  }

  async function load() {
    setLoading(true); setError("");
    try {
      // Call our API; it will fetch + cache full year per country then filter by month
      const params = new URLSearchParams({ month: String(month) });
      const body = { countries: selectedCountries }; // optional; blank => all
      const r = await fetch(`/api/seasonal-events?${params.toString()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: ApiResponse | { error: string } = await r.json();
      if (!r.ok || (data as any).error) throw new Error((data as any).error || "Failed to load");

      let list = (data as ApiResponse).events || [];

      // If a vertical is selected, we *display* all events but (optionally)
      // could reduce noise. For now keep all; the vertical will be used later
      // when you wire the generator prompt per event.
      setEvents(list);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  // search filter
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return events;
    return events.filter(ev =>
      (ev.name || "").toLowerCase().includes(needle) ||
      (ev.description || "").toLowerCase().includes(needle)
    );
  }, [events, q]);

  function exportCsv() {
    const rows = [
      ["name","date","country","description"].join(","),
      ...filtered.map(e => [
        JSON.stringify(e.name ?? ""),
        JSON.stringify(e.date ?? ""),
        JSON.stringify(e._country ?? ""),
        JSON.stringify(e.description ?? ""),
      ].join(","))
    ].join("\n");

    const blob = new Blob([rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: `seasonal-events-${MONTHS[month-1]}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  }

  // initial load (current month, all countries)
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <>
      {/* Header (kept as requested) */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-5 mb-4 shadow-sm">
        <div className="text-sm opacity-80">Seasonal Events</div>
        <div className="text-lg md:text-xl font-semibold">
          Research and curate seasonal events to optimise and implement into your workflow and content strategy.
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <label className="font-semibold">Month</label>
        <select
          className="border rounded px-3 py-2"
          value={month}
          onChange={(e)=> setMonth(parseInt(e.target.value,10))}
        >
          {MONTHS.map((m,i)=> <option key={m} value={i+1}>{m}</option>)}
        </select>

        <label className="font-semibold ml-2">Countries</label>
        <select
          multiple
          className="border rounded px-3 py-2 min-w-[240px] h-28"
          onChange={handleCountryChange}
        >
          {COUNTRIES.map(c => (
            <option key={c.code + c.label} value={c.code}>{c.label}</option>
          ))}
        </select>

        <label className="font-semibold ml-2">Vertical</label>
        <select
          className="border rounded px-3 py-2 min-w-[240px]"
          value={vertical}
          onChange={(e)=> setVertical(e.target.value)}
        >
          <option value="">(optional)</option>
          {VERTICALS.map(v=> <option key={v} value={v}>{v}</option>)}
        </select>

        <input
          className="border rounded px-3 py-2 flex-1 min-w-[240px]"
          placeholder="Search name/description…"
          value={q}
          onChange={(e)=> setQ(e.target.value)}
        />

        <button
          onClick={load}
          className="px-4 py-2 rounded-md bg-indigo-600 text-white font-semibold disabled:opacity-60 flex items-center gap-2"
          disabled={loading}
          title="Load"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? "Loading…" : "Load"}
        </button>

        <button
          onClick={exportCsv}
          className="px-3 py-2 rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-2"
          title="Export CSV"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Compact monthly list */}
      <div className="mb-4">
        <div className="text-slate-900 font-semibold mb-2">Seasonal Events</div>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-slate-500 px-4 py-3">No events for this selection.</div>
          ) : (
            filtered.slice(0, Math.min(5, filtered.length)).map((ev, i) => (
              <div key={`${ev.name}-${ev.date}-${i}`} className="px-4 py-2 border-b last:border-b-0 border-slate-100 flex items-center justify-between">
                <div className="text-sm text-slate-800 truncate">{ev.name}</div>
                <div className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                  {fmtDate(ev.date)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Expandable cards */}
      {error && (
        <div className="text-red-700 bg-red-50 border border-red-200 rounded-md p-3 mb-3">{error}</div>
      )}
      {!error && (
        <div className="space-y-3">
          {filtered.map((ev, i)=> (
            <EventRow key={`${ev.name}-${ev.date}-${i}`} ev={ev} />
          ))}
        </div>
      )}
    </>
  );
}