/* ===================================================================
   Ledger – expense tracker logic
   Flow: load saved data -> render everything -> on any change: save + render again
   =================================================================== */

// ---------- 1. Configuration ----------
const STORAGE_KEY = 'ledger.expenses.v1'; // "v1" lets you change the data shape later without breaking old saves
// Each category has its own chart colour. Add a category here and it appears everywhere automatically.
const CATEGORIES = {
  Food: '#d1603d', Transport: '#1f4e79', Housing: '#3a7d6e', Bills: '#c9a227',
  Fun: '#8c4a6b', Health: '#4f8a3b', Other: '#6b7a8f'
};

// ---------- 2. State & helpers ----------
const $ = id => document.getElementById(id);   // short alias so we type less
let expenses = load();                          // the single source of truth

// Read from localStorage. try/catch because stored text can be corrupted or storage can be blocked.
function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses)); }
  catch { alert('Could not save: browser storage is full or blocked.'); }
}
// Format numbers as Indian rupees, e.g. 1,25,000.00
const money = n => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// Today's date as YYYY-MM-DD in LOCAL time (toISOString would use UTC and can be a day off)
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

// ---------- 3. Chart.js setup (created once, then updated) ----------
let pie, bars;
function initCharts() {
  pie = new Chart($('pie'), {
    type: 'doughnut',
    data: { labels: [], datasets: [{ data: [], backgroundColor: [], borderColor: '#f4f8f5', borderWidth: 2 }] },
    options: { plugins: { legend: { position: 'bottom' },
      tooltip: { callbacks: { label: c => ` ${c.label}: ${money(c.parsed)}` } } } }
  });
  bars = new Chart($('bars'), {
    type: 'bar',
    data: { labels: [], datasets: [{ data: [], backgroundColor: '#1f4e79' }] },
    options: { plugins: { legend: { display: false },
      tooltip: { callbacks: { label: c => ' ' + money(c.parsed.y) } } },
      scales: { y: { beginAtZero: true, ticks: { callback: v => '₹' + v } } } }
  });
}

// ---------- 4. Filtering ----------
// Returns the expenses that match the category + month dropdowns
function getFiltered(ignoreMonth = false) {
  const cat = $('f-category').value, month = $('f-month').value;   // month looks like "2026-10"
  return expenses.filter(e =>
    (cat === 'all' || e.category === cat) &&
    (ignoreMonth || !month || e.date.startsWith(month)));
}

// ---------- 5. Rendering ----------
function render() {
  const rows = getFiltered().sort((a, b) => b.date.localeCompare(a.date)); // newest first
  renderList(rows);
  renderCharts(rows);
}

function renderList(rows) {
  const list = $('list');
  list.replaceChildren();                       // clear old rows
  rows.forEach(e => {
    const li = document.createElement('li');
    // textContent (not innerHTML) so a description like "<script>" can never run as code
    const date = Object.assign(document.createElement('span'), { className: 'date',
      textContent: new Date(e.date + 'T00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) });
    const what = Object.assign(document.createElement('span'), { className: 'what', textContent: e.desc });
    const cat = Object.assign(document.createElement('small'), { textContent: e.category });
    what.append(cat);
    const amt = Object.assign(document.createElement('span'), { className: 'amt', textContent: money(e.amount) });
    const del = Object.assign(document.createElement('button'), { className: 'del', textContent: '×',
      title: 'Delete', ariaLabel: 'Delete ' + e.desc });
    del.onclick = () => { expenses = expenses.filter(x => x.id !== e.id); save(); render(); };
    li.append(date, what, amt, del);
    list.append(li);
  });
  const total = rows.reduce((s, e) => s + e.amount, 0);
  $('summary').textContent = rows.length ? `${rows.length} ${rows.length === 1 ? 'entry' : 'entries'}, ${money(total)} spent` : '';
  // Two different empty states: nothing saved yet, or saved items hidden by the filters
  $('empty').hidden = rows.length > 0;
  $('empty').textContent = expenses.length ? 'No expenses match these filters.' : 'Nothing logged yet. Add your first expense on the left.';
}

function renderCharts(rows) {
  // Doughnut: total per category for the currently filtered rows
  const totals = {};
  rows.forEach(e => totals[e.category] = (totals[e.category] || 0) + e.amount);
  const names = Object.keys(totals);
  pie.data.labels = names;
  pie.data.datasets[0].data = names.map(n => totals[n]);
  pie.data.datasets[0].backgroundColor = names.map(n => CATEGORIES[n] || '#999');
  pie.update();
  $('pie-empty').hidden = names.length > 0;

  // Bars: last 6 calendar months (ignores the month filter, otherwise it would show one bar)
  const labels = [], keys = [], now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
    labels.push(d.toLocaleDateString('en-IN', { month: 'short' }));
  }
  const monthly = getFiltered(true);
  bars.data.labels = labels;
  bars.data.datasets[0].data = keys.map(k => monthly.filter(e => e.date.startsWith(k)).reduce((s, e) => s + e.amount, 0));
  bars.update();
}

// ---------- 6. Events ----------
$('form').addEventListener('submit', ev => {
  ev.preventDefault();                           // stop the page reloading
  expenses.push({
    id: crypto.randomUUID(),                     // unique id so we can delete the right row later
    desc: $('desc').value.trim(),
    amount: parseFloat($('amount').value),
    category: $('category').value,
    date: $('date').value
  });
  save(); render();
  $('desc').value = ''; $('amount').value = '';  // keep category/date: people often add several in a row
  $('desc').focus();
});
$('f-category').addEventListener('change', render);
$('f-month').addEventListener('change', render);
$('clear').addEventListener('click', () => { $('f-category').value = 'all'; $('f-month').value = ''; render(); });

// ---------- 7. Start-up ----------
// Fill both category dropdowns from the CATEGORIES object, set today's date, then draw
Object.keys(CATEGORIES).forEach(name => {
  $('category').add(new Option(name, name));
  $('f-category').add(new Option(name, name));
});
$('date').value = today();
initCharts();
render();
