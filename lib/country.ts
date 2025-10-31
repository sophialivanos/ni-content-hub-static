// lib/country.ts
export type CountryCode = "GB"|"IE"|"CA"|"US"|"FR"|"RO"|"SE"|"MX"|"BR"|"GR"|"DK"|"NL";

export const COUNTRIES: { code: CountryCode; label: string }[] = [
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

export function languageFor(country: CountryCode): string {
  switch (country) {
    case "FR": return "French";
    case "RO": return "Romanian";
    case "SE": return "Swedish";
    case "MX": return "Spanish";
    case "BR": return "Portuguese (Brazil)";
    case "GR": return "Greek";
    case "DK": return "Danish";
    case "NL": return "Dutch";
    case "CA": return "English"; // simplify v1
    default: return "English";
  }
}