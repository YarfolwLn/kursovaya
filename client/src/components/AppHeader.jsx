import React, { useState, useEffect } from 'react'
import ThemeToggle from './ThemeToggle.jsx'
import CursorToggle from './CursorToggle.jsx'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(true)

  useEffect(() => {
    const checkDevice = () => {
      const isTouchDevice = window.matchMedia('(pointer: coarse)').matches ||
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0
      setIsDesktop(!isTouchDevice)
    }
    checkDevice()
  }, [])

  return isDesktop
}

export default function AppHeader({ badge, right }) {
  const isDesktop = useIsDesktop()

  return (
    <div className="header">
      <div className="brand">
        <div className="brandTitle">Wishlist</div>
        {badge}
      </div>
      <div className="row" style={{ alignItems: 'center' }}>
        <ThemeToggle />
        {isDesktop ? <CursorToggle /> : null}
        {right}
      </div>
    </div>
  )
}
