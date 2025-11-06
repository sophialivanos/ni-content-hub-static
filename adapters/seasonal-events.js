// Pure seasonal-events logic for reuse in any runtime (no Next APIs).
// Mirrors pages/api/seasonal-events.ts behavior.

import Holidays from 'date-holidays';
import { isCommercialName } from '../lib/commercial-events.js';
import { syntheticForMonth } from '../lib/synthetic-events.js';

const yearCache = new Map(); // `${year}:${country}` -> normalized holidays

const SUPPORTED = [
  { code: 'GB', label: 'United Kingdom' },
  { code: 'IE', label: 'Ireland' },
  { code: 'CA', label: 'Canada' },
  { code: 'US', label: 'United States' },
  { code: 'FR', label: 'France' },
  { code: 'RO', label: 'Romania' },
  { code: 'SE', label: 'Sweden' },
  { code: 'MX', label: 'Mexico' },
  { code: 'BR', label: 'Brazil' },
  { code: 'GR', label: 'Greece' },
  { code: 'DK', label: 'Denmark' },
  { code: 'NL', label: 'Netherlands' },
];
const SUPPORTED_CODES = new Set(SUPPORTED.map((c) => c.code));

function pad2(n) { return n < 10 ? `0${n}` : `${n}`; }
function ymd(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function monthOf(iso) { const d = new Date(iso); return Number.isNaN(d.getTime()) ? -1 : d.getMonth() + 1; }

function normHoliday(h, country) {
  let d = null;
  if (h.start instanceof Date) d = h.start;
  else if (h.date) d = new Date(String(h.date).replace(' ', 'T') + 'Z');
  if (!d || Number.isNaN(d.getTime())) return null;
  const name = String(h.name ?? '').trim();
  const typeArr = Array.isArray(h.type) ? h.type : h.type ? [h.type] : [];
  const desc = typeArr.includes('public')
    ? 'Public holiday widely observed with time off work and local activities.'
    : 'Widely observed date noted for cultural or seasonal activities.';
  return {
    name,
    date: ymd(d),
    description: desc,
    _country: country,
    _nameEn: name,
    _nameLocal: h.nameLocal || name,
    _rawType: typeArr.length ? typeArr : ['holiday'],
  };
}

function getCountryYear(country, year) {
  const key = `${year}:${country}`;
  const cached = yearCache.get(key);
  if (cached) return cached;
  const hd = new Holidays(country);
  let list = [];
  try { list = hd.getHolidays(year) || []; } catch { list = []; }
  const normalized = list.map((h) => normHoliday(h, country)).filter(Boolean);
  yearCache.set(key, normalized);
  return normalized;
}

/**
 * Compute seasonal events for UI.
 * @param {{ year?: number, month: number, countries?: string[], commercialOnly?: boolean }} params
 * @returns {{ month:number, year:number, countries:string[], events: Array<any>, count:number }}
 */
export function computeSeasonalEvents({ year, month, countries, commercialOnly = true }) {
  const now = new Date();
  const yr = year || now.getFullYear();
  const m = Math.max(1, Math.min(12, Number(month || (now.getMonth() + 1))));

  const listCountries = (countries && countries.length ? countries : SUPPORTED.map(c => c.code))
    .filter((c) => SUPPORTED_CODES.has(c));

  let combined = [];
  for (const code of listCountries) combined = combined.concat(getCountryYear(code, yr));

  let filtered = combined.filter((ev) => monthOf(ev.date) === m);
  if (commercialOnly) filtered = filtered.filter((ev) => isCommercialName(ev._nameEn, ev._nameLocal, ev._country));

  const synth = syntheticForMonth(yr, m, listCountries).map((s) => ({
    name: s.name,
    date: s.date,
    description: s.description,
    _country: s.country,
    _nameEn: s.name,
    _nameLocal: s.localName ?? s.name,
    _rawType: ['Synthetic'],
  }));
  filtered = filtered.concat(synth);

  if (m === 12) {
    for (const code of listCountries) {
      const exists = filtered.some((ev) => /new\s*year/i.test(ev._nameEn || ev.name || ev._nameLocal || '') && String(ev.date).endsWith('-12-31') && String(ev._country).toUpperCase() === code.toUpperCase());
      if (!exists) {
        filtered.push({
          name: "New Year's Eve",
          description: 'Last day of the Gregorian year; countdowns, gatherings and travel are common.',
          date: `${yr}-12-31`,
          _country: code,
          _nameEn: "New Year's Eve",
          _nameLocal: "New Year's Eve",
          _rawType: ['Synthetic'],
        });
      }
    }
  }

  const toIso = (d) => (typeof d === 'string' ? d : String(d?.iso || ''));
  const toTime = (d) => { const iso = toIso(d); const t = Date.parse(iso); return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t; };
  const events = filtered
    .sort((a, b) => toTime(a.date) - toTime(b.date))
    .map((ev) => ({
      name: ev._nameEn || ev.name || 'Untitled',
      date: toIso(ev.date),
      description: ev.description ?? '',
      relevantVerticals: [],
      relevanceExplanation: '',
      bestPractices: [],
      contentSuggestions: undefined,
      _country: ev._country,
      _rawType: ev._rawType,
      _nameEn: ev._nameEn || '',
      _nameLocal: ev._nameLocal || '',
    }));

  return { month: m, year: yr, countries: listCountries, events, count: events.length };
}


