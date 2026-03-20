import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import AppHeader from '../components/AppHeader.jsx'

export default function NotFoundPage() {
  useEffect(() => {
    document.title = '404 — Страница не найдена'
  }, [])

  return (
    <div className="container">
      <AppHeader
        badge={<span className="badge muted">Ошибка</span>}
      />

      <div className="card" style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center', padding: '48px 32px' }}>
        <div style={{ fontSize: '120px', fontWeight: 800, lineHeight: 1, marginBottom: 24 }}>
          404
        </div>
        <div style={{ fontSize: '24px', fontWeight: 600, marginBottom: 16 }}>
          Страница не найдена
        </div>
        <div className="muted" style={{ marginBottom: 32 }}>
          Запрашиваемая страница не существует или была удалена
        </div>
        <Link to="/" className="button" style={{ display: 'inline-flex' }}>
          Вернуться на главную
        </Link>
      </div>
    </div>
  )
}
