// lib/calendarific.ts
export type EventItem = {
  id: string;
  name: string;
  date: string;        // ISO
  description?: string;
  type: string[];      // Calendarific "type" strings
  country: string;     // human label
  countryIso2: string; // e.g. GB
};

// Minimal Calendarific response types (only what we use)
type CalendarificHoliday = {
  name?: string;
  description?: string;
  date?: { iso?: string };
  type?: string[];
};
type CalendarificPayload = {
  response?: { holidays?: CalendarificHoliday[] };
};

// UI label -> ISO-2 code
export const COUNTRY_LABEL_TO_ISO: Record<string, string> = {
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
export const ALL_COUNTRY_LABELS: string[] = Object.keys(COUNTRY_LABEL_TO_ISO);

// simple in-memory cache by year+country+month
const cache: Record<string, Record<string, EventItem[]>> = {};

/**
 * Fetch one country's holidays for a given year+month from Calendarific.
 * Filters out purely religious observances.
 */
export async function fetchCountryMonth(
  apiKey: string,
  year: number,
  month: number,
  countryLabel: string
): Promise<EventItem[]> {
  const iso = COUNTRY_LABEL_TO_ISO[countryLabel];
  if (!iso) return [];

  const yearKey = String(year);
  cache[yearKey] ||= {};
  const tag = `${iso}:${year}:${month}`;
  if (cache[yearKey][tag]) return cache[yearKey][tag];

  const url =
    `https://calendarific.com/api/v2/holidays` +
    `?api_key=${encodeURIComponent(apiKey)}` +
    `&country=${encodeURIComponent(iso)}` +
    `&year=${year}&month=${month}`;

  const r: Response = await fetch(url);
  if (!r.ok) throw new Error(`Calendarific ${iso} ${year}-${month} -> ${r.status}`);

  const payload = (await r.json()) as CalendarificPayload;
  const holidays: CalendarificHoliday[] = payload?.response?.holidays ?? [];

  const rows: EventItem[] = holidays
    .map((h: CalendarificHoliday): EventItem => {
      const types: string[] = Array.isArray(h.type)
        ? (h.type as string[]).map((t: string) => String(t))
        : [];
      const isoDate: string = String(h?.date?.iso ?? "");

      return {
        id: `${iso}-${String(h?.name ?? "")}-${isoDate}`,
        name: String(h?.name ?? ""),
        date: isoDate,
        description: h?.description ? String(h.description) : "",
        type: types,
        country: countryLabel,
        countryIso2: iso,
      };
    })
    // drop purely religious observances (keep if also observance/national/etc.)
    .filter((ev: EventItem) => {
      const t: string[] = ev.type.map((x: string) => x.toLowerCase());
      const allReligious: boolean =
        t.length > 0 && t.every((x: string) => x.includes("religious"));
      return !allReligious;
    });

  cache[yearKey][tag] = rows;
  return rows;
}

/**
 * Convenience: fetch for many country labels. If labels is empty/undefined,
 * it fetches for ALL supported labels.
 */
export async function fetchMonthAll(
  apiKey: string,
  year: number,
  month: number,
  countryLabels?: string[]
): Promise<EventItem[]> {
  const labels: string[] =
    countryLabels && countryLabels.length > 0
      ? countryLabels
      : ALL_COUNTRY_LABELS;

  const chunks: EventItem[][] = await Promise.all(
    labels.map((lbl: string) => fetchCountryMonth(apiKey, year, month, lbl))
  );

  return chunks.flat().sort((a: EventItem, b: EventItem) => a.date.localeCompare(b.date));
}