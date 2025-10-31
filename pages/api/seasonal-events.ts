// pages/api/seasonal-events.ts
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Server-side cache:
 *  key: `${year}:${countryCode}`  => Calendarific response for the whole year
 */
const yearCache = new Map<string, any>();

// Countries we expose in the UI (keep in sync with the page list)
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

const SUPPORTED_CODES = new Set(SUPPORTED.map(c => c.code));

/** Primary UI language per country (tweak if you prefer fr-CA for Quebec etc.) */
const LANG_BY_COUNTRY: Record<string, string> = {
  GB: "en", IE: "en", US: "en", CA: "en",
  FR: "fr", RO: "ro", SE: "sv", MX: "es", BR: "pt",
  GR: "el", DK: "da", NL: "nl",
};

/* ─────────────────────────────
   Retail relevance rules
   ───────────────────────────── */
// religious terms that are commonly retail-relevant (allow list)
const RETAIL_RELEVANT_RELIGIOUS = [
  "christmas", "xmas", "noel",
  "easter", "good friday",
  "boxing day",
  "black friday", "cyber monday",
  "valentine", "valentine’s",
  "singles day","singles' day","double 11","11.11",
  "mother's day","mothers day","mothering sunday",
  "father's day","fathers day",
  "children's day","childrens day",
  "halloween",
  "new year's day","new year","lunar new year","chinese new year",
  "labour day","labor day",
];

// hard “never show” terms to catch items that slip through
const NEVER_SHOW_TERMS = [
  "yom kippur",
  "diwali", "deepavali",
  "hanukkah",
  "ramadan", "eid",
  "passover", "pesach", "pesach seder", "pesach seder night", "pesach night",
  "purim", "pesach seder", "pesach seder night", "pesach night",
  "purim seder", "purim seder night", "purim night",
  "shavuot", "shavuot seder", "shavuot seder night", "shavuot night",
  "sukkot", "sukkot seder", "sukkot seder night", "sukkot night",
  "rosh hashanah",
  "dussehra",
  "ashura",
  "assumption",
  "epiphany",
  // catch most “Feast of St … / Saint …”
  "feast of st",
  "feast of saint",
  "saint ",
  "st ",
];

/* ─────────────────────────────
   Calendarific response types
   ───────────────────────────── */
type CalendarificHoliday = {
  name: string;
  description?: string;
  type?: string[]; // ["Observance","Religious",...]
  date: { iso: string };
};

type CalendarificYear = {
  response?: { holidays?: CalendarificHoliday[] };
};

/* ─────────────────────────────
   Helpers
   ───────────────────────────── */
function monthOf(dateStr: string): number {
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? -1 : d.getMonth() + 1;
}

function looksCommerciallyRelevant(h: CalendarificHoliday): boolean {
  const cats = (h.type ?? []).map((t) => t.toLowerCase());
  const name = (h.name || "").toLowerCase();

  // Never-show guardrails (explicitly remove)
  if (NEVER_SHOW_TERMS.some((k) => name.includes(k))) return false;

  // If Calendarific tags as religious, only keep if explicitly retail-relevant
  if (cats.includes("religious")) {
    return RETAIL_RELEVANT_RELIGIOUS.some((k) => name.includes(k));
  }

  // Otherwise keep by default (observance/national/seasonal/bank/public/cultural/secular/sport, etc.)
  return true;
}

async function fetchCalendarificYear(country: string, year: number, apiKey: string, language: string) {
  const cacheKey = `${year}:${country}:${language}`;
  if (yearCache.has(cacheKey)) return yearCache.get(cacheKey);

  const url = new URL("https://calendarific.com/api/v2/holidays");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("country", country);
  url.searchParams.set("year", String(year));
  url.searchParams.set("language", language); // << ask for specific language

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Calendarific ${country} ${year} (${language}) failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  yearCache.set(cacheKey, data);
  return data;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const API_KEY = process.env.CALENDARIFIC_API_KEY;
    if (!API_KEY) {
      res.status(400).json({ error: "Missing CALENDARIFIC_API_KEY" });
      return;
    }

    const now = new Date();
    const year = now.getFullYear();

    const m = Math.max(1, Math.min(12, parseInt(String(req.query.month ?? now.getMonth() + 1), 10)));

    // countries can arrive via query (?countries=GB,US) or body JSON
    let countries: string[] = [];
    if (req.method === "POST" && req.headers["content-type"]?.includes("application/json")) {
      const body = req.body ?? {};
      if (Array.isArray(body.countries)) countries = body.countries.filter(Boolean);
    }
    if (typeof req.query.countries === "string" && req.query.countries.length > 0) {
      countries = countries.concat(
        String(req.query.countries).split(",").map(s => s.trim()).filter(Boolean)
      );
    }

    // Blank => all supported
    countries = (countries.length === 0 ? SUPPORTED.map(c => c.code) : countries)
      .filter(c => SUPPORTED_CODES.has(c));

    // Fetch & merge all countries (cached by year)
    const combined: any[] = [];
    for (const code of countries) {
      const localLang = LANG_BY_COUNTRY[code] || "en";

      // Always fetch EN so we have a stable English name
      const enData = await fetchCalendarificYear(code, year, API_KEY, "en");
      const enList: any[] = enData?.response?.holidays ?? [];

      // Optionally fetch local language (if not English)
      let localList: any[] = [];
      if (localLang !== "en") {
        const locData = await fetchCalendarificYear(code, year, API_KEY, localLang);
        localList = locData?.response?.holidays ?? [];
      }

      // Build quick lookup from local list by (date + first type) to attach local name
      const localNameByKey = new Map<string, string>();
      for (const h of localList) {
        const dateIso = h?.date?.iso || h?.date;
        const t0 = String((h?.type?.[0] ?? "")).toLowerCase();
        if (dateIso) localNameByKey.set(`${dateIso}|${t0}`, String(h?.name ?? ""));
      }

      // Push EN items, enrich with local if available
      for (const h of enList) {
        const dateIso = h?.date?.iso || h?.date;
        const t0 = String((h?.type?.[0] ?? "")).toLowerCase();
        const localName = dateIso ? localNameByKey.get(`${dateIso}|${t0}`) : undefined;

        combined.push({
          ...h,
          _country: code,
          _nameEn: String(h?.name ?? ""),
          _nameLocal: localName || String(h?.name_local ?? "") || String(h?.name ?? ""),
        });
      }
    }

    // Filter by month and commercial relevance
    const filtered = combined.filter(ev => {
      const dateStr = ev?.date?.iso || ev?.date;
      return monthOf(dateStr) === m && looksCommerciallyRelevant(ev);
    });

    // Format to the shape the page expects; keep helper fields for UI
    const result = filtered
      .sort((a, b) => (a.date?.iso ?? "").localeCompare(b.date?.iso ?? ""))
      .map(ev => ({
        name: ev?._nameEn ?? ev?.name ?? "Untitled",       // English for stable merge
        date: ev?.date?.iso ?? ev?.date ?? "",
        description: ev?.description ?? "",
        relevantVerticals: [] as string[],
        relevanceExplanation: "",
        bestPractices: [],
        contentSuggestions: undefined,
        _country: ev?._country,            // ISO-2 e.g., "FR"
        _rawType: ev?.type ?? [],
        _nameEn: ev?._nameEn ?? "",
        _nameLocal: ev?._nameLocal ?? "",
      }));

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