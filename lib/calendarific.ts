// pages/api/calendarific.ts
import type { NextApiRequest, NextApiResponse } from "next";

const API_KEY = process.env.CALENDARIFIC_KEY || "";
if (!API_KEY) {
  // Don't throw; return a helpful error if invoked.
  // (Vercel envs need the var set per project)
  console.warn("CALENDARIFIC_KEY is not set");
}

// Countries you said we care about (map label -> ISO2 expected by Calendarific)
const COUNTRY_MAP: Record<string, string> = {
  "United Kingdom": "GB",
  Ireland: "IE",
  Canada: "CA",
  "United States": "US",
  France: "FR",
  Romania: "RO",
  Sweden: "SE",
  Mexico: "MX",
  Brazil: "BR",
  Greece: "GR",
  Denmark: "DK",
  Netherlands: "NL",
};

// Wherever you build/normalise the "type" array for a holiday `h`:
const rawTypes = Array.isArray(h.type) ? (h.type as string[]) : [];
const t: string[] = (Array.isArray(h.type) ? (h.type as string[]) : [])
  .map((x: string) => String(x).toLowerCase());// very small in-memory cache (per lambda/container lifecycle)
type CacheVal = { fetchedAt: number; data: any[] };
const cache = new Map<string, CacheVal>();
const ONE_DAY = 24 * 60 * 60 * 1000;

async function fetchCountryYear(countryIso2: string, year: number) {
  const url = `https://calendarific.com/api/v2/holidays?api_key=${API_KEY}&country=${countryIso2}&year=${year}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Calendarific ${countryIso2} ${year} failed: ${r.status}`);
  const j = await r.json();
  // Normalize to flat list of items we care about
  const holidays = (j?.response?.holidays ?? []).map((h: any) => ({
    id: `${countryIso2}-${h.date?.iso}-${h.name}`,
    name: h.name as string,
    description: h.description as string,
    // Calendarific gives: { date: { iso: "YYYY-MM-DD" } }
    date: h.date?.iso as string,
    // array like ["National holiday","Observance"] or religion
    type: (h.type ?? []) as string[],
    countryIso2,
    country: Object.keys(COUNTRY_MAP).find((k) => COUNTRY_MAP[k] === countryIso2) ?? countryIso2,
  }));
  return holidays;
}

// Heuristic: exclude "purely religious" unless widely commercial.
// Keep room for improvement once your LLM prompt is plugged in.
const ALWAYS_INCLUDE_NAME = new Set([
  "Christmas Day",
  "Christmas Eve",
  "Boxing Day",
  "Easter Monday",
  "Easter Sunday",
  "Halloween",
  "Valentine's Day",
  "Black Friday",
  "Cyber Monday",
  "Singles' Day",
  "Mother's Day",
  "Father's Day",
  "New Year's Day",
  "New Year's Eve",
  "Independence Day",
  "Labour Day",
  "Labor Day",
]);

function likelyCommercial(h: any) {
  const name = (h.name || "").toLowerCase();
  if ([...ALWAYS_INCLUDE_NAME].some((n) => n.toLowerCase() === name)) return true;

  const t = (h.type || []).map((x: string) => x.toLowerCase());
  const religious: boolean = t.some((x: string) =>
    /christian|muslim|buddhist|hindu|sikh|jewish|orthodox/.test(x)
  );  // Observance/National/Seasonal/Cultural → keep; purely religious → drop
  const hasCommercialishType: boolean = t.some((x: string) =>
    /(observance|national|season|seasonal|bank|public|cultural|secular|sport)/.test(x)
  );

  // Example filter condition (adjust to your logic):
  const keep = hasCommercialishType && !(
  // e.g., cases where it's purely religious AND not public/seasonal etc.
  religious && !t.some((x: string) => /(public|bank|national|season|seasonal)/.test(x))
);

  if (!keep) {
    continue; // or `return false` inside an Array.filter
  }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const year = Number(req.query.year ?? new Date().getFullYear());
    const month = Number(req.query.month ?? new Date().getMonth() + 1);
    // comma-separated labels, "all" or empty means all supported
    const countriesParam = (req.query.countries as string) || "";
    const labels = countriesParam === "" || countriesParam.toLowerCase() === "all"
      ? Object.keys(COUNTRY_MAP)
      : countriesParam.split(",").map((s) => s.trim()).filter(Boolean);

    // fetch (and cache per country+year), then aggregate
    const results: any[] = [];
    await Promise.all(
      labels.map(async (label) => {
        const iso2 = COUNTRY_MAP[label];
        if (!iso2) return;

        const key = `${iso2}:${year}`;
        const now = Date.now();
        const cached = cache.get(key);
        if (cached && now - cached.fetchedAt < ONE_DAY) {
          // use cache
          results.push(...cached.data);
          return;
        }
        const fresh = await fetchCountryYear(iso2, year);
        cache.set(key, { fetchedAt: now, data: fresh });
        results.push(...fresh);
      }),
    );

    // month filter (on server to keep payload smaller)
    const filteredByMonth = results.filter((h) => {
      const d = new Date(h.date);
      return d.getMonth() + 1 === month;
    });

    // exclude purely religious (heuristic)
    const commercialOnly = filteredByMonth.filter(likelyCommercial);

    res.status(200).json({ year, month, countries: labels, events: commercialOnly });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Calendarific error" });
  }
}