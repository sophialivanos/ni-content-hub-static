// pages/api/seasonal-events.ts
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Server-side cache:
 *  key: `${year}:${countryCode}`  =>  Calendarific response for the whole year
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

const RETAIL_RELEVANT_RELIGIOUS = [
  // religious but widely linked to retail or promos
  "christmas", "xmas", "noel",
  "easter", "good friday", "boxing day", "black friday", "cyber monday", // (BF/CM not religious but common add-ins)
  "diwali", "deepavali", "hanukkah", "ramadan", "eid", "passover",
  "valentine", "valentine’s",
];

function isSupported(code: string) {
  return SUPPORTED.some(c => c.code === code);
}

function monthOf(dateStr: string) {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? -1 : d.getMonth() + 1;
}

function looksCommerciallyRelevant(ev: any): boolean {
  // Calendarific categories can include: "observance", "national", "seasonal", "religious", etc.
  const cats: string[] = (ev?.type || []).map((x: string) => x.toLowerCase());

  // Exclude purely religious unless in our allowlist
  if (cats.includes("religious")) {
    const name = String(ev?.name || "").toLowerCase();
    if (!RETAIL_RELEVANT_RELIGIOUS.some(k => name.includes(k))) {
      return false;
    }
  }

  // Otherwise, keep national / observance / seasonal by default
  return true;
}

async function fetchCalendarificYear(country: string, year: number, apiKey: string) {
  const cacheKey = `${year}:${country}`;
  if (yearCache.has(cacheKey)) return yearCache.get(cacheKey);

  const url = new URL("https://calendarific.com/api/v2/holidays");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("country", country);
  url.searchParams.set("year", String(year));

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Calendarific ${country} ${year} failed: ${res.status} ${text}`);
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
    let countries: string[] = [];

    // countries can arrive via query (?countries=GB,US) or body JSON
    if (req.method === "POST" && req.headers["content-type"]?.includes("application/json")) {
      const body = req.body ?? {};
      if (Array.isArray(body.countries)) countries = body.countries.filter(Boolean);
    }
    if (typeof req.query.countries === "string" && req.query.countries.length > 0) {
      countries = String(req.query.countries).split(",").map(s => s.trim()).filter(Boolean);
    }

    // Blank means "all supported"
    if (countries.length === 0) {
      countries = SUPPORTED.map(c => c.code);
    } else {
      countries = countries.filter(isSupported);
    }

    // Fetch & merge all countries (cached by year)
    const combined: any[] = [];
    for (const code of countries) {
      const yearData = await fetchCalendarificYear(code, year, API_KEY);
      const list: any[] = yearData?.response?.holidays ?? [];
      for (const h of list) {
        // Keep a note of source country on each holiday
        combined.push({
          ...h,
          _country: code,
        });
      }
    }

    // Filter by month and commercial relevance
    const filtered = combined.filter(ev => {
      const dateStr = ev?.date?.iso || ev?.date;
      return monthOf(dateStr) === m && looksCommerciallyRelevant(ev);
    });

    // Format down to the shape the page expects
    const result = filtered
      .sort((a, b) => (a.date?.iso ?? "").localeCompare(b.date?.iso ?? ""))
      .map(ev => ({
        name: ev?.name ?? "Untitled",
        date: ev?.date?.iso ?? ev?.date ?? "",
        description: ev?.description ?? "",
        // We’re deferring vertical relevance & best practices to your generator prompt,
        // but we keep slots ready:
        relevantVerticals: [] as string[],
        relevanceExplanation: "",
        bestPractices: [],
        contentSuggestions: undefined,
        _country: ev?._country,
        _rawType: ev?.type ?? [],
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