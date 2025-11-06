import { computeSeasonalEvents } from '../../adapters/seasonal-events.js';
import { fetchInsights } from '../../adapters/insights.js';
import { CANONICAL_VERTICALS } from '../../lib/verticals.js';
import { COUNTRIES } from '../../lib/country.js';
// Sidebar toggle
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
sidebarToggle?.addEventListener('click', () => {
  sidebar?.classList.toggle('collapsed');
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
  const monthSel = h('input', { class: 'input', type: 'number', min: '1', max: '12', value: String(new Date().getMonth() + 1) });
  const countriesSel = h('select', { class: 'select', multiple: 'multiple', size: '5' }, ...COUNTRIES.map(c => h('option', { value: c.code }, c.label)));
  const btn = h('button', { class: 'btn' }, 'Load seasonal events');
  const controls = h('div', { class: 'row' }, monthSel, countriesSel, btn);
  const grid = h('div', { class: 'card-grid' });
  btn.addEventListener('click', () => {
    grid.innerHTML = '';
    const month = Number(monthSel.value) || (new Date().getMonth() + 1);
    const countries = Array.from(countriesSel.selectedOptions).map(o => o.value);
    const { events } = computeSeasonalEvents({ month, countries, commercialOnly: true });
    events.forEach(ev => grid.append(card(`${ev.name} — ${ev._country}`, ev.date)));
    if (grid.children.length === 0) grid.append(card('No events', 'Try a different month or countries.'));
  });
  root.append(section('Events', controls), grid);
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
  const btn = h('button', { class: 'btn' }, 'Say hello');
  const grid = h('div', { class: 'card-grid' });
  btn.addEventListener('click', () => {
    grid.prepend(card('Hello!', 'Welcome to the demo.'));
  });
  root.append(section('Welcome', btn), grid);
}

const ROUTES = {
  '/home': renderHome,
  '/ai-search': renderAiSearch,
  '/articles': renderArticles,
  '/events': renderEvents,
  '/vertical-profiles': renderVerticalProfiles,
  '/welcome': renderWelcome,
};

// Router
const app = document.getElementById('app');
function renderRoute() {
  const hash = location.hash || '#/home';
  const path = hash.replace(/^#/, '');
  const page = ROUTES[path] || renderHome;
  page(app);
  // Highlight active link
  document.querySelectorAll('.nav-link').forEach(a => {
    if (a.getAttribute('href') === `#${path}`) a.classList.add('active');
    else a.classList.remove('active');
  });
}
window.addEventListener('hashchange', renderRoute);
window.addEventListener('DOMContentLoaded', renderRoute);


