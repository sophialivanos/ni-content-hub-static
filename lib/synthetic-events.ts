// lib/synthetic-events.ts

export type SyntheticEvent = {
    name: string;            // English name
    localName?: string;      // native label (optional)
    date: string;            // YYYY-MM-DD (approx if needed)
    country: string;         // ISO-2
    description?: string;
    tags?: string[];         // e.g. ["Synthetic","Retail"]
  };
  
  const pad = (n: number) => String(n).padStart(2, "0");
  
  /** Heuristics for known retail windows not in Calendarific */
  export function syntheticForMonth(year: number, month: number, countries: string[]): SyntheticEvent[] {
    const out: SyntheticEvent[] = [];
  
    // Amazon Prime Day (placeholder) — usually July, sometimes shifts
    if (month === 7) {
      for (const c of countries) {
        out.push({
          name: "Amazon Prime Day (placeholder)",
          localName: undefined,
          date: `${year}-07-15`,
          country: c,
          description: "Major retail event on Amazon (exact date varies by year).",
          tags: ["Synthetic","Retail"]
        });
      }
    }
  
    // Back-to-School window — show a mid-point in Aug/Sep
    if (month === 8 || month === 9) {
      for (const c of countries) {
        out.push({
          name: "Back-to-School Deals (window)",
          date: `${year}-${pad(month)}-15`,
          country: c,
          description: "Back-to-School retail period (dates vary by region).",
          tags: ["Synthetic","Retail"]
        });
      }
    }
  
    // France official sales (Soldes) — rough anchors
    if (countries.includes("FR")) {
      if (month === 1) {
        out.push({
          name: "Soldes d’hiver (Winter Sales)",
          localName: "Soldes d’hiver",
          date: `${year}-01-10`,
          country: "FR",
          description: "Government-regulated winter sales period (approx anchor date).",
          tags: ["Synthetic","Retail","FR"]
        });
      }
      if (month === 6) {
        out.push({
          name: "Soldes d’été (Summer Sales)",
          localName: "Soldes d’été",
          date: `${year}-06-26`,
          country: "FR",
          description: "Government-regulated summer sales period (approx anchor date).",
          tags: ["Synthetic","Retail","FR"]
        });
      }
    }
  
    // Mexico: El Buen Fin (if not provided by API) — weekend before Revolution Day, we anchor mid-Nov.
    if (countries.includes("MX") && month === 11) {
      out.push({
        name: "El Buen Fin (synthetic)",
        localName: "El Buen Fin",
        date: `${year}-11-15`,
        country: "MX",
        description: "National discount weekend (actual dates vary).",
        tags: ["Synthetic","Retail","MX"]
      });
    }
  
    return out;
  }