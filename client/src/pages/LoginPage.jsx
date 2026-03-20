import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../auth.jsx'
import AppHeader from '../components/AppHeader.jsx'

export default function LoginPage() {
  const nav = useNavigate()
  const { setUser } = useAuth()

  useEffect(() => {
    document.title = 'Вход — Wishlist'
  }, [])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.login({ email, password })
      const u = data?.user || data
      setUser(u)
      nav('/dashboard')
    } catch (err) {
      setError(err.message || 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <AppHeader
        badge={<span className="badge muted">Вход</span>}
      />

      <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
        <form onSubmit={onSubmit} className="row" style={{ flexDirection: 'column' }}>
          <label htmlFor="email">Email</label>
          <input id="email" className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label htmlFor="password" style={{ marginTop: 12 }}>Пароль</label>
          <input id="password" className="input" placeholder="Пароль" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error ? <div className="error">{error}</div> : null}
          <button id="btn-login" className="button" disabled={loading}>{loading ? 'Входим…' : 'Войти'}</button>
        </form>
        <div style={{ marginTop: 12 }} className="muted">
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </div>
      </div>
    </div>
  )
}
