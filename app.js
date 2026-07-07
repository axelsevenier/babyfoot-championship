'use strict';

const MOIS_NOMS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const MOIS_COURT = ['Jan','Fév','Mar','Avr','Mai','Juin','Jul','Août','Sep','Oct','Nov','Déc'];
const FIREBASE_URL = 'https://babyfoot-championship-default-rtdb.firebaseio.com';

const DEFAULT_JOUEURS = ['Alice','Axel','Mehdi','Mohamed','Thibaut'];
const DEFAULT_MATCHS_2V2 = [
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
let currentMode = '2v2'; // '2v2' ou '1v1'
let paused = []; // joueurs en pause (partagé entre les modes)
let state = {
  '2v2': { joueurs: [...DEFAULT_JOUEURS], matchs: [] },
  '1v1': { joueurs: [...DEFAULT_JOUEURS], matchs: [] }
};
let activeMois = new Date().getMonth();
let currentSort = 'ratio';
let sortDir = 1;
let lastMatchCount = { '2v2': 0, '1v1': 0 };

// Raccourcis vers le state du mode actif
function S() { return state[currentMode]; }
function fbPath(path) { return `/${currentMode}${path}`; }

// ─── Firebase ─────────────────────────────────────────────────────────────────
async function fbGet(path) {
  const r = await fetch(`${FIREBASE_URL}${path}.json`);
  return r.json();
}
async function fbSet(path, data) {
  await fetch(`${FIREBASE_URL}${path}.json`, { method: 'PUT', body: JSON.stringify(data) });
}
async function fbPush(path, data) {
  const r = await fetch(`${FIREBASE_URL}${path}.json`, { method: 'POST', body: JSON.stringify(data) });
  return r.json();
}
async function fbDelete(path) {
  await fetch(`${FIREBASE_URL}${path}.json`, { method: 'DELETE' });
}
function fbListen(path, callback) {
  const es = new EventSource(`${FIREBASE_URL}${path}.json`);
  es.addEventListener('put', e => { const d = JSON.parse(e.data); callback(d.data); });
  es.addEventListener('patch', e => { const d = JSON.parse(e.data); callback(null, d.data); });
  return es;
}

// ─── Init ─────────────────────────────────────────────────────────────────────
async function initFirebase() {
  showLoading(true);
  try {
    // Charger les deux modes
    for (const mode of ['2v2', '1v1']) {
      let joueurs = await fbGet(`/${mode}/joueurs`);
      if (!joueurs) {
        await fbSet(`/${mode}/joueurs`, DEFAULT_JOUEURS);
        joueurs = DEFAULT_JOUEURS;
      }
      state[mode].joueurs = Array.isArray(joueurs) ? joueurs : Object.values(joueurs);

      let matchsRaw = await fbGet(`/${mode}/matchs`);
      if (!matchsRaw && mode === '2v2') {
        for (const m of DEFAULT_MATCHS_2V2) await fbPush(`/${mode}/matchs`, m);
        matchsRaw = await fbGet(`/${mode}/matchs`);
      }
      state[mode].matchs = matchsRaw ? Object.entries(matchsRaw).map(([id,m]) => ({...m, _id: id})) : [];
      lastMatchCount[mode] = state[mode].matchs.length;
    }

    // Charger les joueurs en pause
    const pausedRaw = await fbGet('/paused');
    paused = Array.isArray(pausedRaw) ? pausedRaw : Object.values(pausedRaw || {});

    showLoading(false);
    renderMensuel(activeMois);
    renderSaisie();

    // Écoute temps réel pour les deux modes
    fbListen('/paused', (d) => { paused = Array.isArray(d) ? d : Object.values(d || {}); });
    fbListen('/2v2/matchs', () => reloadMatchs('2v2', true));
    fbListen('/1v1/matchs', () => reloadMatchs('1v1', true));
    fbListen('/2v2/joueurs', () => reloadJoueurs('2v2'));
    fbListen('/1v1/joueurs', () => reloadJoueurs('1v1'));
  } catch(e) {
    console.error(e);
    showLoading(false);
    document.getElementById('loading-error').style.display = 'block';
  }
}

async function reloadMatchs(mode, notify = false) {
  const matchsRaw = await fbGet(`/${mode}/matchs`);
  state[mode].matchs = matchsRaw ? Object.entries(matchsRaw).map(([id,m]) => ({...m, _id: id})) : [];

  if (notify && state[mode].matchs.length > lastMatchCount[mode]) {
    const last = state[mode].matchs[state[mode].matchs.length - 1];
    if (last && mode === currentMode) {
      const winner = mode === '1v1'
        ? (last.ba > last.bb ? last.a1 : last.b1)
        : (last.ba > last.bb ? `${last.a1} & ${last.a2}` : `${last.b1} & ${last.b2}`);
      showNotif(`🏆 ${winner} ${mode === '1v1' ? 'vient' : 'viennent'} de gagner !`);
    }
  }
  lastMatchCount[mode] = state[mode].matchs.length;

  if (mode !== currentMode) return;
  const activePage = document.querySelector('.page.active')?.id?.replace('page-','');
  if (activePage === 'general') renderGeneral();
  if (activePage === 'mensuel') renderMensuel(activeMois);
  if (activePage === 'palmares') renderPalmares();
  if (activePage === 'matchs') renderHistory();
  if (activePage === 'duos') renderDuos();
}

async function reloadJoueurs(mode) {
  const joueurs = await fbGet(`/${mode}/joueurs`);
  state[mode].joueurs = Array.isArray(joueurs) ? joueurs : Object.values(joueurs || {});
  if (mode !== currentMode) return;
  const activePage = document.querySelector('.page.active')?.id?.replace('page-','');
  if (activePage === 'joueurs') renderJoueurs();
  if (activePage === 'saisie') renderSaisie();
}

function showLoading(show) {
  document.getElementById('loading-overlay').style.display = show ? 'flex' : 'none';
}

function showNotif(msg) {
  const el = document.getElementById('notif-banner');
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

// ─── Changement de mode ───────────────────────────────────────────────────────
function setMode(mode) {
  currentMode = mode;

  // Boutons header
  document.getElementById('mode-btn-2v2').classList.toggle('active', mode === '2v2');
  document.getElementById('mode-btn-1v1').classList.toggle('active', mode === '1v1');

  // Bandeau
  const banner = document.getElementById('mode-banner');
  banner.className = `mode-banner mode-banner-${mode}`;
  banner.innerHTML = mode === '2v2' ? '⚽ Mode <strong>2 vs 2</strong>' : '🎯 Mode <strong>1 vs 1</strong>';

  // Label onglet Duos
  document.getElementById('nav-duos-label').textContent = mode === '1v1' ? 'Face-à-face' : 'Duos';
  document.getElementById('duos-title').textContent = mode === '1v1' ? 'Face-à-face' : 'Analyse des duos';
  document.getElementById('duos-sub').textContent = mode === '1v1' ? 'Résultats directs entre joueurs' : 'Équilibrage des coéquipiers';
  document.getElementById('duos-th-col1').textContent = mode === '1v1' ? 'Confrontation' : 'Duo';
  document.getElementById('duos-th-col3').textContent = mode === '1v1' ? 'Ratio A gagne' : 'Écart moy.';
  document.getElementById('saisie-sub').textContent = mode === '2v2' ? 'Match 2 contre 2' : 'Match 1 contre 1';
  document.getElementById('th-joueur').textContent = 'Joueur';

  // Formulaire saisie
  document.getElementById('form-2v2').style.display = mode === '2v2' ? '' : 'none';
  document.getElementById('form-1v1').style.display = mode === '1v1' ? '' : 'none';

  // Re-render la page active
  const activePage = document.querySelector('.page.active')?.id?.replace('page-','');
  renders[activePage] && renders[activePage]();
  renderSaisie();
}
window.setMode = setMode;

// ─── Stats ────────────────────────────────────────────────────────────────────
function calcStats(matchs, joueur) {
  let v = 0, d = 0, diff = 0;
  matchs.forEach(m => {
    const is1v1 = !m.a2;
    const inA = is1v1 ? m.a1 === joueur : [m.a1,m.a2].includes(joueur);
    const inB = is1v1 ? m.b1 === joueur : [m.b1,m.b2].includes(joueur);
    if (!inA && !inB) return;
    const vA = m.ba > m.bb;
    if (inA) { v += vA?1:0; d += vA?0:1; diff += (m.ba-m.bb); }
    else      { v += vA?0:1; d += vA?1:0; diff += (m.bb-m.ba); }
  });
  const total = v + d;
  return { v, d, matchs: total, diff, ratio: total > 0 ? Math.round(v/total*100) : 0 };
}

function defaultRanking(matchs, joueurs, minMatchs = 0) {
  return joueurs
    .map(j => ({ j, ...calcStats(matchs, j) }))
    .filter(r => r.matchs >= minMatchs)
    .sort((a, b) => (b.ratio - a.ratio) || (b.diff - a.diff) || (b.v - a.v));
}

function getStreak(matchs, joueur) {
  let streak = 0;
  for (let i = matchs.length - 1; i >= 0; i--) {
    const m = matchs[i];
    const is1v1 = !m.a2;
    const inA = is1v1 ? m.a1 === joueur : [m.a1,m.a2].includes(joueur);
    const inB = is1v1 ? m.b1 === joueur : [m.b1,m.b2].includes(joueur);
    if (!inA && !inB) continue;
    const won = inA ? m.ba > m.bb : m.bb > m.ba;
    if (won) streak++;
    else break;
  }
  return streak;
}

function getMaxStreak(matchs, joueur) {
  let max = 0, cur = 0;
  matchs.forEach(m => {
    const is1v1 = !m.a2;
    const inA = is1v1 ? m.a1 === joueur : [m.a1,m.a2].includes(joueur);
    const inB = is1v1 ? m.b1 === joueur : [m.b1,m.b2].includes(joueur);
    if (!inA && !inB) return;
    const won = inA ? m.ba > m.bb : m.bb > m.ba;
    if (won) { cur++; max = Math.max(max, cur); }
    else cur = 0;
  });
  return max;
}

// Évolution du rang : compare avec le classement avant le dernier jour joué
function getRankEvolution(matchs, joueurs) {
  const current = defaultRanking(matchs, joueurs, 0);
  const dates = matchs.map(m => m.date).filter(Boolean);
  let prevMatchs;
  if (dates.length) {
    const lastDay = dates.sort()[dates.length - 1];
    prevMatchs = matchs.filter(m => m.date !== lastDay);
  } else {
    // Fallback si aucun match n'a de date : on retire les 5 derniers
    prevMatchs = matchs.slice(0, Math.max(0, matchs.length - 5));
  }
  const previous = defaultRanking(prevMatchs, joueurs, 0);
  const evo = {};
  current.forEach((r, i) => {
    const prevIdx = previous.findIndex(p => p.j === r.j);
    if (prevIdx === -1) { evo[r.j] = 0; return; }
    evo[r.j] = prevIdx - i; // positif = monte
  });
  return evo;
}

function sortedRanking(matchs, joueurs, minMatchs = 0) {
  return joueurs
    .map(j => ({ j, ...calcStats(matchs, j) }))
    .filter(r => r.matchs >= minMatchs)
    .sort((a, b) => {
      const val = (b[currentSort] - a[currentSort]) * sortDir;
      if (val !== 0) return val;
      return (b.ratio - a.ratio) || (b.diff - a.diff);
    });
}

// ─── Navigation ───────────────────────────────────────────────────────────────
const PAGE_ORDER = ['general','saisie','mensuel','palmares','matchs','duos','joueurs'];

function showPage(id) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const btn = document.querySelector(`.nav-btn[data-page="${id}"]`);
  if (btn) btn.classList.add('active');
  const page = document.getElementById('page-' + id);
  if (page) page.classList.add('active');
  renders[id] && renders[id]();
}
window.showPage = showPage;

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => showPage(btn.dataset.page));
});



// Tri
function sortBy(col) {
  if (currentSort === col) sortDir *= -1;
  else { currentSort = col; sortDir = 1; }
  document.querySelectorAll('.sortable').forEach(th => th.classList.remove('active-sort'));
  document.querySelector(`.sortable[data-sort="${col}"]`)?.classList.add('active-sort');
  renderGeneral();
}
window.sortBy = sortBy;

// ─── Render: Classement général ───────────────────────────────────────────────
function renderGeneral() {
  const rows = sortedRanking(S().matchs, S().joueurs, 0);
  const top3 = rows.slice(0, 3);
  const medals = ['🥇','🥈','🥉'];
  const rankClasses = ['rank-1','rank-2','rank-3'];

  document.getElementById('podium-row').innerHTML = top3.map((r, i) =>
    `<div class="podium-card ${rankClasses[i]}">
      <div class="podium-medal">${medals[i]}</div>
      <div class="podium-name">${r.j}</div>
      <div class="podium-ratio">${r.ratio}%</div>
      <div class="podium-stats">${r.v}V · ${r.d}D · ${r.matchs} matchs</div>
    </div>`
  ).join('');

  const evo = getRankEvolution(S().matchs, S().joueurs);
  document.getElementById('tbody-general').innerHTML = rows.map((r, i) => {
    const medal = i < 3 ? medals[i] : (i + 1);
    const diffClass = r.diff > 0 ? 'diff-pos' : r.diff < 0 ? 'diff-neg' : '';
    const diffStr = r.diff > 0 ? '+' + r.diff : r.diff;
    const e = evo[r.j] || 0;
    const evoIcon = e > 0 ? '<span style="color:#16a34a;font-size:11px">▲</span>' : e < 0 ? '<span style="color:#dc2626;font-size:11px">▼</span>' : '<span style="color:#d1d5db;font-size:11px">–</span>';
    const streak = getStreak(S().matchs, r.j);
    const streakBadge = streak >= 3 ? ` <span style="font-size:11px;background:#fef3c7;color:#92400e;padding:1px 6px;border-radius:100px;font-weight:600">🔥${streak}</span>` : '';
    return `<tr>
      <td class="col-rank">${medal} ${evoIcon}</td>
      <td style="font-weight:600;cursor:pointer" onclick="showPlayerDetail('${r.j}')">${r.j}${streakBadge} <span style="font-size:10px;color:#9ca3af">↗</span></td>
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
  moisSel.innerHTML = MOIS_NOMS.map((m,i) => `<option value="${i}">${m}</option>`).join('');
  moisSel.value = new Date().getMonth();
  const opts = '<option value="">— Choisir —</option>' + S().joueurs.map(j => `<option>${j}</option>`).join('');

  if (currentMode === '2v2') {
    ['s-a1','s-a2','s-b1','s-b2'].forEach(id => {
      document.getElementById(id).innerHTML = opts;
      document.getElementById(id).value = '';
    });
  } else {
    ['s-1a','s-1b'].forEach(id => {
      document.getElementById(id).innerHTML = opts;
      document.getElementById(id).value = '';
    });
  }
  const dateEl = document.getElementById('s-date');
  if (!dateEl.value) dateEl.value = new Date().toISOString().split('T')[0];
  updateWinnerPreview();
}

function adjustScore(id, delta) {
  const el = document.getElementById(id);
  el.value = Math.max(0, Math.min(20, parseInt(el.value || 0) + delta));
  updateWinnerPreview();
}
window.adjustScore = adjustScore;

function setScore(id, val) {
  document.getElementById(id).value = val;
  updateWinnerPreview();
}
window.setScore = setScore;

// ─── Suggestion d'équipes équilibrées ─────────────────────────────────────────
function duoCount(matchs, j1, j2) {
  return matchs.filter(m =>
    ([m.a1,m.a2].includes(j1) && [m.a1,m.a2].includes(j2)) ||
    ([m.b1,m.b2].includes(j1) && [m.b1,m.b2].includes(j2))
  ).length;
}

function confrontCount(matchs, j1, j2) {
  return matchs.filter(m => (m.a1===j1&&m.b1===j2)||(m.a1===j2&&m.b1===j1)).length;
}

// Index de rotation des suggestions (réinitialisé quand le contexte change)
let suggestIdx = 0;
let suggestKey = '';

function suggestMatch() {
  const actifs = S().joueurs.filter(j => !paused.includes(j));
  // Équilibrage basé sur le mois sélectionné dans le formulaire de saisie
  const moisCible = parseInt(document.getElementById('s-mois')?.value ?? new Date().getMonth());
  const matchsMois = S().matchs.filter(m => m.mois === moisCible);

  // Si le contexte change (mode, mois, joueurs, nb matchs), on repart de la proposition n°1
  const key = `${currentMode}|${moisCible}|${actifs.join(',')}|${matchsMois.length}`;
  if (key !== suggestKey) { suggestKey = key; suggestIdx = 0; }

  if (currentMode === '2v2') {
    if (actifs.length < 4) { alert('Il faut au moins 4 joueurs actifs (hors pause).'); return; }
    // Énumérer toutes les répartitions possibles et les classer par priorité
    const options = [];
    for (let a = 0; a < actifs.length; a++)
    for (let b = a+1; b < actifs.length; b++)
    for (let c = b+1; c < actifs.length; c++)
    for (let d = c+1; d < actifs.length; d++) {
      const quad = [actifs[a], actifs[b], actifs[c], actifs[d]];
      const splits = [
        [[quad[0],quad[1]],[quad[2],quad[3]]],
        [[quad[0],quad[2]],[quad[1],quad[3]]],
        [[quad[0],quad[3]],[quad[1],quad[2]]],
      ];
      splits.forEach(([tA, tB]) => {
        const score = duoCount(matchsMois, tA[0], tA[1]) + duoCount(matchsMois, tB[0], tB[1]);
        options.push({ tA, tB, score });
      });
    }
    options.sort((x, y) => x.score - y.score);
    const pick = options[suggestIdx % options.length];
    suggestIdx++;
    document.getElementById('s-a1').value = pick.tA[0];
    document.getElementById('s-a2').value = pick.tA[1];
    document.getElementById('s-b1').value = pick.tB[0];
    document.getElementById('s-b2').value = pick.tB[1];
  } else {
    if (actifs.length < 2) { alert('Il faut au moins 2 joueurs actifs (hors pause).'); return; }
    const options = [];
    for (let i = 0; i < actifs.length; i++)
    for (let k = i+1; k < actifs.length; k++) {
      options.push({ j1: actifs[i], j2: actifs[k], n: confrontCount(matchsMois, actifs[i], actifs[k]) });
    }
    options.sort((x, y) => x.n - y.n);
    const pick = options[suggestIdx % options.length];
    suggestIdx++;
    document.getElementById('s-1a').value = pick.j1;
    document.getElementById('s-1b').value = pick.j2;
  }
  updateWinnerPreview();
}
window.suggestMatch = suggestMatch;

function updateWinnerPreview() {
  const preview = document.getElementById('winner-preview');
  if (!preview) return;
  let ba, bb, labelA, labelB;
  if (currentMode === '2v2') {
    ba = parseInt(document.getElementById('s-ba')?.value) || 0;
    bb = parseInt(document.getElementById('s-bb')?.value) || 0;
    const a1 = document.getElementById('s-a1')?.value || '';
    const a2 = document.getElementById('s-a2')?.value || '';
    const b1 = document.getElementById('s-b1')?.value || '';
    const b2 = document.getElementById('s-b2')?.value || '';
    labelA = `${a1} & ${a2}`; labelB = `${b1} & ${b2}`;
  } else {
    ba = parseInt(document.getElementById('s-1ba')?.value) || 0;
    bb = parseInt(document.getElementById('s-1bb')?.value) || 0;
    labelA = document.getElementById('s-1a')?.value || '';
    labelB = document.getElementById('s-1b')?.value || '';
  }
  if (ba === bb) { preview.style.display = 'none'; return; }
  preview.style.display = 'block';
  if (ba > bb) {
    preview.className = 'winner-a';
    preview.textContent = `🏆 ${labelA} gagne (${ba} – ${bb})`;
  } else {
    preview.className = 'winner-b';
    preview.textContent = `🏆 ${labelB} gagne (${bb} – ${ba})`;
  }
}
window.updateWinnerPreview = updateWinnerPreview;

async function saveMatch() {
  const mois = parseInt(document.getElementById('s-mois').value);
  const date = document.getElementById('s-date').value;
  const msg = document.getElementById('s-msg');
  let matchData;

  if (currentMode === '2v2') {
    const a1 = document.getElementById('s-a1').value;
    const a2 = document.getElementById('s-a2').value;
    const b1 = document.getElementById('s-b1').value;
    const b2 = document.getElementById('s-b2').value;
    const ba = parseInt(document.getElementById('s-ba').value) || 0;
    const bb = parseInt(document.getElementById('s-bb').value) || 0;
    if (new Set([a1,a2,b1,b2]).size < 4) { msg.textContent = '⚠ 4 joueurs différents requis.'; msg.className = 'save-msg error'; return; }
    if (ba === bb) { msg.textContent = '⚠ Pas de match nul.'; msg.className = 'save-msg error'; return; }
    matchData = { mois, a1, a2, b1, b2, ba, bb, date };
  } else {
    const a1 = document.getElementById('s-1a').value;
    const b1 = document.getElementById('s-1b').value;
    const ba = parseInt(document.getElementById('s-1ba').value) || 0;
    const bb = parseInt(document.getElementById('s-1bb').value) || 0;
    if (a1 === b1) { msg.textContent = '⚠ 2 joueurs différents requis.'; msg.className = 'save-msg error'; return; }
    if (ba === bb) { msg.textContent = '⚠ Pas de match nul.'; msg.className = 'save-msg error'; return; }
    matchData = { mois, a1, b1, ba, bb, date };
  }

  const btn = document.querySelector('#page-saisie .btn-primary');
  btn.disabled = true; btn.textContent = 'Enregistrement...';
  await fbPush(`/${currentMode}/matchs`, matchData);
  await reloadMatchs(currentMode, false);

  // Reset scores
  if (currentMode === '2v2') { document.getElementById('s-ba').value = 0; document.getElementById('s-bb').value = 0; }
  else { document.getElementById('s-1ba').value = 0; document.getElementById('s-1bb').value = 0; }
  updateWinnerPreview();
  msg.textContent = '✓ Match enregistré !'; msg.className = 'save-msg';
  btn.disabled = false; btn.textContent = 'Enregistrer le match';
  setTimeout(() => { msg.textContent = ''; }, 3000);
}
window.saveMatch = saveMatch;

// ─── Render: Mensuel ──────────────────────────────────────────────────────────
function renderMensuel(mois) {
  if (mois !== undefined) activeMois = mois;
  document.getElementById('month-pills').innerHTML = MOIS_NOMS.map((m, i) => {
    const hasData = S().matchs.some(x => x.mois === i);
    return `<button class="month-pill ${i === activeMois ? 'active' : ''} ${!hasData ? 'empty' : ''}" onclick="renderMensuel(${i})">${m}</button>`;
  }).join('');

  const matchsMois = S().matchs.filter(m => m.mois === activeMois);
  const content = document.getElementById('mensuel-content');
  if (!matchsMois.length) { content.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><p>Aucun match en ${MOIS_NOMS[activeMois]}.</p></div>`; return; }

  const minM = 3;
  const ranked = sortedRanking(matchsMois, S().joueurs, minM);
  const nonClass = S().joueurs.filter(j => calcStats(matchsMois, j).matchs < minM && calcStats(matchsMois, j).matchs > 0);
  const medals = ['🥇','🥈','🥉'];
  const joueursMois = [...new Set(matchsMois.flatMap(m => currentMode === '1v1' ? [m.a1,m.b1] : [m.a1,m.a2,m.b1,m.b2]))];

  content.innerHTML = `
    <div style="display:flex;gap:.75rem;margin-bottom:1rem;flex-wrap:wrap">
      <div class="duo-stat-card" style="flex:1;min-width:100px"><div class="duo-stat-label">Matchs joués</div><div class="duo-stat-value">${matchsMois.length}</div></div>
      <div class="duo-stat-card" style="flex:1;min-width:100px"><div class="duo-stat-label">Joueurs actifs</div><div class="duo-stat-value">${joueursMois.length}</div></div>
      <div class="duo-stat-card" style="flex:1;min-width:100px"><div class="duo-stat-label">Classés</div><div class="duo-stat-value">${ranked.length}</div></div>
    </div>
    <div class="card">
      <table class="ranking-table"><thead><tr><th class="col-rank">Rang</th><th>Joueur</th><th class="col-num">V</th><th class="col-num">D</th><th class="col-num">Matchs</th><th class="col-num">Diff.</th><th class="col-num">Ratio</th></tr></thead>
      <tbody>
        ${(() => { const evoM = getRankEvolution(matchsMois, S().joueurs); return ranked.map((r, i) => {
          const medal = i < 3 ? medals[i] : (i+1);
          const diffClass = r.diff > 0 ? 'diff-pos' : r.diff < 0 ? 'diff-neg' : '';
          const diffStr = r.diff > 0 ? '+'+r.diff : r.diff;
          const e = evoM[r.j] || 0;
          const evoIcon = e > 0 ? '<span style="color:#16a34a;font-size:10px">▲</span>' : e < 0 ? '<span style="color:#dc2626;font-size:10px">▼</span>' : '';
          return `<tr><td class="col-rank">${medal}${evoIcon}</td><td style="font-weight:600">${r.j}</td><td class="col-num">${r.v}</td><td class="col-num">${r.d}</td><td class="col-num">${r.matchs}</td><td class="col-num ${diffClass}">${diffStr}</td><td class="col-num" style="font-weight:600">${r.ratio}%</td></tr>`;
        }).join(''); })()}
        ${nonClass.length ? `<tr><td colspan="7" style="font-size:11px;color:#9ca3af;padding-top:10px">N/C (< ${minM} matchs) : ${nonClass.join(', ')}</td></tr>` : ''}
      </tbody></table>
    </div>`;
}
window.renderMensuel = renderMensuel;

// ─── Render: Palmarès ────────────────────────────────────────────────────────
let palmaresMoisFilter = ''; // '' = toute la saison

function palmaresMatchs() {
  if (palmaresMoisFilter === '') return S().matchs;
  return S().matchs.filter(m => m.mois === parseInt(palmaresMoisFilter));
}

function setPalmaresFilter(val) {
  palmaresMoisFilter = val;
  const j1 = document.getElementById('cmp-j1')?.value || '';
  const j2 = document.getElementById('cmp-j2')?.value || '';
  renderPalmares();
  // Restaurer la sélection du comparateur
  if (j1) document.getElementById('cmp-j1').value = j1;
  if (j2) document.getElementById('cmp-j2').value = j2;
  if (j1 && j2) renderComparateur();
}
window.setPalmaresFilter = setPalmaresFilter;

function renderPalmares() {
  const content = document.getElementById('palmares-content');
  const moisAvecData = [...new Set(S().matchs.map(m => m.mois))].sort((a,b) => a-b);
  if (!moisAvecData.length) { content.innerHTML = '<div class="empty-state"><div class="empty-icon">🎖️</div><p>Aucune donnée.</p></div>'; return; }

  const fMatchs = palmaresMatchs(); // matchs filtrés pour records + comparateur

  const titresHTML = moisAvecData.map(mois => {
    const matchsMois = S().matchs.filter(m => m.mois === mois);
    const ranked = sortedRanking(matchsMois, S().joueurs, 3);
    if (!ranked.length) return '';
    const winner = ranked[0];
    return `<div class="palmares-month-card">
      <span style="font-size:24px">🥇</span>
      <div><div class="palmares-mois">${MOIS_NOMS[mois]}</div>
      <div class="palmares-winner">${winner.j}</div>
      <div class="palmares-stats">${winner.v}V · ${winner.d}D · ${winner.ratio}% de réussite</div></div>
    </div>`;
  }).join('');

  const joueursHTML = S().joueurs.map(j => {
    const globalStats = calcStats(S().matchs, j);
    const monthlyRatios = moisAvecData.map(mois => {
      const mm = S().matchs.filter(m => m.mois === mois);
      const s = calcStats(mm, j);
      return { mois, ...s };
    }).filter(s => s.matchs > 0);

    const meilleurDuo = currentMode === '2v2' ? getBestDuo(j) : null;
    const pireAdversaire = getWorstOpponent(j);

    const ratiosBars = monthlyRatios.map(s =>
      `<div class="month-ratio-row">
        <span class="month-ratio-label">${MOIS_COURT[s.mois]}</span>
        <div style="flex:1"><div class="ratio-bar-wrap"><div class="ratio-bar" style="width:${s.ratio}%"></div></div></div>
        <span class="month-ratio-val">${s.ratio}%</span>
      </div>`
    ).join('');

    return `<div class="player-detail-card">
      <div class="player-detail-header" onclick="togglePlayerDetail('pd-${j}')">
        <div class="player-avatar" style="width:38px;height:38px;border-radius:50%;background:#dcfce7;color:#14532d;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">${j.slice(0,2).toUpperCase()}</div>
        <div style="flex:1">
          <div style="font-weight:700;font-size:15px">${j}</div>
          <div style="font-size:12px;color:#6b7280">${globalStats.v}V · ${globalStats.d}D · ${globalStats.ratio}% sur la saison</div>
        </div>
        <span style="color:#9ca3af;font-size:18px">▸</span>
      </div>
      <div class="player-detail-body" id="pd-${j}">
        <div style="margin-bottom:1rem">
          <div style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.5rem">Évolution mensuelle</div>
          ${ratiosBars || '<p style="font-size:12px;color:#9ca3af">Pas assez de données.</p>'}
        </div>
        <div style="display:flex;gap:.75rem;flex-wrap:wrap">
          ${meilleurDuo ? `<div class="duo-stat-card" style="flex:1;min-width:120px"><div class="duo-stat-label">Meilleur duo</div><div style="font-size:15px;font-weight:700">${meilleurDuo.j} <span style="font-size:12px;color:#6b7280">(${meilleurDuo.ratio}%)</span></div></div>` : ''}
          ${pireAdversaire ? `<div class="duo-stat-card" style="flex:1;min-width:120px"><div class="duo-stat-label">Adversaire difficile</div><div style="font-size:15px;font-weight:700">${pireAdversaire.j} <span style="font-size:12px;color:#6b7280">(${pireAdversaire.ratio}%)</span></div></div>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');

  // ── Homme en forme (meilleur ratio sur les 10 derniers matchs, min 5 joués) ──
  let enForme = null;
  S().joueurs.forEach(j => {
    const perso = fMatchs.filter(m => {
      const is1v1 = !m.a2;
      return is1v1 ? [m.a1,m.b1].includes(j) : [m.a1,m.a2,m.b1,m.b2].includes(j);
    }).slice(-10);
    if (perso.length < 5) return;
    const s = calcStats(perso, j);
    if (!enForme || s.ratio > enForme.ratio) enForme = { j, ratio: s.ratio, n: perso.length };
  });

  // ── Records ──
  let bigWin = null;
  fMatchs.forEach(m => {
    const gap = Math.abs(m.ba - m.bb);
    if (!bigWin || gap > bigWin.gap) bigWin = { ...m, gap };
  });
  let maxStreak = null;
  S().joueurs.forEach(j => {
    const ms = getMaxStreak(fMatchs, j);
    if (!maxStreak || ms > maxStreak.n) maxStreak = { j, n: ms };
  });
  const parMois = {};
  fMatchs.forEach(m => { parMois[m.mois] = (parMois[m.mois] || 0) + 1; });
  let moisActif = null;
  Object.entries(parMois).forEach(([mois, n]) => {
    if (!moisActif || n > moisActif.n) moisActif = { mois: parseInt(mois), n };
  });

  const is1v1BW = bigWin && !bigWin.a2;
  const bigWinLabel = bigWin ? `${is1v1BW ? bigWin.a1 : bigWin.a1+' & '+bigWin.a2} ${bigWin.ba} – ${bigWin.bb} ${is1v1BW ? bigWin.b1 : bigWin.b1+' & '+bigWin.b2}` : '—';

  // Sélecteur de mois pour records + comparateur
  const moisFilterOptions = '<option value="">Toute la saison</option>' + moisAvecData.map(mois =>
    `<option value="${mois}" ${String(mois) === palmaresMoisFilter ? 'selected' : ''}>${MOIS_NOMS[mois]}</option>`
  ).join('');
  const filterHTML = `
    <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1rem;flex-wrap:wrap">
      <label style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.04em">Filtrer records & comparateur :</label>
      <select class="form-select" style="width:auto;min-width:160px" onchange="setPalmaresFilter(this.value)">${moisFilterOptions}</select>
    </div>`;

  const periodLabel = palmaresMoisFilter === '' ? '' : ` (${MOIS_NOMS[parseInt(palmaresMoisFilter)]})`;

  const recordsHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:.75rem;margin-bottom:1.5rem">
      ${enForme ? `<div class="duo-stat-card" style="border-top:3px solid #16a34a"><div class="duo-stat-label">💪 L'homme en forme${periodLabel}</div><div style="font-size:16px;font-weight:800">${enForme.j}</div><div style="font-size:11px;color:#6b7280">${enForme.ratio}% sur ses ${enForme.n} derniers matchs</div></div>` : ''}
      ${bigWin ? `<div class="duo-stat-card" style="border-top:3px solid #f59e0b"><div class="duo-stat-label">💥 Plus grosse victoire${periodLabel}</div><div style="font-size:13px;font-weight:700">${bigWinLabel}</div><div style="font-size:11px;color:#6b7280">Écart de ${bigWin.gap} buts</div></div>` : ''}
      ${maxStreak && maxStreak.n >= 2 ? `<div class="duo-stat-card" style="border-top:3px solid #dc2626"><div class="duo-stat-label">🔥 Plus longue série${periodLabel}</div><div style="font-size:16px;font-weight:800">${maxStreak.j}</div><div style="font-size:11px;color:#6b7280">${maxStreak.n} victoires d'affilée</div></div>` : ''}
      ${moisActif && palmaresMoisFilter === '' ? `<div class="duo-stat-card" style="border-top:3px solid #2563eb"><div class="duo-stat-label">📅 Mois le plus actif</div><div style="font-size:16px;font-weight:800">${MOIS_NOMS[moisActif.mois]}</div><div style="font-size:11px;color:#6b7280">${moisActif.n} matchs joués</div></div>` : ''}
      ${moisActif && palmaresMoisFilter !== '' ? `<div class="duo-stat-card" style="border-top:3px solid #2563eb"><div class="duo-stat-label">📅 Matchs joués${periodLabel}</div><div style="font-size:16px;font-weight:800">${moisActif.n}</div></div>` : ''}
    </div>`;

  // ── Comparateur ──
  const opts = '<option value="">— Joueur —</option>' + S().joueurs.map(j => `<option>${j}</option>`).join('');
  const comparateurHTML = `
    <div class="card form-card" style="margin-bottom:1.5rem">
      <h3 class="card-title">⚔️ Comparateur de joueurs</h3>
      <div style="display:flex;gap:.75rem;align-items:center;flex-wrap:wrap;margin-bottom:.75rem">
        <select id="cmp-j1" class="form-select" style="flex:1;min-width:120px" onchange="renderComparateur()">${opts}</select>
        <span style="font-weight:800;color:#9ca3af">VS</span>
        <select id="cmp-j2" class="form-select" style="flex:1;min-width:120px" onchange="renderComparateur()">${opts}</select>
      </div>
      <div id="cmp-result"></div>
    </div>`;

  content.innerHTML = `
    ${filterHTML}
    ${recordsHTML}
    ${comparateurHTML}
    <div style="margin-bottom:1.5rem">
      <h3 style="font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.75rem">Vainqueurs mensuels</h3>
      ${titresHTML || '<p style="color:#9ca3af;font-size:13px">Pas encore de données.</p>'}
    </div>
    <div>
      <h3 style="font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.75rem">Fiche par joueur</h3>
      ${joueursHTML}
    </div>`;
}

function renderComparateur() {
  const j1 = document.getElementById('cmp-j1').value;
  const j2 = document.getElementById('cmp-j2').value;
  const res = document.getElementById('cmp-result');
  if (!j1 || !j2 || j1 === j2) { res.innerHTML = ''; return; }

  const cMatchs = palmaresMatchs();
  const s1 = calcStats(cMatchs, j1);
  const s2 = calcStats(cMatchs, j2);

  // Confrontations directes (camps opposés)
  const vs = cMatchs.filter(m => {
    const is1v1 = !m.a2;
    if (is1v1) return (m.a1===j1&&m.b1===j2)||(m.a1===j2&&m.b1===j1);
    const j1inA = [m.a1,m.a2].includes(j1);
    const j2inA = [m.a1,m.a2].includes(j2);
    const j1inB = [m.b1,m.b2].includes(j1);
    const j2inB = [m.b1,m.b2].includes(j2);
    return (j1inA||j1inB) && (j2inA||j2inB) && (j1inA !== j2inA);
  });
  const sVs = calcStats(vs, j1);

  // Ensemble (2v2 uniquement)
  const ensemble = currentMode === '2v2' ? cMatchs.filter(m =>
    ([m.a1,m.a2].includes(j1) && [m.a1,m.a2].includes(j2)) ||
    ([m.b1,m.b2].includes(j1) && [m.b1,m.b2].includes(j2))
  ) : [];
  const sEns = ensemble.length ? calcStats(ensemble, j1) : null;

  const bar = (v1, v2, label) => {
    const total = v1 + v2 || 1;
    const p1 = Math.round(v1/total*100);
    return `<div style="margin-bottom:.75rem">
      <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;margin-bottom:3px">
        <span style="color:#2563eb">${v1}</span><span style="color:#6b7280;font-size:11px">${label}</span><span style="color:#dc2626">${v2}</span>
      </div>
      <div style="display:flex;height:8px;border-radius:100px;overflow:hidden;background:#f3f4f6">
        <div style="width:${p1}%;background:#3b82f6"></div>
        <div style="flex:1;background:#ef4444"></div>
      </div>
    </div>`;
  };

  res.innerHTML = `
    <div style="display:flex;justify-content:space-between;font-weight:800;font-size:15px;margin-bottom:1rem">
      <span style="color:#2563eb">${j1}</span><span style="color:#dc2626">${j2}</span>
    </div>
    ${bar(s1.v, s2.v, palmaresMoisFilter === '' ? 'Victoires (saison)' : 'Victoires (' + MOIS_NOMS[parseInt(palmaresMoisFilter)] + ')')}
    ${bar(s1.ratio, s2.ratio, 'Ratio %')}
    ${vs.length ? bar(sVs.v, sVs.d, `Face-à-face (${vs.length} matchs)`) : '<p style="font-size:12px;color:#9ca3af;text-align:center">Jamais affrontés directement.</p>'}
    ${sEns ? `<p style="font-size:12px;color:#6b7280;text-align:center;margin-top:.5rem">🤝 En duo ensemble : ${sEns.v}V – ${sEns.d}D (${sEns.ratio}%) sur ${ensemble.length} matchs</p>` : ''}
  `;
}
window.renderComparateur = renderComparateur;

function togglePlayerDetail(id) { const el = document.getElementById(id); if (el) el.classList.toggle('open'); }
window.togglePlayerDetail = togglePlayerDetail;

function getBestDuo(joueur) {
  let best = null;
  S().joueurs.filter(j => j !== joueur).forEach(p => {
    const together = S().matchs.filter(m =>
      ([m.a1,m.a2].includes(joueur) && [m.a1,m.a2].includes(p)) ||
      ([m.b1,m.b2].includes(joueur) && [m.b1,m.b2].includes(p))
    );
    if (together.length < 2) return;
    const s = calcStats(together, joueur);
    if (!best || s.ratio > best.ratio) best = { j: p, ratio: s.ratio };
  });
  return best;
}

function getWorstOpponent(joueur) {
  let worst = null;
  S().joueurs.filter(j => j !== joueur).forEach(o => {
    const vsMatches = S().matchs.filter(m => {
      const is1v1 = !m.a2;
      if (is1v1) return (m.a1 === joueur && m.b1 === o) || (m.b1 === joueur && m.a1 === o);
      const joueurInA = [m.a1,m.a2].includes(joueur);
      const opponentInA = [m.a1,m.a2].includes(o);
      return joueurInA !== opponentInA;
    });
    if (vsMatches.length < 2) return;
    const s = calcStats(vsMatches, joueur);
    if (!worst || s.ratio < worst.ratio) worst = { j: o, ratio: s.ratio };
  });
  return worst;
}

function showPlayerDetail(joueur) {
  showPage('palmares');
  setTimeout(() => {
    const el = document.getElementById(`pd-${joueur}`);
    if (el) { el.classList.add('open'); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  }, 100);
}
window.showPlayerDetail = showPlayerDetail;

// ─── Render: Historique ───────────────────────────────────────────────────────
function renderHistory() {
  const moisFilter = document.getElementById('h-mois').value;
  const joueurFilter = document.getElementById('h-joueur').value;

  const hm = document.getElementById('h-mois');
  hm.innerHTML = '<option value="">Tous les mois</option>';
  MOIS_NOMS.forEach((m, i) => {
    if (S().matchs.some(x => x.mois === i)) {
      const o = document.createElement('option');
      o.value = i; o.textContent = m; hm.appendChild(o);
    }
  });
  hm.value = moisFilter;

  const hj = document.getElementById('h-joueur');
  hj.innerHTML = '<option value="">Tous les joueurs</option>';
  S().joueurs.forEach(j => {
    const o = document.createElement('option');
    o.value = j; o.textContent = j; hj.appendChild(o);
  });
  hj.value = joueurFilter;

  let matchs = [...S().matchs].reverse();
  if (moisFilter !== '') matchs = matchs.filter(m => m.mois === parseInt(moisFilter));
  if (joueurFilter !== '') {
    matchs = matchs.filter(m => currentMode === '1v1'
      ? [m.a1,m.b1].includes(joueurFilter)
      : [m.a1,m.a2,m.b1,m.b2].includes(joueurFilter));
  }

  document.getElementById('match-count-label').textContent = matchs.length + ' match' + (matchs.length > 1 ? 's' : '');

  const el = document.getElementById('history-list');
  if (!matchs.length) { el.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><p>Aucun match trouvé.</p></div>`; return; }

  el.innerHTML = matchs.map(m => {
    const vA = m.ba > m.bb;
    const is1v1 = !m.a2;
    const teamA = is1v1 ? m.a1 : `${m.a1} & ${m.a2}`;
    const teamB = is1v1 ? m.b1 : `${m.b1} & ${m.b2}`;
    const winner = vA ? teamA : teamB;
    const scoreA = vA ? `<strong>${m.ba}</strong>` : m.ba;
    const scoreB = !vA ? `<strong>${m.bb}</strong>` : m.bb;
    const actions = m._id ? `
      <div style="display:flex;gap:4px;margin-left:auto">
        <button onclick="openEditModal('${m._id}')" style="background:#eff6ff;border:1px solid #bfdbfe;color:#2563eb;border-radius:6px;padding:3px 10px;font-size:11px;cursor:pointer;font-weight:500">✏️ Modifier</button>
        <button onclick="deleteMatch('${m._id}')" style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626;border-radius:6px;padding:3px 8px;font-size:13px;cursor:pointer">×</button>
      </div>` : '';
    return `<div class="match-card">
      <span class="match-month">${MOIS_COURT[m.mois]}</span>
      <div class="match-teams">
        <span class="team-names">${teamA}</span>
        <span class="match-score">${scoreA} – ${scoreB}</span>
        <span class="match-vs">vs</span>
        <span class="team-names">${teamB}</span>
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
  await fbDelete(`/${currentMode}/matchs/${id}`);
  await reloadMatchs(currentMode, false);
}
window.deleteMatch = deleteMatch;

// ─── Modal modification ────────────────────────────────────────────────────────
let editingId = null;
function openEditModal(id) {
  const m = S().matchs.find(x => x._id === id);
  if (!m) return;
  editingId = id;
  const is1v1 = !m.a2;

  document.getElementById('edit-form-2v2').style.display = is1v1 ? 'none' : '';
  document.getElementById('edit-form-1v1').style.display = is1v1 ? '' : 'none';

  const moisSel = document.getElementById('e-mois');
  moisSel.innerHTML = MOIS_NOMS.map((n,i) => `<option value="${i}">${n}</option>`).join('');
  moisSel.value = m.mois;
  const opts = S().joueurs.map(j => `<option>${j}</option>`).join('');

  if (!is1v1) {
    ['e-a1','e-a2','e-b1','e-b2'].forEach(id => { document.getElementById(id).innerHTML = opts; });
    document.getElementById('e-a1').value = m.a1;
    document.getElementById('e-a2').value = m.a2;
    document.getElementById('e-b1').value = m.b1;
    document.getElementById('e-b2').value = m.b2;
    document.getElementById('e-ba').value = m.ba;
    document.getElementById('e-bb').value = m.bb;
  } else {
    ['e-1a','e-1b'].forEach(id => { document.getElementById(id).innerHTML = opts; });
    document.getElementById('e-1a').value = m.a1;
    document.getElementById('e-1b').value = m.b1;
    document.getElementById('e-1ba').value = m.ba;
    document.getElementById('e-1bb').value = m.bb;
  }
  document.getElementById('e-date').value = m.date || '';
  document.getElementById('e-msg').textContent = '';
  document.getElementById('edit-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeEditModal() {
  document.getElementById('edit-modal').style.display = 'none';
  document.body.style.overflow = '';
  editingId = null;
}

async function saveEditMatch() {
  const m = S().matchs.find(x => x._id === editingId);
  const is1v1 = m && !m.a2;
  const mois = parseInt(document.getElementById('e-mois').value);
  const date = document.getElementById('e-date').value;
  const msg = document.getElementById('e-msg');
  let matchData;

  if (!is1v1) {
    const a1=document.getElementById('e-a1').value, a2=document.getElementById('e-a2').value;
    const b1=document.getElementById('e-b1').value, b2=document.getElementById('e-b2').value;
    const ba=parseInt(document.getElementById('e-ba').value)||0, bb=parseInt(document.getElementById('e-bb').value)||0;
    if (new Set([a1,a2,b1,b2]).size < 4) { msg.textContent='⚠ 4 joueurs différents requis.'; msg.className='save-msg error'; return; }
    if (ba===bb) { msg.textContent='⚠ Pas de match nul.'; msg.className='save-msg error'; return; }
    matchData = { mois, a1, a2, b1, b2, ba, bb, date };
  } else {
    const a1=document.getElementById('e-1a').value, b1=document.getElementById('e-1b').value;
    const ba=parseInt(document.getElementById('e-1ba').value)||0, bb=parseInt(document.getElementById('e-1bb').value)||0;
    if (a1===b1) { msg.textContent='⚠ 2 joueurs différents requis.'; msg.className='save-msg error'; return; }
    if (ba===bb) { msg.textContent='⚠ Pas de match nul.'; msg.className='save-msg error'; return; }
    matchData = { mois, a1, b1, ba, bb, date };
  }

  const btn = document.getElementById('e-save-btn');
  btn.disabled = true; btn.textContent = 'Enregistrement...';
  await fbSet(`/${currentMode}/matchs/${editingId}`, matchData);
  await reloadMatchs(currentMode, false);
  btn.disabled = false; btn.textContent = 'Enregistrer';
  closeEditModal();
}

document.getElementById('edit-modal').addEventListener('click', function(e) { if (e.target === this) closeEditModal(); });
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.saveEditMatch = saveEditMatch;

// ─── Render: Duos / Face-à-face ───────────────────────────────────────────────
function renderDuos() {
  const moisFilter = document.getElementById('duo-mois').value;
  const ds = document.getElementById('duo-mois');
  ds.innerHTML = '<option value="">Toute la saison</option>';
  MOIS_NOMS.forEach((m, i) => {
    if (S().matchs.some(x => x.mois === i)) {
      const o = document.createElement('option');
      o.value = i; o.textContent = m; ds.appendChild(o);
    }
  });
  ds.value = moisFilter;
  let matchs = S().matchs;
  if (moisFilter !== '') matchs = matchs.filter(m => m.mois === parseInt(moisFilter));

  if (currentMode === '1v1') {
    renderFaceAFace(matchs);
  } else {
    renderDuos2v2(matchs);
  }
}
window.renderDuos = renderDuos;

function renderDuos2v2(matchs) {
  const joueurs = S().joueurs;
  const duos = [];
  for (let i = 0; i < joueurs.length; i++) {
    for (let k = i+1; k < joueurs.length; k++) {
      const j1=joueurs[i], j2=joueurs[k];
      const together = matchs.filter(m =>
        ([m.a1,m.a2].includes(j1) && [m.a1,m.a2].includes(j2)) ||
        ([m.b1,m.b2].includes(j1) && [m.b1,m.b2].includes(j2))
      );
      const n = together.length;
      const avgPerDuo = joueurs.length > 1 ? matchs.length/(joueurs.length-1) : 0;
      const ecart = Math.round((n-avgPerDuo)*10)/10;
      duos.push({ j1, j2, n, ecart });
    }
  }
  duos.sort((a,b) => a.n-b.n);
  const totalDuos=duos.length, duos0=duos.filter(d=>d.n===0).length;
  const avgMatchs=totalDuos>0?Math.round(duos.reduce((s,d)=>s+d.n,0)/totalDuos*10)/10:0;

  document.getElementById('duo-stats-grid').innerHTML = `
    <div class="duo-stat-card"><div class="duo-stat-label">Total duos</div><div class="duo-stat-value">${totalDuos}</div></div>
    <div class="duo-stat-card"><div class="duo-stat-label">Duos à 0 match</div><div class="duo-stat-value" style="${duos0>0?'color:#dc2626':''}">${duos0}</div></div>
    <div class="duo-stat-card"><div class="duo-stat-label">Moy. matchs/duo</div><div class="duo-stat-value">${avgMatchs}</div></div>`;

  document.getElementById('tbody-duos').innerHTML = duos.map(d => {
    const hasPaused = paused.includes(d.j1) || paused.includes(d.j2);
    const prio = hasPaused
      ? `<span style="font-size:11px;background:#f3f4f6;color:#6b7280;padding:2px 8px;border-radius:100px;font-weight:600">⏸ pause</span>`
      : d.n===0?`<span class="badge-urgent">URGENT</span>`:d.ecart<-0.5?`<span class="badge-rattraper">Rattraper</span>`:'—';
    return `<tr style="${hasPaused ? 'opacity:.55' : ''}"><td><strong>${d.j1}</strong> & <strong>${d.j2}</strong></td><td class="col-num">${d.n}</td><td class="col-num">${d.ecart>0?'+':''}${d.ecart}</td><td>${prio}</td></tr>`;
  }).join('');
}

function renderFaceAFace(matchs) {
  const joueurs = S().joueurs;
  const confrontations = [];
  for (let i = 0; i < joueurs.length; i++) {
    for (let k = i+1; k < joueurs.length; k++) {
      const j1=joueurs[i], j2=joueurs[k];
      const vs = matchs.filter(m => (m.a1===j1&&m.b1===j2)||(m.a1===j2&&m.b1===j1));
      const n = vs.length;
      if (n === 0) { confrontations.push({j1,j2,n,ratio:0,label:'Jamais joué'}); return; }
      const s = calcStats(vs, j1);
      const ratioJ1 = s.ratio;
      confrontations.push({j1,j2,n,ratioJ1,label:`${j1} gagne ${ratioJ1}%`});
    }
  }
  confrontations.sort((a,b) => b.n-a.n);

  const totalConf=confrontations.length;
  const jamais=confrontations.filter(c=>c.n===0).length;
  const totalMatchs=matchs.length;

  document.getElementById('duo-stats-grid').innerHTML = `
    <div class="duo-stat-card"><div class="duo-stat-label">Confrontations</div><div class="duo-stat-value">${totalConf}</div></div>
    <div class="duo-stat-card"><div class="duo-stat-label">Jamais joué</div><div class="duo-stat-value" style="${jamais>0?'color:#dc2626':''}">${jamais}</div></div>
    <div class="duo-stat-card"><div class="duo-stat-label">Total matchs</div><div class="duo-stat-value">${totalMatchs}</div></div>`;

  document.getElementById('tbody-duos').innerHTML = confrontations.map(c => {
    const hasPaused = paused.includes(c.j1) || paused.includes(c.j2);
    const prio = hasPaused
      ? `<span style="font-size:11px;background:#f3f4f6;color:#6b7280;padding:2px 8px;border-radius:100px;font-weight:600">⏸ pause</span>`
      : c.n===0?`<span class="badge-urgent">Jamais joué</span>`:'—';
    const ratioTd = c.n>0 ? `${c.ratioJ1}% pour ${c.j1}` : '—';
    return `<tr style="${hasPaused ? 'opacity:.55' : ''}"><td><strong>${c.j1}</strong> vs <strong>${c.j2}</strong></td><td class="col-num">${c.n}</td><td class="col-num">${ratioTd}</td><td>${prio}</td></tr>`;
  }).join('');
}

// ─── Render: Joueurs ──────────────────────────────────────────────────────────
function renderJoueurs() {
  document.getElementById('players-grid').innerHTML = S().joueurs.map((j, i) => {
    const stats = calcStats(S().matchs, j);
    const isPaused = paused.includes(j);
    return `<div class="player-card" style="${isPaused ? 'opacity:.55' : ''}">
      <div class="player-avatar">${j.slice(0,2).toUpperCase()}</div>
      <div class="player-info">
        <div class="player-name">${j} ${isPaused ? '<span style="font-size:10px;background:#f3f4f6;color:#6b7280;padding:1px 7px;border-radius:100px;font-weight:600">⏸ EN PAUSE</span>' : ''}</div>
        <div class="player-matchs">${stats.matchs} matchs · ${stats.ratio}%</div>
      </div>
      <button onclick="togglePause('${j}')" title="${isPaused ? 'Réactiver' : 'Mettre en pause'}" style="background:none;border:1px solid #e5e7eb;border-radius:6px;cursor:pointer;font-size:13px;padding:4px 8px;flex-shrink:0">${isPaused ? '▶️' : '⏸'}</button>
      <button class="player-remove" onclick="removeJoueur(${i})" title="Retirer ${j}">×</button>
    </div>`;
  }).join('');
}

async function togglePause(nom) {
  if (paused.includes(nom)) paused = paused.filter(p => p !== nom);
  else paused.push(nom);
  await fbSet('/paused', paused);
  renderJoueurs();
}
window.togglePause = togglePause;

async function addJoueur() {
  const inp = document.getElementById('new-joueur');
  const nom = inp.value.trim();
  if (!nom) return;
  if (S().joueurs.includes(nom)) { alert('Ce joueur existe déjà.'); return; }
  // Ajouter dans les deux modes
  for (const mode of ['2v2','1v1']) {
    state[mode].joueurs.push(nom);
    await fbSet(`/${mode}/joueurs`, state[mode].joueurs);
  }
  inp.value = '';
  renderJoueurs(); renderSaisie();
}

async function removeJoueur(i) {
  const nom = S().joueurs[i];
  if (!confirm(`Retirer ${nom} des deux championnats ?`)) return;
  for (const mode of ['2v2','1v1']) {
    state[mode].joueurs = state[mode].joueurs.filter(j => j !== nom);
    await fbSet(`/${mode}/joueurs`, state[mode].joueurs);
  }
  renderJoueurs(); renderSaisie();
}
window.addJoueur = addJoueur;
window.removeJoueur = removeJoueur;

// ─── Render map ───────────────────────────────────────────────────────────────
const renders = {
  general: renderGeneral,
  saisie: renderSaisie,
  mensuel: () => renderMensuel(activeMois),
  palmares: renderPalmares,
  matchs: renderHistory,
  duos: renderDuos,
  joueurs: renderJoueurs,
};

// ─── Boot ─────────────────────────────────────────────────────────────────────
initFirebase();
