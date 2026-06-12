'use strict';

// ─── Constants ────────────────────────────────────────────────────────────────
const MOIS_NOMS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
];
const MOIS_COURT = ['Jan','Fév','Mar','Avr','Mai','Juin','Jul','Août','Sep','Oct','Nov','Déc'];

const FIREBASE_URL = 'https://babyfoot-championship-default-rtdb.firebaseio.com';

const DEFAULT_JOUEURS = ['Alice','Axel','Mehdi','Mohamed','Thibaut'];
const DEFAULT_MATCHS = [
  {mois:4,a1:'Axel',a2:'Mohamed',b1:'Alice',b2:'Mehdi',ba:10,bb:9,date:''},
  {mois:4,a1:'Axel',a2:'Alice',b1:'Mohamed',b2:'Mehdi',ba:4,bb:10,date:''},
  {mois:4,a1:'Axel',a2:'Mehdi',b1:'Alice',b2:'Mohamed',ba:10,bb:6,date:''},
  {mois:4,a1:'Mohamed',a2:'Axel',b1:'Thibaut',b2:'Mehdi',ba:9,bb:10,date:''},
  {mois:4,a1:'Axel',a2:'Thibaut',b1:'Alice',b2:'Mohamed',ba:10,bb:4,date:''},
  {mois:4,a1:'Alice',a2:'Thibaut',b1:'Mehdi',b2:'Mohamed',ba:6,bb:10,date:''},
  {mois:4,a1:'Thibaut',a2:'Mohamed',b1:'Alice',b2:'Mehdi',ba:10,bb:6,date:''},
  {mois:4,a1:'Thibaut',a2:'Mehdi',b1:'Alice',b2:'Mohamed',ba:10,bb:9,date:''},
  {mois:4,a1:'Axel',a2:'Thibaut',b1:'Mohamed',b2:'Mehdi',ba:10,bb:4,date:''},
  {mois:4,a1:'Axel',a2:'Mehdi',b1:'Mohamed',b2:'Thibaut',ba:8,bb:10,date:''},
  {mois:4,a1:'Axel',a2:'Mohamed',b1:'Thibaut',b2:'Mehdi',ba:10,bb:4,date:''},
  {mois:4,a1:'Axel',a2:'Thibaut',b1:'Mohamed',b2:'Mehdi',ba:10,bb:5,date:''},
  {mois:4,a1:'Axel',a2:'Mehdi',b1:'Thibaut',b2:'Mohamed',ba:9,bb:10,date:''},
  {mois:4,a1:'Axel',a2:'Alice',b1:'Mehdi',b2:'Thibaut',ba:3,bb:10,date:''},
  {mois:4,a1:'Axel',a2:'Mehdi',b1:'Alice',b2:'Thibaut',ba:10,bb:8,date:''},
  {mois:4,a1:'Thibaut',a2:'Axel',b1:'Alice',b2:'Mehdi',ba:10,bb:7,date:''},
  {mois:5,a1:'Alice',a2:'Thibaut',b1:'Mehdi',b2:'Mohamed',ba:10,bb:8,date:''},
  {mois:5,a1:'Mohamed',a2:'Axel',b1:'Alice',b2:'Mehdi',ba:10,bb:2,date:''},
  {mois:5,a1:'Alice',a2:'Axel',b1:'Mohamed',b2:'Thibaut',ba:10,bb:8,date:''},
  {mois:5,a1:'Alice',a2:'Mehdi',b1:'Axel',b2:'Thibaut',ba:8,bb:10,date:''},
  {mois:5,a1:'Mohamed',a2:'Alice',b1:'Thibaut',b2:'Mehdi',ba:7,bb:10,date:''},
  {mois:5,a1:'Mohamed',a2:'Thibaut',b1:'Mehdi',b2:'Alice',ba:10,bb:1,date:''},
  {mois:5,a1:'Mohamed',a2:'Mehdi',b1:'Thibaut',b2:'Alice',ba:3,bb:10,date:''},
  {mois:5,a1:'Mohamed',a2:'Alice',b1:'Thibaut',b2:'Mehdi',ba:4,bb:10,date:''},
  {mois:5,a1:'Mohamed',a2:'Thibaut',b1:'Axel',b2:'Alice',ba:10,bb:3,date:''},
  {mois:5,a1:'Mohamed',a2:'Axel',b1:'Thibaut',b2:'Alice',ba:10,bb:5,date:''},
  {mois:5,a1:'Axel',a2:'Thibaut',b1:'Mohamed',b2:'Alice',ba:10,bb:5,date:''},
  {mois:5,a1:'Alice',a2:'Axel',b1:'Mohamed',b2:'Thibaut',ba:10,bb:6,date:''},
  {mois:5,a1:'Mohamed',a2:'Axel',b1:'Alice',b2:'Thibaut',ba:10,bb:3,date:''},
];

// ─── State ────────────────────────────────────────────────────────────────────
let state = { joueurs: [...DEFAULT_JOUEURS], matchs: [] };
let activeMois = new Date().getMonth();
let initialized = false;

// ─── Firebase helpers ─────────────────────────────────────────────────────────
async function fbGet(path) {
  const r = await fetch(`${FIREBASE_URL}${path}.json`);
  return r.json();
}

async function fbSet(path, data) {
  await fetch(`${FIREBASE_URL}${path}.json`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

async function fbPush(path, data) {
  const r = await fetch(`${FIREBASE_URL}${path}.json`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return r.json();
}

async function fbDelete(path) {
  await fetch(`${FIREBASE_URL}${path}.json`, { method: 'DELETE' });
}

// Écoute temps réel via SSE (Server-Sent Events Firebase)
function fbListen(path, callback) {
  const es = new EventSource(`${FIREBASE_URL}${path}.json`);
  es.addEventListener('put', e => {
    const d = JSON.parse(e.data);
    callback(d.data);
  });
  es.addEventListener('patch', e => {
    const d = JSON.parse(e.data);
    callback(null, d.data); // partial update
  });
  return es;
}

// ─── Init Firebase ────────────────────────────────────────────────────────────
async function initFirebase() {
  showLoading(true);
  try {
    // Charger joueurs
    let joueurs = await fbGet('/joueurs');
    if (!joueurs) {
      await fbSet('/joueurs', DEFAULT_JOUEURS);
      joueurs = DEFAULT_JOUEURS;
    }
    state.joueurs = Array.isArray(joueurs) ? joueurs : Object.values(joueurs);

    // Charger matchs
    let matchsRaw = await fbGet('/matchs');
    if (!matchsRaw) {
      // Premier lancement : on seed les données par défaut
      for (const m of DEFAULT_MATCHS) {
        await fbPush('/matchs', m);
      }
      matchsRaw = await fbGet('/matchs');
    }
    state.matchs = matchsRaw ? Object.entries(matchsRaw).map(([id, m]) => ({...m, _id: id})) : [];

    initialized = true;
    showLoading(false);
    renderGeneral();
    renderSaisie();

    // Écoute temps réel
    fbListen('/matchs', () => reloadMatchs());
    fbListen('/joueurs', () => reloadJoueurs());

  } catch(e) {
    console.error(e);
    showLoading(false);
    document.getElementById('loading-error').style.display = 'block';
  }
}

async function reloadMatchs() {
  const matchsRaw = await fbGet('/matchs');
  state.matchs = matchsRaw ? Object.entries(matchsRaw).map(([id, m]) => ({...m, _id: id})) : [];
  const activePage = document.querySelector('.page.active')?.id?.replace('page-','');
  if (activePage === 'general') renderGeneral();
  if (activePage === 'mensuel') renderMensuel(activeMois);
  if (activePage === 'matchs') renderHistory();
  if (activePage === 'duos') renderDuos();
}

async function reloadJoueurs() {
  const joueurs = await fbGet('/joueurs');
  state.joueurs = Array.isArray(joueurs) ? joueurs : Object.values(joueurs || {});
  const activePage = document.querySelector('.page.active')?.id?.replace('page-','');
  if (activePage === 'joueurs') renderJoueurs();
  if (activePage === 'saisie') renderSaisie();
}

function showLoading(show) {
  document.getElementById('loading-overlay').style.display = show ? 'flex' : 'none';
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function calcStats(matchs, joueur) {
  let v = 0, d = 0, diff = 0;
  matchs.forEach(m => {
    const inA = [m.a1, m.a2].includes(joueur);
    const inB = [m.b1, m.b2].includes(joueur);
    if (!inA && !inB) return;
    const vA = m.ba > m.bb;
    if (inA) { v += vA ? 1 : 0; d += vA ? 0 : 1; diff += (m.ba - m.bb); }
    else      { v += vA ? 0 : 1; d += vA ? 1 : 0; diff += (m.bb - m.ba); }
  });
  const total = v + d;
  return { v, d, matchs: total, diff, ratio: total > 0 ? Math.round(v / total * 100) : 0 };
}

function sortedRanking(matchs, joueurs, minMatchs = 0) {
  return joueurs
    .map(j => ({ j, ...calcStats(matchs, j) }))
    .filter(r => r.matchs >= minMatchs)
    .sort((a, b) => b.ratio - a.ratio || b.diff - a.diff || b.v - a.v);
}

// ─── Navigation ───────────────────────────────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const page = btn.dataset.page;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('page-' + page).classList.add('active');
    renders[page] && renders[page]();
  });
});

// ─── Render: Classement général ───────────────────────────────────────────────
function renderGeneral() {
  const rows = sortedRanking(state.matchs, state.joueurs, 0);
  const top3 = rows.slice(0, 3);
  const medals = ['🥇', '🥈', '🥉'];
  const rankClasses = ['rank-1', 'rank-2', 'rank-3'];

  document.getElementById('podium-row').innerHTML = top3.map((r, i) =>
    `<div class="podium-card ${rankClasses[i]}">
      <div class="podium-medal">${medals[i]}</div>
      <div class="podium-name">${r.j}</div>
      <div class="podium-ratio">${r.ratio}%</div>
      <div class="podium-stats">${r.v}V · ${r.d}D · ${r.matchs} matchs</div>
    </div>`
  ).join('');

  document.getElementById('tbody-general').innerHTML = rows.map((r, i) => {
    const medal = i < 3 ? medals[i] : (i + 1);
    const diffClass = r.diff > 0 ? 'diff-pos' : r.diff < 0 ? 'diff-neg' : '';
    const diffStr = r.diff > 0 ? '+' + r.diff : r.diff;
    return `<tr>
      <td class="col-rank">${medal}</td>
      <td style="font-weight:600">${r.j}</td>
      <td class="col-num">${r.v}</td>
      <td class="col-num">${r.d}</td>
      <td class="col-num">${r.matchs}</td>
      <td class="col-num ${diffClass}">${diffStr}</td>
      <td class="col-num" style="font-weight:600">${r.ratio}%</td>
    </tr>`;
  }).join('');
}

// ─── Render: Saisie ───────────────────────────────────────────────────────────
function renderSaisie() {
  const moisSel = document.getElementById('s-mois');
  moisSel.innerHTML = '';
  MOIS_NOMS.forEach((m, i) => {
    const o = document.createElement('option');
    o.value = i; o.textContent = m;
    moisSel.appendChild(o);
  });
  moisSel.value = new Date().getMonth();

  ['s-a1','s-a2','s-b1','s-b2'].forEach((id, idx) => {
    const sel = document.getElementById(id);
    sel.innerHTML = state.joueurs.map(j => `<option>${j}</option>`).join('');
    sel.value = state.joueurs[idx] || state.joueurs[0];
  });

  const dateEl = document.getElementById('s-date');
  if (!dateEl.value) dateEl.value = new Date().toISOString().split('T')[0];
}

function adjustScore(id, delta) {
  const el = document.getElementById(id);
  el.value = Math.max(0, Math.min(20, parseInt(el.value || 0) + delta));
}
window.adjustScore = adjustScore;

async function saveMatch() {
  const a1 = document.getElementById('s-a1').value;
  const a2 = document.getElementById('s-a2').value;
  const b1 = document.getElementById('s-b1').value;
  const b2 = document.getElementById('s-b2').value;
  const ba = parseInt(document.getElementById('s-ba').value) || 0;
  const bb = parseInt(document.getElementById('s-bb').value) || 0;
  const mois = parseInt(document.getElementById('s-mois').value);
  const date = document.getElementById('s-date').value;
  const msg = document.getElementById('s-msg');

  if (new Set([a1, a2, b1, b2]).size < 4) {
    msg.textContent = '⚠ 4 joueurs différents requis.';
    msg.className = 'save-msg error'; return;
  }
  if (ba === bb) {
    msg.textContent = '⚠ Pas de match nul.';
    msg.className = 'save-msg error'; return;
  }

  const btn = document.querySelector('#page-saisie .btn-primary');
  btn.disabled = true;
  btn.textContent = 'Enregistrement...';

  await fbPush('/matchs', { mois, a1, a2, b1, b2, ba, bb, date });
  await reloadMatchs();

  document.getElementById('s-ba').value = 0;
  document.getElementById('s-bb').value = 0;
  msg.textContent = '✓ Match enregistré !';
  msg.className = 'save-msg';
  btn.disabled = false;
  btn.textContent = 'Enregistrer le match';
  setTimeout(() => { msg.textContent = ''; }, 3000);
}
window.saveMatch = saveMatch;

// ─── Render: Mensuel ──────────────────────────────────────────────────────────
function renderMensuel(mois) {
  if (mois !== undefined) activeMois = mois;

  document.getElementById('month-pills').innerHTML = MOIS_NOMS.map((m, i) => {
    const hasData = state.matchs.some(x => x.mois === i);
    return `<button class="month-pill ${i === activeMois ? 'active' : ''} ${!hasData ? 'empty' : ''}" onclick="renderMensuel(${i})">${m}</button>`;
  }).join('');

  const matchsMois = state.matchs.filter(m => m.mois === activeMois);
  const content = document.getElementById('mensuel-content');

  if (!matchsMois.length) {
    content.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><p>Aucun match en ${MOIS_NOMS[activeMois]}.</p></div>`;
    return;
  }

  const minM = 3;
  const ranked = sortedRanking(matchsMois, state.joueurs, minM);
  const nonClass = state.joueurs.filter(j => calcStats(matchsMois, j).matchs < minM && calcStats(matchsMois, j).matchs > 0);
  const medals = ['🥇','🥈','🥉'];
  const joueursMois = [...new Set(matchsMois.flatMap(m => [m.a1,m.a2,m.b1,m.b2]))];

  content.innerHTML = `
    <div style="display:flex;gap:.75rem;margin-bottom:1rem;flex-wrap:wrap">
      <div class="duo-stat-card" style="flex:1;min-width:100px"><div class="duo-stat-label">Matchs joués</div><div class="duo-stat-value">${matchsMois.length}</div></div>
      <div class="duo-stat-card" style="flex:1;min-width:100px"><div class="duo-stat-label">Joueurs actifs</div><div class="duo-stat-value">${joueursMois.length}</div></div>
      <div class="duo-stat-card" style="flex:1;min-width:100px"><div class="duo-stat-label">Classés</div><div class="duo-stat-value">${ranked.length}</div></div>
    </div>
    <div class="card">
      <table class="ranking-table">
        <thead><tr><th class="col-rank">Rang</th><th>Joueur</th><th class="col-num">V</th><th class="col-num">D</th><th class="col-num">Matchs</th><th class="col-num">Diff.</th><th class="col-num">Ratio</th></tr></thead>
        <tbody>
          ${ranked.map((r, i) => {
            const medal = i < 3 ? medals[i] : (i + 1);
            const diffClass = r.diff > 0 ? 'diff-pos' : r.diff < 0 ? 'diff-neg' : '';
            const diffStr = r.diff > 0 ? '+' + r.diff : r.diff;
            return `<tr><td class="col-rank">${medal}</td><td style="font-weight:600">${r.j}</td><td class="col-num">${r.v}</td><td class="col-num">${r.d}</td><td class="col-num">${r.matchs}</td><td class="col-num ${diffClass}">${diffStr}</td><td class="col-num" style="font-weight:600">${r.ratio}%</td></tr>`;
          }).join('')}
          ${nonClass.length ? `<tr><td colspan="7" style="font-size:11px;color:#9ca3af;padding-top:10px">N/C (< ${minM} matchs) : ${nonClass.join(', ')}</td></tr>` : ''}
        </tbody>
      </table>
    </div>`;
}
window.renderMensuel = renderMensuel;

// ─── Render: Historique ───────────────────────────────────────────────────────
function renderHistory() {
  const moisFilter = document.getElementById('h-mois').value;
  const joueurFilter = document.getElementById('h-joueur').value;

  const hm = document.getElementById('h-mois');
  hm.innerHTML = '<option value="">Tous les mois</option>';
  MOIS_NOMS.forEach((m, i) => {
    if (state.matchs.some(x => x.mois === i)) {
      const o = document.createElement('option');
      o.value = i; o.textContent = m; hm.appendChild(o);
    }
  });
  hm.value = moisFilter;

  const hj = document.getElementById('h-joueur');
  hj.innerHTML = '<option value="">Tous les joueurs</option>';
  state.joueurs.forEach(j => {
    const o = document.createElement('option');
    o.value = j; o.textContent = j; hj.appendChild(o);
  });
  hj.value = joueurFilter;

  let matchs = [...state.matchs].reverse();
  if (moisFilter !== '') matchs = matchs.filter(m => m.mois === parseInt(moisFilter));
  if (joueurFilter !== '') matchs = matchs.filter(m => [m.a1,m.a2,m.b1,m.b2].includes(joueurFilter));

  document.getElementById('match-count-label').textContent = matchs.length + ' match' + (matchs.length > 1 ? 's' : '');

  const el = document.getElementById('history-list');
  if (!matchs.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><p>Aucun match trouvé.</p></div>`;
    return;
  }

  el.innerHTML = matchs.map(m => {
    const vA = m.ba > m.bb;
    const winner = vA ? `${m.a1} & ${m.a2}` : `${m.b1} & ${m.b2}`;
    const scoreA = vA ? `<strong>${m.ba}</strong>` : m.ba;
    const scoreB = !vA ? `<strong>${m.bb}</strong>` : m.bb;
    const actions = m._id ? `
      <div style="display:flex;gap:4px;margin-left:auto">
        <button onclick="openEditModal('${m._id}')" style="background:#eff6ff;border:1px solid #bfdbfe;color:#2563eb;border-radius:6px;padding:3px 10px;font-size:11px;cursor:pointer;font-weight:500" title="Modifier">✏️ Modifier</button>
        <button onclick="deleteMatch('${m._id}')" style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626;border-radius:6px;padding:3px 8px;font-size:13px;cursor:pointer" title="Supprimer">×</button>
      </div>` : '';
    return `<div class="match-card">
      <span class="match-month">${MOIS_COURT[m.mois]}</span>
      <div class="match-teams">
        <span class="team-names">${m.a1} & ${m.a2}</span>
        <span class="match-score">${scoreA} – ${scoreB}</span>
        <span class="match-vs">vs</span>
        <span class="team-names">${m.b1} & ${m.b2}</span>
      </div>
      <span class="winner-pill">🏆 ${winner}</span>
      ${m.date ? `<span class="match-date">${m.date}</span>` : ''}
      ${actions}
    </div>`;
  }).join('');
}
window.renderHistory = renderHistory;

async function deleteMatch(id) {
  if (!confirm('Supprimer ce match ?')) return;
  await fbDelete(`/matchs/${id}`);
  await reloadMatchs();
}
window.deleteMatch = deleteMatch;

// ─── Modal modification ────────────────────────────────────────────────────────
let editingId = null;

function openEditModal(id) {
  const m = state.matchs.find(x => x._id === id);
  if (!m) return;
  editingId = id;

  // Remplir le select mois
  const moisSel = document.getElementById('e-mois');
  moisSel.innerHTML = MOIS_NOMS.map((n, i) => `<option value="${i}">${n}</option>`).join('');
  moisSel.value = m.mois;

  // Remplir les selects joueurs
  const opts = state.joueurs.map(j => `<option>${j}</option>`).join('');
  ['e-a1','e-a2','e-b1','e-b2'].forEach(id => {
    document.getElementById(id).innerHTML = opts;
  });
  document.getElementById('e-a1').value = m.a1;
  document.getElementById('e-a2').value = m.a2;
  document.getElementById('e-b1').value = m.b1;
  document.getElementById('e-b2').value = m.b2;
  document.getElementById('e-ba').value = m.ba;
  document.getElementById('e-bb').value = m.bb;
  document.getElementById('e-date').value = m.date || '';
  document.getElementById('e-msg').textContent = '';

  const modal = document.getElementById('edit-modal');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeEditModal() {
  document.getElementById('edit-modal').style.display = 'none';
  document.body.style.overflow = '';
  editingId = null;
}

async function saveEditMatch() {
  const a1 = document.getElementById('e-a1').value;
  const a2 = document.getElementById('e-a2').value;
  const b1 = document.getElementById('e-b1').value;
  const b2 = document.getElementById('e-b2').value;
  const ba = parseInt(document.getElementById('e-ba').value) || 0;
  const bb = parseInt(document.getElementById('e-bb').value) || 0;
  const mois = parseInt(document.getElementById('e-mois').value);
  const date = document.getElementById('e-date').value;
  const msg = document.getElementById('e-msg');

  if (new Set([a1, a2, b1, b2]).size < 4) {
    msg.textContent = '⚠ 4 joueurs différents requis.';
    msg.className = 'save-msg error'; return;
  }
  if (ba === bb) {
    msg.textContent = '⚠ Pas de match nul.';
    msg.className = 'save-msg error'; return;
  }

  const btn = document.getElementById('e-save-btn');
  btn.disabled = true; btn.textContent = 'Enregistrement...';

  await fbSet(`/matchs/${editingId}`, { mois, a1, a2, b1, b2, ba, bb, date });
  await reloadMatchs();

  btn.disabled = false; btn.textContent = 'Enregistrer';
  closeEditModal();
}

window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.saveEditMatch = saveEditMatch;

// Fermer la modal en cliquant à l'extérieur
document.getElementById('edit-modal').addEventListener('click', function(e) {
  if (e.target === this) closeEditModal();
});

// ─── Render: Duos ─────────────────────────────────────────────────────────────
function renderDuos() {
  const moisFilter = document.getElementById('duo-mois').value;

  const ds = document.getElementById('duo-mois');
  ds.innerHTML = '<option value="">Toute la saison</option>';
  MOIS_NOMS.forEach((m, i) => {
    if (state.matchs.some(x => x.mois === i)) {
      const o = document.createElement('option');
      o.value = i; o.textContent = m; ds.appendChild(o);
    }
  });
  ds.value = moisFilter;

  let matchs = state.matchs;
  if (moisFilter !== '') matchs = matchs.filter(m => m.mois === parseInt(moisFilter));

  const joueurs = state.joueurs;
  const duos = [];
  for (let i = 0; i < joueurs.length; i++) {
    for (let k = i + 1; k < joueurs.length; k++) {
      const j1 = joueurs[i], j2 = joueurs[k];
      const together = matchs.filter(m =>
        ([m.a1,m.a2].includes(j1) && [m.a1,m.a2].includes(j2)) ||
        ([m.b1,m.b2].includes(j1) && [m.b1,m.b2].includes(j2))
      );
      const n = together.length;
      const avgPerDuo = joueurs.length > 1 ? matchs.length / (joueurs.length - 1) : 0;
      const ecart = Math.round((n - avgPerDuo) * 10) / 10;
      duos.push({ j1, j2, n, ecart });
    }
  }
  duos.sort((a, b) => a.n - b.n);

  const totalDuos = duos.length;
  const duos0 = duos.filter(d => d.n === 0).length;
  const avgMatchs = totalDuos > 0 ? Math.round(duos.reduce((s,d) => s+d.n, 0) / totalDuos * 10) / 10 : 0;

  document.getElementById('duo-stats-grid').innerHTML = `
    <div class="duo-stat-card"><div class="duo-stat-label">Total duos</div><div class="duo-stat-value">${totalDuos}</div></div>
    <div class="duo-stat-card"><div class="duo-stat-label">Duos à 0 match</div><div class="duo-stat-value" style="${duos0>0?'color:#dc2626':''}">${duos0}</div></div>
    <div class="duo-stat-card"><div class="duo-stat-label">Moy. matchs/duo</div><div class="duo-stat-value">${avgMatchs}</div></div>`;

  document.getElementById('tbody-duos').innerHTML = duos.map(d => {
    const prio = d.n === 0
      ? `<span class="badge-urgent">URGENT</span>`
      : d.ecart < -0.5 ? `<span class="badge-rattraper">Rattraper</span>` : '—';
    return `<tr><td><strong>${d.j1}</strong> & <strong>${d.j2}</strong></td><td class="col-num">${d.n}</td><td class="col-num">${d.ecart>0?'+':''}${d.ecart}</td><td>${prio}</td></tr>`;
  }).join('');
}
window.renderDuos = renderDuos;

// ─── Render: Joueurs ──────────────────────────────────────────────────────────
function renderJoueurs() {
  document.getElementById('players-grid').innerHTML = state.joueurs.map((j, i) => {
    const stats = calcStats(state.matchs, j);
    const initials = j.slice(0, 2).toUpperCase();
    return `<div class="player-card">
      <div class="player-avatar">${initials}</div>
      <div class="player-info">
        <div class="player-name">${j}</div>
        <div class="player-matchs">${stats.matchs} matchs · ${stats.ratio}%</div>
      </div>
      <button class="player-remove" onclick="removeJoueur(${i})" title="Retirer ${j}">×</button>
    </div>`;
  }).join('');
}

async function addJoueur() {
  const inp = document.getElementById('new-joueur');
  const nom = inp.value.trim();
  if (!nom) return;
  if (state.joueurs.includes(nom)) { alert('Ce joueur existe déjà.'); return; }
  state.joueurs.push(nom);
  await fbSet('/joueurs', state.joueurs);
  inp.value = '';
  renderJoueurs();
  renderSaisie();
}

async function removeJoueur(i) {
  const nom = state.joueurs[i];
  if (!confirm(`Retirer ${nom} ?`)) return;
  state.joueurs.splice(i, 1);
  await fbSet('/joueurs', state.joueurs);
  renderJoueurs();
  renderSaisie();
}

window.addJoueur = addJoueur;
window.removeJoueur = removeJoueur;

// ─── Render map ───────────────────────────────────────────────────────────────
const renders = {
  general: renderGeneral,
  saisie: renderSaisie,
  mensuel: () => renderMensuel(activeMois),
  matchs: renderHistory,
  duos: renderDuos,
  joueurs: renderJoueurs,
};

// ─── Boot ─────────────────────────────────────────────────────────────────────
initFirebase();
