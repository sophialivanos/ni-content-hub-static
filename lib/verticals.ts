// lib/verticals.ts
// Canonical, de-duplicated verticals for selectors (country variants collapsed)

export const CANONICAL_VERTICALS = [
    "Accounting Software",
    "Antivirus",
    "Background Checks",
    "Banking",
    "Bingo",
    "Braces",
    "Business Applications",
    "Business Applications Hub",
    "Business Insurance",
    "Business Loans",
    "Business VoIP",
    "Car Insurance",
    "Car Loans",
    "Car Selling",
    "Car Warranty",
    "Online Casino",
    "Contact Lenses",
    "Credit Cards",
    "CRM",
    "Cyber Security Hub",
    "Data Analysis Software",
    "Dating",
    "Debt Consolidation",
    "Debt Funnel",
    "DNA Testing",
    "E-Commerce",
    "ED (Men’s Health)",
    "Editing Apps",
    "Flower Delivery",
    "Gold & Silver",
    "Hair Loss",
    "Hearing Aids",
    "Home Insurance",
    "Home Security",
    "Home Warranty",
    "Web Hosting",
    "Web Hosting (SaaS)",
    "Identity Theft Protection",
    "In-App",
    "Internet Providers",
    "Investments",
    "Invoicing",
    "Lab-Grown Diamonds",
    "Language Learning",
    "Legal Services",
    "Life Insurance",
    "Life Insurance (Fintech)",
    "LLC",
    "Marketing Tools Hub",
    "Meal Delivery",
    "Medical Alerts",
    "Mobile Plans",
    "Money Transfer",
    "Mortgage",
    "Moving Companies",
    "Online Banking",
    "Online Degrees",
    "Online Therapy",
    "Parental Control",
    "Password Manager",
    "Payroll",
    "Personal Loans",
    "Pet Food Delivery",
    "Pet Insurance",
    "Pet Subscription Boxes",
    "PGR (Pro Group Racing)",
    "Poker",
    "POS & Payments",
    "Printing Services",
    "Private Student Loans",
    "Project Management",
    "Psychic Reading",
    "Remote Access",
    "Renters Insurance",
    "Resume Builders",
    "Slots (Casino)",
    "Solar",
    "Sports Betting",
    "Student Loans",
    "Tax Relief",
    "Tax Software",
    "Tech Bootcamps",
    "Teeth Whitening",
    "Telecom",
    "Top Offers (FR)",
    "Top10",
    "Travel Insurance",
    "TV Services",
    "TV Streaming",
    "Vitamins",
    "VPN",
    "Walk-in Tubs",
    "Web Design",
    "Website Builders",
    "Website Builders (SaaS)",
    "Weight Loss",
    "Weight-loss Plans",
    "WSB",
    "MAS",
    "HS",
    "HW",
  ] as const;
  
  export type CanonicalVertical = typeof CANONICAL_VERTICALS[number];
  
  /**
   * Collapse your raw labels (with country/variants) into a canonical one for analytics or ingest.
   * Examples:
   *  - "Sport Betting UK" -> "Sports Betting"
   *  - "Anti-Virus FR"   -> "Antivirus"
   *  - "Mortgages (Fintech)" / "Mortgage Refinance" -> "Mortgage"
   */
  export function canonicalizeVertical(raw: string): CanonicalVertical | "Other/Legacy" {
    const s = (raw || "").trim();
  
    // strip common locale suffixes
    const noLocale = s.replace(/\s+(UK|US|CA|MX|FR|DE|RO|SE|IE|IT|NL|PT|SP|AU|BR|RU)\b/gi, "").trim();
  
    const is = (re: RegExp) => re.test(noLocale);
  
    if (is(/^Anti[-\s]?Virus/i)) return "Antivirus";
    if (is(/^Casino|^Slots UK|^Slots\b/i)) return "Online Casino";
    if (is(/^Sport(\s|$)|^Sport Betting/i)) return "Sports Betting";
    if (is(/^VPN(\s|$)|^VPN [A-Z]{2}$/i)) return "VPN";
    if (is(/^Website Builders \(SaaS\)/i)) return "Website Builders (SaaS)";
    if (is(/^Website Builders\b/i)) return "Website Builders";
    if (is(/^Web Hosting \(SaaS\)/i)) return "Web Hosting (SaaS)";
    if (is(/^Hosting\b|^Web Hosting\b/i)) return "Web Hosting";
    if (is(/^VOIP\b|^Business VoIP/i)) return "Business VoIP";
    if (is(/^CCP\/??POS|^CCP$|^POS$/i)) return "POS & Payments";
    if (is(/^Identity Theft\b|^IDT\b/i)) return "Identity Theft Protection";
    if (is(/^Parental control/i)) return "Parental Control";
    if (is(/^Password manager/i)) return "Password Manager";
    if (is(/^Home LG Insurance/i)) return "Home Insurance";
    if (is(/^Mortgage\b|^Mortgages/i)) return "Mortgage";
    if (is(/^Student Loans \(Fintech\)|^Student Loans Refinance/i)) return "Student Loans";
    if (is(/^Life Insurance \(Fintech\)/i)) return "Life Insurance (Fintech)";
    if (is(/^Banking\b|^Online Banking\b/i)) return is(/^Online Banking/i) ? "Online Banking" : "Banking";
    if (is(/^Lab Grown Diamonds/i)) return "Lab-Grown Diamonds";
    if (is(/^Cappsool- Pet Food|^Pet food Delivery/i)) return "Pet Food Delivery";
    if (is(/^Pet Insurance \(Fintech\)/i)) return "Pet Insurance";
    if (is(/^Top Offers FR/i)) return "Top Offers (FR)";
    if (is(/^Top10(\/|$)/i)) return "Top10";
    if (is(/^Slots/i)) return "Slots (Casino)";
  
    // direct match to canonical list?
    const direct = CANONICAL_VERTICALS.find(v => v.toLowerCase() === noLocale.toLowerCase());
    if (direct) return direct;
  
    return "Other/Legacy";
  }


