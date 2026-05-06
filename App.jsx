import { useState } from 'react'
import { buildRanking, formatRatio, MONTHS } from '../lib/stats'

const MEDALS = ['🥇', '🥈', '🥉']

export default function Ranking({ players, matches, minMatches, onMinChange, activeMonths }) {
  const [selectedMonth, setSelectedMonth] = useState('Tous')

  const filtered = selectedMonth === 'Tous'
    ? matches
    : matches.filter(m => m.month === selectedMonth)

  const { qualified, nc } = buildRanking(players, filtered, minMatches)
  const allRows = [
    ...qualified.map((s, i) => ({ ...s, rank: i + 1, isQualified: true })),
    ...nc.map(s => ({ ...s, rank: null, isQualified: false })),
  ]

  const displayMonths = ['Tous', ...activeMonths]

  return (
    <div className="section">
      <div className="month-tabs">
        {displayMonths.map(m => (
          <button
            key={m}
            className={`month-tab ${selectedMonth === m ? 'active' : ''}`}
            onClick={() => setSelectedMonth(m)}
          >
            {m === 'Tous' ? 'Tous' : m.slice(0, 3)}
          </button>
        ))}
      </div>

      <div className="min-bar">
        <span>Min. matchs pour être classé</span>
        <input
          type="number"
          min="1"
          value={minMatches}
          onChange={e => onMinChange(e.target.value)}
          className="min-input"
        />
      </div>

      <div className="card">
        <div className="rank-header-row">
          <span className="rh rh-rank">#</span>
          <span className="rh rh-name">Joueur</span>
          <span className="rh rh-stat">V</span>
          <span className="rh rh-stat">D</span>
          <span className="rh rh-stat">+/-</span>
          <span className="rh rh-ratio">Ratio</span>
        </div>

        {allRows.length === 0 && (
          <div className="empty">Aucun match enregistré</div>
        )}

        {allRows.map((s, i) => (
          <div key={s.name} className={`rank-row ${!s.isQualified ? 'rank-row-nc' : ''}`}>
            <div className="rank-pos">
              {s.isQualified
                ? (MEDALS[s.rank - 1] || <span className="rank-num">{s.rank}</span>)
                : <span className="badge-nc">N/C</span>
              }
            </div>
            <div className="rank-name">{s.name}</div>
            <div className="rank-stat green">{s.v}</div>
            <div className="rank-stat red">{s.d}</div>
            <div className={`rank-stat ${s.diff > 0 ? 'green' : s.diff < 0 ? 'red' : ''}`}>
              {s.diff > 0 ? '+' : ''}{s.diff}
            </div>
            <div className="rank-ratio">
              {s.isQualified ? formatRatio(s.v, s.played) : '—'}
              <span className="rank-played">{s.played}j</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
