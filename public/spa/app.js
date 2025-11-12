// Local, dependency-free fallbacks so the app works even if imports fail
let CANONICAL_VERTICALS = [
  'Online Banking','VPN','Website Builders','Sports Betting','Online Casino','Solar','Credit Cards','Personal Loans'
];
let COUNTRIES = [
  { code:'GB', label:'United Kingdom' }, { code:'US', label:'United States' }, { code:'IE', label:'Ireland' },
  { code:'CA', label:'Canada' }, { code:'FR', label:'France' }, { code:'NL', label:'Netherlands' }
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
  const grid = h('div', { class: 'card-grid' });
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
    h('option', { value: 'Finance' }, 'Finance'),
    h('option', { value: 'Technology' }, 'Technology'),
    h('option', { value: 'Health' }, 'Health'),
    h('option', { value: 'Travel' }, 'Travel'),
  );
  const verticalSel = h('select', { class: 'select' },
    h('option', { value: '' }, 'Select'),
    ...CANONICAL_VERTICALS.slice(0, 20).map(v => h('option', { value: v }, v))
  );
  const runBtn = h('button', { class: 'btn btn-primary' }, 'Get Insights');
  const industryLabel = h('label', {}, 'Industry');
  const verticalLabel = h('label', {}, 'Vertical');
  const controls = h('div', { class: 'section' },
    h('div', { class: 'toolbar ai-controls' },
      industryLabel, industrySel,
      verticalLabel, verticalSel,
      runBtn
    )
  );
  const grid = h('div', { class: 'card-grid' });

  function ul(items) {
    return h('ul', {}, ...items.map(t => h('li', {}, t)));
  }

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
    grid.append(
      card('Current Trends', ul(currentTrends)),
      card('Reddit Research', h('div', {}, h('div', { class: 'muted' }, `Findings from the finds r/${v.toLowerCase().replace(/\s+/g,'')}`), ul(redditFindings))),
      card('Aggregator/Competitor Insights', ul(aggregatorInsights)),
      card('Suggested FAQs', ul(faqs)),
      card('Page Update Suggestions', ul(pageUpdates)),
    );
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
    grid.append(left, right);
  }

  runBtn.addEventListener('click', async () => {
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
  const select = h('select', { class: 'select' },
    h('option', { value: 'all' }, 'All categories'),
    h('option', { value: 'howto' }, 'How-to'),
    h('option', { value: 'comparison' }, 'Comparisons')
  );
  const grid = h('div', { class: 'card-grid' });
  const data = [
    { t: 'How to budget', c: 'howto' },
    { t: 'Best VPNs', c: 'comparison' },
    { t: 'Install solar panels', c: 'howto' },
    { t: 'Hosting vs SaaS', c: 'comparison' },
  ];
  function renderList() {
    grid.innerHTML = '';
    const val = select.value;
    data.filter(x => val === 'all' || x.c === val).forEach(x => grid.append(card(x.t, `Category: ${x.c}`)));
  }
  select.addEventListener('change', renderList);
  renderList();
  root.append(section('Articles', select), grid);
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
    ...COUNTRIES.map(c => h('option', { value: c.code }, c.label))
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


