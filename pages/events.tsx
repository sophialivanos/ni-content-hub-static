// pages/events.tsx
import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Loader2, Download } from "lucide-react";

/* ---------- Types ---------- */
type SuggestionBuckets = {
  H1?: string[];
  DH1?: string[];
  H2?: string[];
  "Article headline"?: string[];
  "Ribbon Copy"?: string[];
  "BTC paragraph"?: string;
};

type RelevantEvent = {
  name: string;                // English (stable for merging)
  date: string;                // YYYY-MM-DD
  description?: string;        // from API (may be country-specific)
  relevantVerticals?: string[] | string;
  relevanceExplanation?: string;
  bestPractices?: string[] | string;
  contentSuggestions?: SuggestionBuckets;
  _country?: string;           // ISO-2 from API
  _rawType?: string[];         // Calendarific types
  _nameEn?: string;            // English name
  _nameLocal?: string;         // Native name (if available)
};

type MergedEvent = RelevantEvent & {
  _countries?: string[];                 // merged ISO-2 codes
  _localNames?: Record<string, string>;  // code -> local name
};

type ApiResponse = {
  month: number;
  year: number;
  countries: string[];
  events: RelevantEvent[];
  count: number;
};

/* ---------- NEW: i18n ---------- */
type Lang = "en"|"fr"|"es"|"pt"|"ro"|"sv"|"el"|"da"|"nl";

type I18nPack = {
  h1: (p:{base:string;year:number;dateStr:string;vertical:string})=>string[];
  dh1:(p:{base:string;year:number;dateStr:string;vertical:string})=>string[];
  h2: (p:{base:string;year:number;dateStr:string;vertical:string})=>string[];
  article:(p:{base:string;year:number;dateStr:string;vertical:string})=>string[];
  ribbon: (p:{base:string})=>string[];
  btc: (p:{base:string;dateStr:string;vertical:string})=>string; // long paragraph
};

const I18N: Record<Lang, I18nPack> = {
  en: {
    h1: ({ base, year, vertical }) => [
      base + " " + year + ": " + vertical + " picks & ideas",
      vertical + " for " + base + " " + year,
      base + " " + year + ": " + vertical + " guide",
      base + ": plan " + year + " with " + vertical,
      base + " " + year + ": smarter choices in " + vertical,
    ],
    dh1: ({ base, vertical }) => [
      "Make " + base + " easier with " + vertical + " choices that work.",
      "Your quick plan for " + base + " using the right " + vertical + ".",
      "Everything for " + base + " — tools, tips and " + vertical + " know-how.",
      base + ": compare " + vertical + " options and decide fast.",
      "Shortlist the best " + vertical + " paths for " + base + ".",
    ],
    h2: ({ base, vertical }) => [
      base + ": why " + vertical + " matters",
      base + ": timing & tactics for " + vertical,
      "Top " + vertical + " use cases for " + base,
      base + ": value over hype in " + vertical,
      vertical + " FAQs for " + base,
    ],
    article: ({ base, year, vertical }) => [
      base + " " + year + ": practical " + vertical + " choices that pay off",
      base + ": the only " + vertical + " checklist you need",
      "From research to checkout: " + vertical + " for " + base,
      base + ": spot real value in " + vertical,
      base + ": quick " + vertical + " wins to try today",
    ],
    ribbon: () => ["Trending now", "Editor’s choice", "Best value", "Top pick", "Staff favourite"],
    btc: ({ base, dateStr, vertical }) =>
      base + " falls on " + dateStr +
      " and typically sparks early research as people plan purchases, subscriptions and at-home activities tied to clear needs. " +
      "For " + vertical + ", users look for trustworthy comparisons, real benefits and simple steps from browsing to completion, so pages that remove guesswork perform better. " +
      "Make timing, delivery and return policies explicit to reduce hesitation, and keep calls-to-action visible on mobile. " +
      "Use scannable sections, recent reviews and helpful FAQs to hold attention, and set expectations on setup or onboarding so momentum isn’t lost. " +
      "Where ongoing service applies, highlight trial-to-paid paths, ease of cancellation and responsive support to build confidence.",
  },

  fr: {
    h1: ({ base, year, vertical }) => [
      base + " " + year + " : idées et choix " + vertical,
      vertical + " pour " + base + " " + year,
      base + " " + year + " : guide " + vertical,
      base + " : préparer " + year + " avec " + vertical,
      base + " " + year + " : meilleurs choix en " + vertical,
    ],
    dh1: ({ base, vertical }) => [
      "Simplifiez " + base + " avec des choix " + vertical + " utiles.",
      "Votre plan rapide pour " + base + " avec le bon " + vertical + ".",
      "Tout pour " + base + " : outils, conseils et " + vertical + ".",
      base + " : comparez les options " + vertical + " et décidez vite.",
      base + " : sélection " + vertical + " prête à l’emploi.",
    ],
    h2: ({ base, vertical }) => [
      base + " : pourquoi " + vertical + " compte",
      base + " : calendrier et tactiques " + vertical,
      "Cas d’usage " + vertical + " pour " + base,
      base + " : valeur réelle en " + vertical,
      "FAQ " + vertical + " pour " + base,
    ],
    article: ({ base, year, vertical }) => [
      base + " " + year + " : choix " + vertical + " concrets qui fonctionnent",
      base + " : la checklist " + vertical + " essentielle",
      "De la recherche au paiement : " + vertical + " pour " + base,
      base + " : repérer la vraie valeur en " + vertical,
      base + " : actions " + vertical + " rapides à tester",
    ],
    ribbon: () => ["Tendance", "Choix de la rédaction", "Meilleur rapport qualité-prix", "Notre sélection", "Favori de l’équipe"],
    btc: ({ base, dateStr, vertical }) =>
      base + " a lieu le " + dateStr +
      " et déclenche souvent une phase de recherche en amont, lorsqu’on planifie achats, abonnements et activités à domicile. " +
      "Pour " + vertical + ", les utilisateurs veulent des comparatifs fiables, des bénéfices clairs et un parcours simple jusqu’à la finalisation ; les pages qui lèvent les doutes performent mieux. " +
      "Rendre explicites délais, livraison et retours réduit les hésitations, avec des appels à l’action visibles sur mobile. " +
      "Des sections lisibles, des avis récents et une FAQ utile maintiennent l’attention. " +
      "Si un service continu est concerné, mettez en avant l’essai, la facilité de résiliation et un support réactif pour inspirer confiance.",
  },

  es: {
    h1: ({ base, year, vertical }) => [
      base + " " + year + ": ideas y elecciones en " + vertical,
      vertical + " para " + base + " " + year,
      base + " " + year + ": guía de " + vertical,
      base + ": prepara " + year + " con " + vertical,
      base + " " + year + ": mejores opciones de " + vertical,
    ],
    dh1: ({ base, vertical }) => [
      "Haz " + base + " más fácil con " + vertical + " bien elegido.",
      "Plan rápido para " + base + " usando " + vertical + ".",
      "Todo para " + base + ": herramientas, consejos y " + vertical + ".",
      base + ": compara " + vertical + " y decide sin vueltas.",
      "Atajos " + vertical + " para " + base + ".",
    ],
    h2: ({ base, vertical }) => [
      base + ": por qué importa " + vertical,
      base + ": calendario y tácticas en " + vertical,
      "Casos de uso " + vertical + " para " + base,
      base + ": valor real en " + vertical,
      "Preguntas frecuentes " + vertical + " sobre " + base,
    ],
    article: ({ base, year, vertical }) => [
      base + " " + year + ": decisiones " + vertical + " que funcionan",
      base + ": la lista esencial de " + vertical,
      "De la investigación al pago: " + vertical + " para " + base,
      base + ": cómo detectar valor en " + vertical,
      base + ": acciones rápidas en " + vertical,
    ],
    ribbon: () => ["Tendencia", "Elección del editor", "Mejor valor", "Recomendado", "Favorito del equipo"],
    btc: ({ base, dateStr, vertical }) =>
      base + " se celebra el " + dateStr +
      " y suele activar una fase temprana de investigación para planificar compras, suscripciones y actividades en casa. " +
      "En " + vertical + ", los usuarios buscan comparativas fiables, beneficios claros y un recorrido sencillo hasta completar. " +
      "Deja claros los plazos, la entrega y las devoluciones y mantén visibles las llamadas a la acción en móvil. " +
      "Usa bloques escaneables, reseñas recientes y una FAQ útil. " +
      "Si hay servicio continuo, resalta prueba, facilidad de cancelación y soporte ágil para generar confianza.",
  },

  pt: {
    h1: ({ base, year, vertical }) => [
      base + " " + year + ": ideias e escolhas em " + vertical,
      vertical + " para " + base + " " + year,
      base + " " + year + ": guia de " + vertical,
      base + ": prepare " + year + " com " + vertical,
      base + " " + year + ": melhores opções em " + vertical,
    ],
    dh1: ({ base, vertical }) => [
      "Torne " + base + " mais simples com " + vertical + " bem escolhido.",
      "Plano rápido para " + base + " usando " + vertical + ".",
      "Tudo para " + base + ": ferramentas, dicas e " + vertical + ".",
      base + ": compare " + vertical + " e decida rápido.",
      "Atalhos de " + vertical + " para " + base + ".",
    ],
    h2: ({ base, vertical }) => [
      base + ": por que " + vertical + " importa",
      base + ": calendário e táticas em " + vertical,
      "Casos de uso de " + vertical + " para " + base,
      base + ": valor real em " + vertical,
      "Perguntas frequentes de " + vertical + " em " + base,
    ],
    article: ({ base, year, vertical }) => [
      base + " " + year + ": decisões " + vertical + " que funcionam",
      base + ": a checklist essencial de " + vertical,
      "Da pesquisa ao pagamento: " + vertical + " para " + base,
      base + ": como ver valor em " + vertical,
      base + ": ações rápidas em " + vertical,
    ],
    ribbon: () => ["Em alta", "Escolha do editor", "Melhor valor", "Recomendado", "Favorito da equipa"],
    btc: ({ base, dateStr, vertical }) =>
      base + " ocorre em " + dateStr +
      " e costuma iniciar pesquisa antecipada para planear compras, subscrições e atividades em casa. " +
      "Em " + vertical + ", as pessoas procuram comparações fiáveis, benefícios claros e um percurso simples até concluir. " +
      "Deixe explícitos prazos, entrega e devoluções e mantenha as chamadas visíveis no telemóvel. " +
      "Use blocos escaneáveis, avaliações recentes e uma FAQ útil. " +
      "Quando há serviço contínuo, destaque teste, facilidade de cancelamento e suporte pronto para gerar confiança.",
  },

  ro: {
    h1: ({ base, year, vertical }) => [
      base + " " + year + ": idei și alegeri în " + vertical,
      vertical + " pentru " + base + " " + year,
      base + " " + year + ": ghid " + vertical,
      base + ": pregătește " + year + " cu " + vertical,
      base + " " + year + ": opțiuni mai bune în " + vertical,
    ],
    dh1: ({ base, vertical }) => [
      "Fă " + base + " mai ușor cu " + vertical + " potrivit.",
      "Plan rapid pentru " + base + " folosind " + vertical + ".",
      "Totul pentru " + base + ": instrumente, sfaturi și " + vertical + ".",
      base + ": compară " + vertical + " și decide rapid.",
      "Liste scurte " + vertical + " pentru " + base + ".",
    ],
    h2: ({ base, vertical }) => [
      base + ": de ce contează " + vertical,
      base + ": calendar și tactici " + vertical,
      "Cazuri " + vertical + " pentru " + base,
      base + ": valoare reală în " + vertical,
      "Întrebări " + vertical + " pentru " + base,
    ],
    article: ({ base, year, vertical }) => [
      base + " " + year + ": decizii " + vertical + " care funcționează",
      base + ": lista esențială " + vertical,
      "De la research la plată: " + vertical + " pentru " + base,
      base + ": cum vezi valoarea în " + vertical,
      base + ": acțiuni rapide în " + vertical,
    ],
    ribbon: () => ["În trend", "Alegerea editorului", "Cel mai bun raport", "Recomandat", "Favoritul echipei"],
    btc: ({ base, dateStr, vertical }) =>
      base + " are loc pe " + dateStr +
      " și, de obicei, pornește din timp documentarea pentru achiziții, abonamente și activități acasă. " +
      "În " + vertical + ", utilizatorii caută comparații de încredere, beneficii clare și pași simpli până la finalizare. " +
      "Precizează termene, livrare și retur și păstrează butoanele vizibile pe mobil. " +
      "Folosește secțiuni ușor de parcurs, recenzii recente și o FAQ utilă. " +
      "Dacă este un serviciu continuu, subliniază perioada de test, ușurința anulării și suportul prompt.",
  },

  sv: {
    h1: ({ base, year, vertical }) => [
      base + " " + year + ": val och idéer inom " + vertical,
      vertical + " för " + base + " " + year,
      base + " " + year + ": guide för " + vertical,
      base + ": förbered " + year + " med " + vertical,
      base + " " + year + ": bättre val i " + vertical,
    ],
    dh1: ({ base, vertical }) => [
      "Gör " + base + " enklare med rätt " + vertical + ".",
      "Snabbplan för " + base + " med " + vertical + ".",
      "Allt för " + base + ": verktyg, tips och " + vertical + ".",
      base + ": jämför " + vertical + " och bestäm dig snabbt.",
      "Kortlista " + vertical + "-alternativ för " + base + ".",
    ],
    h2: ({ base, vertical }) => [
      base + ": därför är " + vertical + " viktigt",
      base + ": timing och taktik i " + vertical,
      "Användningsfall för " + vertical + " vid " + base,
      base + ": verkligt värde i " + vertical,
      vertical + "-frågor om " + base,
    ],
    article: ({ base, year, vertical }) => [
      base + " " + year + ": " + vertical + "-val som fungerar",
      base + ": den viktiga " + vertical + "-listan",
      "Från sök till köp: " + vertical + " för " + base,
      base + ": se värdet i " + vertical,
      base + ": snabba " + vertical + "-åtgärder",
    ],
    ribbon: () => ["Trend", "Redaktionens val", "Bäst värde", "Rekommenderad", "Teamets favorit"],
    btc: ({ base, dateStr, vertical }) =>
      base + " infaller " + dateStr +
      " och triggar ofta tidig research när man planerar köp, abonnemang och hemaktiviteter. " +
      "För " + vertical + " söker användare pålitliga jämförelser, tydliga fördelar och enkla steg till avslut. " +
      "Gör tider, leverans och retur tydliga och håll knappar synliga i mobil. " +
      "Använd skannbara block, färska omdömen och en hjälpsam FAQ. " +
      "Vid löpande tjänst: lyft provperiod, enkel uppsägning och snabbt stöd.",
  },

  el: {
    h1: ({ base, year, vertical }) => [
      base + " " + year + ": επιλογές και ιδέες στο " + vertical,
      vertical + " για " + base + " " + year,
      base + " " + year + ": οδηγός " + vertical,
      base + ": προετοιμασία " + year + " με " + vertical,
      base + " " + year + ": καλύτερες επιλογές στο " + vertical,
    ],
    dh1: ({ base, vertical }) => [
      "Κάνε το " + base + " πιο απλό με σωστό " + vertical + ".",
      "Γρήγορο πλάνο για " + base + " με " + vertical + ".",
      "Όλα για " + base + ": εργαλεία, συμβουλές και " + vertical + ".",
      base + ": σύγκρινε " + vertical + " και αποφάσισε γρήγορα.",
      "Σύντομη λίστα " + vertical + " για " + base + ".",
    ],
    h2: ({ base, vertical }) => [
      base + ": γιατί το " + vertical + " μετράει",
      base + ": χρονισμός και τακτικές στο " + vertical,
      "Χρήσεις " + vertical + " για το " + base,
      base + ": πραγματική αξία στο " + vertical,
      "Συχνές ερωτήσεις " + vertical + " για " + base,
    ],
    article: ({ base, year, vertical }) => [
      base + " " + year + ": επιλογές " + vertical + " που αποδίδουν",
      base + ": ο βασικός κατάλογος " + vertical,
      "Από την έρευνα στο checkout: " + vertical + " για " + base,
      base + ": πώς να δεις αξία στο " + vertical,
      base + ": γρήγορες κινήσεις στο " + vertical,
    ],
    ribbon: () => ["Δημοφιλές", "Επιλογή συντάκτη", "Καλύτερη αξία", "Πρόταση", "Αγαπημένο της ομάδας"],
    btc: ({ base, dateStr, vertical }) =>
      base + " είναι στις " + dateStr +
      " και συνήθως ενεργοποιεί έγκαιρη αναζήτηση για αγορές, συνδρομές και δραστηριότητες στο σπίτι. " +
      "Στο " + vertical + ", οι χρήστες ζητούν αξιόπιστες συγκρίσεις, σαφή οφέλη και απλά βήματα μέχρι την ολοκλήρωση. " +
      "Κάνε σαφείς προθεσμίες, παράδοση και επιστροφές και κράτα εμφανή κουμπιά σε κινητό. " +
      "Χρησιμοποίησε ενότητες που διαβάζονται εύκολα, πρόσφατες αξιολογήσεις και χρήσιμη FAQ. " +
      "Για συνεχή υπηρεσία, τόνισε δοκιμή, εύκολη ακύρωση και άμεση υποστήριξη.",
  },

  da: {
    h1: ({ base, year, vertical }) => [
      base + " " + year + ": valg og idéer i " + vertical,
      vertical + " til " + base + " " + year,
      base + " " + year + ": guide til " + vertical,
      base + ": forbered " + year + " med " + vertical,
      base + " " + year + ": bedre valg i " + vertical,
    ],
    dh1: ({ base, vertical }) => [
      "Gør " + base + " enklere med det rigtige " + vertical + ".",
      "Hurtig plan for " + base + " med " + vertical + ".",
      "Alt til " + base + ": værktøjer, tips og " + vertical + ".",
      base + ": sammenlign " + vertical + " og beslut hurtigt.",
      "Kortliste over " + vertical + " til " + base + ".",
    ],
    h2: ({ base, vertical }) => [
      base + ": derfor betyder " + vertical + " noget",
      base + ": timing og taktik i " + vertical,
      "Anvendelser af " + vertical + " ved " + base,
      base + ": reel værdi i " + vertical,
      vertical + " FAQ for " + base,
    ],
    article: ({ base, year, vertical }) => [
      base + " " + year + ": " + vertical + " der virker",
      base + ": den vigtige " + vertical + "-tjekliste",
      "Fra research til betaling: " + vertical + " for " + base,
      base + ": se værdien i " + vertical,
      base + ": hurtige " + vertical + "-tiltag",
    ],
    ribbon: () => ["Populært", "Redaktørens valg", "Bedste værdi", "Anbefalet", "Teamfavorit"],
    btc: ({ base, dateStr, vertical }) =>
      base + " er den " + dateStr +
      " og udløser ofte tidlig research, når folk planlægger køb, abonnementer og aktiviteter hjemme. " +
      "I " + vertical + " søger brugere troværdige sammenligninger, tydelige fordele og en enkel vej til afslutning. " +
      "Gør leveringsfrister og retur tydelige og hold knapper synlige på mobil. " +
      "Brug overskuelige sektioner, friske anmeldelser og en hjælpsom FAQ. " +
      "Ved løbende tjenester: fremhæv prøve, nem opsigelse og hurtig support.",
  },

  nl: {
    h1: ({ base, year, vertical }) => [
      base + " " + year + ": keuzes en ideeën in " + vertical,
      vertical + " voor " + base + " " + year,
      base + " " + year + ": gids " + vertical,
      base + ": bereid " + year + " voor met " + vertical,
      base + " " + year + ": betere keuzes in " + vertical,
    ],
    dh1: ({ base, vertical }) => [
      "Maak " + base + " eenvoudiger met de juiste " + vertical + ".",
      "Snel plan voor " + base + " met " + vertical + ".",
      "Alles voor " + base + ": tools, tips en " + vertical + ".",
      base + ": vergelijk " + vertical + " en beslis snel.",
      "Korte lijst " + vertical + " voor " + base + ".",
    ],
    h2: ({ base, vertical }) => [
      base + ": waarom " + vertical + " telt",
      base + ": timing en tactiek in " + vertical,
      "Use-cases " + vertical + " voor " + base,
      base + ": echte waarde in " + vertical,
      vertical + "-FAQ voor " + base,
    ],
    article: ({ base, year, vertical }) => [
      base + " " + year + ": " + vertical + " die werken",
      base + ": de essentiële " + vertical + "-checklist",
      "Van research tot betaling: " + vertical + " voor " + base,
      base + ": waarde zien in " + vertical,
      base + ": snelle " + vertical + "-acties",
    ],
    ribbon: () => ["Populair", "Keuze van de redactie", "Beste waarde", "Aanbevolen", "Teamfavoriet"],
    btc: ({ base, dateStr, vertical }) =>
      base + " valt op " + dateStr +
      " en start vaak vroegtijdige research wanneer men aankopen, abonnementen en activiteiten thuis plant. " +
      "In " + vertical + " zoeken gebruikers betrouwbare vergelijkingen, duidelijke voordelen en een eenvoudig pad naar afronding. " +
      "Maak termijnen, levering en retourneren expliciet en houd knoppen zichtbaar op mobiel. " +
      "Gebruik scanbare blokken, recente reviews en een nuttige FAQ. " +
      "Bij doorlopende diensten: benadruk proefperiode, eenvoud van opzeggen en snelle support.",
  },
};

/* ---------- Constants ---------- */
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const COUNTRIES = [
  { code: "",  label: "Select…" }, // single-select placeholder
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

// Full, explicit type to avoid TS implicit-any
const VERTICALS: string[] = [
  "Accounting Software","Anti-Virus","Anti-Virus AU","Anti-Virus BR","Anti-Virus FR",
  "Anti-Virus RU","Anti-Virus UK","Background Checks","Banking FR","Bingo","Braces",
  "Business Applications Hub","Business Insurance","Business Loans","Business VoIP",
  "Cappsool- Pet Food","Car Insurance","Car Loans","Car Selling","Car Selling UK",
  "Car Warranty","Casino CA","Casino MX","Casino RO","Casino SE","Casino UK","Casino US",
  "CCP","CCP/POS","Contact Lenses","Credit Cards","Credit Cards FR","CRM","Cyber Security Hub",
  "Data Analysis Software","Dating","Dating AU","Dating BE DUTCH","Dating BE FR","Dating CA",
  "Dating DE","Dating ES","Dating FR","Dating IT","Dating NL","Dating UK","Dating US",
  "Debt Consolidation","Debt Funnel","DNA","E-Commerce","ED","Editing Apps","Flower Delivery",
  "Gold and Silver","Hair Loss","Hearing Aid","Home LG Insurance","Home Security","Home Warranty",
  "Hosting","Hosting AU","HS","HW","ID Theft","IDT","In-App","Internet Providers","Investments",
  "Invoicing","Lab Grown Diamonds","Language Learning","Legal Services","Life Insurance",
  "Life Insurance (Fintech)","LLC","Marketing Tools Hub","MAS","Meal Delivery","Medical Alerts",
  "Mobile Plans","Money Transfer","Mortgage","Mortgage HE","Mortgage Loans","Mortgage Purchase",
  "Mortgage Refinance","Mortgage Reverse","Mortgages (Fintech)","Moving Companies","Online Banking",
  "Online Degrees","Online Therapy","Parental control","Password manager","Payroll","Personal Loans",
  "Personal Loans FR","Personal Loans Funnel","Pet food Delivery  (Cappsool unique)",
  "Pet Insurance","Pet Insurance (Fintech)","Pet Subscription Boxes (Cappsool unique)",
  "PGR (Pro Group Racing)","Poker","POS","Printing Services","Private Student Loans",
  "Project Management","Psychic Reading","Remote Access","Renters Insurance","Resume Builders",
  "Slots UK","Solar","Sport Betting AU","Sport Betting FR","Sport Betting IE","Sport Betting RO",
  "Sport Betting SE","Sport Betting UK","Sport BR","Sport CA","Student Loans (Fintech)",
  "Student Loans Refinance","Tax Relief","Tax Software","Tech Bootcamps","Teeth Whitening",
  "Telecom FR","Top Offers FR (PL FR Funnel) - Floa","Top10","Top10/Dating","Top10/Dating-ca",
  "Travel Insurance","TV Services","TV Streaming","Vitamins","VOIP","VPN","VPN DE","VPN FR",
  "VPN IT","VPN NL","VPN PT","VPN SP","Walk-in Tubs","Web Design","Web Hosting (SaaS)",
  "Website Builders","Website Builders (SaaS)","Weight Loss","Weight loss plans","WSB",
];

/* Language map – used to decide when to show Native (English) */
const LANG_BY_COUNTRY: Record<string, Lang> = {
  GB: "en", IE: "en", US: "en", CA: "en",
  FR: "fr", RO: "ro", SE: "sv", MX: "es", BR: "pt",
  GR: "el", DK: "da", NL: "nl",
};

/* Country names + demonyms for description sanitising */
const COUNTRY_WORDS = [
  "United Kingdom","Britain","British","England","English","Scotland","Scottish","Wales","Welsh",
  "Ireland","Irish",
  "Canada","Canadian",
  "United States","USA","U.S.","American","Americans",
  "France","French",
  "Romania","Romanian",
  "Sweden","Swedish",
  "Mexico","Mexican","Mexicans",
  "Brazil","Brazilian",
  "Greece","Greek",
  "Denmark","Danish","Danes",
  "Netherlands","Dutch","Holland","Hollanders"
];

/* ---------- Utilities ---------- */
const isDifferent = (a?: string, b?: string) =>
  !!a && !!b && a.trim().toLowerCase() !== b.trim().toLowerCase();

function normaliseName(name: string) {
  return (name || "")
    .toLowerCase()
    .replace(/[’'´`]/g, "'")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

const fmtDate = (iso: any) => {
  try {
    const s = typeof iso === "string" ? iso : (iso && typeof iso === "object" && "iso" in iso && (iso as any).iso) || "";
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s || "";
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return typeof iso === "string" ? iso : "";
  }
};

const toArray = <T,>(v: T | T[] | undefined): T[] => (Array.isArray(v) ? v : v ? [v] : []);

/** Remove country/demonym sentences; prefer generic copy */
function sanitiseDescription(raw?: string): string {
  if (!raw) return "";
  const parts = raw.split(/(?<=\.)\s+/); // sentences
  const bad = new RegExp(`\\b(${COUNTRY_WORDS.map(w => w.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")).join("|")})\\b`, "i");
  const kept = parts.filter((p) => !bad.test(p));
  const base = (kept.length ? kept.join(" ") : parts[0] || "").trim();
  return base.replace(/^ *(Most|Many)\s+[A-Za-z’'().-]+\s+/, "");
}

/** Heuristic (fallback) */
function guessVerticals(evName: string): string[] {
  const n = evName.toLowerCase();
  const add = (...xs: string[]) => xs.filter(Boolean);
  if (/black friday|cyber monday|boxing day|singles|prime day|el buen fin|soldes/.test(n))
    return add("E-Commerce","Website Builders","Web Hosting (SaaS)","VPN","TV Streaming","Credit Cards","POS","Marketing Tools Hub");
  if (/christmas|xmas/.test(n))
    return add("E-Commerce","Flower Delivery","Meal Delivery","Vitamins","TV Streaming","Credit Cards");
  if (/new year/.test(n))
    return add("E-Commerce","VPN","TV Streaming","Mobile Plans","Credit Cards");
  if (/valentine/.test(n))
    return add("Dating","Flower Delivery","Lab Grown Diamonds","Vitamins","Credit Cards");
  if (/mother/.test(n))
    return add("Flower Delivery","Online Therapy","Meal Delivery","Credit Cards");
  if (/father/.test(n))
    return add("Online Therapy","VPN","TV Streaming","Credit Cards");
  if (/halloween/.test(n))
    return add("VPN","TV Streaming","E-Commerce");
  if (/easter|good friday/.test(n))
    return add("E-Commerce","Meal Delivery");
  if (/independence|4th of july|bastille|national day/.test(n))
    return add("Travel Insurance","Credit Cards","TV Streaming");
  return ["E-Commerce"];
}

/* --------- BTC helper to target ~600 characters --------- */
function clampBTC(text: string, min = 550, max = 650): string {
  if (text.length > max) {
    const cut = text.lastIndexOf(".", max);
    return (cut > 0 ? text.slice(0, cut + 1) : text.slice(0, max)).trim();
  }
  if (text.length < min) {
    const fillers = [
      " Emphasise trustworthy comparisons, recent reviews and clear benefits.",
      " Keep CTAs visible on mobile and reduce form friction to speed completion.",
      " Use scannable sections, concise copy and fast pages to hold attention.",
      " Reinforce with social proof and transparent policies to lower perceived risk."
    ];
    let i = 0;
    while (text.length < min && i < fillers.length) {
      text += fillers[i++];
    }
  }
  return text;
}

/* --------- Creative BTC: event + light history + vertical pull --------- */

// Map verticals to broad families
const BTC_FAMILY = (v: string):
  "sportsbook"|"commerce"|"finance"|"media"|"gifting"|"travel" => {
  const s = (v || "").toLowerCase();
  if (s.includes("sport") || s.includes("pgr") || s.includes("poker")) return "sportsbook";
  if (s.includes("credit") || s.includes("loan") || s.includes("bank")) return "finance";
  if (s.includes("tv") || s.includes("stream") || s.includes("vpn")
      || s.includes("cyber") || s.includes("password") || s.includes("id theft")) return "media";
  if (s.includes("flower") || s.includes("dating") || s.includes("meal")
      || s.includes("diamond") || s.includes("therapy") || s.includes("vitamin")) return "gifting";
  if (s.includes("travel")) return "travel";
  return "commerce"; // e-com, builders, hosting, POS, marketing tools, etc.
};

// Lightweight history hint by event pattern (safe, non-promotional)
function historyHint(eventName: string): string {
  const n = (eventName || "").toLowerCase();
  if (/black friday|cyber monday|prime day|el buen fin|soldes/.test(n))
    return "born from the retail calendar and now a global online ritual";
  if (/christmas|xmas/.test(n))
    return "a centuries-old celebration that anchors the festive season";
  if (/new year/.test(n))
    return "marking the turning of the calendar and shared countdown traditions";
  if (/valentine/.test(n))
    return "popularised by 19th-century cards and modern gifting culture";
  if (/halloween/.test(n))
    return "with roots in Celtic Samhain and today’s costume culture";
  if (/easter|good friday/.test(n))
    return "a moveable feast tied to the lunar calendar";
  if (/mother/.test(n))
    return "a 20th-century tribute that established modern gifting rituals";
  if (/father/.test(n))
    return "a modern occasion that leans into practical gifting";
  if (/independence|national day|bastille|4th of july/.test(n))
    return "commemorating nationhood with gatherings, travel and at-home celebrations";
  if (/back[- ]?to[- ]?school/.test(n))
    return "a perennial reset before term starts";
  if (/olympic|world cup|euros|grand national|ascot|tour de france/.test(n))
    return "shaped by legacy fixtures and collective viewing";
  return "anchored in cultural habit and shared moments";
}

// Creative scenes per family (no “win/discount/sale/rates”)
const BTC_SCENES = {
  sportsbook: {
    mood: "Countdowns tighten, form guides get refreshed and living rooms turn into mini grandstands.",
    behaviour: "Bettors scan markets, compare prices and look for safer ways to stake without faff.",
    proof: "Show market depth, helpful stats and responsible play controls alongside clear terms.",
    cta: "Guide readers from odds to stake in a couple of crisp steps with guardrails visible."
  },
  commerce: {
    mood: "Wish-lists become baskets; late-night scrolls flip into decisions under time pressure.",
    behaviour: "Shoppers shortlist, compare and commit when friction is low and value is obvious.",
    proof: "Surface recent reviews, precise timelines and straightforward returns to remove doubt.",
    cta: "Move readers from shortlist to checkout with low-friction forms and sticky mobile CTAs."
  },
  finance: {
    mood: "Big purchases line up; people weigh rewards, eligibility and flexible repayments.",
    behaviour: "Users compare cards and lending options to make larger buys feel manageable.",
    proof: "Lead with APR clarity, eligibility guidance and fees explained in plain English.",
    cta: "Take users from comparison to application with simple, staged steps and instant checks."
  },
  media: {
    mood: "Sofas become cinemas; households want seamless set-ups and something for everyone.",
    behaviour: "People judge catalogues, device support and privacy before starting a trial.",
    proof: "Highlight content breadth, compatibility and easy cancellation with no small-print traps.",
    cta: "Carry readers from browse to play with one-tap starts and transparent renewal terms."
  },
  gifting: {
    mood: "Lists are made, delivery windows matter and reassurance beats impulse choices.",
    behaviour: "Givers want dependable timing, clear quality signals and stress-free returns.",
    proof: "Show stock status, cut-offs and authenticity or care standards up front.",
    cta: "Move readers from idea to order with precise ETAs and concise, confidence-building copy."
  },
  travel: {
    mood: "Bags get packed; people double-check cover and avoid policy grey areas.",
    behaviour: "Travellers seek clear tiers and what’s included if plans change.",
    proof: "Make limits, claim speed and medical cover obvious without jargon.",
    cta: "Lead users from quote to cover with plain choices and no-surprise next steps."
  }
} as const;

function creativeBTC(event: string, dateStr: string, vertical: string): string {
  const fam = BTC_FAMILY(vertical);
  const S = BTC_SCENES[fam];

  let txt =
    `${event} falls on ${dateStr} — ${historyHint(event)}. ` +
    `${S.mood} ` +
    `${S.behaviour} ` +
    `In ${vertical}, earn the click with story first, detail second: ` +
    `${S.proof} ` +
    `${S.cta} ` +
    `Keep sections scannable, reduce mobile friction and let trust signals do the heavy lifting so intent becomes confident action.`;

  return clampBTC(txt, 550, 650);
}

/* --------- Creative BTC for ALL languages (localised) --------- */
/* Uses: clampBTC (already defined), BTC_FAMILY (already defined) */

type BtcFamily = ReturnType<typeof BTC_FAMILY>;
type BtcScene = { mood: string; behaviour: string; proof: string; cta: string };

// History hints per language (short, safe cultural notes)
const BTC_HISTORY_L10N: Record<Lang, (eventName: string) => string> = {
  en: (n) => {
    n = n.toLowerCase();
    if (/black friday|cyber monday|prime day|el buen fin|soldes/.test(n)) return "born from the retail calendar and now a global online ritual";
    if (/christmas|xmas/.test(n)) return "a centuries-old celebration that anchors the festive season";
    if (/new year/.test(n)) return "marking the turning of the calendar and shared countdown traditions";
    if (/valentine/.test(n)) return "popularised by 19th-century cards and modern gifting culture";
    if (/halloween/.test(n)) return "with roots in Celtic Samhain and today’s costume culture";
    if (/easter|good friday/.test(n)) return "a moveable feast tied to the lunar calendar";
    if (/mother/.test(n)) return "a 20th-century tribute that established modern gifting rituals";
    if (/father/.test(n)) return "a modern occasion that leans into practical gifting";
    if (/independence|national day|bastille|4th of july/.test(n)) return "commemorating nationhood with gatherings, travel and at-home celebrations";
    if (/back[- ]?to[- ]?school/.test(n)) return "a perennial reset before term starts";
    if (/olympic|world cup|euros|grand national|ascot|tour de france/.test(n)) return "shaped by legacy fixtures and collective viewing";
    return "anchored in cultural habit and shared moments";
  },
  fr: (n) => {
    n = n.toLowerCase();
    if (/black friday|cyber monday|prime day|el buen fin|soldes/.test(n)) return "né du calendrier du commerce et devenu un rituel en ligne mondial";
    if (/christmas|xmas|noël/.test(n)) return "une fête séculaire qui marque le cœur de la saison";
    if (/new year|nouvel an|réveillon/.test(n)) return "le passage symbolique au nouveau calendrier et ses comptes à rebours";
    if (/valentine|saint[- ]?valentin/.test(n)) return "popularisée par les cartes du XIXe siècle et la culture des cadeaux";
    if (/halloween/.test(n)) return "aux racines celtiques (Samhain) et à la culture des costumes";
    if (/easter|pâques|vendredi saint/.test(n)) return "une fête mobile liée au calendrier lunaire";
    if (/mother|mères/.test(n)) return "un hommage moderne qui a installé des rituels de cadeaux";
    if (/father|pères/.test(n)) return "une occasion contemporaine tournée vers les cadeaux pratiques";
    if (/independence|national day|bastille|14 juillet/.test(n)) return "célébrant la nation avec rassemblements et voyages";
    if (/rentrée|back[- ]?to[- ]?school/.test(n)) return "une remise à niveau annuelle avant la reprise";
    if (/olympic|world cup|euros|tour de france/.test(n)) return "rythmée par des rendez-vous historiques et un public réuni";
    return "ancrée dans les habitudes culturelles et les moments partagés";
  },
  es: (n) => {
    n = n.toLowerCase();
    if (/black friday|cyber monday|prime day|el buen fin|rebajas|soldes/.test(n)) return "nacido del calendario minorista y hoy un ritual digital global";
    if (/christmas|navidad|xmas/.test(n)) return "una celebración centenaria que define la temporada festiva";
    if (/new year|año nuevo|nochevieja/.test(n)) return "el cambio de calendario y las tradiciones de cuenta atrás";
    if (/valentine|san valentín/.test(n)) return "popularizado por tarjetas del XIX y la cultura del regalo";
    if (/halloween/.test(n)) return "con raíces en Samhain y la cultura del disfraz";
    if (/easter|pascua|viernes santo/.test(n)) return "fiesta móvil ligada al calendario lunar";
    if (/mother|madre/.test(n)) return "homenaje moderno que fijó rituales de obsequios";
    if (/father|padre/.test(n)) return "ocasión actual con regalos prácticos";
    if (/independence|nacional|bastilla|4th of july/.test(n)) return "conmemorando la nación con reuniones y viajes";
    if (/vuelta al cole|back[- ]?to[- ]?school/.test(n)) return "reinicio anual antes del curso";
    if (/olympic|world cup|euros|la vuelta|tour de france/.test(n)) return "marcado por citas históricas y visión colectiva";
    return "anclado en hábitos culturales y momentos compartidos";
  },
  pt: (n) => {
    n = n.toLowerCase();
    if (/black friday|cyber monday|prime day|el buen fin|soldes|promoções/.test(n)) return "nascido do calendário do retalho e hoje um ritual digital global";
    if (/christmas|natal|xmas/.test(n)) return "uma celebração centenária que marca a época festiva";
    if (/new year|ano novo|réveillon/.test(n)) return "a virada do calendário e as contagens regressivas";
    if (/valentine|são valentim|dia dos namorados/.test(n)) return "popularizado por cartões do séc. XIX e a cultura da oferta";
    if (/halloween/.test(n)) return "com raízes no Samhain e na cultura das fantasias";
    if (/easter|páscoa|sexta[- ]?feira santa/.test(n)) return "uma festa móvel ligada ao calendário lunar";
    if (/mother|mãe/.test(n)) return "uma homenagem moderna que criou rituais de presentes";
    if (/father|pai/.test(n)) return "uma ocasião atual com ofertas práticas";
    if (/independence|nacional|bastille|7 de setembro|4th of july/.test(n)) return "comemorando a nação com encontros e viagens";
    if (/volta às aulas|back[- ]?to[- ]?school/.test(n)) return "um recomeço anual antes do período letivo";
    if (/olympic|world cup|euros|tour de france/.test(n)) return "guiado por eventos históricos e audiência coletiva";
    return "ancorado em hábitos culturais e momentos partilhados";
  },
  ro: (n) => {
    n = n.toLowerCase();
    if (/black friday|cyber monday|prime day|soldes|el buen fin/.test(n)) return "născut din calendarul retail și devenit un ritual online global";
    if (/christmas|crăciun|xmas/.test(n)) return "o sărbătoare veche ce centrează sezonul festiv";
    if (/new year|anul nou|reveillon|ajunul anului/.test(n)) return "schimbarea calendarului și tradițiile de numărătoare";
    if (/valentine|îndrăgostiților|dragobete/.test(n)) return "popularizată de felicitări din secolul XIX și cultura cadourilor";
    if (/halloween/.test(n)) return "cu rădăcini în Samhain și cultura costumelor";
    if (/easter|paște|paşti|vinerea mare/.test(n)) return "o sărbătoare mobilă legată de calendarul lunar";
    if (/mother|mamei/.test(n)) return "un omagiu modern care a fixat ritualurile de daruri";
    if (/father|tatălui/.test(n)) return "o ocazie actuală cu daruri practice";
    if (/independence|național|bastille|4th of july/.test(n)) return "marcând națiunea prin reuniuni și călătorii";
    if (/back[- ]?to[- ]?school|înapoi la școală|începutul școlii/.test(n)) return "un restart anual înainte de semestru";
    if (/olympic|world cup|euros|tour de france/.test(n)) return "modelată de competiții istorice și vizionare colectivă";
    return "ancorată în obiceiuri și momente împărtășite";
  },
  sv: (n) => {
    n = n.toLowerCase();
    if (/black friday|cyber monday|prime day|soldes|el buen fin/.test(n)) return "född ur detaljhandelns kalender och nu ett globalt online-ritual";
    if (/christmas|jul|xmas/.test(n)) return "en månghundraårig högtid som präglar vintersäsongen";
    if (/new year|nyår|nyårsafton/.test(n)) return "skiftet i kalendern och de gemensamma nedräkningarna";
    if (/valentine|alla hjärtans dag/.test(n)) return "populariserad av 1800-talets kort och gåvokultur";
    if (/halloween/.test(n)) return "med rötter i Samhain och dagens maskeradkultur";
    if (/easter|påsk|långfredag/.test(n)) return "en rörlig högtid kopplad till månkalendern";
    if (/mother|mors dag/.test(n)) return "en modern hyllning som skapade gåvans ritual";
    if (/father|fars dag/.test(n)) return "en samtida högtid med praktiska gåvor";
    if (/independence|nationaldag|bastille|4th of july/.test(n)) return "nationens dag firad med sammankomster och resor";
    if (/skolstart|back[- ]?to[- ]?school/.test(n)) return "en årlig omstart före terminen";
    if (/olympic|world cup|euros|tour de france/.test(n)) return "formad av klassiska idrottsögonblick och gemensam tittning";
    return "förankrad i vanor och delade stunder";
  },
  el: (n) => {
    n = n.toLowerCase();
    if (/black friday|cyber monday|prime day|soldes|el buen fin/.test(n)) return "γεννημένο από το ημερολόγιο του λιανεμπορίου και πλέον παγκόσμιο ψηφιακό έθιμο";
    if (/christmas|xmas|χριστούγεννα/.test(n)) return "μια παράδοση αιώνων που ορίζει την εορταστική περίοδο";
    if (/new year|πρωτοχρονιά|παραμονή/.test(n)) return "η αλλαγή του χρόνου και οι κοινές αντίστροφες μετρήσεις";
    if (/valentine|αγίου βαλεντίνου/.test(n)) return "δημοφιλής από τον 19ο αιώνα με κάρτες και κουλτούρα δώρων";
    if (/halloween/.test(n)) return "με ρίζες στο Samhain και τη σημερινή κουλτούρα μεταμφίεσης";
    if (/easter|πάσχα|μεγάλη παρασκευή/.test(n)) return "κινητή γιορτή δεμένη με το σεληνιακό ημερολόγιο";
    if (/mother|μητέρας/.test(n)) return "σύγχρονος φόρος τιμής που καθιέρωσε τα δώρα";
    if (/father|πατέρα/.test(n)) return "σύγχρονη περίσταση με πρακτικά δώρα";
    if (/independence|εθνική|bastille|4th of july/.test(n)) return "τιμώντας το έθνος με συναθροίσεις και ταξίδια";
    if (/back[- ]?to[- ]?school|σχολείο/.test(n)) return "ετήσια επανεκκίνηση πριν το άνοιγμα των σχολείων";
    if (/olympic|world cup|euros|tour de france/.test(n)) return "σμιλεμένη από ιστορικά γεγονότα και συλλογική θέαση";
    return "ριζωμένη στη συνήθεια και σε κοινές στιγμές";
  },
  da: (n) => {
    n = n.toLowerCase();
    if (/black friday|cyber monday|prime day|soldes|el buen fin/.test(n)) return "født af detailkalenderen og nu et globalt online-ritual";
    if (/christmas|jul|xmas/.test(n)) return "en århundredgammel højtid der præger sæsonen";
    if (/new year|nytår|nytårsaften/.test(n)) return "kalenderskiftet og de fælles nedtællinger";
    if (/valentine|valentins/.test(n)) return "populariseret af 1800-tallets kort og gavekultur";
    if (/halloween/.test(n)) return "med rødder i Samhain og nutidens udklædningskultur";
    if (/easter|påske|langfredag/.test(n)) return "en flytbar højtid knyttet til månekalenderen";
    if (/mother|mors dag/.test(n)) return "en moderne hyldest der skabte gave-ritualet";
    if (/father|fars dag/.test(n)) return "en nutidig anledning med praktiske gaver";
    if (/independence|nationaldag|bastille|4th of july/.test(n)) return "fejring af nationen med samvær og rejser";
    if (/skolestart|back[- ]?to[- ]?school/.test(n)) return "et årligt reset før skolernes start";
    if (/olympic|world cup|euros|tour de france/.test(n)) return "formet af klassiske begivenheder og fælles visning";
    return "forankret i vaner og fælles øjeblikke";
  },
  nl: (n) => {
    n = n.toLowerCase();
    if (/black friday|cyber monday|prime day|soldes|el buen fin/.test(n)) return "ontstaan uit de retailkalender en nu een wereldwijd online ritueel";
    if (/christmas|kerst|xmas/.test(n)) return "een eeuwenoude viering die het feestseizoen bepaalt";
    if (/new year|nieuwjaar|oudejaarsavond/.test(n)) return "de wisseling van het jaar met gezamenlijke afcounten";
    if (/valentine|valentijn/.test(n)) return "gepopulariseerd door 19e-eeuwse kaarten en de geefcultuur";
    if (/halloween/.test(n)) return "met wortels in Samhain en de verkleedcultuur";
    if (/easter|pasen|goede vrijdag/.test(n)) return "een verschuifbaar feest gekoppeld aan de maankalender";
    if (/mother|moederdag/.test(n)) return "een moderne hommage die geefrituelen vestigde";
    if (/father|vaderdag/.test(n)) return "een eigentijdse gelegenheid met praktische cadeaus";
    if (/independence|nationale|bastille|4th of july/.test(n)) return "de natie vieren met bijeenkomsten en reizen";
    if (/back[- ]?to[- ]?school|schoolstart/.test(n)) return "een jaarlijkse reset voor de schooltijd";
    if (/olympic|world cup|euros|tour de france/.test(n)) return "gevormd door historische evenementen en gezamenlijk kijken";
    return "verankerd in gewoonten en gedeelde momenten";
  },
};

// Scene lines per language & family (kept concise but creative)
const BTC_SCENES_L10N: Record<Lang, Record<BtcFamily, BtcScene>> = {
  en: {
    sportsbook: { mood: "Countdowns tighten, form guides get refreshed and living rooms turn into mini grandstands.",
      behaviour: "Bettors scan markets, compare prices and look for safer ways to stake without faff.",
      proof: "Show market depth, helpful stats and responsible play controls alongside clear terms.",
      cta: "Guide readers from odds to stake in a couple of crisp steps with guardrails visible." },
    commerce: { mood: "Wish-lists become baskets; late-night scrolls flip into decisions under time pressure.",
      behaviour: "Shoppers shortlist, compare and commit when friction is low and value is obvious.",
      proof: "Surface recent reviews, precise timelines and straightforward returns to remove doubt.",
      cta: "Move readers from shortlist to checkout with low-friction forms and sticky mobile CTAs." },
    finance: { mood: "Big purchases line up; people weigh rewards, eligibility and flexible repayments.",
      behaviour: "Users compare cards and lending options to make larger buys feel manageable.",
      proof: "Lead with APR clarity, eligibility guidance and fees explained in plain English.",
      cta: "Take users from comparison to application with staged steps and instant checks." },
    media: { mood: "Sofas become cinemas; households want seamless set-ups and something for everyone.",
      behaviour: "People judge catalogues, device support and privacy before starting a trial.",
      proof: "Highlight content breadth, compatibility and easy cancellation with no traps.",
      cta: "Carry readers from browse to play with one-tap starts and transparent renewal terms." },
    gifting: { mood: "Lists are made, delivery windows matter and reassurance beats impulse choices.",
      behaviour: "Givers want dependable timing, clear quality signals and stress-free returns.",
      proof: "Show stock status, cut-offs and authenticity or care standards up front.",
      cta: "Move readers from idea to order with precise ETAs and confidence-building copy." },
    travel: { mood: "Bags get packed; people double-check cover and avoid policy grey areas.",
      behaviour: "Travellers seek clear tiers and what’s included if plans change.",
      proof: "Make limits, claim speed and medical cover obvious without jargon.",
      cta: "Lead users from quote to cover with plain choices and no-surprise next steps." },
  },
  fr: {
    sportsbook: { mood:"Les comptes à rebours s’accélèrent et les salons deviennent des mini-tribunes.",
      behaviour:"Parieurs et fans comparent les marchés et cherchent un parcours sûr, sans frictions.",
      proof:"Affichez profondeur des marchés, stats utiles et outils de jeu responsable avec conditions claires.",
      cta:"Faites passer de la cote à la mise en quelques étapes nettes, garde-fous visibles." },
    commerce: { mood:"Les listes de souhaits deviennent des paniers ; les décisions se prennent sous pression de temps.",
      behaviour:"On shortlist, on compare, on valide quand la valeur est évidente et la friction faible.",
      proof:"Mettez en avant avis récents, délais précis et retours simples pour lever les doutes.",
      cta:"Du shortlist au paiement avec formulaires légers et CTA mobiles persistants." },
    finance: { mood:"Les gros achats s’alignent ; on pèse avantages, éligibilité et mensualités.",
      behaviour:"Les utilisateurs comparent cartes et prêts pour rendre l’achat gérable.",
      proof:"Conduisez avec clarté TAEG, critères d’éligibilité et frais expliqués simplement.",
      cta:"De la comparaison à la demande en étapes guidées avec vérifications instantanées." },
    media: { mood:"Les canapés deviennent cinémas ; on veut une mise en route fluide et un catalogue pour tous.",
      behaviour:"On juge contenus, appareils pris en charge et confidentialité avant l’essai.",
      proof:"Soulignez l’ampleur du catalogue, la compatibilité et la facilité de résiliation.",
      cta:"De la navigation à la lecture en un geste, conditions de renouvellement transparentes." },
    gifting: { mood:"Les listes se posent, les délais comptent et la réassurance prime sur l’impulsif.",
      behaviour:"On veut un timing fiable, des preuves de qualité et des retours sans stress.",
      proof:"Affichez stock, dates limites et garanties d’authenticité ou de soin.",
      cta:"De l’idée à la commande avec ETA précis et texte qui inspire confiance." },
    travel: { mood:"Les valises se bouclent ; on vérifie la couverture et on évite les zones grises.",
      behaviour:"On cherche des paliers clairs et ce qui est inclus si le plan change.",
      proof:"Rendez visibles plafonds, vitesse d’indemnisation et couverture médicale.",
      cta:"Du devis à la police avec choix simples et étapes sans surprise." },
  },
  es: {
    sportsbook:{ mood:"Las cuentas atrás aprietan y el salón se convierte en mini graderío.",
      behaviour:"Los apostadores comparan mercados y buscan un camino seguro y sencillo.",
      proof:"Muestra profundidad de mercados, estadísticas útiles y juego responsable con condiciones claras.",
      cta:"Guía del momio a la apuesta en pocos pasos con salvaguardas visibles." },
    commerce:{ mood:"Las listas pasan a carritos; las decisiones llegan con el reloj corriendo.",
      behaviour:"Se compara y se compra cuando la fricción es baja y el valor es claro.",
      proof:"Destaca reseñas recientes, plazos exactos y devoluciones simples para eliminar dudas.",
      cta:"Del shortlist al checkout con formularios ligeros y CTAs fijos en móvil." },
    finance:{ mood:"Se alinean compras grandes; se valoran recompensas, elegibilidad y cuotas.",
      behaviour:"Se comparan tarjetas y préstamos para hacer manejable el desembolso.",
      proof:"Lidera con claridad de TAE, criterios y comisiones explicadas sin jerga.",
      cta:"De la comparación a la solicitud con pasos guiados y verificaciones al instante." },
    media:{ mood:"El sofá se vuelve cine; se quiere puesta en marcha fácil y catálogo para todos.",
      behaviour:"Se evalúan contenidos, dispositivos y privacidad antes de la prueba.",
      proof:"Resalta amplitud, compatibilidad y cancelación sencilla sin trucos.",
      cta:"De navegar a reproducir con inicio en un toque y renovación transparente." },
    gifting:{ mood:"Listas hechas, los plazos mandan y la confianza vence al impulso.",
      behaviour:"Se busca puntualidad fiable, señales de calidad y devoluciones sin estrés.",
      proof:"Muestra stock, fechas límite y estándares de autenticidad o cuidado.",
      cta:"De la idea al pedido con ETAs precisas y texto que inspira confianza." },
    travel:{ mood:"Maletas listas; se revisa la cobertura y se evitan zonas grises.",
      behaviour:"Viajeros quieren niveles claros y saber qué incluye si se cambia el plan.",
      proof:"Haz visibles límites, rapidez de siniestros y cobertura médica.",
      cta:"Del presupuesto a la póliza con opciones claras y sin sorpresas." },
  },
  pt: {
    sportsbook:{ mood:"As contagens apertam e a sala vira arquibancada.",
      behaviour:"Apostadores comparam mercados e procuram um caminho seguro e simples.",
      proof:"Mostre profundidade, estatísticas úteis e jogo responsável com termos claros.",
      cta:"Leve do odd à aposta em poucos passos, com salvaguardas visíveis." },
    commerce:{ mood:"Wishlists viram carrinhos; decisões acontecem sob pressão do tempo.",
      behaviour:"Compra-se quando há pouco atrito e valor evidente.",
      proof:"Realce avaliações recentes, prazos exatos e devoluções simples para tirar dúvidas.",
      cta:"Do shortlist ao checkout com formulários leves e CTAs fixos no móvel." },
    finance:{ mood:"Compras grandes à vista; pesam-se benefícios, elegibilidade e parcelas.",
      behaviour:"Comparam-se cartões e crédito para tornar viável o gasto.",
      proof:"Lidere com TAE claro, critérios e taxas explicadas sem jargão.",
      cta:"Da comparação à proposta com etapas guiadas e verificações instantâneas." },
    media:{ mood:"O sofá vira cinema; todos querem início rápido e catálogo para a casa inteira.",
      behaviour:"Avaliam-se conteúdos, dispositivos e privacidade antes do teste.",
      proof:"Destaque amplitude, compatibilidade e cancelamento fácil sem armadilhas.",
      cta:"Do navegar ao play com um toque e renovação transparente." },
    gifting:{ mood:"Listas feitas, prazos contam, e a confiança vence o impulso.",
      behaviour:"Procura-se pontualidade, provas de qualidade e devoluções sem stress.",
      proof:"Mostre stock, prazos-limite e padrões de autenticidade ou cuidado.",
      cta:"Da ideia ao pedido com ETAs precisos e texto que gera confiança." },
    travel:{ mood:"Mala pronta; revê-se a cobertura e evitam-se zonas cinzentas.",
      behaviour:"Viajantes querem níveis claros e saber o que está incluído.",
      proof:"Torne visíveis limites, rapidez de sinistros e cobertura médica.",
      cta:"Do orçamento à apólice com escolhas simples e sem surpresas." },
  },
  ro: {
    sportsbook:{ mood:"Numărătoarea se strânge, iar livingul devine mică tribună.",
      behaviour:"Pariorii compară piețe și caută un traseu sigur, fără bătăi de cap.",
      proof:"Arătați profunzimea piețelor, statistici utile și joc responsabil cu termeni clari.",
      cta:"Conduceți de la cote la miză în câțiva pași vizibili și simpli." },
    commerce:{ mood:"Listele de dorințe devin coșuri; deciziile se iau cu timpul pe fugă.",
      behaviour:"Se compară și se cumpără când fricțiunea e mică și valoarea evidentă.",
      proof:"Scoateți în față recenzii recente, termene precise și retururi simple.",
      cta:"Din shortlist la checkout cu formulare ușoare și CTA fix pe mobil." },
    finance:{ mood:"Apar achiziții mari; se cântăresc beneficii, eligibilitate și rate flexibile.",
      behaviour:"Se compară carduri și împrumuturi pentru a face cumpărăturile gestionabile.",
      proof:"Conduceți cu DAE clară, criterii și comisioane explicate pe înțeles.",
      cta:"Din comparație în aplicație cu pași ghidați și verificări instant." },
    media:{ mood:"Canapeaua devine cinema; toți vor pornire lină și conținut pentru fiecare.",
      behaviour:"Se evaluează catalogul, dispozitivele și confidențialitatea înainte de trial.",
      proof:"Evidențiați varietatea, compatibilitatea și anularea ușoară, fără capcane.",
      cta:"De la navigare la play dintr-un tap, cu reînnoire transparentă." },
    gifting:{ mood:"Listele se fac, termenele contează, iar siguranța bate impulsul.",
      behaviour:"Se caută punctualitate, semnale de calitate și retur fără stres.",
      proof:"Arătați stoc, limită de expediere și standarde de autenticitate.",
      cta:"De la idee la comandă cu ETA precis și text care inspiră încredere." },
    travel:{ mood:"Bagajele se fac; se verifică acoperirea și se evită zonele gri.",
      behaviour:"Călătorii vor planuri clare și ce e inclus la schimbări.",
      proof:"Faceți vizibile plafoane, viteza despăgubirilor și acoperirea medicală.",
      cta:"Din ofertă în poliță cu opțiuni simple și pași fără surprize." },
  },
  sv: {
    sportsbook:{ mood:"Nedräkningen skruvas upp och vardagsrummet blir läktare.",
      behaviour:"Spelare jämför marknader och söker en trygg, friktionsfri väg.",
      proof:"Visa marknadsdjup, hjälpsam statistik och spelansvar med tydliga villkor.",
      cta:"Från odds till insats i några tydliga steg med synliga skydd." },
    commerce:{ mood:"Önskelistor blir varukorgar; beslut tas under tidspress.",
      behaviour:"Man jämför och köper när värdet är tydligt och friktionen låg.",
      proof:"Lyft fram färska omdömen, exakta leveranstider och enkla returer.",
      cta:"Från shortlist till checkout med lätta formulär och fasta mobila CTA." },
    finance:{ mood:"Större köp planeras; man väger förmåner, kvalificering och avbetalning.",
      behaviour:"Kort och lån jämförs för att göra köpet hanterbart.",
      proof:"Led med tydlig effektiv ränta, kriterier och avgifter utan jargong.",
      cta:"Från jämförelse till ansökan via guidande steg och snabba kontroller." },
    media:{ mood:"Soffan blir bio; hushåll vill ha smidig start och något för alla.",
      behaviour:"Man bedömer utbud, enheter och integritet före testperiod.",
      proof:"Visa bredd, kompatibilitet och enkel uppsägning utan fällor.",
      cta:"Från bläddra till spela med ett tryck och transparent förnyelse." },
    gifting:{ mood:"Listor skrivs, leveransfönster räknas och trygghet slår impuls.",
      behaviour:"Givare söker pålitlig tid, tydliga kvalitetsbevis och enkla returer.",
      proof:"Visa lagerstatus, sista beställning och standarder för äkthet/omsorg.",
      cta:"Från idé till order med precisa ETA och förtroendeskapande text." },
    travel:{ mood:"Väskor packas; man dubbelkollar skydd och undviker gråzoner.",
      behaviour:"Resenärer vill ha tydliga nivåer och vad som ingår vid ändringar.",
      proof:"Gör gränser, skadereglering och vårdskydd tydliga.",
      cta:"Från offert till skydd med enkla val och steg utan överraskningar." },
  },
  el: {
    sportsbook:{ mood:"Η αντίστροφη μετρά και το σαλόνι γίνεται μικρή κερκίδα.",
      behaviour:"Οι παίκτες συγκρίνουν αγορές και ζητούν ασφαλή, απλό δρόμο.",
      proof:"Δείξτε βάθος αγορών, χρήσιμα στατιστικά και υπεύθυνο παιχνίδι με καθαρούς όρους.",
      cta:"Από τις αποδόσεις στο ποντάρισμα σε λίγα καθαρά βήματα με ορατές δικλίδες." },
    commerce:{ mood:"Οι wish-lists γίνονται καλάθια· οι αποφάσεις παίρνονται με την ώρα να τρέχει.",
      behaviour:"Οι αγοραστές δεσμεύονται όταν η αξία είναι σαφής και η τριβή χαμηλή.",
      proof:"Προβάλετε πρόσφατες κριτικές, ακριβή χρονοδιαγράμματα και απλές επιστροφές.",
      cta:"Από shortlist σε checkout με ελαφριές φόρμες και σταθερά CTA στο κινητό." },
    finance:{ mood:"Μεγάλες αγορές μπαίνουν στο πλάνο· ζυγίζονται προνόμια και δόσεις.",
      behaviour:"Συγκρίνονται κάρτες και δάνεια ώστε το κόστος να είναι διαχειρίσιμο.",
      proof:"Ξεκινήστε με καθαρό επιτόκιο, κριτήρια και χρεώσεις χωρίς ορολογία.",
      cta:"Από σύγκριση σε αίτηση με καθοδηγούμενα βήματα και άμεσους ελέγχους." },
    media:{ mood:"Ο καναπές γίνεται σινεμά· ζητείται εύκολη εκκίνηση και περιεχόμενο για όλους.",
      behaviour:"Αξιολογούνται κατάλογος, συσκευές και ιδιωτικότητα πριν το trial.",
      proof:"Τονίστε εύρος, συμβατότητα και εύκολη ακύρωση χωρίς παγίδες.",
      cta:"Από περιήγηση σε play με ένα tap και διαφανή ανανέωση." },
    gifting:{ mood:"Οι λίστες κλείνουν, τα χρονικά περιθώρια μετράνε και η σιγουριά κερδίζει το impulsive.",
      behaviour:"Χρειάζεται έγκαιρη παράδοση, σαφή ποιότητα και άνετες επιστροφές.",
      proof:"Δείξτε διαθεσιμότητα, cut-offs και πιστοποίηση/φροντίδα από την αρχή.",
      cta:"Από ιδέα σε παραγγελία με ακριβή ETA και κείμενο που εμπνέει εμπιστοσύνη." },
    travel:{ mood:"Οι βαλίτσες ετοιμάζονται· ελέγχουμε κάλυψη και γκρίζες ζώνες.",
      behaviour:"Οι ταξιδιώτες θέλουν καθαρά επίπεδα και τι περιλαμβάνεται σε αλλαγές.",
      proof:"Κάντε σαφή τα όρια, την ταχύτητα αποζημιώσεων και την ιατρική κάλυψη.",
      cta:"Από προσφορά σε κάλυψη με απλές επιλογές και χωρίς εκπλήξεις." },
  },
  da: {
    sportsbook:{ mood:"Nedtællingen skærpes, og stuen bliver til mini-tribune.",
      behaviour:"Spillere sammenligner markeder og søger en sikker, enkel vej.",
      proof:"Vis markedsdybde, nyttig statistik og ansvarligt spil med klare vilkår.",
      cta:"Fra odds til indsats i få tydelige trin med synlige værn." },
    commerce:{ mood:"Ønskelister bliver kurve; beslutninger tages under tidspres.",
      behaviour:"Man køber, når værdien er tydelig og friktionen lav.",
      proof:"Fremhæv friske anmeldelser, præcise leveringer og enkle returneringer.",
      cta:"Fra shortlist til checkout med lette formularer og faste mobile CTA." },
    finance:{ mood:"Store køb planlægges; fordele, egnethed og afdrag vejes.",
      behaviour:"Kort og lån sammenlignes for at gøre købet håndterbart.",
      proof:"Led med klar ÅOP, kriterier og gebyrer uden fagsprog.",
      cta:"Fra sammenligning til ansøgning via guidede trin og hurtige checks." },
    media:{ mood:"Sofaen bliver biograf; husholdninger vil have nem opsætning og indhold til alle.",
      behaviour:"Katalog, enheder og privatliv vurderes før prøveperioden.",
      proof:"Fremhæv bredde, kompatibilitet og nem opsigelse uden fælder.",
      cta:"Fra browse til play med ét tryk og gennemsigtig fornyelse." },
    gifting:{ mood:"Listerne er klar, deadlines tæller, og tryghed slår impuls.",
      behaviour:"Man ønsker punktlig levering, klare kvalitetstegn og stressfri retur.",
      proof:"Vis lager, sidste bestilling og standarder for ægthed/pleje.",
      cta:"Fra idé til ordre med præcise ETA og tillidsskabende tekst." },
    travel:{ mood:"Tasker pakkes; dækning dobbelttjekkes og gråzoner undgås.",
      behaviour:"Rejsende vil have klare niveauer og hvad der er inkluderet ved ændringer.",
      proof:"Gør grænser, sagsbehandling og medicinsk dækning tydelig.",
      cta:"Fra tilbud til police med enkle valg og uden overraskelser." },
  },
  nl: {
    sportsbook:{ mood:"De countdown loopt; de woonkamer wordt een mini-tribune.",
      behaviour:"Spelers vergelijken markten en zoeken een veilige, eenvoudige route.",
      proof:"Toon marktdiepte, nuttige stats en verantwoord spelen met duidelijke voorwaarden.",
      cta:"Van odds naar inzet in een paar heldere stappen met zichtbare waarborgen." },
    commerce:{ mood:"Verlanglijstjes worden winkelwagens; beslissingen vallen onder tijdsdruk.",
      behaviour:"Men koopt wanneer de frictie laag is en de waarde duidelijk.",
      proof:"Zet recente reviews, exacte levertijden en eenvoudige retouren voorop.",
      cta:"Van shortlist naar checkout met lichte formulieren en vaste mobiele CTA." },
    finance:{ mood:"Grote aankopen dienen zich aan; voordelen, geschiktheid en termijnen worden afgewogen.",
      behaviour:"Kaarten en leningen worden vergeleken om de uitgave beheersbaar te maken.",
      proof:"Leid met duidelijke JK, criteria en kosten zonder jargon.",
      cta:"Van vergelijking naar aanvraag via geleide stappen en directe checks." },
    media:{ mood:"De bank wordt bios; iedereen wil een soepele start en aanbod voor het hele huis.",
      behaviour:"Men beoordeelt catalogus, apparaten en privacy vóór de proef.",
      proof:"Benadruk breedte, compatibiliteit en eenvoudig opzeggen zonder trucs.",
      cta:"Van bladeren naar afspelen met één tik en transparante verlenging." },
    gifting:{ mood:"Lijsten staan klaar, deadlines tellen, zekerheid wint van impuls.",
      behaviour:"Men wil stipte levering, duidelijke kwaliteitsbewijzen en stressvrije retour.",
      proof:"Toon voorraad, laatste bestelmoment en normen voor echtheid/zorg.",
      cta:"Van idee naar bestelling met precieze ETA en tekst die vertrouwen geeft." },
    travel:{ mood:"Koffers gaan dicht; dekking wordt dubbelgecheckt en grijze zones vermeden.",
      behaviour:"Reizigers willen duidelijke niveaus en wat er bij wijzigingen is inbegrepen.",
      proof:"Maak limieten, afhandeling en medische dekking zichtbaar.",
      cta:"Van offerte naar polis met eenvoudige keuzes en zonder verrassingen." },
  },
};

// Fixed wrappers per language
const BTC_STRINGS: Record<Lang, { fallsOn: (event:string, dateStr:string)=>string; inVertical: (vertical:string)=>string; closing: string }> = {
  en: { fallsOn: (e,d)=>`${e} falls on ${d}`, inVertical:(v)=>`In ${v}, earn the click with story first, detail second:`, closing:`Keep sections scannable, reduce mobile friction and let trust signals do the heavy lifting so intent becomes confident action.` },
  fr: { fallsOn: (e,d)=>`${e} a lieu le ${d}`, inVertical:(v)=>`Dans ${v}, captez le clic avec récit d’abord, détail ensuite :`, closing:`Gardez des sections lisibles, réduisez la friction mobile et laissez les preuves de confiance convertir l’intention en action.` },
  es: { fallsOn: (e,d)=>`${e} se celebra el ${d}`, inVertical:(v)=>`En ${v}, gana el clic con historia primero y detalle después:`, closing:`Mantén bloques escaneables, poca fricción en móvil y señales de confianza para convertir la intención en acción segura.` },
  pt: { fallsOn: (e,d)=>`${e} acontece em ${d}`, inVertical:(v)=>`Em ${v}, conquiste o clique com história primeiro e detalhe depois:`, closing:`Use secções escaneáveis, pouca fricção no telemóvel e sinais de confiança para transformar intenção em ação.` },
  ro: { fallsOn: (e,d)=>`${e} are loc pe ${d}`, inVertical:(v)=>`În ${v}, câștigă clicul cu poveste mai întâi și detaliu apoi:`, closing:`Păstrează blocuri ușor de parcurs, fricțiune redusă pe mobil și semnale de încredere pentru a transforma intenția în acțiune.` },
  sv: { fallsOn: (e,d)=>`${e} infaller ${d}`, inVertical:(v)=>`I ${v} vinner du klicket med berättelse först, detalj sedan:`, closing:`Ha skannbara block, låg mobilfriktion och tydliga förtroendesignaler så att intent blir trygg handling.` },
  el: { fallsOn: (e,d)=>`${e} είναι στις ${d}`, inVertical:(v)=>`Στο ${v}, κέρδισε το κλικ με ιστορία πρώτα και λεπτομέρεια μετά:`, closing:`Κράτησε ενότητες ευανάγνωστες, με χαμηλή τριβή στο κινητό και ισχυρά σήματα εμπιστοσύνης ώστε η πρόθεση να γίνεται πράξη.` },
  da: { fallsOn: (e,d)=>`${e} falder den ${d}`, inVertical:(v)=>`I ${v} vinder du klikket med fortælling først, detaljer bagefter:`, closing:`Brug overskuelige sektioner, lav friktion på mobil og tydelige tillidssignaler, så intention bliver til handling.` },
  nl: { fallsOn: (e,d)=>`${e} valt op ${d}`, inVertical:(v)=>`In ${v} win je de klik met verhaal eerst en detail daarna:`, closing:`Houd blokken scanbaar, verlaag frictie op mobiel en laat vertrouwenssignalen het werk doen zodat intentie actie wordt.` },
};

function creativeBTCL10N(lang: Lang, event: string, dateStr: string, vertical: string): string {
  const fam: BtcFamily = BTC_FAMILY(vertical);
  const scenes = BTC_SCENES_L10N[lang]?.[fam] || BTC_SCENES_L10N.en[fam];
  const strings = BTC_STRINGS[lang] || BTC_STRINGS.en;
  const history = BTC_HISTORY_L10N[lang]?.(event) || BTC_HISTORY_L10N.en(event);

  let txt =
    `${strings.fallsOn(event, dateStr)} — ${history}. ` +
    `${scenes.mood} ` +
    `${scenes.behaviour} ` +
    `${strings.inVertical(vertical)} ` +
    `${scenes.proof} ` +
    `${scenes.cta} ` +
    `${strings.closing}`;

  return clampBTC(txt, 550, 650);
}

// Override BTC generator for ALL languages
I18N.en.btc =   ({base, dateStr, vertical}) => creativeBTCL10N("en", base, dateStr, vertical);
I18N.fr.btc =   ({base, dateStr, vertical}) => creativeBTCL10N("fr", base, dateStr, vertical);
I18N.es.btc =   ({base, dateStr, vertical}) => creativeBTCL10N("es", base, dateStr, vertical);
I18N.pt.btc =   ({base, dateStr, vertical}) => creativeBTCL10N("pt", base, dateStr, vertical);
I18N.ro.btc =   ({base, dateStr, vertical}) => creativeBTCL10N("ro", base, dateStr, vertical);
I18N.sv.btc =   ({base, dateStr, vertical}) => creativeBTCL10N("sv", base, dateStr, vertical);
I18N.el.btc =   ({base, dateStr, vertical}) => creativeBTCL10N("el", base, dateStr, vertical);
I18N.da.btc =   ({base, dateStr, vertical}) => creativeBTCL10N("da", base, dateStr, vertical);
I18N.nl.btc =   ({base, dateStr, vertical}) => creativeBTCL10N("nl", base, dateStr, vertical);
// Override only EN BTC to use the creative version.
// (Other languages keep their existing BTC until we localise them similarly.)
I18N.en.btc = ({base, dateStr, vertical}) => creativeBTC(base, dateStr, vertical);

/** Suggestions (now language + vertical aware) */
function generateSuggestions(
  name: string,
  when: string,
  opts?: { lang?: Lang; vertical?: string }
): SuggestionBuckets {
  const year = new Date(when).getFullYear();
  const dateStr = fmtDate(when);
  const base = name;
  const lang: Lang = opts?.lang || "en";
  const vertical = opts?.vertical || "E-Commerce";

  const pack = I18N[lang] || I18N.en;

  const btc = clampBTC(pack.btc({base, dateStr, vertical}));

  return {
    H1: pack.h1({base, year, dateStr, vertical}),
    DH1: pack.dh1({base, year, dateStr, vertical}),
    H2: pack.h2({base, year, dateStr, vertical}),
    "Article headline": pack.article({base, year, dateStr, vertical}),
    "Ribbon Copy": pack.ribbon({base}),
    "BTC paragraph": btc,
  };
}

/* --- NEW: diacritic stripping + cross-language canonicalisers --- */
function stripDiacritics(s: string): string {
  try {
    return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } catch {
    return s;
  }
}

function canonicalHolidayTokens(s: string): string {
  let out = stripDiacritics((s || "").toLowerCase());

  // Christmas + Christmas Eve (EL/FR/ES/PT/NL/SV/RO etc.)
  out = out
    .replace(/παραμονη\s+χριστουγεννων/g, " christmas eve ")
    .replace(/χριστουγεννα/g, " christmas ")
    .replace(/\bnoel\b/g, " christmas ")
    .replace(/\bnavidad\b/g, " christmas ")
    .replace(/\bnatal\b/g, " christmas ")
    .replace(/\bkerst\w*/g, " christmas ")
    .replace(/\bjul\w*/g, " christmas ")
    .replace(/craciun/g, " christmas ")
    .replace(/\bxmas\b/g, " christmas ");
  if (/\bchristmas eve\b/.test(out)) out += " christmas ";

  // New Year / New Year's Eve (ADD the following mappings)
  out = out
    .replace(/\breveillon\b/g, " new year eve ")
    .replace(/\bnochevieja\b/g, " new year eve ")
    .replace(/\bvispera(?:\s+de)?\s+ano\s+nuevo\b/g, " new year eve ")
    .replace(/\bsaint[- ]?sylvestre\b/g, " new year eve ")
    .replace(/\boudejaarsavond\b/g, " new year eve ")
    .replace(/\bhogmanay\b/g, " new year eve ")
    .replace(/\bnew\s*year'?s?\s*eve\b/g, " new year eve ")
    .replace(/\bano nuevo\b/g, " new year ")
    .replace(/\bano novo\b/g, " new year ");

  // New Year (keep Eve signal in string)
  out = out
    .replace(/\breveillon\b/g, " new year eve ")
    .replace(/\bano nuevo\b/g, " new year ")
    .replace(/\bano novo\b/g, " new year ");

  // Retail tentpoles
  out = out
    .replace(/\bviernes negro\b/g, " black friday ")
    .replace(/\bsexta[- ]feira negra\b/g, " black friday ")
    .replace(/\bcyber[- ]?monday\b/g, " cyber monday ")
    .replace(/\bboxing day\b/g, " boxing day ")
    .replace(/\b11(?:\.|\/)?11\b/g, " singles ");
  return out;
}

function canonicalEventKey(ev: RelevantEvent): string {
  const s = canonicalHolidayTokens([ev.name, ev._nameEn, ev._nameLocal].filter(Boolean).join(" "));

  const table: Array<{ re: RegExp; key: string }> = [
    { re: /\bchristmas eve\b/, key: "christmas eve" },
    { re: /\bchristmas\b/,     key: "christmas" },
    { re: /\bnew year\b/,      key: "new year" },
    { re: /\bgood friday\b/,   key: "good friday" },
    { re: /\beaster\b/,        key: "easter" },
    { re: /\bvalentine/,       key: "valentine's day" },
    { re: /\bmother'?s?\b/,    key: "mother's day" },
    { re: /\bfather'?s?\b/,    key: "father's day" },
    { re: /\bhalloween\b/,     key: "halloween" },
    { re: /\bblack friday\b/,  key: "black friday" },
    { re: /\bcyber monday\b/,  key: "cyber monday" },
    { re: /\bboxing day\b/,    key: "boxing day" },
    { re: /\bsingles\b/,       key: "singles' day" },
  ];
  for (const t of table) if (t.re.test(s)) return t.key;
  return normaliseName(ev._nameEn || ev.name || "");
}

function canonicalDisplayName(key: string): string | null {
  const labels: Record<string, string> = {
    "christmas": "Christmas",
    "christmas eve": "Christmas Eve",
    "new year": "New Year's Eve",
    "good friday": "Good Friday",
    "easter": "Easter",
    "valentine's day": "Valentine's Day",
    "mother's day": "Mother's Day",
    "father's day": "Father's Day",
    "halloween": "Halloween",
    "black friday": "Black Friday",
    "cyber monday": "Cyber Monday",
    "boxing day": "Boxing Day",
    "singles' day": "Singles' Day",
  };
  return labels[key] || null;
}

/* ---------- Merge duplicates by English name & clean descriptions ---------- */
function mergeByName(list: RelevantEvent[]): MergedEvent[] {
  const map = new Map<string, MergedEvent>();
  for (const ev of list) {
    const key = normaliseName(ev.name || ev._nameEn || "");
    if (!key) continue;

    const code = (ev._country || "").toUpperCase();
    const local = ev._nameLocal || ev._nameEn || ev.name;
    const desc = sanitiseDescription(ev.description);

    const ex = map.get(key);
    if (!ex) {
      map.set(key, {
        ...ev,
        description: desc,
        _countries: code ? [code] : [],
        _localNames: code ? { [code]: local } : {},
        _rawType: toArray(ev._rawType),
      });
      continue;
    }

    // keep earliest date
    const curr = new Date(ex.date),
      next = new Date(ev.date);
    if (!isNaN(next.getTime()) && (isNaN(curr.getTime()) || next < curr)) ex.date = ev.date;

    // prefer generic (or longer if both generic)
    const exHasCountry = sanitiseDescription(ex.description) !== (ex.description || "");
    const newHasCountry = sanitiseDescription(ev.description) !== (ev.description || "");
    const chooseNew =
      (exHasCountry && !newHasCountry) ||
      (!exHasCountry && !newHasCountry && (desc.length > (ex.description || "").length));
    if (chooseNew) ex.description = desc;

    // union countries & local names
    if (code && !ex._countries!.includes(code)) ex._countries!.push(code);
    if (code) {
      ex._localNames = ex._localNames || {};
      if (!ex._localNames[code]) ex._localNames[code] = local;
    }

    // union types
    ex._rawType = Array.from(new Set([...(ex._rawType || []), ...toArray(ev._rawType)]));
  }

  const toTime = (d: any): number => {
    const s = typeof d === "string" ? d : (d && typeof d === "object" && "iso" in d && (d as any).iso) || "";
    const t = Date.parse(s);
    return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
  };
  
  return Array.from(map.values()).sort((a, b) => {
    const dt = toTime(a.date) - toTime(b.date);
    if (dt !== 0) return dt;
    return (a.name || "").toLowerCase().localeCompare((b.name || "").toLowerCase());
  });
}

/* ---------- NEW: relevance mapping helpers ---------- */
const norm = (s?: string) => (s || "").toLowerCase();

/* Relevance return type */
type RelevanceInfo = { history: string; why: string; bullets: string[] };

const VERTICAL_RULES: Record<string, RegExp[]> = {
  "E-Commerce": [/black friday|cyber monday|boxing day|prime day|el buen fin|soldes|back[- ]?to[- ]?school|christmas|new year|halloween|easter|singles/i],
  "Website Builders": [/black friday|cyber monday|boxing day|prime day|el buen fin|soldes|back[- ]?to[- ]?school/i],
  "Web Hosting (SaaS)": [/black friday|cyber monday|boxing day|prime day|soldes|el buen fin/i],
  "Marketing Tools Hub": [/black friday|cyber monday|prime day|soldes|el buen fin/i],
  "POS": [/black friday|cyber monday|boxing day|prime day|el buen fin|soldes/i],

  "TV Streaming": [/christmas|new year|halloween|independence|4th of july|world cup|olympic|euro/i],
  "TV Services": [/christmas|new year|halloween|sport|world cup|olympic|euro/i],

  "VPN": [/black friday|cyber monday|boxing day|new year|halloween|world cup|olympic|travel|abroad|independence|4th of july/i],
  "Cyber Security Hub": [/cyber monday|black friday/i],
  "ID Theft": [/black friday|cyber monday/i],
  "Password manager": [/black friday|cyber monday/i],

  "Credit Cards": [/black friday|cyber monday|boxing day|prime day|el buen fin|soldes|christmas|new year|independence|4th of july|back[- ]?to[- ]?school|valentine|mother|father/i],
  "Personal Loans": [/holiday|christmas|new year|black friday|cyber monday|boxing day/i],
  "Online Banking": [/black friday|cyber monday|boxing day|new year/i],

  "Travel Insurance": [/independence|4th of july|christmas|new year|easter|summer|spring break|bank holiday|national day/i],

  "Flower Delivery": [/valentine|mother|father|christmas|easter/i],
  "Lab Grown Diamonds": [/valentine|anniversary|christmas/i],
  "Dating": [/valentine|christmas|new year/i],
  "Online Therapy": [/christmas|new year|valentine|mother|father|world mental health/i],
  "Meal Delivery": [/christmas|new year|easter|mother|father/i],
  "Vitamins": [/new year|christmas|easter|back[- ]?to[- ]?school/i],

  "Sport Betting UK": [/grand national|premier league|euros|world cup|ascot/i],
  "Sport Betting IE": [/grand national|premier league|euros|world cup/i],
  "Sport Betting FR": [/euros|world cup|tour de france/i],
  "Sport Betting SE": [/euros|world cup|hockey|bandy/i],
};
const FALLBACK_RULES = [/black friday|cyber monday|boxing day|prime day|soldes|el buen fin|back[- ]?to[- ]?school|christmas|new year/i];

function isRelevantForVertical(evName: string, evDesc: string, vertical: string): boolean {
  const rules = VERTICAL_RULES[vertical] || FALLBACK_RULES;
  return rules.some((re) => re.test(evName) || re.test(evDesc));
}
function determineRelevantVerticals(ev: MergedEvent): string[] {
  const name = canonicalHolidayTokens(norm(ev.name || ev._nameEn || ""));
  const desc = canonicalHolidayTokens(norm(ev.description || ""));
  const out = new Set<string>();
  const provided = ev.relevantVerticals;
  if (provided && (Array.isArray(provided) ? provided.length : String(provided).trim().length)) {
    (Array.isArray(provided) ? provided : String(provided).split(","))
      .map((s) => s.trim()).filter(Boolean).forEach((v) => out.add(v));
  }
  for (const v of VERTICALS) {
    if (isRelevantForVertical(name, desc, v)) out.add(v);
  }
  if (out.size === 0) guessVerticals(ev.name || ev._nameEn || "").forEach((v) => out.add(v));
  return Array.from(out);
}

/* NEW: vertical bullets & reducer */
const VERTICAL_BULLETS: Record<string, string> = {
  "E-Commerce": "Shoppers actively compare and buy within tight windows → higher CTR and AOV when urgency and social proof are clear.",
  "Website Builders": "SMBs spin up promo pages → trials lift when templates and launch time are explicit.",
  "Web Hosting (SaaS)": "Traffic spikes drive infra upgrades/migrations → conversions rise when reliability and quick setup are positioned.",
  "Marketing Tools Hub": "Merchants scale campaigns → trials increase with ROI examples and 1-click integrations.",
  "POS": "Retail footfall pushes hardware/software refresh → demand lifts with simple pricing and next-day shipping.",
  "Credit Cards": "Big-ticket and instalment planning → applications rise with clear benefits and eligibility clarity.",
  "Personal Loans": "Short-term affordability around peak spend → pre-qualified offers reduce friction.",
  "Online Banking": "New accounts for budgeting/rewards → sign-ups lift with instant verification and fee transparency.",
  "Travel Insurance": "Short breaks and domestic trips → quotes spike when coverage and claims speed are obvious.",
  "TV Streaming": "Event/holiday viewing → trials surge if marquee content and cancellation ease are highlighted.",
  "TV Services": "Household upgrades for gatherings → conversions improve with bundle clarity and next-day install.",
  "VPN": "Geo-blocked content & travel → trials convert with streaming compatibility and one-click apps.",
  "Cyber Security Hub": "New devices and online spend → demand lifts with ‘set-and-forget’ protection and multi-device value.",
  "Password manager": "Account surge → uptake improves with import wizards and breach alerts.",
  "ID Theft": "More transactions → conversions rise with proactive monitoring and recovery guarantees.",
  "Flower Delivery": "Gifting peaks near the day → last-minute availability and cut-offs drive conversion.",
  "Lab Grown Diamonds": "High-consideration gifting → conversions rise with certification proof and financing.",
  "Dating": "Seasonal interest → sign-ups lift when you highlight safety, profile quality and quick starts.",
  "Online Therapy": "Life events trigger self-care → bookings lift with licensed therapists and discreet access.",
  "Meal Delivery": "Entertaining/time-poor → orders rise with clear prep time and first-order value.",
  "Vitamins": "Resolution/health focus → plans convert with transparent ingredients and habit nudges.",
  "Sport Betting UK": "Tent-pole fixtures → engagement climbs with odds clarity and responsible prompts.",
  "Sport Betting IE": "Tent-pole fixtures → engagement climbs with odds clarity and responsible prompts.",
  "Sport Betting FR": "Tent-pole fixtures → engagement climbs with odds clarity and responsible prompts.",
  "Sport Betting SE": "Tent-pole fixtures → engagement climbs with odds clarity and responsible prompts.",
};
function bulletsFromVerticals(verticals: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of verticals) {
    const b = VERTICAL_BULLETS[v];
    if (b && !seen.has(b)) {
      seen.add(b);
      out.push(b);
    }
  }
  return out.slice(0, 6);
}

function buildRelevance(
  name: string,
  dateIso: string,
  verticals: string[],
  countries?: string[]
) {
  const canon = canonicalHolidayTokens(name.toLowerCase());
  const monthStr = new Date(dateIso).toLocaleDateString("en-GB", { month: "long" });
  const countryNote = (countries && countries.length === 1) ? ` in ${countries[0]}` : "";

  let history = "", behaviour = "", marketing = "";

  if (/\bnew year(?:\s+eve)?\b/.test(canon)) {
    history   = `${name}${countryNote} marks the final night of the Gregorian year, with roots in Roman year-end rites and strong regional traditions like Hogmanay in the UK and Réveillon across Europe and Brazil.`;
    behaviour = ` People gather for countdowns, book dining and short breaks, stream live events and set “fresh-start” goals for January. Device set-ups and plan changes also peak after gifting.`;
    marketing = ` This concentrates intent for subscriptions and reset-oriented services (finance tools, VPN/streaming, wellness) — clear timelines, low-friction trials and easy cancellation increase trial-to-paid.`;
  } else if (/\bchristmas\b/.test(canon)) {
    history   = `${name}${countryNote} is a centuries-old Christian feast that evolved into a modern gift-giving season shaped by Victorian retail and mass media.`;
    behaviour = ` Households plan gatherings, travel and gifting; last-mile delivery and returns are decisive.`;
    marketing = ` Urgency, stock clarity, trusted reviews and cut-off timers reduce abandonment and lift basket size.`;
  } else if (/\bchristmas\s+eve\b/.test(canon)) {
    history   = `${name}${countryNote} is the traditional vigil before Christmas Day, associated with family gatherings and final preparations.`;
    behaviour = ` Users make last-minute purchases, confirm delivery slots and cue up entertainment for the evening.`;
    marketing = ` Same-day options, local availability and simple set-up instructions drive fast decisions.`;
  } else if (/\bblack friday|cyber monday|boxing day|el buen fin|soldes|prime day\b/.test(canon)) {
    history   = `${name}${countryNote} concentrates promotional activity into a short window that shoppers now plan around.`;
    behaviour = ` Comparison, price-checking and checkout happen in tight bursts, often on mobile.`;
    marketing = ` Clear value, scarcity signals and frictionless checkout lift CTR and conversion.`;
  } else if (/\bvalentine/.test(canon)) {
    history   = `${name}${countryNote} stems from late-medieval courtship customs and modern gifting culture.`;
    behaviour = ` Users seek curated gifts and experiences with guaranteed timing.`;
    marketing = ` Proof of quality, delivery certainty and simple bundles boost completion.`;
  } else if (/\beaster|good friday\b/.test(canon)) {
    history   = `${name}${countryNote} is a major Christian observance leading into spring holidays.`;
    behaviour = ` Families plan meals, short trips and at-home activities.`;
    marketing = ` Convenience, scheduling clarity and easy returns reduce hesitation.`;
  } else if (/\bhalloween\b/.test(canon)) {
    history   = `${name}${countryNote} blends Celtic and American traditions and is now mainstream globally.`;
    behaviour = ` Seasonal décor, costumes and streaming spike in the run-up.`;
    marketing = ` Themed collections and time-boxed prompts lift browse depth and micro-conversions.`;
  } else if (/\bindependence|4th of july|national day|bastille\b/.test(canon)) {
    history   = `${name}${countryNote} celebrates national milestones with public events and travel.`;
    behaviour = ` People plan gatherings, short breaks and at-home entertainment.`;
    marketing = ` Timely bundles and clear use-cases drive engagement and purchase readiness.`;
  } else if (/\bback[- ]?to[- ]?school\b/.test(canon)) {
    history   = `${name}${countryNote} is a retail planning cycle aligned to school calendars.`;
    behaviour = ` Households make deadline-driven, practical purchases and subscriptions.`;
    marketing = ` Checklists and side-by-side comparisons reduce decision time and increase completion.`;
  } else {
    history   = `${name}${countryNote} produces a measurable intent shift around ${monthStr}.`;
    behaviour = ` Users research, compare and make time-sensitive choices.`;
    marketing = ` Clarity, timing and risk-reduction push users deeper into the funnel.`;
  }

  return {
    why: `${history}${behaviour}${marketing}`,
    bullets: bulletsFromVerticals(verticals),
  };
}
/* ---------- UI helpers ---------- */
const Pill = ({
  children,
  tone = "indigo",
}: {
  children: React.ReactNode;
  tone?: "indigo" | "blue" | "amber" | "emerald";
}) => {
  const colours: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    amber: "bg-amber-100 text-amber-800 border-amber-200",
    emerald: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${colours[tone]} mr-2`}
    >
      {children}
    </span>
  );
};

function EventRow({ ev, displayName }: { ev: MergedEvent; displayName: string }) {
  const [open, setOpen] = useState(false);

  // NEW: per-event user picks
  const [pickedCountry, setPickedCountry] = useState<string>("");
  const [pickedVertical, setPickedVertical] = useState<string>("");

  const verticals = useMemo(() => determineRelevantVerticals(ev), [ev]);

  const activeCountry = pickedCountry || ev._countries?.[0] || "";
  const activeLang: Lang = (activeCountry && LANG_BY_COUNTRY[activeCountry]) || "en";
  const activeVertical = pickedVertical || verticals[0] || "E-Commerce";

  const relevance = useMemo(
    () => buildRelevance(displayName, ev.date, verticals, ev._countries),
    [displayName, ev.date, verticals, ev._countries?.join("|")]
  );

  // UPDATED: suggestions depend on chosen country (language) and vertical
  const suggestions = useMemo(
    () => generateSuggestions(displayName, ev.date, { lang: activeLang, vertical: activeVertical }),
    [displayName, ev.date, activeLang, activeVertical]
  );

  const chipBase =
    "inline-block text-[11px] px-2 py-0.5 rounded-full border transition cursor-pointer select-none";
  const chipOn  = "bg-indigo-600 border-indigo-600 text-white";
  const chipOff = "bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50";

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-50"
      >
        <div className="flex items-center gap-3">
          {open ? (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-500" />
          )}
          <div className="font-semibold text-slate-900">{displayName}</div>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
          {fmtDate(ev.date)}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4">
          {/* raw types */}
          <div className="flex flex-wrap gap-2 my-2">
            {toArray(ev._rawType).map((t) => (
              <Pill key={t} tone="indigo">
                {t}
              </Pill>
            ))}
          </div>

          {/* description – country neutral */}
          {ev.description && <p className="text-slate-700 mb-4">{ev.description}</p>}

          {/* NEW: Countries (clickable for language) */}
          {ev._countries?.length ? (
            <div className="rounded-lg border border-indigo-100 bg-slate-50 p-3 mb-3">
              <div className="text-xs uppercase font-semibold text-indigo-700 mb-2">Countries</div>
              <div className="flex flex-wrap gap-2">
                {ev._countries.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setPickedCountry((prev) => (prev === c ? "" : c))}
                    aria-pressed={pickedCountry === c}
                    className={`${chipBase} ${pickedCountry === c ? chipOn : chipOff}`}
                    title={`Use ${c} language`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Relevant Verticals (clickable) */}
          {verticals.length > 0 && (
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 mb-3">
              <div className="text-xs uppercase font-semibold text-indigo-700 mb-2">Relevant Verticals</div>
              <div className="flex flex-wrap gap-2">
                {verticals.map((v) => {
                  const on = pickedVertical === v || (!pickedVertical && v === verticals[0]);
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setPickedVertical((prev) => (prev === v ? "" : v))}
                      aria-pressed={pickedVertical === v}
                      className={`${chipBase} ${on ? chipOn : chipOff}`}
                      title={`Create content for ${v}`}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Relevance (WHY + bullets) */}
          <div className="rounded-lg border border-indigo-100 bg-slate-50 p-3 mb-4">
            <div className="text-xs uppercase font-semibold text-indigo-700 mb-2">Relevance</div>
            <p className="text-slate-700 mb-2">{relevance.why}</p>
            {relevance.bullets.length > 0 && (
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                {relevance.bullets.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            )}
          </div>

          {/* Best practices (unchanged) */}
          <div className="rounded-lg border border-indigo-100 bg-slate-50 p-3 mb-4">
            <div className="text-xs uppercase font-semibold text-indigo-700 mb-2">Best practices</div>
            <ol className="list-decimal pl-5 space-y-1 text-slate-700">
              {(toArray(ev.bestPractices) as string[]).length
                ? (toArray(ev.bestPractices) as string[]).map((b, i) => <li key={i}>{b}</li>)
                : [
                    "Lead with value — avoid empty ‘sale’ copy.",
                    "Align creatives and landing pages with the event theme.",
                    "Make deadlines explicit (timezone, cut-off, shipping).",
                    "Show comparisons; help users decide quickly.",
                    "Capture intent: CTAs above the fold & sticky on mobile.",
                  ].map((b, i) => <li key={i}>{b}</li>)}
            </ol>
          </div>

          {/* Content suggestions — now in chosen language and vertical */}
          <div className="rounded-lg border border-indigo-100 bg-slate-50 p-3">
            <div className="text-xs uppercase font-semibold text-indigo-700 mb-2">
              Content suggestions {activeCountry ? `(${activeCountry}/${activeLang.toUpperCase()}, ${activeVertical})` : `(${activeLang.toUpperCase()}, ${activeVertical})`}
            </div>

            {suggestions.H1?.length ? (
              <div className="mb-3">
                <Pill tone="blue">H1</Pill>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  {suggestions.H1.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {suggestions.DH1?.length ? (
              <div className="mb-3">
                <Pill tone="amber">DH1</Pill>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  {suggestions.DH1.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {suggestions.H2?.length ? (
              <div className="mb-3">
                <Pill tone="indigo">H2</Pill>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  {suggestions.H2.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {suggestions["Article headline"]?.length ? (
              <div className="mb-3">
                <Pill tone="blue">ARTICLE</Pill>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  {suggestions["Article headline"].map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {suggestions["Ribbon Copy"]?.length ? (
              <div className="mb-3">
                <Pill tone="emerald">RIBBON</Pill>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  {suggestions["Ribbon Copy"].map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {suggestions["BTC paragraph"] ? (
              <div className="mb-1">
                <Pill tone="emerald">BTC</Pill>
                <p className="text-slate-700">{suggestions["BTC paragraph"]}</p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Page ---------- */
export default function EventsPage() {
  const [month, setMonth] = useState<number | "">("");
  const [country, setCountry] = useState<string>("");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [vertical, setVertical] = useState<string | "">("");
  const [commercialOnly, setCommercialOnly] = useState<boolean>(true);
  const [q, setQ] = useState("");
  const [loadingLoad, setLoadingLoad] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [error, setError] = useState<string>("");
  const [events, setEvents] = useState<RelevantEvent[]>([]);

  const deriveCountries = (code: string) => setSelectedCountries(code ? [code] : []);

  async function load() {
    setError("");
    if (!month) {
      setError("Please select a month.");
      return;
    }
    setLoadingLoad(true);
    try {
      const params = new URLSearchParams({
        month: String(month),
        commercialOnly: commercialOnly ? "1" : "0",
      });
      const body = { countries: selectedCountries };
      const r = await fetch(`/api/seasonal-events?${params.toString()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: ApiResponse | { error: string } = await r.json();
      if (!r.ok || (data as any).error) throw new Error((data as any).error || "Failed to load");
      setEvents((data as ApiResponse).events || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
      setEvents([]);
    } finally {
      setLoadingLoad(false);
    }
  }

  // Search by text (single definitive version)
  async function searchByText() {
    const needle = norm(q);
    if (!needle) return;
    setError("");
    setLoadingSearch(true);
    try {
      const months = month ? [Number(month)] : Array.from({ length: 12 }, (_, i) => i + 1);
      const all: RelevantEvent[] = [];
      for (const m of months) {
        const params = new URLSearchParams({
          month: String(m),
          commercialOnly: commercialOnly ? "1" : "0",
        });
        const body = { countries: selectedCountries };
        const r = await fetch(`/api/seasonal-events?${params.toString()}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) continue;
        const data: ApiResponse = await r.json();
        all.push(...(data.events || []));
      }
      const filteredByText = all.filter(e =>
        norm(e.name).includes(needle) ||
        norm(e._nameEn).includes(needle) ||
        norm(e._nameLocal).includes(needle) ||
        norm(e.description).includes(needle) ||
        norm((e as any)._descGeneric).includes(needle)
      );
      setEvents(filteredByText);
    } catch (e: any) {
      setError(e?.message || "Search failed");
      setEvents([]);
    } finally {
      setLoadingSearch(false);
    }
  }

  const merged = useMemo(() => mergeByName(events), [events]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return merged;
    return merged.filter(
      (ev) =>
        (ev.name || "").toLowerCase().includes(needle) ||
        (ev.description || "").toLowerCase().includes(needle)
    );
  }, [merged, q]);

  const getDisplayName = (ev: MergedEvent): string => {
    if (selectedCountries.length === 1) {
      const code = selectedCountries[0].toUpperCase();
      const local = ev._localNames?.[code] || ev._nameLocal || ev.name;
      const lang = LANG_BY_COUNTRY[code] || "en";
      if (lang !== "en" && isDifferent(local, ev.name)) return `${local} (${ev.name})`;
      return local || ev.name;
    }
    return ev.name || ev._nameEn || "";
    };

  const monthlyUnique = useMemo(() => {
    const seen = new Map<string, MergedEvent>();
    for (const ev of filtered) {
      const key = `${(ev.name || "").toLowerCase()}|${ev.date}`;
      if (!seen.has(key)) seen.set(key, ev);
    }
    return Array.from(seen.values());
  }, [filtered]);

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-5 mb-8 shadow-sm">
        <div className="text-sm opacity-80">Seasonal Events</div>
        <div className="text-lg md:text-xl font-semibold">
          Research and prioritise the seasonal events that matter! Align your teams and implement content that moves the needle.
        </div>
      </div>

      {/* Controls — inline labels with (Optional) beneath (unchanged) */}
      <div className="flex flex-wrap items-center gap-5 mb-6">
        <label className="flex items-center gap-2 font-semibold">
          <span>
            Month <span className="text-red-500">*</span>
          </span>
          <select
            className="border rounded px-3 py-2 w-56"
            value={month ?? ""}
            onChange={(e) => setMonth(e.target.value ? parseInt(e.target.value, 10) : "")}
          >
            <option value="">Select…</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2">
          <div className="min-w-[84px]">
            <div className="font-semibold leading-tight">Country</div>
            <div className="text-xs text-slate-500 leading-tight">(Optional)</div>
          </div>
          <select
            className="border rounded px-3 py-2 w-56"
            value={country}
            onChange={(e) => { const v = e.target.value; setCountry(v); deriveCountries(v); }}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code + c.label} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="min-w-[84px]">
            <div className="font-semibold leading-tight">Vertical</div>
            <div className="text-xs text-slate-500 leading-tight">(Optional)</div>
          </div>
          <select
            className="border rounded px-3 py-2 w-56"
            value={vertical}
            onChange={(e) => setVertical(e.target.value)}
          >
            <option value="">Select…</option>
            {VERTICALS.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 font-semibold">
          <span>Commercial only</span>
          <input
            type="checkbox"
            className="h-5 w-5"
            checked={commercialOnly}
            onChange={(e) => setCommercialOnly(e.target.checked)}
          />
        </label>

        <button
          onClick={load}
          className="px-4 py-2 rounded-md bg-indigo-600 text-white font-semibold disabled:opacity-60 flex items-center gap-2"
          disabled={!month || loadingLoad || loadingSearch}
          title="Load"
        >
          {loadingLoad ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loadingLoad ? "Loading…" : "Load"}
        </button>
      </div>

      {/* Search row (unchanged) */}
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div className="flex items-center gap-2 w-full md:w-auto flex-1 min-w-[260px]">
          <label className="font-semibold mr-2">Search</label>
          <input
            className="border rounded px-3 py-2 w-full"
            placeholder="Search name/description…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && q.trim() && !loadingSearch) searchByText(); }}
          />
          <button
            onClick={searchByText}
            className="px-4 py-2 rounded-md bg-indigo-600 text-white font-semibold disabled:opacity-60 flex items-center gap-2"
            disabled={loadingSearch || loadingLoad || q.trim().length === 0}
            title="Search by text (month optional)"
          >
            {loadingSearch ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loadingSearch ? "Searching…" : "Search"}
          </button>
        </div>
      </div>

      {/* Export CSV (unchanged) */}
      <div className="mb-6">
        <button
          onClick={() => {
            const rows = [
              ["name", "date", "countries", "description"].join(","),
              ...filtered.map((e) =>
                [
                  JSON.stringify(getDisplayName(e)),
                  JSON.stringify(e.date ?? ""),
                  JSON.stringify((e._countries && e._countries.join(" / ")) || ""),
                  JSON.stringify(e.description ?? ""),
                ].join(",")
              ),
            ].join("\n");
            const blob = new Blob([rows], { type: "text/csv;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = Object.assign(document.createElement("a"), {
              href: url,
              download: `seasonal-events-${month ? MONTHS[Number(month) - 1] : "all"}.csv`,
            });
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="px-4 py-2 rounded-md bg-indigo-600 text-white font-semibold disabled:opacity-60 flex items-center gap-2"
          title="Export CSV"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Compact monthly list (unchanged) */}
      <div className="mb-4">
        <div className="text-slate-900 font-semibold mb-2">Seasonal Events</div>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {monthlyUnique.length === 0 ? (
            <div className="text-slate-500 px-4 py-3">No events for this selection.</div>
          ) : (
            monthlyUnique.slice(0, Math.min(5, monthlyUnique.length)).map((ev, i) => (
              <div
                key={`${ev.name}-${ev.date}-${i}`}
                className="px-4 py-2 border-b last:border-b-0 border-slate-100 flex items-center justify-between"
              >
                <div className="text-sm text-slate-800 truncate">{getDisplayName(ev)}</div>
                <div className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {fmtDate(ev.date)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Expandable cards */}
      {error && (
        <div className="text-red-700 bg-red-50 border border-red-200 rounded-md p-3 mb-3">
          {error}
        </div>
      )}
      {!error && (
        <div className="space-y-3">
          {filtered.map((ev, i) => (
            <EventRow
              key={`${normaliseName(ev.name)}-${ev.date}-${i}`}
              ev={ev}
              displayName={getDisplayName(ev)}
            />
          ))}
        </div>
      )}
    </>
  );
}