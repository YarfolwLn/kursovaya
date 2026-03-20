import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import AppHeader from '../components/AppHeader.jsx'

export default function RegisterPage() {
  const nav = useNavigate()

  useEffect(() => {
    document.title = 'Регистрация — Wishlist'
  }, [])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function validatePassword(password) {
    if (password.length < 6) {
      return 'Пароль должен содержать минимум 6 символов'
    }
    if (!/[A-Z]/.test(password)) {
      return 'Пароль должен содержать минимум одну заглавную букву'
    }
    if (!/[a-z]/.test(password)) {
      return 'Пароль должен содержать минимум одну строчную букву'
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return 'Пароль должен содержать минимум один специальный символ (!@#$%^&* и т.д.)'
    }
    return null
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')

    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    setLoading(true)
    try {
      await api.register({ name, email, password })
      nav('/login')
    } catch (err) {
      setError(err.message || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <AppHeader
        badge={<span className="badge muted">Регистрация</span>}
      />

      <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
        <form onSubmit={onSubmit} className="row" style={{ flexDirection: 'column' }}>
          <label htmlFor="name">Имя</label>
          <input id="name" className="input" placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)} />
          <label htmlFor="email" style={{ marginTop: 12 }}>Email</label>
          <input id="email" className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label htmlFor="password" style={{ marginTop: 12 }}>Пароль</label>
          <input id="password" className="input" placeholder="Пароль" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error ? <div className="error">{error}</div> : null}
          <button id="btn-register" className="button" disabled={loading}>{loading ? 'Создаём…' : 'Зарегистрироваться'}</button>
        </form>
        <div style={{ marginTop: 12 }} className="muted">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </div>
      </div>
    </div>
  )
}
