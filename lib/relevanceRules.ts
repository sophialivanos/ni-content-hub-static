// lib/relevanceRules.ts
// Minimal, defensible v1 rules. Expand iteratively.

export type Vertical = string;

const EXCLUDE_PURELY_RELIGIOUS = [
  /epiphany/i, /ascension/i, /corpus christi/i, /assumption/i, /immaculate conception/i,
  /orthodox/i, /holy thursday/i, /maundy thursday/i, /good friday/i, /easter (monday|sunday)/i,
  /all saints/i, /all souls/i, /annunciation/i, /pentecost/i, /whit/i, /saint\s/i
];

const RETAIL_HEAVY = [
  /new year/i, /valentine/i, /mother'?s day/i, /father'?s day/i,
  /black friday/i, /cyber monday/i, /boxing day/i, /singles'? day/i,
  /back to school/i, /halloween/i, /christmas/i, /xmas/i, /labor day/i, /labour day/i,
  /memorial day/i, /independence day/i, /bastille/i, /thanksgiving/i
];

// Mapping: event keyword -> relevant verticals (generic)
// Region-specific expansion handled separately.
const MAP: Array<{ test: RegExp; verticals: Vertical[] }> = [
  { test: /valentine/i, verticals: ["Dating", "Flower Delivery", "Lab Grown Diamonds"] },
  { test: /mother'?s day/i, verticals: ["Flower Delivery", "Vitamins", "Meal Delivery"] },
  { test: /father'?s day/i, verticals: ["Vitamins"] },
  { test: /black friday|cyber monday|singles'? day/i,
    verticals: ["E-Commerce", "Hosting", "Website Builders", "VPN", "Anti-Virus", "ID Theft", "Password manager"] },
  { test: /boxing day/i, verticals: ["E-Commerce", "TV Streaming", "VPN"] },
  { test: /back to school/i, verticals: ["Anti-Virus", "Parental control", "VPN", "Password manager", "Online Degrees", "Tech Bootcamps"] },
  { test: /halloween/i, verticals: ["TV Streaming", "VPN"] },
  { test: /new year/i, verticals: ["Weight Loss", "Vitamins", "Meal Delivery", "Online Degrees", "Project Management"] },
  { test: /tax day|tax return|end of financial year|financial year end|fiscal year/i,
    verticals: ["Tax Software", "Accounting Software", "Payroll", "LLC"] },
  { test: /independence day|bastille|thanksgiving|memorial|labou?r day/i,
    verticals: ["E-Commerce", "Meal Delivery", "TV Streaming", "VPN"] },
  { test: /christmas/i, verticals: ["E-Commerce", "Flower Delivery", "VPN", "TV Streaming"] },
];

function hasRetailSignal(name: string, description: string): boolean {
  const txt = `${name} ${description}`.toLowerCase();
  if (EXCLUDE_PURELY_RELIGIOUS.some(rx => rx.test(txt))) {
    // allow through if it's one of the known retail spikes
    if (!RETAIL_HEAVY.some(rx => rx.test(txt))) return false;
  }
  return true;
}

// Expand “regionalized” vertical labels when we know the country
export function expandRegional(vert: Vertical, country: string): Vertical[] {
  const c = country.toUpperCase();
  const map: Record<string, string[]> = {
    "Dating": {
      GB: ["Dating UK"], IE: ["Dating"], CA: ["Dating CA"], US: ["Dating US"],
      FR: ["Dating FR"], RO: ["Dating"], SE: ["Dating SE"], MX: ["Dating"], BR: ["Dating"],
      GR: ["Dating"], DK: ["Dating"], NL: ["Dating NL"]
    }[c] || ["Dating"],

    "Anti-Virus": {
      GB: ["Anti-Virus UK"], FR: ["Anti-Virus FR"], AU: ["Anti-Virus AU"],
      BR: ["Anti-Virus BR"], RU: ["Anti-Virus RU"]
    }[c] || ["Anti-Virus"],

    "VPN": {
      DE: ["VPN DE"], FR: ["VPN FR"], IT: ["VPN IT"], NL: ["VPN NL"], PT: ["VPN PT"], ES: ["VPN SP"]
    }[c] || ["VPN"],
  } as any;

  return (map[vert] ?? [vert]) as string[];
}

export function classifyVerticals(name: string, description: string, country: string): Vertical[] {
  if (!hasRetailSignal(name, description)) return [];
  const matches = MAP
    .filter(rule => rule.test.test(name) || rule.test.test(description))
    .flatMap(rule => rule.verticals);
  // de-dup and expand regionals
  const expanded = matches.flatMap(v => expandRegional(v, country));
  return Array.from(new Set(expanded));
}