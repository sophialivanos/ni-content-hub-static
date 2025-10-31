// pages/api/calendarific.ts
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

/** Minimal shape of Calendarific response we use */
type CalendarificHoliday = {
  name?: string;
  description?: string;
  date?: { iso?: string };
  type?: string[];
};
type CalendarificPayload = {
  response?: { holidays?: CalendarificHoliday[] };
};

const COUNTRY_LABEL_TO_ISO: Record<string, string> = {
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
const ALL_COUNTRY_LABELS: string[] = Object.keys(COUNTRY_LABEL_TO_ISO);

// simple in-memory cache by year+country
const cache: Record<string, Record<string, EventItem[]>> = {};
const KEY: string | undefined = process.env.CALENDARIFIC_API_KEY; // set in Vercel & .env.local

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

  const url = `https://calendarific.com/api/v2/holidays?api_key=${encodeURIComponent(
    KEY as string
  )}&country=${encodeURIComponent(iso)}&year=${year}&month=${month}`;

  const r: Response = await fetch(url);
  if (!r.ok) {
    throw new Error(`Calendarific ${iso} ${year}-${month} -> ${r.status}`);
  }

  const j = (await r.json()) as CalendarificPayload;
  const holidays: CalendarificHoliday[] = j?.response?.holidays ?? [];

  const rows: EventItem[] = holidays
    .map((h: CalendarificHoliday): EventItem => {
      const types: string[] = Array.isArray(h?.type)
        ? (h.type as string[]).map((t: string) => String(t))
        : [];
      const dateIso = String(h?.date?.iso ?? "");

      return {
        id: `${iso}-${String(h?.name ?? "")}-${dateIso}`,
        name: String(h?.name ?? ""),
        date: dateIso,
        description: h?.description ? String(h.description) : "",
        type: types,
        country: label,
        countryIso2: iso,
      };
    })
    // drop purely religious observances (keep if also national/observance/etc.)
    .filter((ev: EventItem) => {
      const t: string[] = ev.type.map((x: string) => x.toLowerCase());
      const allReligious: boolean =
        t.length > 0 && t.every((x: string) => x.includes("religious"));
      return !allReligious;
    });

  cache[cacheKey][monthTag] = rows;
  return rows;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (!KEY) {
      return res.status(500).json({ error: "Missing CALENDARIFIC_API_KEY" });
    }

    const year: number = parseInt(String(req.query.year ?? ""), 10);
    const month: number = parseInt(String(req.query.month ?? ""), 10);
    if (!year || !month)
      return res.status(400).json({ error: "year and month are required" });

    // countries query is comma-separated labels; blank or missing = ALL
    const raw: string = String(req.query.countries ?? "").trim();
    const labels: string[] = raw
      ? raw.split(",").map((s: string) => s.trim()).filter(Boolean)
      : ALL_COUNTRY_LABELS;

    const all: EventItem[][] = await Promise.all(
      labels.map((lbl: string) => fetchCountryMonth(year, month, lbl))
    );
    const events: EventItem[] = all.flat().sort((a: EventItem, b: EventItem) =>
      a.date.localeCompare(b.date)
    );

    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
    return res.status(200).json({ events });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return res.status(500).json({ error: msg });
  }
}