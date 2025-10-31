import type { NextApiRequest, NextApiResponse } from "next";

type EventItem = {
  id: string;
  name: string;
  date: string;        // ISO
  description?: string;
  type: string[];      // Calendarific types
  country: string;     // human label
  countryIso2: string; // e.g. GB
};

// Map UI labels -> ISO-2
const COUNTRY_LABEL_TO_ISO: Record<string, string> = {
  "United Kingdom": "GB",
  "Ireland": "IE",
  "Canada": "CA",
  "United States": "US",
  "France": "FR",
  "Romania": "RO",
  "Sweden": "SE",
  "Mexico": "MX",
  "Brazil": "BR",
  "Greece": "GR",
  "Denmark": "DK",
  "Netherlands": "NL",
};
const ALL_COUNTRY_LABELS = Object.keys(COUNTRY_LABEL_TO_ISO);

// simple in-memory cache by year+country
const cache: Record<string, Record<string, EventItem[]>> = {};
const KEY = process.env.CALENDARIFIC_API_KEY; // put your key in .env.local

async function fetchCountryMonth(
  year: number,
  month: number,
  label: string
): Promise<EventItem[]> {
  const iso = COUNTRY_LABEL_TO_ISO[label];
  if (!iso) return [];

  const cacheKey = String(year);
  cache[cacheKey] ||= {};
  const monthTag = `${iso}:${year}:${month}`;
  if (cache[cacheKey][monthTag]) return cache[cacheKey][monthTag];

  const url = `https://calendarific.com/api/v2/holidays?api_key=${KEY}&country=${iso}&year=${year}&month=${month}`;
  const r = await fetch(url);
  const j = await r.json();

  const rows: EventItem[] = (j?.response?.holidays || []).map((h: any) => {
    const types: string[] = (h?.type || []).map((t: any) => String(t));
    return {
      id: `${iso}-${h?.name}-${h?.date?.iso || ""}`,
      name: String(h?.name || ""),
      date: String(h?.date?.iso || ""),
      description: String(h?.description || ""),
      type: types,
      country: label,
      countryIso2: iso,
    };
  })
  // drop purely religious observances (keep if also national/observance/etc.)
  .filter(ev => {
    const t = ev.type.map(x => x.toLowerCase());
    const allReligious = t.length > 0 && t.every(x => x.includes("religious"));
    return !allReligious;
  });

  cache[cacheKey][monthTag] = rows;
  return rows;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (!KEY) {
      return res.status(500).json({ error: "Missing CALENDARIFIC_API_KEY" });
    }

    const year = parseInt(String(req.query.year ?? ""), 10);
    const month = parseInt(String(req.query.month ?? ""), 10);
    if (!year || !month) return res.status(400).json({ error: "year and month are required" });

    // countries query is comma-separated labels; blank or missing = ALL
    const raw = String(req.query.countries ?? "").trim();
    const labels = raw
      ? raw.split(",").map(s => s.trim()).filter(Boolean)
      : ALL_COUNTRY_LABELS;

    const all = await Promise.all(labels.map(lbl => fetchCountryMonth(year, month, lbl)));
    const events = all.flat().sort((a, b) => a.date.localeCompare(b.date));

    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
    return res.status(200).json({ events });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}