// pages/api/seasonal-events.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Holidays from "date-holidays";
import { isCommercialName } from "@/lib/commercial-events";
import { syntheticForMonth } from "@/lib/synthetic-events";

/** Server-side cache: `${year}:${country}` -> normalized holidays list */
const yearCache = new Map<string, any[]>();

const SUPPORTED = [
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
const SUPPORTED_CODES = new Set(SUPPORTED.map((c) => c.code));

/** Primary UI language per country (kept for compatibility) */
const LANG_BY_COUNTRY: Record<string, string> = {
  GB: "en",
  IE: "en",
  US: "en",
  CA: "en",
  FR: "fr",
  RO: "ro",
  SE: "sv",
  MX: "es",
  BR: "pt",
  GR: "el",
  DK: "da",
  NL: "nl",
};

type DHRawHoliday = {
  date?: string;      // e.g. "2025-12-25 00:00:00"
  start?: Date;       // present in newer versions
  end?: Date;
  name?: string;      // English by default
  nameLocal?: string; // if configured; often undefined
  type?: string | string[];
  rule?: string;
  substitute?: boolean;
  note?: string;
};

type UiHoliday = {
  name: string;
  date: string;             // YYYY-MM-DD
  description?: string;
  _country: string;
  _nameEn: string;
  _nameLocal?: string;
  _rawType: string[];
};

function pad2(n: number) { return n < 10 ? `0${n}` : `${n}`; }
function ymd(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function monthOf(iso: string): number {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? -1 : d.getMonth() + 1;
}

/** Normalize a date-holidays item to our UI format */
function normHoliday(h: DHRawHoliday, country: string): UiHoliday | null {
  let d: Date | null = null;
  if (h.start instanceof Date) d = h.start;
  else if (h.date) d = new Date(h.date.replace(" ", "T") + "Z"); // be robust to "YYYY-MM-DD 00:00:00"
  if (!d || Number.isNaN(d.getTime())) return null;

  const name = String(h.name ?? "").trim();
  const typeArr = Array.isArray(h.type) ? h.type : h.type ? [h.type] : [];

  // date-holidays does not ship descriptions; provide a neutral default
  const desc =
    typeArr.includes("public")
      ? "Public holiday widely observed with time off work and local activities."
      : "Widely observed date noted for cultural or seasonal activities.";

  return {
    name,
    date: ymd(d),
    description: desc,
    _country: country,
    _nameEn: name,
    _nameLocal: h.nameLocal || name,
    _rawType: typeArr.length ? typeArr : ["holiday"],
  };
}

/** Get & cache all holidays for (year,country) from date-holidays */
function getCountryYear(country: string, year: number): UiHoliday[] {
  const key = `${year}:${country}`;
  const cached = yearCache.get(key);
  if (cached) return cached as UiHoliday[];

  const hd = new Holidays(country);
  // If library throws for an unsupported code, just return empty
  let list: DHRawHoliday[] = [];
  try {
    list = (hd.getHolidays(year) as any[]) || [];
  } catch {
    list = [];
  }

  const normalized = list
    .map((h) => normHoliday(h, country))
    .filter((x): x is UiHoliday => !!x);

  yearCache.set(key, normalized);
  return normalized;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const m = Math.max(1, Math.min(12, parseInt(String(req.query.month ?? now.getMonth() + 1), 10)));

    // Countries may be in body or query
    let countries: string[] = [];
    let commercialOnly = true; // default
    if (req.method === "POST" && req.headers["content-type"]?.includes("application/json")) {
      const body = req.body ?? {};
      if (Array.isArray(body.countries)) countries = body.countries.filter(Boolean);
      if (typeof body.commercialOnly === "boolean") commercialOnly = body.commercialOnly;
    }
    if (typeof req.query.countries === "string" && req.query.countries.length > 0) {
      countries = countries.concat(
        String(req.query.countries).split(",").map((s) => s.trim()).filter(Boolean)
      );
    }
    if (typeof req.query.commercialOnly === "string") {
      commercialOnly = String(req.query.commercialOnly).toLowerCase() !== "false";
    }

    // Blank → all supported
    countries = (countries.length === 0 ? SUPPORTED.map((c) => c.code) : countries).filter((c) =>
      SUPPORTED_CODES.has(c)
    );

    // Collect holidays per country from local library
    let combined: UiHoliday[] = [];
    for (const code of countries) {
      const list = getCountryYear(code, year);
      combined = combined.concat(list);
    }

    // Filter for selected month
    let filtered = combined.filter((ev) => monthOf(ev.date) === m);

    // Commercial-only filter using your allow-list helper
    if (commercialOnly) {
      filtered = filtered.filter((ev) => isCommercialName(ev._nameEn, ev._nameLocal, ev._country));
    }

    // Inject synthetic events (Prime Day, BTS, Soldes, El Buen Fin, etc.)
    const synthetic = syntheticForMonth(year, m, countries).map((s) => ({
      name: s.name,
      date: s.date, // already YYYY-MM-DD
      description: s.description,
      _country: s.country,
      _nameEn: s.name,
      _nameLocal: s.localName ?? s.name,
      _rawType: ["Synthetic"],
    })) as UiHoliday[];
    filtered = filtered.concat(synthetic);

    /* NEW: Guarantee New Year's Eve across selected countries (Calendarific gaps) */
    if (m === 12) {
      for (const code of countries) {
        const exists = filtered.some((ev) => {
          const name = String((ev as any)._nameEn || ev.name || (ev as any)._nameLocal || "");
          const iso  = String((ev as any).date || "");
          return /new\s*year/i.test(name) && iso.endsWith("-12-31") && String((ev as any)._country).toUpperCase() === code.toUpperCase();
        });
        if (!exists) {
          filtered.push({
            name: "New Year's Eve",
            description: "Last day of the Gregorian year; countdowns, gatherings and travel are common.",
            date: `${year}-12-31`,
            _country: code,
            _nameEn: "New Year's Eve",
            _nameLocal: "New Year's Eve",
            _rawType: ["Synthetic"],
          } as UiHoliday);
        }
      }
    }

    // Format for UI (keep your front-end contract)
    const toIso = (d: any): string => (typeof d === "string" ? d : String(d?.iso || ""));
    const toTime = (d: any): number => {
      const iso = toIso(d);
      const t = Date.parse(iso);
      return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
    };
    const result = filtered
      .sort((a, b) => toTime(a.date) - toTime(b.date))
      .map((ev) => ({
        name: ev._nameEn || ev.name || "Untitled",
        date: toIso(ev.date),
        description: ev.description ?? "",
        relevantVerticals: [] as string[],
        relevanceExplanation: "",
        bestPractices: [],
        contentSuggestions: undefined,
        _country: ev._country,
        _rawType: ev._rawType,
        _nameEn: ev._nameEn || "",
        _nameLocal: ev._nameLocal || "",
      }));

    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
    res.status(200).json({
      month: m,
      year,
      countries,
      events: result,
      count: result.length,
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Unexpected error" });
  }
}