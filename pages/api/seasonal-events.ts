// pages/api/seasonal-events.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { isCommercialName } from "@/lib/commercial-events";
import { syntheticForMonth } from "@/lib/synthetic-events";

/** Server-side cache: `${year}:${country}:${lang}` -> Calendarific response */
const yearCache = new Map<string, any>();

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

/** Primary UI language per country (tweak as needed) */
const LANG_BY_COUNTRY: Record<string, string> = {
  GB: "en", IE: "en", US: "en", CA: "en",
  FR: "fr", RO: "ro", SE: "sv", MX: "es", BR: "pt",
  GR: "el", DK: "da", NL: "nl",
};

type CalendarificHoliday = {
  name: string;
  description?: string;
  type?: string[];       // ["Observance","Religious",...]
  date: { iso: string };
};

function monthOf(dateStr: string): number {
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? -1 : d.getMonth() + 1;
}

async function fetchCalendarificYear(country: string, year: number, apiKey: string, language: string) {
  const cacheKey = `${year}:${country}:${language}`;
  if (yearCache.has(cacheKey)) return yearCache.get(cacheKey);

  const url = new URL("https://calendarific.com/api/v2/holidays");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("country", country);
  url.searchParams.set("year", String(year));
  url.searchParams.set("language", language);

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
    if (!API_KEY) return res.status(400).json({ error: "Missing CALENDARIFIC_API_KEY" });

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
        String(req.query.countries).split(",").map(s => s.trim()).filter(Boolean)
      );
    }
    if (typeof req.query.commercialOnly === "string") {
      commercialOnly = String(req.query.commercialOnly).toLowerCase() !== "false";
    }

    // Blank → all supported
    countries = (countries.length === 0 ? SUPPORTED.map(c => c.code) : countries)
      .filter(c => SUPPORTED_CODES.has(c));

    // Fetch EN + local per country; attach _nameEn/_nameLocal and _country
    const combined: Array<CalendarificHoliday & {
      _country: string;
      _nameEn: string;
      _nameLocal: string | undefined;
    }> = [];

    for (const code of countries) {
      const lang = LANG_BY_COUNTRY[code] || "en";

      const enData = await fetchCalendarificYear(code, year, API_KEY, "en");
      const enList: CalendarificHoliday[] = enData?.response?.holidays ?? [];

      let localList: CalendarificHoliday[] = [];
      if (lang !== "en") {
        const locData = await fetchCalendarificYear(code, year, API_KEY, lang);
        localList = locData?.response?.holidays ?? [];
      }

      // Build (date+firstType) → local-name lookup
      const localByKey = new Map<string, string>();
      for (const h of localList) {
        const iso = h?.date?.iso;
        const t0 = String(h?.type?.[0] ?? "").toLowerCase();
        if (iso) localByKey.set(`${iso}|${t0}`, String(h?.name ?? ""));
      }

      for (const h of enList) {
        const iso = h?.date?.iso;
        const t0 = String(h?.type?.[0] ?? "").toLowerCase();
        const local = iso ? localByKey.get(`${iso}|${t0}`) : undefined;

        combined.push({
          ...h,
          _country: code,
          _nameEn: String(h?.name ?? ""),
          _nameLocal: local || (h as any)?.name_local || String(h?.name ?? ""),
        });
      }
    }

    // Filter for selected month
    let filtered = combined.filter((ev) => monthOf(ev?.date?.iso || "") === m);

    // Commercial-only filter using allow-list (English/local name + country)
    if (commercialOnly) {
      filtered = filtered.filter((ev) =>
        isCommercialName(ev._nameEn, ev._nameLocal, ev._country)
      );
    }

    // Inject synthetic events (Prime Day, BTS, Soldes, El Buen Fin)
    const synthetic = syntheticForMonth(year, m, countries).map(s => ({
      name: s.name,
      description: s.description,
      type: ["Synthetic"],
      date: { iso: s.date },
      _country: s.country,
      _nameEn: s.name,
      _nameLocal: s.localName ?? s.name,
    }));
    filtered = filtered.concat(synthetic);

    // Format for UI
    const result = filtered
      .sort((a, b) => (a.date?.iso ?? "").localeCompare(b.date?.iso ?? ""))
      .map(ev => ({
        name: ev?._nameEn ?? ev?.name ?? "Untitled",
        date: ev?.date?.iso ?? "",
        description: ev?.description ?? "",
        relevantVerticals: [] as string[],
        relevanceExplanation: "",
        bestPractices: [],
        contentSuggestions: undefined,
        _country: ev?._country,
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