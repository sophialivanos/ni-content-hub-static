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

// Lightweight editor tools for any textarea: expand, tighten, +/- chars, add context
function attachEditorTools(textarea, options = {}) {
  if (!textarea || textarea.__hasTools) return;
  textarea.__hasTools = true;
  const { hideExpandReduce = false } = options;
  const tools = h('div', { class: 'editor-tools' });
  const expandBtn = hideExpandReduce ? null : h('button', { class: 'btn btn-outline' }, 'Expand');
  const tightenBtn = hideExpandReduce ? null : h('button', { class: 'btn btn-outline' }, 'Reduce');
  const plusBtn = h('button', { class: 'btn btn-outline' }, '+ chars');
  const minusBtn = h('button', { class: 'btn btn-outline' }, '− chars');
  const ctxInput = h('input', { class: 'input', placeholder: 'Add context…', style: 'width:260px' });
  const ctxBtn = h('button', { class: 'btn btn-outline' }, 'Apply');
  const counter = h('span', { class: 'muted' }, '');
  if (!hideExpandReduce) tools.append(expandBtn, tightenBtn);
  tools.append(plusBtn, minusBtn, ctxInput, ctxBtn, h('span', { class: 'spacer' }), counter);
  textarea.parentNode && textarea.parentNode.insertBefore(tools, textarea);
  function getSel() {
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    return { start, end };
  }
  function setVal(newVal, selToEnd = false) {
    textarea.value = newVal;
    updateCount();
    if (selToEnd) {
      textarea.selectionStart = textarea.selectionEnd = newVal.length;
    }
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function updateCount() { counter.textContent = `${(textarea.value || '').length} chars`; }
  function expandText(txt) {
    // Naive expansion: duplicate key sentences and add connective phrases
    const parts = txt.split(/([.!?]\s+)/);
    if (parts.length < 3) return txt + ' Additionally, here are more details to consider.';
    return parts.slice(0, parts.length - 1).join('') + ' Furthermore, consider supporting details and examples for clarity.';
  }
  function reduceText(txt) {
    // Naive reduction: trim to ~85% by removing middle sentences/extra spaces
    const target = Math.max(0, Math.floor(txt.length * 0.85));
    if (txt.length <= target) return txt.trim();
    return (txt.slice(0, target).replace(/\s+\S*$/, '') + '…').trim();
  }
  function plusChars(txt) { return txt + ' ' + 'More context to enrich and elaborate on key points.'.slice(0, Math.max(24, Math.min(80, Math.floor(txt.length * 0.1)))); }
  function minusChars(txt) { return reduceText(txt); }
  if (expandBtn) expandBtn.addEventListener('click', () => {
    const { start, end } = getSel();
    const v = textarea.value || '';
    const sel = start !== end ? v.slice(start, end) : v;
    const out = expandText(sel);
    if (start !== end) setVal(v.slice(0, start) + out + v.slice(end), true);
    else setVal(out, true);
  });
  if (tightenBtn) tightenBtn.addEventListener('click', () => {
    const { start, end } = getSel();
    const v = textarea.value || '';
    const sel = start !== end ? v.slice(start, end) : v;
    const out = reduceText(sel);
    if (start !== end) setVal(v.slice(0, start) + out + v.slice(end), true);
    else setVal(out, true);
  });
  plusBtn.addEventListener('click', () => {
    const { start, end } = getSel();
    const v = textarea.value || '';
    const sel = start !== end ? v.slice(start, end) : v;
    const out = plusChars(sel);
    if (start !== end) setVal(v.slice(0, start) + out + v.slice(end), true);
    else setVal(out, true);
  });
  minusBtn.addEventListener('click', () => {
    const { start, end } = getSel();
    const v = textarea.value || '';
    const sel = start !== end ? v.slice(start, end) : v;
    const out = minusChars(sel);
    if (start !== end) setVal(v.slice(0, start) + out + v.slice(end), true);
    else setVal(out, true);
  });
  ctxBtn.addEventListener('click', () => {
    const ctx = (ctxInput.value || '').trim();
    if (!ctx) return;
    const { start, end } = getSel();
    const v = textarea.value || '';
    const sel = start !== end ? v.slice(start, end) : v;
    const out = sel + (sel ? ' ' : '') + `Additional context: ${ctx}.`;
    if (start !== end) setVal(v.slice(0, start) + out + v.slice(end), true);
    else setVal(out, true);
    ctxInput.value = '';
  });
  textarea.addEventListener('input', updateCount);
  updateCount();
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
    ...COUNTRIES.map(c => h('option', { value: c.code }, `${c.label} (${c.code})`))
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
    regenImgBtn.addEventListener('click', () => { createImgBtn.click(); });
    regenInfBtn.addEventListener('click', () => { createInfBtn.click(); });
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
  attachEditorTools(outputArea);

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
    ...COUNTRIES.map(c => h('option', { value: c.code }, `${c.label} (${c.code})`))
  );
  function updateVerticalsFromIndustryArticles() {
    const ind = industrySel.value;
    const verts = (INDUSTRY_TO_VERTICALS[ind] || CANONICAL_VERTICALS).slice(0, 20);
    verticalSel.innerHTML = '';
    verticalSel.append(h('option', { value: '' }, 'Select vertical'));
    verts.forEach(v => verticalSel.append(h('option', { value: v }, v)));
  }
  industrySel.addEventListener('change', () => { updateVerticalsFromIndustryArticles(); updateTrendsEnabled(); });
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
  const getTrendsBtn = h('button', { class: 'btn btn-primary', disabled: 'disabled' }, 'Get Trends + Insights');
  function updateTrendsEnabled() {
    const hasIndustry = (industrySel.value || '').trim().length > 0;
    const hasVertical = (verticalSel.value || '').trim().length > 0;
    getTrendsBtn.disabled = !(hasIndustry && hasVertical);
  }
  verticalSel.addEventListener('change', updateTrendsEnabled);
  updateTrendsEnabled();
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
    // Ensure Selected headline box is empty until a headline is chosen
    selectedHeadline.value = '';
    updateArticleEnabled();
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
  const regenHeadlinesBtn = h('button', { class: 'btn btn-primary hidden' }, 'Regenerate headlines');
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
    // Do not auto-populate; require the user to select a headline
    selectedHeadline.value = '';
    createHeadlinesBtn.textContent = prev; createHeadlinesBtn.disabled = false;
    articleCard.style.display = '';
    updateArticleEnabled();
    regenHeadlinesBtn.classList.remove('hidden');
  });
  regenHeadlinesBtn.addEventListener('click', () => { renderHeadlines(); selectedHeadline.value = ''; updateArticleEnabled(); });
  const headlinesCard = h('div', { class: 'card full', style: 'display:none' },
    h('h3', {}, 'Step 2 — Create Headlines'),
    h('div', { class: 'toolbar' }, createHeadlinesBtn, regenHeadlinesBtn),
    headlineList,
    h('div', { class: 'row', style: 'margin-top:10px' }, selectedHeadline)
  );

  // Step 3: Generate article (editable) + export + visuals
  const articleArea = h('textarea', { class: 'input', rows: '12', placeholder: 'Generated article will appear here. You can edit freely.' });
  const extraContext = h('textarea', { class: 'input', rows: '2', placeholder: 'Additional context for the article (optional)' });
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
    const ctx = (extraContext.value || '').trim();
    articleArea.value =
`# ${head}

Introduction — In this ${style.toLowerCase()} piece, we explore the latest developments with a ${tone.toLowerCase()} tone.

- Trend 1: Context and why it matters
- Trend 2: User needs and search intent
- Trend 3: Actionable recommendations

${ctx ? `Additional context — ${ctx}\n\n` : ''}Conclusion — Clear next steps and a concise wrap-up.`;
    genArticleBtn.textContent = prev; genArticleBtn.disabled = false; updateArticleEnabled();
    visualsCard.style.display = '';
  });
  const articleCard = h('div', { class: 'card full', style: 'display:none' },
    h('h3', {}, 'Step 3 — Generate Article'),
    h('div', { class: 'toolbar' }, genArticleBtn, exportBtn),
    extraContext,
    articleArea
  );
  // attach editor tools
  attachEditorTools(articleArea);

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
  imgRegen.addEventListener('click', () => { imgCreate.click(); });
  infCreate.addEventListener('click', async () => { await withWorking(infCreate, 'Creating infographic…', 'Create infographic'); infRegen.classList.remove('hidden'); });
  infRegen.addEventListener('click', () => { infCreate.click(); });
  const visualsCard = h('div', { class: 'card full', style: 'display:none' },
    h('h3', {}, 'Step 4 — Visuals'),
    h('div', { class: 'split-2' },
      h('div', { class: 'card' }, h('h4', { class: 'card-title' }, 'Header image'), h('div', { class: 'toolbar' }, imgCreate, imgRegen)),
      h('div', { class: 'card' }, h('h4', { class: 'card-title' }, 'Infographic'), h('div', { class: 'toolbar' }, infCreate, infRegen))
    )
  );

  // Compose page
  root.append(hero, manualRow, customSection, insightsCard, headlinesCard, articleCard, visualsCard);
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
  const yearLabel = h('label', { class: 'label-required' }, 'Year');
  const years = Array.from({ length: 8 }).map((_, idx) => 2023 + idx);
  const yearSel = h('select', { class: 'select', style: 'width:160px' },
    h('option', { value: '' }, 'Select'),
    ...years.map(y => h('option', { value: String(y) }, String(y)))
  );
  // Leave as "Select" by default (required field)
  // Removed prev/next arrows per request
  const countriesLabel = h('label', {}, 'Country (Optional)');
  const countriesSel = h('select', { class: 'select', style: 'width:160px' },
    h('option', { value: '' }, 'Select'),
    ...COUNTRIES.map(c => h('option', { value: c.code }, `${c.label} (${c.code})`))
  );
  const verticalLabel = h('label', {}, 'Vertical (Optional)');
  const verticalSel = h('select', { class: 'select', style: 'width:160px' },
    h('option', { value: '' }, 'Select'),
    ...CANONICAL_VERTICALS.map(v => h('option', { value: v }, v))
  );
  const commercialChk = h('input', { type: 'checkbox', checked: 'checked' });
  const commercialWrap = h('label', { class: 'checkbox' }, commercialChk, 'Commercial only');
  const loadBtn = h('button', { class: 'btn btn-primary', disabled: 'disabled' }, 'Load');
  const exportBtn = h('button', { class: 'btn btn-primary', disabled: 'disabled' }, '⬇ Export CSV');
  // (meta row removed per feedback)
  const grid = h('div', { class: 'card-grid' });
  const searchInput = h('input', { class: 'input', placeholder: 'Quick search…', style: 'width:300px' });
  const searchBtn = h('button', { class: 'btn btn-primary' }, 'Search');
  // API output area shown under the top section
  const apiOutPre = h('pre', { class: 'muted', style: 'white-space:pre-wrap;margin:0' }, '');
  const apiOutSection = h('div', { class: 'section', style: 'display:none' },
    h('div', { class: 'row' }, h('label', {}, 'Events Discovery (API response)')),
    apiOutPre
  );

  function setMonth(delta) {
    // If no month is chosen, start from current month
    let m = monthSel.value ? (months.indexOf(monthSel.value) + 1) : (new Date().getMonth() + 1);
    m += delta;
    if (m < 1) m = 12; if (m > 12) m = 1;
    monthSel.value = months[m - 1];
  }
  // no arrow listeners
  function updateEventsReady() {
    const ready = !!monthSel.value && !!yearSel.value;
    loadBtn.disabled = !ready;
    exportBtn.disabled = !ready;
  }
  monthSel.addEventListener('change', updateEventsReady);
  yearSel.addEventListener('change', updateEventsReady);
  updateEventsReady();

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
    const yearValue = yearSel.value;
    if (!yearValue) {
      grid.append(card('Select a year', 'Year is required. Please choose a year from the dropdown.'));
      return;
    }
    const countries = Array.from(countriesSel.selectedOptions).map(o => o.value).filter(Boolean);
    const vertical = verticalSel.value || '';
    const commercialOnly = !!commercialChk.checked;
    loadBtn.disabled = true; loadBtn.textContent = 'Loading…';
    // brief delay so the loading state is visible
    await new Promise(r => setTimeout(r, 500));
    try {
      // Call external API with selected params; country and vertical optional
      try {
        const payload = JSON.stringify({
          version: '0',
          args: Object.assign(
            {
              month: String(month),
              year: String(yearValue)
            },
            countriesSel.value ? { country: String(countriesSel.value) } : {},
            vertical ? { vertical: String(vertical) } : {}
          )
        });
        console.log('Payload being sent:', payload);
        const resp = await fetch('https://chat-gpt-production.naturalint.com/lf/workflow/content_events_discovery', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json'
          },
          body: payload,
        });
        const text = await resp.text();
        apiOutPre.textContent = text || '(empty response)';
        apiOutSection.style.display = '';
      } catch (e) {
        apiOutPre.textContent = 'API request failed.';
        apiOutSection.style.display = '';
      }
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
      yearLabel, yearSel,
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
  root.append(hero, controls, apiOutSection, grid);

  // initial state: require explicit selections (month required)
}

export function renderVerticalProfiles(root) {
  root.innerHTML = '';
  const hero = h('div', { class: 'page-hero' },
    h('h1', {}, 'Vertical Profile'),
    h('p', {}, 'Generate a vertical profile with key demographics, regulations, personas, preferences, and content considerations.')
  );

  // Selectors
  const industrySel = h('select', { class: 'select' },
    h('option', { value: '' }, 'Select industry'),
    ...INDUSTRIES.map(i => h('option', { value: i }, i))
  );
  const verticalSel = h('select', { class: 'select' },
    h('option', { value: '' }, 'Select vertical')
  );
  function updateVerticalsFromIndustryVP() {
    const ind = industrySel.value;
    const verts = (INDUSTRY_TO_VERTICALS[ind] || CANONICAL_VERTICALS).slice(0, 24);
    verticalSel.innerHTML = '';
    verticalSel.append(h('option', { value: '' }, 'Select vertical'));
    verts.forEach(v => verticalSel.append(h('option', { value: v }, v)));
    updateReady();
  }
  industrySel.addEventListener('change', updateVerticalsFromIndustryVP);
  const countrySel = h('select', { class: 'select' },
    h('option', { value: '' }, 'Select country'),
    ...COUNTRIES.map(c => h('option', { value: c.code }, `${c.label} (${c.code})`))
  );
  const controls = h('div', { class: 'section' },
    h('div', { class: 'row articles-controls' },
      h('label', { class: 'label-required' }, 'Industry'), industrySel,
      h('label', { class: 'label-required' }, 'Vertical'), verticalSel,
      h('label', {}, 'Country'), countrySel
    )
  );

  // CTA
  const genBtn = h('button', { class: 'btn btn-primary', disabled: 'disabled' }, 'Generate Vertical Profile');
  const exportBtn = h('button', { class: 'btn btn-primary', disabled: 'disabled' }, '⬇ Export doc');
  let lastProfile = null;
  function exportDocFile(filename, content) {
    try {
      const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 300);
    } catch {}
  }
  exportBtn.addEventListener('click', () => {
    if (!lastProfile) return;
    const v = verticalSel.value || 'Vertical';
    const c = countrySel.value || 'US';
    const lines = [
      `Vertical Profile — ${v} (${c})`,
      '',
      'User Demographics',
      ...lastProfile.demographics.map(x => `- ${x}`),
      '',
      'Regulations',
      ...lastProfile.regulations.map(x => `- ${x}`),
      '',
      'Personas',
      ...lastProfile.personas.map(x => `- ${x}`),
      '',
      'Content Considerations',
      ...lastProfile.considerations.map(x => `- ${x}`),
      '',
      'Platform and Device Preferences',
      ...lastProfile.platforms.map(x => `- ${x}`),
    ];
    exportDocFile(`${v.toLowerCase().replace(/[^a-z0-9]+/g,'-') || 'vertical'}-profile.doc`, lines.join('\n'));
  });
  function updateReady() {
    const ready = !!industrySel.value && !!verticalSel.value;
    genBtn.disabled = !ready;
    exportBtn.disabled = !lastProfile;
  }
  verticalSel.addEventListener('change', updateReady);
  updateVerticalsFromIndustryVP();
  const cta = h('div', { class: 'section' }, h('div', { class: 'toolbar' }, genBtn, exportBtn));

  // Outputs
  const outCard = h('div', { class: 'card full', style: 'display:none' });
  function ul(items) { return h('ul', {}, ...items.map(i => h('li', {}, i))); }
  function fabricateProfile() {
    const v = verticalSel.value || 'the selected vertical';
    const c = countrySel.value || 'US';
    const countryLabel = (COUNTRIES.find(x => x.code === c)?.label) || 'United States';
    const demographics = [
      `Adults aged 25–54 are primary decision-makers for ${v.toLowerCase()}.`,
      `Balanced gender distribution; slight skew by sub-vertical.`,
      `High research intent on mobile; converts on desktop.`
    ];
    const regulations = [
      `Country-specific regulations in ${countryLabel} apply to ${v.toLowerCase()}.`,
      `Disclosure, data privacy, and advertising claims must follow local laws.`,
      `Review licencing requirements for publishers/advertisers as applicable.`
    ];
    const personas = [
      `Professionals evaluating ${v.toLowerCase()} to solve an immediate need.`,
      `Budget-conscious researchers comparing ${v.toLowerCase()} options.`,
      `Risk-averse users looking for social proof and guarantees.`
    ];
    const considerations = [
      `Lead with outcome/value before features; show quick proof (ratings, badges).`,
      `Localise examples and pricing to ${countryLabel}; avoid region-specific jargon.`,
      `Answer top objections and highlight differentiators early on the page.`
    ];
    const platforms = [
      `Mobile-first consumption; ensure fast loads and scannable sections.`,
      `Retargeting on ${['Facebook','YouTube','Google'].join(', ')} performs well with value-led hooks.`,
      `Desktop sees higher form completion; simplify fields for mobile.`
    ];
    return { demographics, regulations, personas, considerations, platforms };
  }
  genBtn.addEventListener('click', async () => {
    if (genBtn.disabled) return;
    const prev = genBtn.textContent; genBtn.disabled = true; genBtn.textContent = 'Generating…';
    await new Promise(r => setTimeout(r, 600));
    const { demographics, regulations, personas, considerations, platforms } = fabricateProfile();
    lastProfile = { demographics, regulations, personas, considerations, platforms };
    outCard.innerHTML = '';
    function sectionEditor(title, lines) {
      const ta = h('textarea', { class: 'input', rows: String(Math.max(3, lines.length + 1)) });
      ta.value = lines.join('\n');
      const cardEl = h('div', { class: 'card' }, h('h4', { class: 'card-title' }, title), ta);
      attachEditorTools(ta);
      return { cardEl, ta };
    }
    const s1 = sectionEditor('User Demographics', demographics);
    const s2 = sectionEditor('Regulations', regulations);
    const s3 = sectionEditor('Personas', personas);
    const s4 = sectionEditor('Content Considerations', considerations);
    const s5 = sectionEditor('Platform and Device Preferences', platforms);
    outCard.append(s1.cardEl, s2.cardEl, s3.cardEl, s4.cardEl, s5.cardEl);
    outCard.style.display = '';
    genBtn.textContent = prev; genBtn.disabled = false;
    exportBtn.disabled = false;
    // Keep a reference to the live editors for export
    lastProfile = {
      get demographics() { return (s1.ta.value || '').split(/\n/).filter(Boolean); },
      get regulations() { return (s2.ta.value || '').split(/\n/).filter(Boolean); },
      get personas() { return (s3.ta.value || '').split(/\n/).filter(Boolean); },
      get considerations() { return (s4.ta.value || '').split(/\n/).filter(Boolean); },
      get platforms() { return (s5.ta.value || '').split(/\n/).filter(Boolean); },
    };
  });

  root.append(hero, controls, cta, outCard);
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
  const hero = h('div', { class: 'page-hero' },
    h('h1', {}, 'Funnel Optimisation'),
    h('p', {}, 'Enter details for a current funnel to generate optimised variations, including rationale.')
  );

  // Controls row 1: Industry / Vertical / Platform
  const industrySel = h('select', { class: 'select' },
    h('option', { value: '' }, 'Select industry'),
    ...INDUSTRIES.map(i => h('option', { value: i }, i))
  );
  const verticalSel = h('select', { class: 'select' },
    h('option', { value: '' }, 'Select vertical')
  );
  function updateVerticalsFromIndustryFunnel() {
    const ind = industrySel.value;
    const verts = (INDUSTRY_TO_VERTICALS[ind] || CANONICAL_VERTICALS).slice(0, 20);
    verticalSel.innerHTML = '';
    verticalSel.append(h('option', { value: '' }, 'Select vertical'));
    verts.forEach(v => verticalSel.append(h('option', { value: v }, v)));
  }
  industrySel.addEventListener('change', () => { updateVerticalsFromIndustryFunnel(); updateReady(); });
  const platforms = ['Facebook','Instagram','Google Ads','YouTube','TikTok','LinkedIn','Email'];
  const platformSel = h('select', { class: 'select' },
    h('option', { value: '' }, 'Select platform'),
    ...platforms.map(p => h('option', { value: p }, p))
  );
  const row1 = h('div', { class: 'section' },
    h('div', { class: 'row articles-controls' },
      h('label', { class: 'label-required' }, 'Industry'), industrySel,
      h('label', { class: 'label-required' }, 'Vertical'), verticalSel,
      h('label', {}, 'Platform'), platformSel
    )
  );

  // Controls row 2: Persona + current funnel
  const personaArea = h('textarea', { class: 'input', rows: '2', placeholder: 'Persona (e.g., Middle-aged homeowners seeking life insurance...)' });
  const genPersonaBtn = h('button', { class: 'btn btn-primary', disabled: 'disabled' }, 'Generate persona');
  const regenPersonaBtn = h('button', { class: 'btn btn-primary hidden' }, 'Regenerate persona');
  let personaGenerated = false;
  async function withWorking(btn, text, done) { const prev = btn.textContent; btn.disabled = true; btn.textContent = text; await new Promise(r=>setTimeout(r,600)); btn.textContent = done || prev; btn.disabled = false; }
  genPersonaBtn.addEventListener('click', async () => {
    await withWorking(genPersonaBtn, 'Generating…', 'Generate persona');
    personaArea.value = `Adults considering ${verticalSel.value || 'your product'} on ${platformSel.value || 'social'}, prioritising value, clarity and trust.`;
    regenPersonaBtn.classList.remove('hidden');
    personaGenerated = true;
    updateReady();
  });
  regenPersonaBtn.addEventListener('click', async () => {
    await withWorking(regenPersonaBtn, 'Regenerating…', 'Regenerate persona');
    personaArea.value = `Audience segment for ${verticalSel.value || 'the vertical'} showing intent; responds to concise benefits and proof.`;
    personaGenerated = true;
    updateReady();
  });
  const currentFunnelArea = h('textarea', { class: 'input', rows: '2', placeholder: 'Current funnel (optional)' });
  const row2 = h('div', { class: 'section' },
    h('div', { class: 'row' }, h('label', {}, 'Persona'), personaArea, h('div', { class: 'toolbar' }, genPersonaBtn, regenPersonaBtn)),
    h('div', { class: 'row', style: 'margin-top:10px' }, h('label', {}, 'Current Funnel (optional)'), currentFunnelArea)
  );

  // Controls row 3: Tone/Style pairs
  const tones = ['Default','Warm & conversational','Slightly more formal','Upbeat and cheeky','Inspiring & Empowering','Gentle and warm','Informative and direct','Emotional and inspiring','Confident, expert, factual (Authoritative)','Warm, understanding, emotionally in-tune (Empathetic)','Casual, relaxed, friendly (Conversational)','Uplifting, motivational, purpose-driven (Inspiring)','Polished, neutral, minimal fluff (Professional)','Humorous, clever, youth-targeted (Witty/Playful)','Gentle, comforting, calm and grounded (Reassuring)','Stats-focused, analytical, objective (Data-driven)'];
  const styles = ['Default','Narrative / Story-Driven','Conversational','Instructional / How-To','Persuasive / Conversion-Oriented','Analytical / Data-Led','Editorial / Journalistic','Narrative + Persuasive','Instructional + Conversational','Analytical + Third-Person','Narrative + First-Person','Poetic + Journalistic','Comparative + Listicle'];
  const tone1 = h('select', { class: 'select' }, ...tones.map(t => h('option', { value: t === 'Default' ? '' : t }, t)));
  const style1 = h('select', { class: 'select' }, ...styles.map(s => h('option', { value: s === 'Default' ? '' : s }, s)));
  const tone2 = h('select', { class: 'select' }, ...tones.map(t => h('option', { value: t === 'Default' ? '' : t }, t)));
  const style2 = h('select', { class: 'select' }, ...styles.map(s => h('option', { value: s === 'Default' ? '' : s }, s)));
  const row3 = h('div', { class: 'section' },
    h('div', { class: 'split-2 tone-style' },
      h('div', { class: 'tone-style-col' },
        h('label', {}, 'Tone 1'), tone1,
        h('label', {}, 'Style 1'), style1
      ),
      h('div', { class: 'tone-style-col' },
        h('label', {}, 'Tone 2'), tone2,
        h('label', {}, 'Style 2'), style2
      )
    )
  );

  // CTA: Optimise Funnel
  const optimiseBtn = h('button', { class: 'btn btn-primary', disabled: 'disabled' }, 'Optimise Funnel');
  const regenVariantsBtn = h('button', { class: 'btn btn-primary hidden' }, 'Regenerate variants');
  function updateReady() {
    const ready = !!industrySel.value && !!verticalSel.value;
    genPersonaBtn.disabled = !ready;
    // Optimise requires persona to be generated
    optimiseBtn.disabled = !(ready && personaGenerated);
  }
  verticalSel.addEventListener('change', () => { personaGenerated = false; regenPersonaBtn.classList.add('hidden'); updateReady(); });
  industrySel.addEventListener('change', () => { personaGenerated = false; regenPersonaBtn.classList.add('hidden'); });
  updateVerticalsFromIndustryFunnel();
  updateReady();
  const ctaSection = h('div', { class: 'section' },
    h('div', { class: 'toolbar' }, optimiseBtn, regenVariantsBtn)
  );

  // Outputs: Variants
  const v1Title = h('input', { class: 'input', placeholder: 'Variant 1 title' });
  const v1Copy = h('textarea', { class: 'input', rows: '3', placeholder: 'Variant 1 copy (editable)' });
  const v1Hyp = h('textarea', { class: 'input', rows: '2', placeholder: 'Hypothesis / reasoning for Variant 1' });
  const v2Title = h('input', { class: 'input', placeholder: 'Variant 2 title' });
  const v2Copy = h('textarea', { class: 'input', rows: '3', placeholder: 'Variant 2 copy (editable)' });
  const v2Hyp = h('textarea', { class: 'input', rows: '2', placeholder: 'Hypothesis / reasoning for Variant 2' });
  attachEditorTools(v1Copy); attachEditorTools(v2Copy); attachEditorTools(v1Hyp); attachEditorTools(v2Hyp);
  const variantsWrap = h('div', { class: 'split-2' },
    h('div', { class: 'card' },
      h('h4', { class: 'card-title' }, 'Funnel Variant 1'),
      v1Title, v1Copy, v1Hyp
    ),
    h('div', { class: 'card' },
      h('h4', { class: 'card-title' }, 'Funnel Variant 2'),
      v2Title, v2Copy, v2Hyp
    )
  );
  const variantsCard = h('div', { class: 'card full', style: 'display:none' }, variantsWrap);

  function buildVariant(titleBase, tSel, sSel) {
    const t = (tSel.value || 'Professional').toLowerCase();
    const s = (sSel.value || 'Conversational').toLowerCase();
    return {
      title: `${titleBase} — ${platformSel.value || 'Platform'} (${s})`,
      copy:
`You care about ${verticalSel.value || 'your audience'}’s outcome — here’s how we help:
• Clear benefit 1 tied to ${platformSel.value || 'platform'}
• Social proof or trust signal
• Action-driven CTA`,
      hyp: `We expect uplift from a ${t} tone with a ${s} structure that clarifies value quickly to ${platformSel.value || 'the audience'}.`
    };
  }

  async function generateVariants() {
    const prev = optimiseBtn.textContent;
    optimiseBtn.disabled = true; optimiseBtn.textContent = 'Optimising…';
    await new Promise(r => setTimeout(r, 700));
    const base = verticalSel.value || 'your product';
    const v1 = buildVariant(`Find the right ${base} for you`, tone1, style1);
    const v2 = buildVariant(`Make ${base} decisions with confidence`, tone2, style2);
    v1Title.value = v1.title; v1Copy.value = v1.copy; v1Hyp.value = v1.hyp;
    v2Title.value = v2.title; v2Copy.value = v2.copy; v2Hyp.value = v2.hyp;
    variantsCard.style.display = '';
    optimiseBtn.textContent = prev; optimiseBtn.disabled = false;
    regenVariantsBtn.classList.remove('hidden');
  }

  optimiseBtn.addEventListener('click', async () => {
    // Respect gating: requires mandatory fields and persona generated
    const ready = !!industrySel.value && !!verticalSel.value && personaGenerated;
    if (!ready) return;
    await generateVariants();
  });
  regenVariantsBtn.addEventListener('click', async () => {
    // Regenerate from scratch: run the same generation again with current inputs
    await withWorking(regenVariantsBtn, 'Regenerating…', 'Regenerate variants');
    await generateVariants();
  });

  // If mandatory selections change, require fresh persona and hide previous variants/regenerate
  function resetAfterSelectionChange() {
    personaGenerated = false;
    regenPersonaBtn.classList.add('hidden');
    regenVariantsBtn.classList.add('hidden');
    variantsCard.style.display = 'none';
    updateReady();
  }
  industrySel.addEventListener('change', resetAfterSelectionChange);
  verticalSel.addEventListener('change', resetAfterSelectionChange);

  root.append(hero, row1, row2, row3, ctaSection, variantsCard);
}

const ROUTES = {
  '/welcome': renderWelcome,
  '/seasonal-events': renderEvents,
  '/ai-search': renderAiSearch,
  '/articles': renderArticles,
  '/funnel': renderFunnel,
  '/vertical-profiles': renderVerticalProfiles,
  '/mc-ads': renderMcAds,
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

export function renderMcAds(root) {
  root.innerHTML = '';
  const hero = h('div', { class: 'page-hero' },
    h('h1', {}, 'MC Ads, Scripts, and Brainstorming'),
    h('p', {}, 'Supports campaign ideation and rapid execution on major media channels.')
  );

  // Inputs
  const platforms = ['Facebook','Instagram','TikTok','YouTube','LinkedIn','Google Ads','Twitter/X'];
  const platformSel = h('select', { class: 'select' },
    h('option', { value: '' }, 'Select platform'),
    ...platforms.map(p => h('option', { value: p }, p))
  );
  const industrySel = h('select', { class: 'select' },
    h('option', { value: '' }, 'Select industry'),
    ...INDUSTRIES.map(i => h('option', { value: i }, i))
  );
  const verticalSel = h('select', { class: 'select' },
    h('option', { value: '' }, 'Select vertical')
  );
  function updateVerticalsFromIndustryAds() {
    const ind = industrySel.value;
    const verts = (INDUSTRY_TO_VERTICALS[ind] || CANONICAL_VERTICALS).slice(0, 24);
    verticalSel.innerHTML = '';
    verticalSel.append(h('option', { value: '' }, 'Select vertical'));
    verts.forEach(v => verticalSel.append(h('option', { value: v }, v)));
    updateReady();
  }
  industrySel.addEventListener('change', updateVerticalsFromIndustryAds);
  const bannedWords = h('input', { class: 'input', placeholder: 'Banned words (optional)' });
  const outTypes = ['Ad copy','Script'];
  const outTypeSel = h('select', { class: 'select' },
    ...outTypes.map(t => h('option', { value: t.toLowerCase() }, t))
  );
  const frameRanges = ['3-5','5-7','7-9'];
  const frameRangeSel = h('select', { class: 'select' },
    h('option', { value: '' }, 'Frames'),
    ...frameRanges.map(r => h('option', { value: r }, r))
  );
  const tones = ['Default','Warm & conversational','Slightly more formal','Upbeat and cheeky','Inspiring & Empowering','Gentle and warm','Informative and direct','Emotional and inspiring','Confident, expert, factual (Authoritative)','Warm, understanding, emotionally in-tune (Empathetic)','Casual, relaxed, friendly (Conversational)','Uplifting, motivational, purpose-driven (Inspiring)','Polished, neutral, minimal fluff (Professional)','Humorous, clever, youth-targeted (Witty/Playful)','Gentle, comforting, calm and grounded (Reassuring)','Stats-focused, analytical, objective (Data-driven)'];
  const styles = ['Default','Narrative / Story-Driven','Conversational','Instructional / How-To','Persuasive / Conversion-Oriented','Analytical / Data-Led','Editorial / Journalistic','Narrative + Persuasive','Instructional + Conversational','Analytical + Third-Person','Narrative + First-Person','Poetic + Journalistic','Comparative + Listicle'];
  const toneSel = h('select', { class: 'select' }, ...tones.map(t => h('option', { value: t === 'Default' ? '' : t }, t)));
  const styleSel = h('select', { class: 'select' }, ...styles.map(s => h('option', { value: s === 'Default' ? '' : s }, s)));
  function field(labelText, el, required) {
    return h('div', { class: 'form-field' },
      h('label', required ? { class: 'label-required' } : {}, labelText),
      el
    );
  }
  const frameFieldWrapper = field('Frames', frameRangeSel, false);
  const controls = h('div', { class: 'section' },
    h('div', { class: 'three-col' },
      field('Social Platform', platformSel, true),
      field('Industry', industrySel, true),
      field('Vertical', verticalSel, true),
      field('Banned words', bannedWords, false),
      field('Output type', outTypeSel, false),
      frameFieldWrapper,
      field('Tone', toneSel, false),
      field('Style', styleSel, false)
    )
  );

  // CTA
  const generateBtn = h('button', { class: 'btn btn-primary', disabled: 'disabled' }, 'Generate');
  const regenBtn = h('button', { class: 'btn btn-primary hidden' }, 'Regenerate');
  function requiresFrames() { return outTypeSel.value === 'script'; }
  function updateReady() {
    const ready = !!platformSel.value && !!industrySel.value && !!verticalSel.value && (!requiresFrames() || !!frameRangeSel.value);
    generateBtn.disabled = !ready;
  }
  platformSel.addEventListener('change', updateReady);
  verticalSel.addEventListener('change', updateReady);
  outTypeSel.addEventListener('change', () => { updateReady(); framesControls.style.display = requiresFrames() ? '' : 'none'; frameFieldWrapper.style.display = requiresFrames() ? '' : 'none'; });
  frameRangeSel.addEventListener('change', updateReady);
  const cta = h('div', { class: 'section' }, h('div', { class: 'toolbar' }, generateBtn, regenBtn));

  // Outputs
  const personaArea = h('textarea', { class: 'input', rows: '2', placeholder: 'Platform-specific persona', readOnly: false });
  const copyArea = h('textarea', { class: 'input', rows: '4', placeholder: 'Ad copy will appear here (editable)' });
  attachEditorTools(copyArea, { hideExpandReduce: true });
  const framesWrap = h('div', { class: 'tone-style' }); // reuse flex column styles
  const framesControls = h('div', { class: 'toolbar', style: 'display:none' },
    h('button', { class: 'btn btn-outline', id: 'decFrames' }, '− Fewer frames'),
    h('button', { class: 'btn btn-outline', id: 'incFrames' }, '+ More frames')
  );
  const outCard = h('div', { class: 'card full', style: 'display:none' },
    h('div', { class: 'card' }, h('h4', { class: 'card-title' }, 'Platform-Specific Persona'), personaArea),
    h('div', { class: 'card' }, h('h4', { class: 'card-title', id: 'outTitle' }, 'Ad Copy'), copyArea),
    h('div', { class: 'card', id: 'scriptCard', style: 'display:none' },
      h('h4', { class: 'card-title' }, 'Video Script Frames'),
      framesControls,
      framesWrap
    )
  );
  // Step: Compliance review and quick check
  const compClaims = h('input', { type: 'checkbox' });
  const compBanned = h('input', { type: 'checkbox' });
  const compDisclosures = h('input', { type: 'checkbox' });
  const compNotes = h('textarea', { class: 'input', rows: '3', placeholder: 'Compliance notes, disclosures, and approvals' });
  const compBtn = h('button', { class: 'btn btn-primary' }, 'Compliant?');
  const compResult = h('div', { class: 'muted', style: 'margin-left:10px' }, '');
  const complianceCard = h('div', { class: 'card full', style: 'display:none' },
    h('h3', {}, 'Step — Compliance Review'),
    h('div', { class: 'toolbar' }, compBtn, compResult),
    h('div', { class: 'card' },
      h('h4', { class: 'card-title' }, 'Checklist'),
      h('div', { class: 'toolbar' },
        h('label', { class: 'checkbox' }, compClaims, 'Claims verified and substantiated'),
        h('label', { class: 'checkbox' }, compBanned, 'Banned words removed/avoided'),
        h('label', { class: 'checkbox' }, compDisclosures, 'Disclosures included where required')
      ),
      h('div', {}, compNotes)
    )
  );

  function buildPersona() {
    return `${platformSel.value} users interested in ${verticalSel.value || 'your offer'} within ${industrySel.value} — respond to ${toneSel.value || 'friendly'} tone and ${styleSel.value || 'conversational'} style.`;
  }
  function randPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function buildAdCopy() {
    const banned = (bannedWords.value || '').trim();
    const openers = [
      `Looking for the perfect ${verticalSel.value || 'solution'}?`,
      `Ready to upgrade your ${verticalSel.value || 'setup'}?`,
      `It’s time to rethink ${verticalSel.value || 'your options'}.`
    ];
    const middles = [
      `Discover options that fit your needs on ${platformSel.value}.`,
      `See why others choose us on ${platformSel.value}.`,
      `Compare, shortlist and decide—fast—on ${platformSel.value}.`
    ];
    const closers = [
      `Get started today!`,
      `Tap to learn more.`,
      `Join thousands who switched.`
    ];
    const lines = [randPick(openers), randPick(middles), randPick(closers)];
    return lines.map(l => banned ? l.replace(new RegExp(banned,'ig'), '—') : l).join(' ');
  }
  function parseRange(val) {
    const m = (val || '').match(/(\d+)\s*-\s*(\d+)/);
    if (!m) return 3;
    return parseInt(m[1], 10);
    }
  function buildScriptFrames(count) {
    const hooks = [
      `Hook: ${verticalSel.value || 'Your solution'} in 5 seconds`,
      `Question: Struggling with ${verticalSel.value || 'this'}?`,
      `POV: Life with and without ${verticalSel.value || 'it'}`
    ];
    const benefits = [
      `Benefit: Fast, simple, and tailored to you`,
      `Proof: Real results from people like you`,
      `Feature: What makes us different`
    ];
    const ctas = [
      `CTA: Learn more`,
      `CTA: Try it today`,
      `CTA: Get started`
    ];
    const frames = [];
    for (let i = 1; i <= count; i++) {
      const line = i === 1 ? randPick(hooks) : i === count ? randPick(ctas) : randPick(benefits);
      frames.push(`${line} — on ${platformSel.value}.`);
    }
    return frames;
  }
  function renderFrames(frames) {
    framesWrap.innerHTML = '';
    const emotions = ['Excited','Reassuring','Inspirational','Playful','Urgent','Trustworthy'];
    frames.forEach((txt, idx) => {
      const emotionSel = h('select', { class: 'select' },
        h('option', { value: '' }, 'Emotion'),
        ...emotions.map(e => h('option', { value: e }, e))
      );
      const toneSelF = h('select', { class: 'select' },
        h('option', { value: '' }, 'Tone'),
        ...tones.map(t => h('option', { value: t === 'Default' ? '' : t }, t))
      );
      const styleSelF = h('select', { class: 'select' },
        h('option', { value: '' }, 'Style'),
        ...styles.map(s => h('option', { value: s === 'Default' ? '' : s }, s))
      );
      const ta = h('textarea', { class: 'input', rows: '3' });
      ta.value = txt;
      const block = h('div', { class: 'frame-block' },
        h('div', { class: 'row articles-controls' },
          h('label', {}, `Frame ${idx+1}`),
          emotionSel,
          toneSelF,
          styleSelF
        ),
        ta
      );
      framesWrap.append(block);
      attachEditorTools(ta, { hideExpandReduce: true });
    });
  }
  function getAllOutputText() {
    if (requiresFrames()) {
      const areas = Array.from(framesWrap.querySelectorAll('textarea'));
      return areas.map(a => a.value || '').join('\n');
    }
    return copyArea.value || '';
  }
  function checkCompliance() {
    const issues = [];
    const text = getAllOutputText().toLowerCase();
    const redFlags = ['guarantee', 'cure', 'risk-free', '#1', 'best ', 'only ', 'free '];
    const banned = (bannedWords.value || '').split(/[,\n]/).map(s => s.trim()).filter(Boolean);
    banned.forEach(w => { if (w && text.includes(w.toLowerCase())) issues.push(`Contains banned word: "${w}"`); });
    redFlags.forEach(f => { if (text.includes(f)) issues.push(`Potential prohibited claim: ${f}`); });
    if (!compDisclosures.checked && /\bterms?\b|\boffer\b/i.test(text)) {
      issues.push('Mentions offer/terms without marking disclosures checked');
    }
    return issues;
  }
  compBtn.addEventListener('click', () => {
    const issues = checkCompliance();
    if (issues.length === 0) {
      compResult.textContent = 'Likely compliant (no obvious issues found).';
      compResult.style.color = '#16a34a';
    } else {
      compResult.textContent = `Issues found: ${issues.slice(0,3).join(' • ')}`;
      compResult.style.color = '#dc2626';
    }
  });
  let currentFrames = 0;
  const decBtn = framesControls.querySelector('#decFrames');
  const incBtn = framesControls.querySelector('#incFrames');
  decBtn.addEventListener('click', () => {
    if (currentFrames > 1) { currentFrames -= 1; renderFrames(buildScriptFrames(currentFrames)); }
  });
  incBtn.addEventListener('click', () => {
    currentFrames += 1; renderFrames(buildScriptFrames(currentFrames));
  });

  async function generateAll(fromRegenerate = false) {
    generateBtn.disabled = true; const prev = generateBtn.textContent; generateBtn.textContent = fromRegenerate ? 'Regenerating…' : 'Generating…';
    await new Promise(r => setTimeout(r, 600));
    personaArea.value = buildPersona();
    if (requiresFrames()) {
      const start = parseRange(frameRangeSel.value) || 3;
      currentFrames = start;
      renderFrames(buildScriptFrames(currentFrames));
      document.getElementById('outTitle').textContent = 'Video Script';
      copyArea.style.display = 'none';
      document.getElementById('scriptCard').style.display = '';
      framesControls.style.display = '';
      complianceCard.style.display = '';
      compResult.textContent = '';
    } else {
      copyArea.value = buildAdCopy();
      document.getElementById('outTitle').textContent = 'Ad Copy';
      copyArea.style.display = '';
      document.getElementById('scriptCard').style.display = 'none';
      framesControls.style.display = 'none';
      complianceCard.style.display = '';
      compResult.textContent = '';
    }
    outCard.style.display = '';
    regenBtn.classList.remove('hidden');
    generateBtn.textContent = 'Generate'; generateBtn.disabled = false;
  }
  generateBtn.addEventListener('click', async () => {
    if (generateBtn.disabled) return;
    await generateAll(false);
  });
  regenBtn.addEventListener('click', async () => { await generateAll(true); });

  updateVerticalsFromIndustryAds();
  // Initialise visibility for frames-related controls in three-col
  frameFieldWrapper.style.display = requiresFrames() ? '' : 'none';
  updateReady();
  root.append(hero, controls, cta, outCard, complianceCard);
}


