// lib/commercial-events.ts

export type CommercialRule = {
    key: string;
    /** One or more regexes to match English OR native names */
    patterns: RegExp[];
    /** Limit to specific ISO-2 countries (optional) */
    countries?: string[];
  };
  
  /** Escape regex special chars */
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  
  /** Build case-insensitive regex from list of synonyms */
  const rx = (syn: string[]) =>
    new RegExp(syn.map(esc).join("|"), "i");
  
  /**
   * Allow-list of high-commercial-value events.
   * Add or refine freely. Keep synonyms short & practical.
   */
  export const COMMERCIAL_RULES: CommercialRule[] = [
    // Global core
    {
      key: "new_years_day",
      patterns: [rx([
        "new year's day", "new year", "jour de l'an", "nieuwjaarsdag",
        "nyårsdagen", "nytårsdag", "año nuevo", "ano novo", "anul nou",
        "πρωτοχρονιά", "kerst en nieuwjaar" // wide net, harmless
      ])],
    },
    { key: "valentines_day",
      patterns: [rx([
        "valentine", "valentine’s", "día de san valentín", "saint-valentin",
        "dia dos namorados", "día de los enamorados"
      ])],
    },
    { key: "mothers_day",
      patterns: [rx([
        "mother's day", "mothers day", "mothering sunday",
        "fête des mères", "día de la madre", "dia das mães", "moederdag",
        "mors dag", "mors dag" /* da/sv */
      ])],
    },
    { key: "fathers_day",
      patterns: [rx([
        "father's day", "fathers day", "fête des pères",
        "día del padre", "dia dos pais", "vaderdag", "fars dag"
      ])],
    },
    { key: "singles_day",
      patterns: [rx(["singles day","singles' day","double 11","11.11","11/11"])],
    },
    { key: "black_friday",
      patterns: [rx(["black friday","vendredi noir"])],
    },
    { key: "cyber_monday",
      patterns: [rx(["cyber monday","ciberlunes","ciber monday"])],
    },
    { key: "boxing_day",
      patterns: [rx(["boxing day"])],
      countries: ["GB","IE","CA","AU","NZ"],
    },
    { key: "labour_day",
      patterns: [rx(["labour day","labor day"])],
      countries: ["US","CA"],
    },
  
    // Religious but explicitly allowed (retail-heavy)
    { key: "christmas",
      patterns: [rx([
        "christmas", "noël", "navidad", "natal", "kerstmis",
        "juldagen", "jul", "crăciun", "χριστούγεννα"
      ])],
    },
    { key: "easter",
      patterns: [rx([
        "easter", "pâques", "påsk", "pasen", "páscoa", "paște", "πάσχα"
      ])],
    },
  
    // US retail anchors
    { key: "memorial_day", patterns: [rx(["memorial day"])], countries: ["US"] },
    { key: "independence_day", patterns: [rx(["independence day","4th of july","fourth of july"])], countries: ["US"] },
    { key: "presidents_day", patterns: [rx(["presidents' day","president's day","presidents day"])], countries: ["US"] },
    { key: "veterans_day", patterns: [rx(["veterans day","veteran's day"])], countries: ["US"] },
  
    // CA specifics
    { key: "canada_day", patterns: [rx(["canada day","fête du canada"])], countries: ["CA"] },
    { key: "victoria_day", patterns: [rx(["victoria day"])], countries: ["CA"] },
  
    // GB/IE bank holiday sales (weekend promos)
    { key: "spring_bank_holiday", patterns: [rx(["spring bank holiday"])], countries: ["GB"] },
    { key: "summer_bank_holiday", patterns: [rx(["summer bank holiday"])], countries: ["GB","IE"] },
  
    // MX / BR
    { key: "el_buen_fin", patterns: [rx(["el buen fin"])], countries: ["MX"] },
    { key: "br_childrens_day", patterns: [rx(["dia das crianças"])], countries: ["BR"] },
  
    // NL
    { key: "koningsdag", patterns: [rx(["koningsdag","king's day"])], countries: ["NL"] },
    { key: "sinterklaas", patterns: [rx(["sinterklaas"])], countries: ["NL"] },
  ];
  
  /** True if a (English/local) name matches commercial rules for a country */
  export function isCommercialName(
    englishName: string,
    localName: string | undefined,
    countryCode: string
  ): boolean {
    const en = (englishName || "").toLowerCase();
    const loc = (localName || "").toLowerCase();
  
    return COMMERCIAL_RULES.some(rule => {
      if (rule.countries && !rule.countries.includes(countryCode)) return false;
      return rule.patterns.some(re => re.test(en) || (loc && re.test(loc)));
    });
  }