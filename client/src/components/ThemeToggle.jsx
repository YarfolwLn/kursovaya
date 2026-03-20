import React, { useEffect, useMemo, useState } from 'react'

function getInitialTheme() {
  try {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // ignore
  }

  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  }

  return 'dark'
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    try {
      localStorage.setItem('theme', theme)
    } catch {
      // ignore
    }
  }, [theme])

  const label = useMemo(() => (theme === 'dark' ? 'Тёмная' : 'Светлая'), [theme])

  return (
    <button
      type="button"
      className="button secondary"
      onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      title={`Тема: ${label}`}
    >
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  )
}
