*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --green: #1a6b3c;
  --green-light: #d6f0e0;
  --green-mid: #2e8b57;
  --gold: #c49a00;
  --red: #c0392b;
  --bg: #f5f4f0;
  --surface: #ffffff;
  --border: rgba(0,0,0,0.09);
  --text: #1a1a18;
  --text-2: #5a5a55;
  --text-3: #9a9a94;
  --font-display: 'Archivo Black', sans-serif;
  --font-body: 'DM Sans', sans-serif;
  --radius: 12px;
  --radius-sm: 8px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #141412;
    --surface: #1e1e1a;
    --border: rgba(255,255,255,0.08);
    --text: #f0efe8;
    --text-2: #9a9a90;
    --text-3: #5a5a55;
    --green-light: #0d3820;
  }
}

html { font-size: 16px; }
body {
  font-family: var(--font-body);
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

.app {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Header */
.app-header {
  background: var(--green);
  padding: 16px 20px 14px;
  position: sticky;
  top: 0;
  z-index: 10;
}
.header-inner {
  display: flex;
  align-items: center;
  gap: 10px;
}
.logo-icon { font-size: 22px; }
.app-title {
  font-family: var(--font-display);
  font-size: 18px;
  color: #fff;
  letter-spacing: -0.02em;
}

/* Tab bar */
.tab-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 58px;
  z-index: 9;
}
.tab-btn {
  padding: 12px 4px;
  border: none;
  background: transparent;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  color: var(--text-3);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all .15s;
}
.tab-btn.active {
  color: var(--green);
  border-bottom-color: var(--green);
}

/* Main */
.main-content { flex: 1; padding: 16px; }

/* Section */
.section { display: flex; flex-direction: column; gap: 14px; }

/* Card */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
}
.card-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--text-3);
  margin-bottom: 14px;
}

/* Form */
.field { margin-bottom: 12px; }
.field label {
  display: block;
  font-size: 12px;
  color: var(--text-2);
  margin-bottom: 4px;
  font-weight: 500;
}
.field input, .field select,
input[type="text"], input[type="number"], select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 14px;
  outline: none;
  transition: border-color .15s;
  appearance: none;
  -webkit-appearance: none;
}
input:focus, select:focus { border-color: var(--green); }

.row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

/* Team blocks */
.team-block { margin-bottom: 4px; }
.team-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .06em;
  margin-bottom: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}
.team-a { background: var(--green-light); color: var(--green); }
.team-b { background: #e8f0fe; color: #1a56b0; }
@media (prefers-color-scheme: dark) {
  .team-b { background: #1a2840; color: #5b8fde; }
}

/* Score */
.score-row {
  display: grid;
  grid-template-columns: 1fr 40px 1fr;
  gap: 8px;
  align-items: center;
  margin: 12px 0;
}
.score-input {
  text-align: center !important;
  font-size: 22px !important;
  font-family: var(--font-display) !important;
  padding: 12px 8px !important;
}
.score-vs {
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-3);
}

/* Buttons */
.btn {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text);
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all .15s;
}
.btn:hover { background: var(--bg); }
.btn:active { transform: scale(.98); }
.btn-primary {
  background: var(--green);
  color: #fff;
  border-color: var(--green);
}
.btn-primary:hover { background: var(--green-mid); }
.btn:disabled { opacity: .5; cursor: not-allowed; }

/* Recent matches */
.match-row {
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}
.match-row:last-child { border-bottom: none; }
.match-teams {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  font-size: 13px;
}
.team-winner { font-weight: 600; color: var(--green); }
.team-loser { color: var(--text-2); }
.match-score {
  font-family: var(--font-display);
  font-size: 15px;
  white-space: nowrap;
  flex-shrink: 0;
}
.match-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 11px;
  color: var(--text-3);
}
.delete-btn {
  border: none;
  background: none;
  color: var(--text-3);
  cursor: pointer;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
}
.delete-btn:hover { color: var(--red); background: #fce4e4; }

/* Month tabs */
.month-tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
}
.month-tabs::-webkit-scrollbar { display: none; }
.month-tab {
  flex-shrink: 0;
  padding: 6px 14px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--surface);
  color: var(--text-2);
  font-family: var(--font-body);
  font-size: 13px;
  cursor: pointer;
  transition: all .15s;
}
.month-tab.active {
  background: var(--green);
  color: #fff;
  border-color: var(--green);
}

/* Min bar */
.min-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fffbe6;
  border: 1px solid #f0d060;
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  font-size: 13px;
  color: #7a6000;
}
@media (prefers-color-scheme: dark) {
  .min-bar { background: #2a2400; border-color: #5a4800; color: #d4aa00; }
}
.min-input {
  width: 52px !important;
  text-align: center !important;
  font-weight: 600 !important;
  padding: 4px 6px !important;
  font-size: 15px !important;
}

/* Ranking */
.rank-header-row {
  display: grid;
  grid-template-columns: 36px 1fr 32px 32px 36px 56px;
  gap: 4px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 4px;
}
.rh {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .04em;
  color: var(--text-3);
}
.rh-rank, .rh-stat, .rh-ratio { text-align: center; }
.rank-row {
  display: grid;
  grid-template-columns: 36px 1fr 32px 32px 36px 56px;
  gap: 4px;
  align-items: center;
  padding: 9px 0;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
}
.rank-row:last-child { border-bottom: none; }
.rank-row-nc { opacity: .65; }
.rank-pos { text-align: center; font-size: 16px; }
.rank-num {
  font-family: var(--font-display);
  font-size: 13px;
  color: var(--text-2);
}
.rank-name { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rank-stat { text-align: center; font-weight: 500; }
.rank-ratio { text-align: center; }
.rank-played { display: block; font-size: 10px; color: var(--text-3); }
.green { color: var(--green); }
.red { color: var(--red); }
.badge-nc {
  font-size: 10px;
  background: #fff3cd;
  color: #856404;
  padding: 2px 5px;
  border-radius: 4px;
  font-weight: 600;
}
@media (prefers-color-scheme: dark) {
  .badge-nc { background: #3a2800; color: #d4a000; }
}

/* Duos */
.duo-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}
.duo-row:last-child { border-bottom: none; }
.duo-names { display: flex; align-items: center; gap: 6px; font-size: 13px; }
.duo-player { font-weight: 500; }
.duo-amp { color: var(--text-3); font-size: 11px; }
.duo-count {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 3px 12px;
  font-size: 12px;
  color: var(--text-2);
  font-weight: 500;
  flex-shrink: 0;
}

/* Players */
.player-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}
.player-row:last-child { border-bottom: none; }
.player-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--green-light);
  color: var(--green);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 14px;
  flex-shrink: 0;
}
.player-name { flex: 1; font-weight: 500; }

/* Toast */
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 22px;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 500;
  z-index: 100;
  animation: toastIn .2s ease;
  white-space: nowrap;
  pointer-events: none;
}
.toast-success { background: var(--green); color: #fff; }
.toast-error { background: var(--red); color: #fff; }
@keyframes toastIn {
  from { opacity: 0; transform: translateX(-50%) translateY(8px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}

/* Loading */
.loading-screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-2);
}
.loading-ball {
  font-size: 40px;
  animation: spin 1.5s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Empty state */
.empty {
  text-align: center;
  padding: 24px;
  color: var(--text-3);
  font-size: 13px;
}
