// Local, dependency-free fallbacks so the app works even if imports fail
let CANONICAL_VERTICALS = [
  'Accounting Software','Anti Virus','Background Checks','Banking','Braces','Business Applications Hub','Business Insurance',
  'Business Loans','Business VoIP','Car Insurance','Car Loans','Car Selling','Car Warranty','CCP','Contact Lenses',
  'Credit Cards','CRM','Cyber Security Hub','Parental Control','Password Manager','Project Management',
  'Marketing Tools Hub','Language Learning','Online Degrees','LLC','VPN','Web Design','Remote Access',
  'Data Analysis Software','Payroll','Home Warranty','Home Security','Medical Alerts','POS','Walk-in Tubs','Mobile Plans',
  'Hearing Aid','Invoicing','Dating','Psychic Reading','Legal Services','Meal Delivery','DNA','Online Therapy',
  'TV Services / Streaming','Printing Services','Resume Builders','Flower Delivery','Editing Apps','Lab Grown Diamonds',
  'Weight Loss','Hair Loss','ED','Website Builders','Hosting','E-commerce','ID Theft','Investments','Gold and Silver',
  'Mortgage','Mortgage Loans','Money Transfer','Online Banking','Debt Funnel','Debt Consolidation',
  'Private Student Loans','Student Loans','Student Loans Refinance','Tax Relief','Life Insurance','Pet Insurance',
  'Renters Insurance','Home LG Insurance','Travel Insurance','Sports Betting','Casino','Slots','Bingo','PGR',
  'Pet Food Delivery','Pet Subscription Boxes','Internet Providers','Moving Companies','Solar'
];
// Broad industry categories for AISearch
let INDUSTRIES = [
  'Finance','Insurance','Software / SaaS','Security','Telecom','Health & Wellness','Home Services','Education',
  'E-commerce','Legal','Travel & Mobility','Entertainment / Gaming','Dating','Pets','Food & Meal','Gambling / Betting',
  'Business Services','Marketing & CRM','Hosting & Web','Utilities'
];
// Map industries to relevant verticals (subset of CANONICAL_VERTICALS)
const INDUSTRY_TO_VERTICALS = {
  'Gambling / Betting': ['Sports Betting','Casino','Slots','Bingo'],
  'Finance': ['Banking','Online Banking','Credit Cards','Car Loans','Mortgage','Mortgage Loans','Money Transfer','Investments','Student Loans','Student Loans Refinance','Private Student Loans','Tax Relief','Tax Software','Debt Consolidation','Gold and Silver'],
  'Insurance': ['Life Insurance','Pet Insurance','Home Insurance','Car Insurance','Travel Insurance','Renters Insurance','Home LG Insurance'],
  'Software / SaaS': ['Accounting Software','Invoicing','Project Management','CRM','Password Manager','Parental Control','Data Analysis Software','Business VoIP','Remote Access','VPN','Website Builders','Hosting','Web Design'],
  'Security': ['Home Security','ID Theft','Anti Virus','Password Manager','Parental Control','Cyber Security Hub'],
  'Telecom': ['Mobile Plans','Internet Providers','TV Services / Streaming'],
  'Health & Wellness': ['Medical Alerts','Hearing Aid','Hair Loss','ED','DNA','Braces','Weight Loss','Online Therapy'],
  'Home Services': ['Home Warranty','Home Insurance','Solar','Moving Companies','Walk-in Tubs','Home Security'],
  'Education': ['Language Learning','Online Degrees','Tech Bootcamps'],
  'E-commerce': ['E-commerce','Printing Services','Resume Builders','Pet Subscription Boxes','Pet Food Delivery','Flower Delivery','Editing Apps','Lab Grown Diamonds'],
  'Legal': ['Legal Services','LLC'],
  'Travel & Mobility': ['Car Insurance','Car Loans','Mobile Plans','Online Banking'],
  'Entertainment / Gaming': ['TV Services / Streaming'],
  'Dating': ['Dating'],
  'Pets': ['Pet Insurance','Pet Food Delivery','Pet Subscription Boxes'],
  'Food & Meal': ['Meal Delivery','Vitamins'],
  'Business Services': ['Business Loans','Payroll','Business Applications Hub','Business Insurance','Business VoIP'],
  'Marketing & CRM': ['Marketing Tools Hub','CRM'],
  'Hosting & Web': ['Hosting','Website Builders','Web Design'],
  'Utilities': ['Internet Providers','TV Services / Streaming','Mobile Plans','Remote Access']
};
let COUNTRIES = [
  { code:'AU', label:'Australia' },
  { code:'BE', label:'Belgium' },
  { code:'BR', label:'Brazil' },
  { code:'CA', label:'Canada' },
  { code:'DE', label:'Germany' },
  { code:'ES', label:'Spain' },
  { code:'FR', label:'France' },
  { code:'GR', label:'Greece' },
  { code:'IE', label:'Ireland' },
  { code:'IT', label:'Italy' },
  { code:'MX', label:'Mexico' },
  { code:'NL', label:'Netherlands' },
  { code:'PT', label:'Portugal' },
  { code:'RO', label:'Romania' },
  { code:'RU', label:'Russia' },
  { code:'SE', label:'Sweden' },
  { code:'SP', label:'Spain (SP)' },
  { code:'UK', label:'United Kingdom' },
  { code:'US', label:'United States' }
];
let computeSeasonalEvents = ({ month, countries }) => ({ events: [] });
let fetchInsights = async () => { throw new Error('proxy not wired'); };
// (Optional hydration from external modules was removed to avoid parse/await issues on some browsers.)

// Sidebar toggle (edge button outside panel)
const sidebar = document.getElementById('sidebar');
const layout = document.querySelector('.layout');
const edgeToggle = document.getElementById('edgeToggle');
function applyCollapsed(collapsed) {
  if (!sidebar || !layout) return;
  if (collapsed) {
    sidebar.classList.add('collapsed');
    layout.classList.add('collapsed');
    layout.style.gridTemplateColumns = '64px 1fr';
    sidebar.style.width = '64px';
  } else {
    sidebar.classList.remove('collapsed');
    layout.classList.remove('collapsed');
    layout.style.gridTemplateColumns = '240px 1fr';
    sidebar.style.width = '240px';
  }
  if (edgeToggle) edgeToggle.textContent = collapsed ? '❯' : '❮';
}
function togglePane() {
  const isCollapsed = sidebar?.classList.contains('collapsed');
  applyCollapsed(!isCollapsed);
}
if (edgeToggle) {
  edgeToggle.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); togglePane(); });
  edgeToggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePane(); }
  });
}
// Fallback: delegate clicks anywhere on the edge button
document.addEventListener('click', (e) => {
  const btn = e.target && (e.target.id === 'edgeToggle' ? e.target : e.target.closest && e.target.closest('#edgeToggle'));
  if (btn) { e.preventDefault(); togglePane(); }
});
document.addEventListener('touchstart', (e) => {
  const btn = e.target && (e.target.id === 'edgeToggle' ? e.target : e.target.closest && e.target.closest('#edgeToggle'));
  if (btn) { e.preventDefault(); togglePane(); }
}, { passive: false });

// Ensure initial explicit layout (expanded)
applyCollapsed(false);

// Simple router click delegation (ensures routing even if hashchange is missed)
document.addEventListener('click', (e) => {
  const a = e.target && (e.target.closest ? e.target.closest('a.nav-link') : null);
  if (a && a.hash) {
    e.preventDefault();
    const target = a.hash;
    if (location.hash === target) {
      renderRoute(); // re-render even when clicking the active tab
    } else {
      location.hash = target;
    }
  }
});

// About modal
const aboutModal = document.getElementById('aboutModal');
const aboutBtn = document.getElementById('aboutBtn');
aboutBtn?.addEventListener('click', () => aboutModal?.classList.remove('hidden'));
aboutModal?.addEventListener('click', (e) => {
  if (e.target?.dataset?.close !== undefined || e.target === aboutModal.querySelector('.modal-backdrop')) {
    aboutModal.classList.add('hidden');
  }
});

// Utilities
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') el.className = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== undefined && v !== null) el.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    el.append(c?.nodeType ? c : document.createTextNode(String(c ?? '')));
  }
  return el;
}

function card(title, body) {
  return h('div', { class: 'card' }, h('h3', {}, title), h('p', {}, body));
}

function section(title, controlsEl) {
  return h('div', { class: 'section' },
    h('div', { class: 'row' }, h('strong', {}, title), h('div', { class: 'spacer grow' }), controlsEl || h('div'))
  );
}

// Page render functions (render<PascalCase>(rootEl))
export function renderHome(root) {
  root.innerHTML = '';
  const q = h('input', { class: 'input', placeholder: 'Search cards…' });
  const grid = h('div', {
    class: 'card-grid ai-rows',
    style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px'
  });
  const data = Array.from({ length: 8 }).map((_, i) => ({ t: `Home Card ${i+1}`, d: 'Demo content' }));
  function renderList() {
    grid.innerHTML = '';
    const term = (q.value || '').toLowerCase();
    data.filter(x => x.t.toLowerCase().includes(term)).forEach(x => grid.append(card(x.t, x.d)));
  }
  q.addEventListener('input', renderList);
  renderList();
  root.append(section('Home', q), grid);
}

export function renderAiSearch(root) {
  root.innerHTML = '';
  const hero = h('div', { class: 'page-hero' },
    h('h1', { style: 'font-size:18px;font-weight:400' }, h('span', { style: 'font-weight:700' }, 'AISearch'), ' (AIO & AIM)'),
    h('p', {}, 'Select an industry and vertical to analyse trends, research insights, and content optimisation opportunities.')
  );
  const industrySel = h('select', { class: 'select' },
    h('option', { value: '' }, 'Select'),
    ...INDUSTRIES.map(i => h('option', { value: i }, i))
  );
  const verticalSel = h('select', { class: 'select' },
    h('option', { value: '' }, 'Select')
  );
  const countrySel = h('select', { class: 'select' },
    h('option', { value: '' }, 'Select'),
    ...COUNTRIES.map(c => h('option', { value: c.code }, c.code))
  );
  const runBtn = h('button', { class: 'btn btn-primary', disabled: 'disabled' }, 'Get Insights');
  const industryLabel = h('label', { class: 'label-required' }, 'Industry');
  const verticalLabel = h('label', { class: 'label-required' }, 'Vertical');
  const countryLabel = h('label', {}, 'Country');
  const controls = h('div', { class: 'section' },
    h('div', { class: 'toolbar ai-controls' },
      industryLabel, industrySel,
      verticalLabel, verticalSel,
      countryLabel, countrySel,
      runBtn
    )
  );
  const grid = h('div', { class: 'card-grid' });

  function ul(items) {
    return h('ul', {}, ...items.map(t => h('li', {}, t)));
  }

  function setVerticalOptions(list) {
    verticalSel.innerHTML = '';
    verticalSel.append(h('option', { value: '' }, 'Select'));
    (list || CANONICAL_VERTICALS).forEach(v => verticalSel.append(h('option', { value: v }, v)));
  }
  function updateVerticalsFromIndustry() {
    const ind = industrySel.value;
    const list = INDUSTRY_TO_VERTICALS[ind] || CANONICAL_VERTICALS;
    setVerticalOptions(list);
    verticalSel.value = '';
    updateReady();
  }
  setVerticalOptions(CANONICAL_VERTICALS);

  function renderInsights() {
    grid.innerHTML = '';
    const v = verticalSel.value || 'Personal Finance';
    const currentTrends = [
      'Increased focus on financial literacy programs',
      'Rise of automated savings tools',
      'Growing interest in ESG investing',
    ];
    const redditFindings = [
      'Most upvoted topics: budgeting tips, best practices for saving for retirement',
      'Frequent questions on emergency funds and debt repayment strategies',
    ];
    const aggregatorInsights = [
      'Competitors creating comprehensive guides on ESG investing',
      'Investopedia recently updated its budgeting tools comparison page',
    ];
    const faqs = [
      'How can I start investing with a small amount of money?',
      'What are the benefits of automated savings?',
      'How do I build an emergency fund?',
      'What is ESG investing?',
    ];
    const pageUpdates = [
      'Improve visibility of the budgeting tools section',
      'Add a quick start guide on establishing an emergency fund',
      'Update the ESG investing guide with new statistics',
    ];
    const recIdeas = [
      'Chart illustrating steps to building an emergency fund',
      'Infographic comparing automated savings tools',
      'Illustration of ESG investment categories',
    ];
    // Build top row cards
    const trendsCard = card('Current Trends', ul(currentTrends));
    const left = h('div', { class: 'card' },
      h('h3', {}, 'Steps to Build an Emergency Fund'),
      h('div', { class: 'muted' }, 'Recommendations ideas'),
      ul(recIdeas),
    );
    const right = h('div', { class: 'card' },
      h('h3', {}, 'Steps to Build an Emergency Fund'),
      h('button', { class: 'btn btn-outline btn-block' }, 'Set a target amount'),
      h('button', { class: 'btn btn-outline btn-block' }, 'Track your expenses'),
      h('button', { class: 'btn btn-outline btn-block' }, 'Start saving monthly'),
      h('button', { class: 'btn btn-outline btn-block' }, 'Reach your goal')
    );
    // (Row 1 will be appended below; avoid early appends here)

    // Visual enhancements: images and infographics (split into two inner cards)
    const createImgBtn = h('button', { class: 'btn btn-primary' }, 'Create image');
    const regenImgBtn = h('button', { class: 'btn btn-primary hidden' }, 'Regenerate image');
    const createInfBtn = h('button', { class: 'btn btn-primary' }, 'Create infographic');
    const regenInfBtn = h('button', { class: 'btn btn-primary hidden' }, 'Regenerate infographic');

    function withWorkingText(btn, workingText, doneText) {
      return (async () => {
        const prev = btn.textContent;
        btn.disabled = true; btn.textContent = workingText;
        await new Promise(r => setTimeout(r, 600));
        if (doneText) btn.textContent = doneText; else btn.textContent = prev;
        btn.disabled = false;
      })();
    }
    createImgBtn.addEventListener('click', async () => {
      await withWorkingText(createImgBtn, 'Creating image…', 'Create image');
      regenImgBtn.classList.remove('hidden');
    });
    createInfBtn.addEventListener('click', async () => {
      await withWorkingText(createInfBtn, 'Creating infographic…', 'Create infographic');
      regenInfBtn.classList.remove('hidden');
    });
    regenImgBtn.addEventListener('click', async () => {
      await withWorkingText(regenImgBtn, 'Regenerating image…', 'Regenerate image');
    });
    regenInfBtn.addEventListener('click', async () => {
      await withWorkingText(regenInfBtn, 'Regenerating infographic…', 'Regenerate infographic');
    });
    const visualsSplit = h('div', { class: 'split-2' },
      h('div', { class: 'card' },
        h('h4', { class: 'card-title' }, 'Images'),
        h('div', { class: 'toolbar' }, createImgBtn, regenImgBtn)
      ),
      h('div', { class: 'card' },
        h('h4', { class: 'card-title' }, 'Infographics'),
        h('div', { class: 'toolbar' }, createInfBtn, regenInfBtn)
      )
    );
    const visualCard = h('div', { class: 'card full' },
      h('h3', {}, 'Suggested images and infographics for visual enhancement'),
      visualsSplit
    );

    // BTC content pull/paste (declare BEFORE using in card layout)
    let btcContent = '';
    const urlInput = h('input', { class: 'input btc-url-input', placeholder: 'Internal page URL (optional)' });
    const pullBtn = h('button', { class: 'btn btn-primary' }, 'Pull BTC content');
    const urlRow = h('div', { class: 'toolbar btc-url-row' }, urlInput, pullBtn);
    const btcArea = h('textarea', { class: 'input', placeholder: 'Or paste BTC content here…', rows: '6' });
    pullBtn.addEventListener('click', async () => {
      pullBtn.disabled = true; const prev = pullBtn.textContent; pullBtn.textContent = 'Pulling…';
      await new Promise(r => setTimeout(r, 600));
      // Demo placeholder content
      btcContent = `BTC excerpt for ${v} pulled from ${urlInput.value || 'internal source'}.`;
      btcArea.value = btcContent;
      pullBtn.disabled = false; pullBtn.textContent = prev;
      updateCreateEnabled();
    });
    btcArea.addEventListener('input', () => {
      btcContent = btcArea.value;
      updateCreateEnabled();
    });
    // Create or optimise content based on BTC
    const outputArea = h('textarea', { class: 'input', rows: '10', placeholder: 'Generated content will appear here. You can edit freely.' });
    outputArea.value = '';
    const exportBtn = h('button', { class: 'btn btn-primary', disabled: 'disabled' }, '⬇ Export doc');
    function exportDocFile(filename, content) {
      try {
        const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 500);
      } catch (e) {
        console.error(e);
      }
    }
    exportBtn.addEventListener('click', () => {
      const content = outputArea.value || '';
      if (!content.trim()) return;
      exportDocFile(`${v}-generated.doc`, content);
    });
    const createBtn = h('button', { class: 'btn btn-primary', disabled: 'disabled' }, 'Create content');
    const optimiseBtn = h('button', { class: 'btn btn-primary', disabled: 'disabled' }, 'Optimise content');
    function fabricateCopy(kind) {
      const base = btcContent || `Key points for ${v}: trending topics and user questions.`;
      return `${kind} based on BTC and insights: ${base.slice(0, 160)}…`;
    }
    function updateCreateEnabled() {
      const has = (btcContent || '').trim().length > 0;
      createBtn.disabled = !has;
      optimiseBtn.disabled = !has;
      exportBtn.disabled = !(outputArea.value || '').trim().length;
    }
    updateCreateEnabled();
    outputArea.addEventListener('input', updateCreateEnabled);
    createBtn.addEventListener('click', async () => {
      const prev = createBtn.textContent; createBtn.disabled = true; createBtn.textContent = 'Creating…';
      await new Promise(r => setTimeout(r, 600));
      outputArea.value = fabricateCopy('Draft content');
      createBtn.textContent = prev; updateCreateEnabled();
      outputCard.style.display = '';
      updateCreateEnabled();
    });
    optimiseBtn.addEventListener('click', async () => {
      const prev = optimiseBtn.textContent; optimiseBtn.disabled = true; optimiseBtn.textContent = 'Optimising…';
      await new Promise(r => setTimeout(r, 600));
      outputArea.value = fabricateCopy('Optimised content');
      optimiseBtn.textContent = prev; updateCreateEnabled();
      outputCard.style.display = '';
      updateCreateEnabled();
    });
    // BTC content card (placed under Trends, first column)
    const btcCard = h('div', { class: 'card full' },
      h('h3', {}, 'BTC content'),
      urlRow,
      btcArea,
      h('div', { class: 'toolbar' }, createBtn, optimiseBtn)
    );
    // Output card (always visible; textarea is editable)
    const outputCard = h('div', { class: 'card full' },
      h('div', { class: 'row' },
        h('h3', { style: 'margin:0' }, 'Generated content')
      ),
      outputArea,
      h('div', { class: 'toolbar export-row' }, exportBtn)
    );

    // Append rows in order:
    // Row 1: Trends, Steps (rec), Reddit, Steps (actions), Aggregator, FAQs, Page Updates
    grid.append(
      trendsCard,
      h('div', { class: 'card' },
        h('h3', {}, 'Steps to Build an Emergency Fund'),
        h('div', { class: 'muted' }, 'Recommendations ideas'),
        ul(recIdeas),
      ),
      card('Reddit Research', h('div', {}, h('div', { class: 'muted' }, `Findings from the finds r/${v.toLowerCase().replace(/\s+/g,'')}`), ul(redditFindings))),
      h('div', { class: 'card' },
        h('h3', {}, 'Steps to Build an Emergency Fund'),
        h('button', { class: 'btn btn-outline btn-block' }, 'Set a target amount'),
        h('button', { class: 'btn btn-outline btn-block' }, 'Track your expenses'),
        h('button', { class: 'btn btn-outline btn-block' }, 'Start saving monthly'),
        h('button', { class: 'btn btn-outline btn-block' }, 'Reach your goal')
      ),
      card('Aggregator/Competitor Insights', ul(aggregatorInsights)),
      card('Suggested FAQs', ul(faqs)),
      card('Page Update Suggestions', ul(pageUpdates))
    );
    // Row 2: full-width BTC
    grid.append(btcCard);
    // Row 3: show output below BTC
    grid.append(outputCard);
    // Row 4: full-width visuals
    grid.append(visualCard);
  }

  function updateReady() {
    const ready = !!industrySel.value && !!verticalSel.value;
    runBtn.disabled = !ready;
  }
  industrySel.addEventListener('change', () => { updateVerticalsFromIndustry(); });
  verticalSel.addEventListener('change', updateReady);
  countrySel.addEventListener('change', () => {});
  updateReady();

  runBtn.addEventListener('click', async () => {
    if (runBtn.disabled) return;
    const prev = runBtn.textContent;
    runBtn.disabled = true; runBtn.textContent = 'Generating…';
    await new Promise(r => setTimeout(r, 500));
    renderInsights();
    runBtn.disabled = false; runBtn.textContent = prev;
  });

  // Render hero, boxed controls, then grid
  root.append(hero, controls, grid);
}

export function renderArticles(root) {
  root.innerHTML = '';
  const hero = h('div', { class: 'page-hero' },
    h('h1', {}, 'Article Creation'),
    h('p', {}, 'Generate trend-based article suggestions and customise your inputs and outputs.')
  );

  // Modes
  const MODE_EVENT = 'event';
  const MODE_MANUAL = 'manual';
  let currentMode = MODE_MANUAL;
  const eventTab = h('button', { class: 'tab' }, 'Event-triggered');
  const manualTab = h('button', { class: 'tab active' }, 'Manual input');
  function setMode(mode) {
    currentMode = mode;
    if (mode === MODE_EVENT) {
      eventTab.classList.add('active'); manualTab.classList.remove('active');
      eventRow.style.display = ''; manualRow.style.display = 'none';
    } else {
      manualTab.classList.add('active'); eventTab.classList.remove('active');
      manualRow.style.display = ''; eventRow.style.display = 'none';
      // Ensure verticals are populated when switching to Manual mode
      updateVerticalsFromIndustryArticles();
    }
  }
  eventTab.addEventListener('click', () => setMode(MODE_EVENT));
  manualTab.addEventListener('click', () => setMode(MODE_MANUAL));
  const tabs = h('div', { class: 'tabs' }, eventTab, manualTab);

  // Event-triggered row
  const sampleEvents = [
    'Black Friday deals in Banking',
    'Tax season guide',
    'Home security holiday checklist',
    'Back-to-school tech essentials'
  ];
  const eventSel = h('select', { class: 'select' },
    h('option', { value: '' }, 'Select an event'),
    ...sampleEvents.map(e => h('option', { value: e }, e))
  );
  const eventRow = h('div', { class: 'section', style: '' },
    h('div', { class: 'row' },
      h('label', { class: 'label-required' }, 'Event'),
      eventSel
    )
  );

  // Manual input row
  const industrySel = h('select', { class: 'select' },
    h('option', { value: '' }, 'Select industry'),
    ...INDUSTRIES.map(i => h('option', { value: i }, i))
  );
  const verticalSel = h('select', { class: 'select' },
    h('option', { value: '' }, 'Select vertical')
  );
  const countrySel = h('select', { class: 'select' },
    h('option', { value: '' }, 'Select country'),
    ...COUNTRIES.map(c => h('option', { value: c.code }, c.label))
  );
  function updateVerticalsFromIndustryArticles() {
    const ind = industrySel.value;
    const verts = (INDUSTRY_TO_VERTICALS[ind] || CANONICAL_VERTICALS).slice(0, 20);
    verticalSel.innerHTML = '';
    verticalSel.append(h('option', { value: '' }, 'Select vertical'));
    verts.forEach(v => verticalSel.append(h('option', { value: v }, v)));
  }
  industrySel.addEventListener('change', updateVerticalsFromIndustryArticles);
  const manualRow = h('div', { class: 'section' },
    h('div', { class: 'row articles-controls' },
      h('label', { class: 'label-required' }, 'Industry'), industrySel,
      h('label', { class: 'label-required' }, 'Vertical'), verticalSel,
      h('label', {}, 'Country'), countrySel
    )
  );
  setMode(MODE_MANUAL);
  // Populate verticals on initial render (when no industry selected)
  updateVerticalsFromIndustryArticles();

  // Background inputs removed per request

  // Customisation
  const tones = ['Warm & conversational','Slightly more formal','Upbeat and cheeky','Inspiring & Empowering','Gentle and warm','Informative and direct','Emotional and inspiring','Confident, expert, factual (Authoritative)','Warm, understanding, emotionally in-tune (Empathetic)','Casual, relaxed, friendly (Conversational)','Uplifting, motivational, purpose-driven (Inspiring)','Polished, neutral, minimal fluff (Professional)','Humorous, clever, youth-targeted (Witty/Playful)','Gentle, comforting, calm and grounded (Reassuring)','Stats-focused, analytical, objective (Data-driven)'];
  const styles = ['Narrative / Story-Driven','Conversational','Instructional / How-To','Persuasive / Conversion-Oriented','Analytical / Data-Led','Editorial / Journalistic','Narrative + Persuasive','Instructional + Conversational','Analytical + Third-Person','Narrative + First-Person','Poetic + Journalistic','Comparative + Listicle'];
  const toneSel = h('select', { class: 'select' }, h('option', { value: '' }, 'Select...'), ...tones.map(t => h('option', { value: t }, t)));
  const styleSel = h('select', { class: 'select' }, h('option', { value: '' }, 'Select...'), ...styles.map(s => h('option', { value: s }, s)));
  const bannedWords = h('input', { class: 'input', placeholder: 'Banned words' });
  const keywordsIn = h('input', { class: 'input', placeholder: 'Keywords to include' });
  const customSection = h('div', { class: 'section' },
    h('div', { class: 'row articles-controls' },
      h('label', {}, 'Banned words'), bannedWords,
      h('label', {}, 'Tone'), toneSel,
      h('label', {}, 'Style'), styleSel
    ),
    h('div', { class: 'row' },
      h('label', {}, 'Keywords to include'), keywordsIn
    )
  );

  // Step 1: Get trends + insights
  const insightsList = h('ul', {});
  const getTrendsBtn = h('button', { class: 'btn btn-primary' }, 'Get Trends + Insights');
  getTrendsBtn.addEventListener('click', async () => {
    getTrendsBtn.disabled = true; const prev = getTrendsBtn.textContent; getTrendsBtn.textContent = 'Generating…';
    await new Promise(r => setTimeout(r, 600));
    const base = currentMode === MODE_EVENT ? eventSel.value || 'Selected event' : (verticalSel.value || 'Selected vertical');
    const items = [
      `Market activity rising around ${base.toLowerCase()}`,
      `User search queries spike for ${base.toLowerCase()}`,
      `Competitive content gaps present opportunities`,
      `Common user objections and questions identified`,
      `Fresh angles suitable for ${styleSel.value || 'your chosen style'}`
    ];
    insightsList.innerHTML = '';
    items.forEach(x => insightsList.append(h('li', {}, x)));
    getTrendsBtn.textContent = prev; getTrendsBtn.disabled = false;
    headlinesCard.style.display = '';
  });
  const insightsCard = h('div', { class: 'card full' },
    h('h3', {}, 'Step 1 — Trends & Insights'),
    h('div', { class: 'toolbar' }, getTrendsBtn),
    h('div', {}, insightsList)
  );

  // Step 2: Create headlines
  const headlineList = h('div', {});
  const selectedHeadline = h('input', { class: 'input', placeholder: 'Selected headline (editable)' });
  const regenHeadlinesBtn = h('button', { class: 'btn btn-primary' }, 'Regenerate headlines');
  const createHeadlinesBtn = h('button', { class: 'btn btn-primary' }, 'Create Headlines');
  function fabricateHeadlines() {
    const base = (verticalSel.value || eventSel.value || 'Your Topic').replace(/\s+/g, ' ');
    return [
      `The Future of ${base}: Trends You Should Know`,
      `How ${base} Is Transforming Consumer Decision-Making`,
      `${base}: 5 Key Insights From Recent Data`,
      `Beginner’s Guide: Getting Started with ${base}`,
      `Expert Tips to Optimise Your Strategy for ${base}`
    ];
  }
  function renderHeadlines() {
    headlineList.innerHTML = '';
    fabricateHeadlines().forEach((hln, i) => {
      const id = `h-${i}-${Date.now()}`;
      const radio = h('input', { type: 'radio', name: 'headline', id });
      radio.addEventListener('change', () => { selectedHeadline.value = hln; updateArticleEnabled(); });
      const label = h('label', { for: id, style: 'cursor:pointer' }, hln);
      headlineList.append(h('div', { class: 'row' }, radio, label));
    });
  }
  createHeadlinesBtn.addEventListener('click', async () => {
    createHeadlinesBtn.disabled = true; const prev = createHeadlinesBtn.textContent; createHeadlinesBtn.textContent = 'Creating…';
    await new Promise(r => setTimeout(r, 500));
    renderHeadlines();
    if (!selectedHeadline.value) { selectedHeadline.value = fabricateHeadlines()[0]; }
    createHeadlinesBtn.textContent = prev; createHeadlinesBtn.disabled = false;
    articleCard.style.display = '';
    updateArticleEnabled();
  });
  regenHeadlinesBtn.addEventListener('click', () => { renderHeadlines(); selectedHeadline.value = fabricateHeadlines()[0]; updateArticleEnabled(); });
  const headlinesCard = h('div', { class: 'card full', style: 'display:none' },
    h('h3', {}, 'Step 2 — Create Headlines'),
    h('div', { class: 'toolbar' }, createHeadlinesBtn, regenHeadlinesBtn),
    headlineList,
    h('div', { class: 'row', style: 'margin-top:10px' }, selectedHeadline)
  );

  // Step 3: Generate article (editable) + export + visuals
  const articleArea = h('textarea', { class: 'input', rows: '12', placeholder: 'Generated article will appear here. You can edit freely.' });
  const exportBtn = h('button', { class: 'btn btn-primary', disabled: 'disabled' }, '⬇ Export doc');
  function exportDocFile(filename, content) {
    try {
      const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 300);
    } catch {}
  }
  exportBtn.addEventListener('click', () => {
    if (!(articleArea.value || '').trim()) return;
    const name = (selectedHeadline.value || 'article').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
    exportDocFile(`${name || 'article'}.doc`, articleArea.value);
  });
  const genArticleBtn = h('button', { class: 'btn btn-primary', disabled: 'disabled' }, 'Generate Article');
  function updateArticleEnabled() {
    genArticleBtn.disabled = !(selectedHeadline.value || '').trim();
    exportBtn.disabled = !(articleArea.value || '').trim();
  }
  selectedHeadline.addEventListener('input', updateArticleEnabled);
  articleArea.addEventListener('input', updateArticleEnabled);
  genArticleBtn.addEventListener('click', async () => {
    genArticleBtn.disabled = true; const prev = genArticleBtn.textContent; genArticleBtn.textContent = 'Generating…';
    await new Promise(r => setTimeout(r, 700));
    const head = selectedHeadline.value || 'Your Article';
    const tone = toneSel.value || 'Professional';
    const style = styleSel.value || 'Conversational';
    articleArea.value =
`# ${head}

Introduction — In this ${style.toLowerCase()} piece, we explore the latest developments with a ${tone.toLowerCase()} tone.

- Trend 1: Context and why it matters
- Trend 2: User needs and search intent
- Trend 3: Actionable recommendations

Conclusion — Clear next steps and a concise wrap-up.`;
    genArticleBtn.textContent = prev; genArticleBtn.disabled = false; updateArticleEnabled();
    visualsCard.style.display = '';
  });
  const articleCard = h('div', { class: 'card full', style: 'display:none' },
    h('h3', {}, 'Step 3 — Generate Article'),
    h('div', { class: 'toolbar' }, genArticleBtn, exportBtn),
    articleArea
  );

  // Visuals
  const imgCreate = h('button', { class: 'btn btn-primary' }, 'Create image');
  const imgRegen = h('button', { class: 'btn btn-primary hidden' }, 'Regenerate image');
  const infCreate = h('button', { class: 'btn btn-primary' }, 'Create infographic');
  const infRegen = h('button', { class: 'btn btn-primary hidden' }, 'Regenerate infographic');
  function withWorking(btn, text, done) {
    return (async () => {
      const prev = btn.textContent; btn.disabled = true; btn.textContent = text;
      await new Promise(r => setTimeout(r, 600));
      btn.textContent = done || prev; btn.disabled = false;
    })();
  }
  imgCreate.addEventListener('click', async () => { await withWorking(imgCreate, 'Creating image…', 'Create image'); imgRegen.classList.remove('hidden'); });
  imgRegen.addEventListener('click', async () => { await withWorking(imgRegen, 'Regenerating…', 'Regenerate image'); });
  infCreate.addEventListener('click', async () => { await withWorking(infCreate, 'Creating infographic…', 'Create infographic'); infRegen.classList.remove('hidden'); });
  infRegen.addEventListener('click', async () => { await withWorking(infRegen, 'Regenerating…', 'Regenerate infographic'); });
  const visualsCard = h('div', { class: 'card full', style: 'display:none' },
    h('h3', {}, 'Step 4 — Visuals'),
    h('div', { class: 'split-2' },
      h('div', { class: 'card' }, h('h4', { class: 'card-title' }, 'Header image'), h('div', { class: 'toolbar' }, imgCreate, imgRegen)),
      h('div', { class: 'card' }, h('h4', { class: 'card-title' }, 'Infographic'), h('div', { class: 'toolbar' }, infCreate, infRegen))
    )
  );

  // Compose page
  root.append(hero, tabs, eventRow, manualRow, customSection, insightsCard, headlinesCard, articleCard, visualsCard);
}

export function renderEvents(root) {
  root.innerHTML = '';
  // Page header
  const hero = h('div', { class: 'page-hero' },
    h('h1', {}, 'Seasonal Events'),
    h('p', {}, 'Research and curate seasonal events to optimise and implement into your workflow and content strategy.')
  );
  const monthLabel = h('label', { class: 'label-required' }, 'Month');
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthSel = h('select', { class: 'select', style: 'width:160px' },
    h('option', { value: '' }, 'Select'),
    ...months.map((m) => h('option', { value: m }, m)),
  );
  // Leave as "Select" by default (required field)
  // Removed prev/next arrows per request
  const countriesLabel = h('label', {}, 'Countries (Optional)');
  const countriesSel = h('select', { class: 'select', style: 'width:160px' },
    h('option', { value: '' }, 'Select'),
    ...COUNTRIES.map(c => h('option', { value: c.code }, c.code))
  );
  const verticalLabel = h('label', {}, 'Vertical (Optional)');
  const verticalSel = h('select', { class: 'select', style: 'width:160px' },
    h('option', { value: '' }, 'Select'),
    ...CANONICAL_VERTICALS.map(v => h('option', { value: v }, v))
  );
  const commercialChk = h('input', { type: 'checkbox', checked: 'checked' });
  const commercialWrap = h('label', { class: 'checkbox' }, commercialChk, 'Commercial only');
  const loadBtn = h('button', { class: 'btn btn-primary' }, 'Load');
  const exportBtn = h('button', { class: 'btn btn-primary' }, '⬇ Export CSV');
  // (meta row removed per feedback)
  const grid = h('div', { class: 'card-grid' });
  const searchInput = h('input', { class: 'input', placeholder: 'Quick search…', style: 'width:300px' });
  const searchBtn = h('button', { class: 'btn btn-primary' }, 'Search');

  function setMonth(delta) {
    // If no month is chosen, start from current month
    let m = monthSel.value ? (months.indexOf(monthSel.value) + 1) : (new Date().getMonth() + 1);
    m += delta;
    if (m < 1) m = 12; if (m > 12) m = 1;
    monthSel.value = months[m - 1];
  }
  // no arrow listeners

  function deriveRelevance(ev, vertical) {
    const txt = `${ev.name || ''} ${ev.description || ''}`.toLowerCase();
    const v = (vertical || '').toLowerCase();
    if (!v) return { relevant: true, why: 'All countries/verticals selected' };
    const hit = txt.includes(v);
    return { relevant: hit, why: hit ? `Matches vertical: ${vertical}` : `Does not mention ${vertical}` };
  }

  let lastEvents = [];

  async function doLoad() {
    grid.innerHTML = '';
    const mIdx = months.indexOf(monthSel.value) + 1;
    if (mIdx <= 0) {
      grid.append(card('Select a month', 'Month is required. Please choose a month from the dropdown.'));
      return;
    }
    const month = mIdx;
    const countries = Array.from(countriesSel.selectedOptions).map(o => o.value).filter(Boolean);
    const vertical = verticalSel.value || '';
    const commercialOnly = !!commercialChk.checked;
    loadBtn.disabled = true; loadBtn.textContent = 'Loading…';
    // brief delay so the loading state is visible
    await new Promise(r => setTimeout(r, 500));
    try {
      const { events } = computeSeasonalEvents({ month, countries: countries.length ? countries : COUNTRIES.map(c=>c.code), commercialOnly });
      lastEvents = events.map(ev => {
        const rel = deriveRelevance(ev, vertical);
        return { ...ev, _relevant: rel.relevant, _why: rel.why, _verticals: vertical ? [vertical] : [] };
      });
    } catch (err) {
      grid.append(card('Error', 'Failed to load events. Please try again.'));
      loadBtn.disabled = false; loadBtn.textContent = 'Load';
      return;
    }
    loadBtn.disabled = false; loadBtn.textContent = 'Load';
    // render
    renderList();
    if (grid.children.length === 0) grid.append(card('No events', 'Try a different month or countries.'));
  }

  function renderList() {
    grid.innerHTML = '';
    const q = (searchInput.value || '').toLowerCase();
    const selectedVertical = verticalSel.value || '';
    lastEvents
      .filter(ev => !q || (`${ev.name||''} ${ev.description||''}`).toLowerCase().includes(q))
      .forEach(ev => {
        const top = h('div', { class: 'toolbar' },
          h('span', { class: 'badge' }, ev._country || ev.country || ''),
          h('span', { class: 'pill' }, ev.date || ''),
        );
        // Expandable body
        const relChips = h('div', { class: 'toolbar' },
          ...(selectedVertical ? [h('span', { class: 'chip' }, selectedVertical)] : [])
        );
        const relBlock = h('div', {}, h('div', { class: 'muted' }, ev._why || 'Relevance not calculated'), relChips);
        const bestPractices = h('ul', {},
          h('li', {}, 'Use clear H1/DH1 with market phrasing'),
          h('li', {}, 'Add brief compliance notes if needed'),
          h('li', {}, 'Mobile-first layout with scannable bullets')
        );
        const suggestions = h('div', {},
          h('div', { class: 'muted' }, 'Content suggestions'),
          h('p', {}, ['H1: ', ev.name || '']),
          h('p', {}, ['DH1: ', 'Concise value proposition aligned to the event']),
          h('p', {}, ['H2: ', 'What, When, Eligibility']),
          h('p', {}, ['Article headline: ', ev.name || '']),
          h('p', {}, ['Ribbon copy: ', `Limited window • Updated ${ev.date || ''}`]),
          h('p', {}, ['BTC paragraph: ', 'Short paragraph describing what visitors will get for this period']),
        );
        const body = h('div', { class: 'card-body' },
          h('p', {}, ev.description || ''),
          h('div', { class: 'section' }, h('strong', {}, 'Relevance'), relBlock),
          h('div', { class: 'section' }, h('strong', {}, 'Best practices'), bestPractices),
          h('div', { class: 'section' }, h('strong', {}, 'Content suggestions'), suggestions),
        );
        const header = h('div', {
          class: 'card-header',
          onClick: (e) => { const card = e.currentTarget.parentElement; card.classList.toggle('expanded'); }
        },
          h('h3', { class: 'card-title' }, ev.name || 'Untitled'),
          h('div', { class: 'card-actions' }, top)
        );
        const cardEl = h('div', { class: 'card' }, header, body);
        grid.append(cardEl);
      });
  }

  loadBtn.addEventListener('click', doLoad);
  exportBtn.addEventListener('click', async () => {
    const prevText = exportBtn.textContent;
    exportBtn.disabled = true;
    exportBtn.textContent = 'Exporting…';
    await new Promise(r => setTimeout(r, 500));
    const month = (months.indexOf(monthSel.value) + 1) || (new Date().getMonth() + 1);
    const selectedVertical = verticalSel.value || '';
    const events = lastEvents.filter(ev => ev._relevant || !selectedVertical);
    const rows = [
      ['name','date','country','description','why'].join(','),
      ...events.map(ev => [
        ev.name || '',
        ev.date || '',
        ev._country || ev.country || '',
        ev.description || '',
        ev._why || ''
      ].map(v => JSON.stringify(v)).join(','))
    ].join('\\n');
    const blob = new Blob([rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const monthName = months[(month-1+12)%12];
    const a = Object.assign(document.createElement('a'), { href: url, download: `seasonal-events-${monthName}.csv` });
    a.click(); URL.revokeObjectURL(url);
    exportBtn.disabled = false;
    exportBtn.textContent = prevText;
  });

  // quick country presets removed per request
  const presets = null;

  const controls = h('div', { class: 'section' },
    // Top row: fixed controls incl. Export
    h('div', { class: 'toolbar events-controls' },
      monthLabel, monthSel,
      countriesLabel, countriesSel,
      verticalLabel, verticalSel,
      commercialWrap, loadBtn
    ),
    // Second row: quick search inline with its button
    h('div', { class: 'toolbar search-row' }, searchInput, searchBtn),
    // Third row: export only (fixed position above results)
    h('div', { class: 'toolbar export-row' }, exportBtn)
  );

  searchBtn.addEventListener('click', async () => {
    searchBtn.disabled = true;
    const prevText = searchBtn.textContent;
    searchBtn.textContent = 'Searching…';
    await new Promise(r => setTimeout(r, 500));
    renderList();
    searchBtn.disabled = false;
    searchBtn.textContent = prevText;
  });

  // Render main content
  root.append(hero, controls, grid);

  // initial state: require explicit selections (month required)
}

export function renderVerticalProfiles(root) {
  root.innerHTML = '';
  const q = h('input', { class: 'input', placeholder: 'Filter verticals…' });
  const grid = h('div', { class: 'card-grid' });
  const data = CANONICAL_VERTICALS.map(t => ({ t }));
  function renderList() {
    grid.innerHTML = '';
    const term = (q.value || '').toLowerCase();
    data.filter(x => x.t.toLowerCase().includes(term)).forEach(x => grid.append(card(x.t, 'Profile summary…')));
  }
  q.addEventListener('input', renderList);
  renderList();
  root.append(section('Vertical Profiles', q), grid);
}

export function renderWelcome(root) {
  root.innerHTML = '';
  const welcome = h('div', { class: 'welcome-wrap' },
    h('div', { class: 'welcome-hero' },
      h('h2', {}, 'Welcome to your content hub!'),
      h('p', {}, [
        'Your one-stop destination to ',
        h('span', { class: 'accent' }, 'create'),
        ', ',
        h('span', { class: 'accent' }, 'optimise'),
        ', and ',
        h('span', { class: 'accent' }, 'brainstorm'),
        ' all things content. Explore the options on the left to supercharge your content strategy.'
      ])
    )
  );
  root.append(welcome);
}

export function renderFunnel(root) {
  root.innerHTML = '';
  const q = h('input', { class: 'input', placeholder: 'Filter optimisation ideas…' });
  const grid = h('div', { class: 'card-grid' });
  const ideas = [
    'Shorten forms',
    'Sticky CTA on mobile',
    'Trust signals above the fold',
    'Comparison table',
    'Reduce steps to checkout',
  ].map(t => ({ t }));
  function renderList() {
    grid.innerHTML = '';
    const term = (q.value || '').toLowerCase();
    ideas.filter(x => x.t.toLowerCase().includes(term)).forEach(x => grid.append(card(x.t, 'Funnel idea')));
  }
  q.addEventListener('input', renderList);
  renderList();
  root.append(section('Funnel Optimisation', q), grid);
}

const ROUTES = {
  '/welcome': renderWelcome,
  '/seasonal-events': renderEvents,
  '/ai-search': renderAiSearch,
  '/articles': renderArticles,
  '/funnel': renderFunnel,
  '/vertical-profiles': renderVerticalProfiles,
};

// Router
const app = document.getElementById('app');
function renderRoute() {
  try {
    const hash = location.hash || '#/welcome';
    const path = hash.replace(/^#/, '');
    const page = ROUTES[path] || renderWelcome;
    page(app);
    // Highlight active link
    document.querySelectorAll('.nav-link').forEach(a => {
      if (a.getAttribute('href') === `#${path}`) a.classList.add('active');
      else a.classList.remove('active');
    });
  } catch (err) {
    // Fail-safe: show a minimal welcome so the page never appears blank
    console.error('Render error:', err);
    app.innerHTML = '';
    const fallback = document.createElement('div');
    fallback.className = 'welcome-wrap';
    fallback.innerHTML = `
      <div class="welcome-hero">
        <h2>Welcome to your content hub!</h2>
        <p>Your one-stop destination to <strong>create</strong>, <strong>optimise</strong>, and <strong>brainstorm</strong> all things content.</p>
      </div>`;
    app.appendChild(fallback);
  }
}
window.addEventListener('hashchange', renderRoute);
window.addEventListener('DOMContentLoaded', renderRoute);


