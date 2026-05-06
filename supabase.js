import { useState } from 'react'
import { buildDuoStats, MONTHS } from '../lib/stats'

export default function Duos({ matches, activeMonths }) {
  const [selectedMonth, setSelectedMonth] = useState('Tous')

  const filtered = selectedMonth === 'Tous'
    ? matches
    : matches.filter(m => m.month === selectedMonth)

  const duos = buildDuoStats(filtered)
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

      <div className="card">
        <div className="card-label">Matchs joués ensemble</div>
        {duos.length === 0 && <div className="empty">Aucun match enregistré</div>}
        {duos.map(d => (
          <div key={`${d.p1}-${d.p2}`} className="duo-row">
            <div className="duo-names">
              <span className="duo-player">{d.p1}</span>
              <span className="duo-amp">&</span>
              <span className="duo-player">{d.p2}</span>
            </div>
            <div className="duo-count">{d.count} match{d.count > 1 ? 's' : ''}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
