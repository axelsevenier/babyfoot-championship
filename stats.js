import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Players({ players, onToast, onRefresh }) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const handleAdd = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (players.includes(trimmed)) return onToast('Joueur déjà inscrit', 'error')
    setSaving(true)
    const { error } = await supabase.from('players').insert({ name: trimmed })
    setSaving(false)
    if (error) return onToast('Erreur lors de l\'ajout', 'error')
    setName('')
    onToast(`${trimmed} ajouté !`)
    onRefresh()
  }

  const handleRemove = async (playerName) => {
    await supabase.from('players').delete().eq('name', playerName)
    onRefresh()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd()
  }

  return (
    <div className="section">
      <div className="card">
        <div className="card-label">Ajouter un joueur</div>
        <div className="field">
          <input
            type="text"
            placeholder="Nom du joueur"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
          {saving ? 'Ajout...' : 'Ajouter'}
        </button>
      </div>

      <div className="card">
        <div className="card-label">{players.length} joueur{players.length > 1 ? 's' : ''} inscrits</div>
        {players.length === 0 && <div className="empty">Aucun joueur</div>}
        {players.map((p, i) => (
          <div key={p} className="player-row">
            <div className="player-avatar">{p.charAt(0).toUpperCase()}</div>
            <span className="player-name">{p}</span>
            <button className="delete-btn" onClick={() => handleRemove(p)}>Retirer</button>
          </div>
        ))}
      </div>
    </div>
  )
}
