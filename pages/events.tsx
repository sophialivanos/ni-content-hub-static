// pages/events.tsx
import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Loader2, Download } from "lucide-react";

/* ---------- Types ---------- */
type SuggestionBuckets = {
  H1?: string[]; DH1?: string[]; H2?: string[];
  "Article headline"?: string[]; "Ribbon Copy"?: string[];
  "BTC paragraph"?: string;
};

type RelevantEvent = {
  name: string; date: string;
  description?: string;
  relevantVerticals?: string[] | string;
  relevanceExplanation?: string;
  bestPractices?: string[] | string;
  contentSuggestions?: SuggestionBuckets;
  _country?: string; _rawType?: string[];
  _nameEn?: string; _nameLocal?: string;
};

type MergedEvent = RelevantEvent & {
  _countries?: string[];
  _localNames?: Record<string,string>;
};

type ApiResponse = {
  month: number; year: number; countries: string[];
  events: RelevantEvent[]; count: number;
};

/* ---------- Constants ---------- */
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const COUNTRIES = [
  // (No blank option needed for multi-select; “no selection” means “all”.)
  { code: "GB", label: "United Kingdom" }, { code: "IE", label: "Ireland" },
  { code: "CA", label: "Canada" }, { code: "US", label: "United States" },
  { code: "FR", label: "France" }, { code: "RO", label: "Romania" },
  { code: "SE", label: "Sweden" }, { code: "MX", label: "Mexico" },
  { code: "BR", label: "Brazil" }, { code: "GR", label: "Greece" },
  { code: "DK", label: "Denmark" }, { code: "NL", label: "Netherlands" },
];

// pages/events.tsx (replace the placeholder line)
const VERTICALS: string[] = [
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
/* Language map used only to decide when to show Native (English) */
const LANG_BY_COUNTRY: Record<string, "en"|"fr"|"ro"|"sv"|"es"|"pt"|"el"|"da"|"nl"> = {
  GB: "en", IE: "en", US: "en", CA: "en",
  FR: "fr", RO: "ro", SE: "sv", MX: "es", BR: "pt",
  GR: "el", DK: "da", NL: "nl",
};

const isDifferent = (a?: string, b?: string) =>
  !!a && !!b && a.trim().toLowerCase() !== b.trim().toLowerCase();

function normaliseName(name: string) {
  return (name || "").toLowerCase().replace(/[’'´`]/g,"'").replace(/[^\p{L}\p{N}]+/gu," ").trim();
}

const fmtDate = (iso: string) => {
  try { const d = new Date(iso); if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}); }
  catch { return iso; }
};

const toArray = <T,>(v: T | T[] | undefined): T[] => Array.isArray(v) ? v : v ? [v] : [];

/* ---------- Merge duplicates by English name ---------- */
function mergeByName(list: RelevantEvent[]): MergedEvent[] {
  const map = new Map<string, MergedEvent>();
  for (const ev of list) {
    const key = normaliseName(ev.name || ev._nameEn || "");
    if (!key) continue;
    const code = (ev._country || "").toUpperCase();
    const local = ev._nameLocal || ev._nameEn || ev.name;

    const ex = map.get(key);
    if (!ex) {
      map.set(key, { ...ev, _countries: code ? [code] : [], _localNames: code ? { [code]: local } : {}, _rawType: toArray(ev._rawType) });
      continue;
    }
    // earliest date
    const curr = new Date(ex.date), next = new Date(ev.date);
    if (!isNaN(next.getTime()) && (isNaN(curr.getTime()) || next < curr)) ex.date = ev.date;
    // richer description
    if ((ev.description || "").length > (ex.description || "").length) ex.description = ev.description;
    // union sets
    if (code && !ex._countries!.includes(code)) ex._countries!.push(code);
    if (code) { ex._localNames = ex._localNames || {}; if (!ex._localNames[code]) ex._localNames[code] = local; }
    ex._rawType = Array.from(new Set([...(ex._rawType || []), ...toArray(ev._rawType)]));
  }
  return Array.from(map.values()).sort((a,b)=>a.date.localeCompare(b.date));
}

/* ---------- UI helpers ---------- */
const Pill = ({ children, tone = "indigo" }:{children:React.ReactNode; tone?:"indigo"|"blue"|"amber"|"emerald"}) => {
  const colours: Record<string,string> = {
    indigo:"bg-indigo-50 text-indigo-700 border-indigo-200",
    blue:"bg-blue-100 text-blue-800 border-blue-200",
    amber:"bg-amber-100 text-amber-800 border-amber-200",
    emerald:"bg-emerald-100 text-emerald-800 border-emerald-200",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${colours[tone]} mr-2`}>{children}</span>;
};

function EventRow({ ev, displayName }: { ev: MergedEvent; displayName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <button onClick={()=>setOpen(v=>!v)} className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-50">
        <div className="flex items-center gap-3">
          {open ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
          <div className="font-semibold text-slate-900">
            {displayName}{ev._countries?.length ? ` (${ev._countries.join(", ")})` : ""}
          </div>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">{fmtDate(ev.date)}</span>
      </button>
      {open && (
        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-2 my-2">
            {toArray(ev._rawType).map(t => <Pill key={t}>{t}</Pill>)}
          </div>
          {ev.description ? <p className="text-slate-700 mb-2">{ev.description}</p> : null}
        </div>
      )}
    </div>
  );
}

/* ---------- Page ---------- */
export default function EventsPage() {
  // Month must be explicitly selected (M2)
  const [month, setMonth] = useState<number | null>(null);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [vertical, setVertical] = useState<string | "">("");
  const [commercialOnly, setCommercialOnly] = useState<boolean>(true);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [events, setEvents] = useState<RelevantEvent[]>([]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vals = Array.from(e.target.selectedOptions).map(o=>o.value).filter(Boolean);
    setSelectedCountries(vals);
  };

  async function load() {
    setError("");
    if (!month) {
      setError("Please select a month.");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        month: String(month),
        // send toggle for future server handling; harmless if ignored
        commercialOnly: commercialOnly ? "1" : "0",
      });
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

  // merge + search
  const merged = useMemo(()=>mergeByName(events), [events]);

  const filtered = useMemo(()=>{
    const needle = q.trim().toLowerCase();
    if (!needle) return merged;
    return merged.filter(ev =>
      (ev.name || "").toLowerCase().includes(needle) ||
      (ev.description || "").toLowerCase().includes(needle)
    );
  }, [merged, q]);

  // build display name with native preference for single country
  const getDisplayName = (ev: MergedEvent): string => {
    if (selectedCountries.length === 1) {
      const code = selectedCountries[0].toUpperCase();
      const local = ev._localNames?.[code] || ev._nameLocal || ev.name;
      const lang = LANG_BY_COUNTRY[code] || "en";
      if (lang !== "en" && isDifferent(local, ev.name)) return `${local} (${ev.name})`;
      return local || ev.name;
    }
    return ev.name;
  };

  // Top mini-list dedup by english name + date
  const monthlyUnique = useMemo(() => {
    const seen = new Map<string, MergedEvent>();
    for (const ev of filtered) {
      const key = `${(ev.name || "").toLowerCase()}|${ev.date}`;
      if (!seen.has(key)) seen.set(key, ev);
    }
    return Array.from(seen.values());
  }, [filtered]);

  // Optional: remove the initial auto-load if present elsewhere.
  useEffect(()=>{ /* guarded load only when you click */ }, []);

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-5 mb-4 shadow-sm">
        <div className="text-sm opacity-80">Seasonal Events</div>
        <div className="text-lg md:text-xl font-semibold">
          Research and prioritise the seasonal events that matter! Align your teams and implement content that moves the needle.
        </div>
      </div>

      {/* Controls (uniform widths, Month required, subtle Export) */}
      <div className="flex flex-wrap items-end gap-4 mb-4">
        {/* Month (required) */}
        <div className="flex flex-col">
          <label className="font-semibold">
            Month <span className="text-red-500">*</span>
          </label>
          <select
            className="border rounded px-3 py-2 min-w-[240px]"
            value={month ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setMonth(v ? parseInt(v, 10) : null);
            }}
          >
            <option value="">Select…</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>

        {/* Country (optional, multi) */}
        <div className="flex flex-col">
          <label className="font-semibold">
            Country
            <span className="block text-xs text-slate-500 font-normal">(Optional)</span>
          </label>
          <select
            multiple
            className="border rounded px-3 py-2 min-w-[240px] h-28"
            onChange={handleCountryChange}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code + c.label} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Vertical (optional) */}
        <div className="flex flex-col">
          <label className="font-semibold">
            Vertical
            <span className="block text-xs text-slate-500 font-normal">(Optional)</span>
          </label>
          <select
            className="border rounded px-3 py-2 min-w-[240px]"
            value={vertical}
            onChange={(e) => setVertical(e.target.value)}
          >
            <option value="">Select…</option>
            {VERTICALS.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        {/* Commercial only toggle (UI ready) */}
        <div className="flex flex-col">
          <label className="font-semibold">Commercial only</label>
          <div className="h-[40px] flex items-center">
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={commercialOnly}
              onChange={(e)=>setCommercialOnly(e.target.checked)}
              title="Show only commercially-relevant days"
            />
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col flex-1 min-w-[240px]">
          <label className="font-semibold invisible">Search</label>
          <input
            className="border rounded px-3 py-2 w-full"
            placeholder="Search name/description…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {/* Load */}
        <div className="flex flex-col">
          <label className="font-semibold invisible">Load</label>
          <button
            onClick={load}
            className="px-4 py-2 rounded-md bg-indigo-600 text-white font-semibold disabled:opacity-60 flex items-center gap-2"
            disabled={!month || loading}
            title="Load"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Loading…" : "Load"}
          </button>
        </div>

        {/* Export CSV — subtle indigo (E1) */}
        <div className="flex flex-col">
          <label className="font-semibold invisible">Export</label>
          <button
            onClick={()=>{
              const rows = [
                ["name","date","countries","description"].join(","),
                ...filtered.map(e=>[
                  JSON.stringify(getDisplayName(e)), JSON.stringify(e.date ?? ""),
                  JSON.stringify((e._countries && e._countries.join(" / ")) || ""),
                  JSON.stringify(e.description ?? "")
                ].join(",")),
              ].join("\n");
              const blob = new Blob([rows], { type: "text/csv;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = Object.assign(document.createElement("a"), { href: url, download: `seasonal-events-${month ? MONTHS[month-1] : "month"}.csv` });
              a.click(); URL.revokeObjectURL(url);
            }}
            className="px-3 py-2 rounded-md border bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 transition flex items-center gap-2"
            title="Export CSV"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Compact monthly list (deduped) */}
      <div className="mb-4">
        <div className="text-slate-900 font-semibold mb-2">Seasonal Events</div>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {monthlyUnique.length === 0 ? (
            <div className="text-slate-500 px-4 py-3">No events for this selection.</div>
          ) : (
            monthlyUnique.slice(0, Math.min(5, monthlyUnique.length)).map((ev, i) => (
              <div key={`${ev.name}-${ev.date}-${i}`} className="px-4 py-2 border-b last:border-b-0 border-slate-100 flex items-center justify-between">
                <div className="text-sm text-slate-800 truncate">{getDisplayName(ev)}</div>
                <div className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">{fmtDate(ev.date)}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Expandable cards */}
      {error && <div className="text-red-700 bg-red-50 border border-red-200 rounded-md p-3 mb-3">{error}</div>}
      {!error && (
        <div className="space-y-3">
          {filtered.map((ev, i)=> (
            <EventRow key={`${normaliseName(ev.name)}-${ev.date}-${i}`} ev={ev} displayName={getDisplayName(ev)} />
          ))}
        </div>
      )}
    </>
  );
}