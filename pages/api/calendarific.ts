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

/* ──────────────────────────────────────────────────────────────
   Filtering rules
   - REMOVE anything tagged religious by type OR looks religious by name.
   - BUT: Allow a curated whitelist of marketing-relevant days even if
     some countries tag them oddly (e.g., “Mothering Sunday”).
   ────────────────────────────────────────────────────────────── */

const RELIGIOUS_KEYWORDS = [
  // Abrahamic
  "yom kippur","rosh hashanah","passover","pesach","hanukkah","purim","sukkot",
  "easter","good friday","ash wednesday","lent","pentecost","epiphany",
  "assumption","ascension","all saints","all souls","immaculate conception",
  "christ the king","corpus christi","annunciation","nativity of mary",
  "ramadan","eid","eid al-fitr","eid al-adha","mawlid","muharram","ashura","Hoshana Rabbah",
  // Hindu / Sikh / Buddhist / Jain, etc.
  "diwali","deepavali","dussehra","vijaya dashami","navratri","holi",
  "makar sankranti","pongal","maha shivaratri","janmashtami","raksha bandhan",
  "guru nanak","vesak","buddha","magha puja","loy krathong","songkran",
  // Saints & feasts
  "saint ","st ","feast of",
  // Generic faith tags
  "hindu","buddhist","sikh","christian","muslim","jewish","orthodox","coptic"
];

const RELIGIOUS_RE = new RegExp(
  RELIGIOUS_KEYWORDS.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
  "i"
);

// ✳️ Whitelist of marketing-relevant days that should ALWAYS pass
const SAFE_WHITELIST = [
  "boxing day",
  "black friday",
  "cyber monday",
  "singles day","singles' day","double 11","11.11",
  "valentine", // covers "valentine’s day"
  "mother's day","mothers day","mothering sunday",
  "father's day","fathers day",
  "children's day","childrens day",
  "halloween",
  "new year's day","new year","lunar new year","chinese new year",
  "labour day","labor day",
  // add more here as your playbook evolves
];
const SAFE_RE = new RegExp(
  SAFE_WHITELIST.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
  "i"
);

// in-memory cache by year -> monthTag -> events
const cache: Record<string, Record<string, EventItem[]>> = {};
const KEY = (process.env.CALENDARIFIC_API_KEY ?? "").trim();

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

  const rows: EventItem[] = (j?.response?.holidays || [])
    .map((h: any) => {
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
    .filter(ev => {
      // Allow if whitelisted (e.g., Boxing Day), regardless of odd tags
      const whitelisted = SAFE_RE.test(ev.name);
      if (whitelisted) return true;

      // Otherwise, drop anything religious by type or name
      const hasReligiousType = ev.type.some(t => /religious/i.test(String(t)));
      const nameLooksReligious = RELIGIOUS_RE.test(ev.name);
      return !(hasReligiousType || nameLooksReligious);
    });

  cache[cacheKey][monthTag] = rows;
  return rows;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (!KEY) return res.status(500).json({ error: "Missing CALENDARIFIC_API_KEY" });

    const year = parseInt(String(req.query.year ?? ""), 10);
    const month = parseInt(String(req.query.month ?? ""), 10);
    if (!year || !month) return res.status(400).json({ error: "year and month are required" });

    // countries: comma-separated UI labels; blank = ALL
    const raw = String(req.query.countries ?? "").trim();
    const labels = raw ? raw.split(",").map(s => s.trim()).filter(Boolean) : ALL_COUNTRY_LABELS;

    const all = await Promise.all(labels.map(lbl => fetchCountryMonth(year, month, lbl)));
    const events = all.flat().sort((a, b) => a.date.localeCompare(b.date));

    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
    return res.status(200).json({ events });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}