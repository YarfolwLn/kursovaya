import React from 'react'

export default function ShareUrlCard({ shareUrl, copyStatus, setCopyStatus }) {
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopyStatus('Скопировано')
      setTimeout(() => setCopyStatus(''), 1500)
    } catch {
      setCopyStatus('Не удалось скопировать')
      setTimeout(() => setCopyStatus(''), 2000)
    }
  }

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div style={{ fontWeight: 800, marginBottom: 10 }}>Публичная ссылка на желания</div>
      <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="badge" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{shareUrl}</div>
        <div className="row">
          <button
            className="button secondary"
            type="button"
            onClick={handleCopy}
          >
            Копировать
          </button>
          <a className="button secondary" href={shareUrl} target="_blank" rel="noreferrer">Открыть</a>
        </div>
      </div>
      {copyStatus ? <div className="muted" style={{ marginTop: 10 }}>{copyStatus}</div> : null}
    </div>
  )
}
