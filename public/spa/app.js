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
  const verticalSel = h('select', { class: 'select' }, ...CANONICAL_VERTICALS.slice(0, 50).map(v => h('option', { value: v }, v)));
  const countrySel = h('select', { class: 'select' }, ...COUNTRIES.map(c => h('option', { value: c.code }, c.label)));
  const recencySel = h('select', { class: 'select' },
    h('option', { value: '24h' }, '24h'),
    h('option', { value: '7d', selected: 'selected' }, '7d'),
    h('option', { value: '30d' }, '30d'),
  );
  const btn = h('button', { class: 'btn btn-primary' }, 'Find Trends & Insights');
  const controls = h('div', { class: 'row' }, verticalSel, countrySel, recencySel, btn);
  const grid = h('div', { class: 'card-grid' });
  const errorBox = h('div', { class: 'card', style: 'display:none' });

  btn.addEventListener('click', async () => {
    grid.innerHTML = '';
    errorBox.style.display = 'none';
    const vertical = verticalSel.value;
    const country = countrySel.value;
    const recency = recencySel.value;
    try {
      // TODO: fetchInsights currently throws until you deploy apps-script/Code.gs.
      const res = await fetchInsights({ vertical, country, recency, limit: 8 });
      (res.results || []).forEach((r) => {
        grid.append(card(r.title || r.source || 'Result', r.snippet || r.url || ''));
      });
      if (grid.children.length === 0) grid.append(card('No results', 'Try different inputs.'));
    } catch (err) {
      errorBox.style.display = '';
      errorBox.innerHTML = '';
      errorBox.append(h('h3', {}, 'Connect the proxy'));
      errorBox.append(h('p', {}, 'Deploy apps-script/Code.gs as a Web App and replace fetchInsights to call it. Showing demo items meanwhile.'));
      ;['Trends', 'Reddit', 'Aggregator', 'Visuals'].forEach((k, i) => grid.append(card(`${k} #${i+1}`, 'Demo item')));
    }
  });
  root.append(section('AI Search', controls), errorBox, grid);
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
  const monthSel = h('input', { class: 'input', type: 'number', min: '1', max: '12', value: String(new Date().getMonth() + 1), style: 'max-width:100px' });
  const prevBtn = h('button', { class: 'btn btn-outline', title: 'Previous month' }, '‹');
  const nextBtn = h('button', { class: 'btn btn-outline', title: 'Next month' }, '›');
  const countriesLabel = h('label', {}, 'Countries (Optional)');
  const countriesSel = h('select', { class: 'select', multiple: 'multiple', size: '6', style: 'min-width:220px' },
    h('option', { value: '' }, ''), // blank first row (interpreted as all)
    ...COUNTRIES.map(c => h('option', { value: c.code }, c.label))
  );
  const verticalLabel = h('label', {}, 'Vertical (Optional)');
  const verticalSel = h('select', { class: 'select', style: 'min-width:240px' },
    h('option', { value: '' }, ''),
    ...CANONICAL_VERTICALS.map(v => h('option', { value: v }, v))
  );
  const commercialChk = h('input', { type: 'checkbox', checked: 'checked' });
  const commercialWrap = h('label', { class: 'checkbox' }, commercialChk, 'Commercial only');
  const loadBtn = h('button', { class: 'btn btn-primary' }, 'Load');
  const exportBtn = h('button', { class: 'btn btn-outline' }, 'Export CSV');
  const meta = h('div', { class: 'toolbar' });
  const grid = h('div', { class: 'card-grid' });
  const searchInput = h('input', { class: 'input', placeholder: 'Quick search…', style: 'min-width:240px' });
  const searchBtn = h('button', { class: 'btn btn-outline' }, 'Search');

  function setMonth(delta) {
    let m = Number(monthSel.value) || (new Date().getMonth() + 1);
    m += delta;
    if (m < 1) m = 12; if (m > 12) m = 1;
    monthSel.value = String(m);
  }
  prevBtn.addEventListener('click', () => { setMonth(-1); doLoad(); });
  nextBtn.addEventListener('click', () => { setMonth(1); doLoad(); });

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
    meta.innerHTML = '';
    const month = Number(monthSel.value) || (new Date().getMonth() + 1);
    const countries = Array.from(countriesSel.selectedOptions).map(o => o.value).filter(Boolean);
    const vertical = verticalSel.value || '';
    const commercialOnly = !!commercialChk.checked;
    loadBtn.disabled = true; loadBtn.textContent = 'Loading…';
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
    // meta info
    meta.append(
      h('span', { class: 'badge' }, `Month: ${month}`),
      h('span', { class: 'badge' }, `Events: ${lastEvents.length}`),
      h('span', { class: 'badge' }, `Countries: ${countries.join(', ') || 'All'}`),
    );
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
        const suggestions = h('div', {},\n"
          + "h('div', { class: 'muted' }, 'Content suggestions'),\n"
          + "h('p', {}, ['H1: ', ev.name || '']),\n"
          + "h('p', {}, ['DH1: ', 'Concise value proposition aligned to the event']),\n"
          + "h('p', {}, ['H2: ', 'What, When, Eligibility']),\n"
          + "h('p', {}, ['Article headline: ', ev.name || '']),\n"
          + "h('p', {}, ['Ribbon copy: ', 'Limited window • Updated ' + (ev.date || '')]),\n"
          + "h('p', {}, ['BTC paragraph: ', 'Short paragraph describing what visitors will get for this period'])\n"
        + ");\n"
        const body = h('div', { class: 'card-body' },\n"
          + "h('p', {}, ev.description || ''),\n"
          + "h('div', { class: 'section' }, h('strong', {}, 'Relevance'), relBlock),\n"
          + "h('div', { class: 'section' }, h('strong', {}, 'Best practices'), bestPractices),\n"
          + "h('div', { class: 'section' }, h('strong', {}, 'Content suggestions'), suggestions)\n"
        + ");\n"
        const header = h('div', { class: 'card-header', onClick: (e) => {\n"
          + "const card = e.currentTarget.parentElement; card.classList.toggle('expanded');\n"
        + "} },\n"
          + "h('h3', { class: 'card-title' }, ev.name || 'Untitled'),\n"
          + "h('div', { class: 'card-actions' }, top)\n"
        + ");\n"
        const cardEl = h('div', { class: 'card' }, header, body);\n"
        grid.append(cardEl);\n"
      });\n"
  }\n"
\n"
  loadBtn.addEventListener('click', doLoad);
  exportBtn.addEventListener('click', () => {
    const month = Number(monthSel.value) || (new Date().getMonth() + 1);
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
    const a = Object.assign(document.createElement('a'), { href: url, download: `seasonal-events-m${month}.csv` });
    a.click(); URL.revokeObjectURL(url);
  });

  // quick country presets
  const presets = h('div', { class: 'toolbar' },
    h('span', {}, 'Quick countries:'),
    ...['GB','US','IE','FR','NL'].map(c =>
      h('button', { class: 'btn btn-outline', onClick: () => {
        Array.from(countriesSel.options).forEach(o => o.selected = (o.value === c));
        doLoad();
      } }, c)
    )
  );

  const controls = h('div', { class: 'section' },\n"
    + "h('div', { class: 'toolbar' }, monthLabel, prevBtn, monthSel, nextBtn, countriesLabel, countriesSel, verticalLabel, verticalSel, commercialWrap, loadBtn, exportBtn),\n"
    + "h('div', { class: 'toolbar' }, searchInput, searchBtn)\n"
  + ");\n"
\n"
  searchBtn.addEventListener('click', () => {\n"
    + "searchBtn.disabled = true; searchBtn.textContent = 'Searching…';\n"
    + "renderList();\n"
    + "searchBtn.disabled = false; searchBtn.textContent = 'Search';\n"
  + "});\n"

  root.append(hero, section('Seasonal Events', controls), presets, meta, grid);

  // initial selection and load
  Array.from(countriesSel.options).forEach(o => { if (['GB','US'].includes(o.value)) o.selected = true; });
  doLoad();
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
  const hash = location.hash || '#/welcome';
  const path = hash.replace(/^#/, '');
  const page = ROUTES[path] || renderWelcome;
  page(app);
  // Highlight active link
  document.querySelectorAll('.nav-link').forEach(a => {
    if (a.getAttribute('href') === `#${path}`) a.classList.add('active');
    else a.classList.remove('active');
  });
}
window.addEventListener('hashchange', renderRoute);
window.addEventListener('DOMContentLoaded', renderRoute);


