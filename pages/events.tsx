// pages/events.tsx
import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Loader2, Download } from "lucide-react";

/* ---------- Types ---------- */
type SuggestionBuckets = {
  H1?: string[];
  DH1?: string[];
  H2?: string[];
  "Article headline"?: string[];
  "Ribbon Copy"?: string[];
  "BTC paragraph"?: string;
};

type RelevantEvent = {
  name: string; // English (stable for merging)
  date: string; // YYYY-MM-DD
  description?: string;
  relevantVerticals?: string[] | string;
  relevanceExplanation?: string;
  bestPractices?: string[] | string;
  contentSuggestions?: SuggestionBuckets;
  _country?: string;     // ISO-2 from API
  _rawType?: string[];
  _nameEn?: string;      // English name from API
  _nameLocal?: string;   // Native name from API (if provided)
};

type MergedEvent = RelevantEvent & {
  _countries?: string[];                 // merged ISO-2 codes
  _localNames?: Record<string, string>;  // code -> local name
};

type ApiResponse = {
  month: number;
  year: number;
  countries: string[];
  events: RelevantEvent[];
  count: number;
};

/* ---------- Static data ---------- */
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

/* ---------- Language helpers (country -> primary UI language) ---------- */
const LANG_BY_COUNTRY: Record<string, "en"|"fr"|"ro"|"sv"|"es"|"pt"|"el"|"da"|"nl"> = {
  GB: "en", IE: "en", US: "en", CA: "en",
  FR: "fr", RO: "ro", SE: "sv", MX: "es", BR: "pt",
  GR: "el", DK: "da", NL: "nl",
};

const isDifferent = (a?: string, b?: string) =>
  !!a && !!b && a.trim().toLowerCase() !== b.trim().toLowerCase();

/* ---------- Utils ---------- */
const fmtDate = (iso: string) => {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return iso; }
};

const toArray = <T,>(v: T | T[] | undefined): T[] =>
  Array.isArray(v) ? v : v ? [v] : [];

function normaliseName(name: string) {
  return (name || "")
    .toLowerCase()
    .replace(/[’'´`]/g, "'")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/* ---------- Deduplicate & merge by English name ---------- */
function mergeByName(list: RelevantEvent[]): MergedEvent[] {
  const map = new Map<string, MergedEvent>();

  for (const ev of list) {
    const key = normaliseName(ev.name || ev._nameEn || "");
    if (!key) continue;

    const code = (ev._country || "").toUpperCase();
    const local = ev._nameLocal || ev._nameEn || ev.name;

    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        ...ev,
        _countries: code ? [code] : [],
        _localNames: code ? { [code]: local } : {},
        _rawType: toArray(ev._rawType),
      });
      continue;
    }

    // earliest date
    const curr = new Date(existing.date);
    const next = new Date(ev.date);
    if (!isNaN(next.getTime()) && (isNaN(curr.getTime()) || next < curr)) {
      existing.date = ev.date;
    }

    // prefer longer description
    if ((ev.description || "").length > (existing.description || "").length) {
      existing.description = ev.description;
    }

    // union country codes
    if (code && !existing._countries!.includes(code)) {
      existing._countries!.push(code);
    }

    // collect local names per country
    if (code) {
      existing._localNames = existing._localNames || {};
      if (!existing._localNames[code]) existing._localNames[code] = local;
    }

    // union types
    const types = new Set([...(existing._rawType || []), ...toArray(ev._rawType)]);
    existing._rawType = Array.from(types);
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/* ---------- UI bits ---------- */
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

/* ---------- Expandable event row ---------- */
function EventRow({ ev, displayName }: { ev: MergedEvent; displayName: string }) {
  const [open, setOpen] = useState(false);

  const verticals = useMemo(() => {
    const raw = ev.relevantVerticals;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : raw.split(",").map(s => s.trim()).filter(Boolean);
  }, [ev.relevantVerticals]);

  function exportThis() {
    const payload = JSON.stringify(ev, null, 2);
    const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: `${(ev.name || "event").replace(/\s+/g, "_")}-${ev.date}.json`,
    });
    a.click();
    URL.revokeObjectURL(url);
  }

  const codes = ev._countries?.join(", ") || "";

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-50"
      >
        <div className="flex items-center gap-3">
          {open ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
          <div className="font-semibold text-slate-900">
            {displayName}{codes ? ` (${codes})` : ""}
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

          {((ev.relevanceExplanation && ev.relevanceExplanation.trim().length > 0) || (verticals.length > 0)) && (
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
        </div>
      )}
    </div>
  );
}

/* ---------- Page ---------- */
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
    const vals = Array.from(e.target.selectedOptions).map(o => o.value).filter(Boolean);
    setSelectedCountries(vals);
  }

  async function load() {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ month: String(month) });
      const body = { countries: selectedCountries }; // blank => all
      const r = await fetch(`/api/seasonal-events?${params.toString()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: ApiResponse | { error: string } = await r.json();
      if (!r.ok || (data as any).error) throw new Error((data as any).error || "Failed to load");
      setEvents((data as ApiResponse).events || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  // Merge duplicates and create country/local-name map
  const merged = useMemo(() => mergeByName(events), [events]);

  // Build display name function based on selection
  const getDisplayName = (ev: MergedEvent): string => {
    if (selectedCountries.length === 1) {
      const code = selectedCountries[0].toUpperCase();
      const local = ev._localNames?.[code] || ev._nameLocal || ev.name;
      const lang = LANG_BY_COUNTRY[code] || "en";
      const en = ev._nameEn || ev.name;
      if (lang !== "en" && local && isDifferent(local, en)) {
        return `${local} (${en})`;
      }
      return local || en;
    }
    return ev.name; // multiple/no country selected
  };

  // Search on merged list
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return merged;
    return merged.filter(ev =>
      (ev.name || "").toLowerCase().includes(needle) ||
      (ev.description || "").toLowerCase().includes(needle)
    );
  }, [merged, q]);

  // De-dupe for the compact monthly list (by English name + date)
  const monthlyUnique = useMemo(() => {
    const seen = new Map<string, MergedEvent>();
    for (const ev of filtered) {
      const key = `${(ev._nameEn || ev.name || "").toLowerCase()}|${ev.date}`;
      if (!seen.has(key)) seen.set(key, ev);
    }
    return Array.from(seen.values());
  }, [filtered]);

  function exportCsv() {
    const rows = [
      ["name","date","countries","description"].join(","),
      ...filtered.map(e => [
        JSON.stringify(getDisplayName(e)),
        JSON.stringify(e.date ?? ""),
        JSON.stringify((e._countries && e._countries.join(" / ")) || ""),
        JSON.stringify(e.description ?? ""),
      ].join(","))
    ].join("\n");

    const blob = new Blob([rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: `seasonal-events-${MONTHS[month-1]}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  }

  // initial load
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <>
      {/* Header */}
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
          {monthlyUnique.length === 0 ? (
            <div className="text-slate-500 px-4 py-3">No events for this selection.</div>
          ) : (
            monthlyUnique.slice(0, Math.min(5, monthlyUnique.length)).map((ev, i) => (
              <div
                key={`${ev.name}-${ev.date}-${i}`}
                className="px-4 py-2 border-b last:border-b-0 border-slate-100 flex items-center justify-between"
              >
                <div className="text-sm text-slate-800 truncate">
                  {getDisplayName(ev)}
                </div>
                <div className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                  {fmtDate(ev.date)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Expandable cards (merged) */}
      {error && (
        <div className="text-red-700 bg-red-50 border border-red-200 rounded-md p-3 mb-3">{error}</div>
      )}
      {!error && (
        <div className="space-y-3">
          {filtered.map((ev, i)=> (
            <EventRow
              key={`${normaliseName(ev.name)}-${ev.date}-${i}`}
              ev={ev}
              displayName={getDisplayName(ev)}
            />
          ))}
        </div>
      )}
    </>
  );
}