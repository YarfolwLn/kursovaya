import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api.js'
import AppHeader from '../components/AppHeader.jsx'
import PublicWishCard from '../components/PublicWishCard.jsx'

export default function SharePage() {
  const { userId } = useParams()

  const [wishes, setWishes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const w = await api.getPublicWishesByUserId(userId)
        if (!mounted) return
        setWishes(Array.isArray(w) ? w : [])
      } catch (err) {
        if (!mounted) return
        setError(err.message || 'Ошибка загрузки')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [userId])

  const userName = useMemo(() => {
    const first = wishes[0]
    return first?.user_name || ''
  }, [wishes])

  useEffect(() => {
    document.title = userName ? `Список желаний — ${userName}` : 'Публичный список — Wishlist'
  }, [userName])

  return (
    <div className="container">
      <AppHeader
        badge={<span className="badge">Публичный список</span>}
        right={<Link className="button secondary" to="/login">Войти</Link>}
      />

      {userName ? <div className="card">Желания пользователя: <b>{userName}</b></div> : null}

      {loading ? <div className="muted" style={{ marginTop: 12 }}>Загрузка…</div> : null}
      {error ? <div className="error" style={{ marginTop: 12 }}>{error}</div> : null}

      {!loading && !error ? (
        wishes.length === 0 ? (
          <div className="muted" style={{ marginTop: 12 }}>Список пуст</div>
        ) : (
          <div className="grid" style={{ marginTop: 16 }}>
            {wishes.map(w => <PublicWishCard key={w.id} wish={w} />)}
          </div>
        )
      ) : null}
    </div>
  )
}
