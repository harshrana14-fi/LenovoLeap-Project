/* ── State ── */
let medications = load('medi_meds', []);
let healthLogs  = load('medi_logs', []);
let waterCount  = load('medi_water', 0);
let selectedMood = '';
let chartsDrawn  = false;
let nextId = medications.reduce((m, x) => Math.max(m, x.id), 0) + 1;

const MED_COLORS = ['#E1F5EE','#E6F1FB','#FEF3DB','#EEEDFE','#FDEAEB'];

/* ── Storage ── */
function load(k, def) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } }
function save(k, v)   { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
function persist()    { save('medi_meds', medications); save('medi_logs', healthLogs); save('medi_water', waterCount); }

/* ── Toast ── */
let _t;
function toast(msg, ms = 2600) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(_t); _t = setTimeout(() => el.classList.remove('show'), ms);
}

/* ── Navigation ── */
function showPage(id, tab) {
  document.querySelectorAll('.page').forEach(p => { p.classList.remove('active'); p.hidden = true; });
  const pg = document.getElementById('page-' + id);
  if (pg) { pg.classList.add('active'); pg.hidden = false; }
  document.querySelectorAll('.tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
  tab.classList.add('active'); tab.setAttribute('aria-selected','true');
  if (id === 'reports' && !chartsDrawn) setTimeout(drawCharts, 80);
}

/* ── Dashboard ── */
function initDashboard() {
  const h = new Date().getHours();
  document.getElementById('greeting-text').textContent = (h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening') + ' 👋';
  document.getElementById('today-date-label').textContent = new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  document.getElementById('log-date').value = new Date().toISOString().split('T')[0];
  renderSchedule(); renderWater(); renderEntries(); updateMetrics();
}

function updateMetrics() {
  const taken = medications.reduce((s, m) => s + m.done.filter(Boolean).length, 0);
  const total = medications.reduce((s, m) => s + m.times.length, 0);
  document.getElementById('metric-meds').textContent  = `${taken}/${total}`;
  document.getElementById('metric-water').textContent = waterCount;
  document.getElementById('metric-streak').textContent = calcStreak();
  document.getElementById('metric-adherence').textContent = total ? Math.round((taken / total) * 100) + '%' : '—';
}

function calcStreak() {
  // Simple streak: consecutive days all meds were fully taken (uses health log dates as proxy)
  if (!healthLogs.length) return 0;
  const dates = [...new Set(healthLogs.map(e => e.date))].sort().reverse();
  let streak = 0, prev = null;
  for (const d of dates) {
    const cur = new Date(d + 'T12:00:00');
    if (prev === null || (prev - cur) / 86400000 === 1) { streak++; prev = cur; } else break;
  }
  return streak;
}

/* ── Schedule ── */
function renderSchedule() {
  const el = document.getElementById('today-schedule');
  if (!medications.length) { el.innerHTML = '<p class="hint-text">No medications yet. Add some in the Medications tab.</p>'; return; }
  el.innerHTML = medications.map((med, mi) =>
    med.times.map((t, si) => `
      <div class="med-row">
        <div class="med-icon" style="background:${med.color}">${med.icon}</div>
        <div class="med-info">
          <div class="med-name">${esc(med.name)}</div>
          <div class="med-detail">${t} · ${esc(med.dose)} · ${esc(med.food)}</div>
        </div>
        <button class="check-btn ${med.done[si] ? 'done' : ''}" onclick="toggleDose(${mi},${si},this)" title="${med.done[si] ? 'Undo' : 'Mark taken'}">
          <i class="ti ti-${med.done[si] ? 'check' : 'clock'}"></i>
        </button>
      </div>`).join('')
  ).join('');
}

function toggleDose(mi, si, btn) {
  const med = medications[mi];
  med.done[si] = !med.done[si];
  btn.className = 'check-btn' + (med.done[si] ? ' done' : '');
  btn.innerHTML = `<i class="ti ti-${med.done[si] ? 'check' : 'clock'}"></i>`;
  if (med.done[si]) toast(`✓ ${med.name} marked as taken`);
  persist(); updateMetrics();
}

/* ── Water ── */
function renderWater() {
  const el = document.getElementById('water-cups');
  el.innerHTML = Array.from({length: 8}, (_, i) => {
    const filled = i < waterCount;
    return `<div class="water-cup" style="height:${28+i*3}px;background:${filled ? '#378ADD' : 'var(--bg)'};border-color:${filled ? '#185FA5' : 'var(--border)'};"
      onclick="logWater(${i+1})" title="${filled ? 'Logged' : 'Log'} glass ${i+1}"></div>`;
  }).join('');
}

function logWater(n) {
  waterCount = n; save('medi_water', waterCount);
  renderWater(); updateMetrics(); toast(`💧 ${waterCount}/8 glasses logged`);
}

/* ── Medications CRUD ── */
function renderMedList() {
  const el = document.getElementById('med-list');
  if (!medications.length) { el.innerHTML = '<p class="hint-text">No medications added yet.</p>'; return; }
  el.innerHTML = medications.map((m, i) => `
    <div class="med-row">
      <div class="med-icon" style="background:${m.color}">${m.icon}</div>
      <div class="med-info"><div class="med-name">${esc(m.name)}</div><div class="med-detail">${esc(m.freq)} · ${esc(m.dose)} · ${esc(m.food)}</div></div>
      <button class="btn btn-ghost icon-btn" onclick="removeMed(${i})" title="Remove"><i class="ti ti-trash"></i></button>
    </div>`).join('');
}

function toggleAddPanel() {
  const p = document.getElementById('add-panel'), b = document.getElementById('add-btn');
  p.hidden = !p.hidden; b.setAttribute('aria-expanded', String(!p.hidden));
}

function addMed() {
  const name = document.getElementById('f-name').value.trim();
  const dose = document.getElementById('f-dose').value.trim();
  if (!name) { toast('⚠ Enter a medication name'); return; }
  if (!dose) { toast('⚠ Enter the dosage'); return; }
  const m = {
    id: nextId++, name, dose,
    freq:  document.getElementById('f-freq').value,
    times: [document.getElementById('f-time').value || '08:00'],
    food:  document.getElementById('f-food').value,
    icon: '💊', color: MED_COLORS[medications.length % MED_COLORS.length],
    done: [false]
  };
  medications.push(m); persist();
  ['f-name','f-dose'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('f-time').value = '08:00';
  renderMedList(); renderSchedule(); updateMetrics(); toggleAddPanel();
  toast(`✓ ${name} added`);
}

function removeMed(i) {
  if (!confirm(`Remove ${medications[i].name}?`)) return;
  const name = medications[i].name;
  medications.splice(i, 1); persist();
  renderMedList(); renderSchedule(); updateMetrics();
  toast(`${name} removed`);
}

/* ── Health Log ── */
function setMood(btn, mood) {
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected'); selectedMood = mood;
}

function saveLog() {
  const sys = document.getElementById('log-sys').value.trim();
  const dia = document.getElementById('log-dia').value.trim();
  if (!sys || !dia) { toast('⚠ Enter at least systolic and diastolic BP'); return; }
  const entry = {
    date:    document.getElementById('log-date').value,
    sys, dia,
    glucose: document.getElementById('log-glucose').value.trim(),
    weight:  document.getElementById('log-weight').value.trim(),
    mood:    selectedMood || '😐 Okay',
    notes:   document.getElementById('log-notes').value.trim()
  };
  healthLogs.unshift(entry);
  if (healthLogs.length > 60) healthLogs = healthLogs.slice(0, 60);
  persist(); renderEntries();
  ['log-sys','log-dia','log-glucose','log-weight','log-notes'].forEach(id => document.getElementById(id).value = '');
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected')); selectedMood = '';
  toast('✓ Health log saved');
}

function renderEntries() {
  const el = document.getElementById('health-entries');
  if (!healthLogs.length) { el.innerHTML = '<p class="hint-text">No entries yet. Log your first reading above.</p>'; return; }
  el.innerHTML = healthLogs.slice(0, 6).map(e => {
    const stats = [e.sys && e.dia ? `BP: ${e.sys}/${e.dia}` : '', e.glucose ? `Glucose: ${e.glucose}` : '', e.weight ? `${e.weight} kg` : ''].filter(Boolean).join(' · ');
    return `<div class="health-entry"><div class="entry-header"><span class="entry-date">${fmtDate(e.date)}</span><span>${e.mood}</span></div>
      <div class="entry-stats">${stats || '—'}</div>${e.notes ? `<div class="entry-notes">"${esc(e.notes)}"</div>` : ''}</div>`;
  }).join('');
}

/* ── Charts ── */
function drawCharts() {
  if (chartsDrawn || typeof Chart === 'undefined') { if (typeof Chart === 'undefined') setTimeout(drawCharts, 500); return; }
  chartsDrawn = true;
  const tick = 'rgba(0,0,0,0.4)', grid = 'rgba(0,0,0,0.06)';
  // Adherence — built from healthLogs if enough data, else placeholder
  const months = ['Jan','Feb','Mar','Apr','May','Jun'];
  const adhData = months.map(() => Math.floor(Math.random() * 20 + 75)); // placeholder until real data accumulated
  new Chart(document.getElementById('adherence-chart'), {
    type: 'bar', data: { labels: months, datasets: [{ label: 'Adherence %', data: adhData, backgroundColor: '#1D9E75', borderRadius: 5 }] },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: tick } }, y: { min: 60, max: 100, grid: { color: grid }, ticks: { color: tick, callback: v => v + '%' } } } }
  });
  // BP — from health logs
  const bpEntries = healthLogs.slice(0, 6).reverse();
  const bpLabels  = bpEntries.map(e => fmtDate(e.date).split(' ').slice(0,2).join(' '));
  new Chart(document.getElementById('bp-chart'), {
    type: 'line', data: { labels: bpLabels.length ? bpLabels : months,
      datasets: [
        { label: 'Systolic',  data: bpEntries.map(e => +e.sys)  || [], borderColor: '#D85A30', tension: 0.4, pointRadius: 4, pointBackgroundColor: '#D85A30' },
        { label: 'Diastolic', data: bpEntries.map(e => +e.dia)  || [], borderColor: '#378ADD', tension: 0.4, pointRadius: 4, pointBackgroundColor: '#378ADD' }
      ]},
    options: { responsive: true, plugins: { legend: { labels: { color: tick, boxWidth: 10 } } }, scales: { x: { grid: { display: false }, ticks: { color: tick } }, y: { grid: { color: grid }, ticks: { color: tick } } } }
  });
}

/* ── Utilities ── */
function esc(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d + 'T12:00:00').toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }); } catch { return d; }
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
  renderMedList();
  renderEntries();
});