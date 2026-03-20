import { useEffect, useState } from 'react'

export default function CursorToggle() {
  const [customCursor, setCustomCursor] = useState(() => {
    return localStorage.getItem('customCursor') !== 'false'
  })

  useEffect(() => {
    localStorage.setItem('customCursor', customCursor)
    if (customCursor) {
      document.body.classList.remove('standard-cursor')
    } else {
      document.body.classList.add('standard-cursor')
    }
  }, [customCursor])

  return (
    <button
      className="button secondary"
      onClick={() => setCustomCursor(!customCursor)}
      title={customCursor ? 'Стандартный курсор' : 'Кастомный курсор'}
    >
      {customCursor ? 'Стандартный курсор' : 'Кастомный курсор'}
    </button>
  )
}
