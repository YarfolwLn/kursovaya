import React from 'react'
import WishCard from './WishCard.jsx'

export default function WishesGrid({ wishes, isAdmin, isDeletingMap, onComplete, onDelete, onEdit }) {
  if (wishes.length === 0) {
    return <div className="muted" style={{ marginTop: 12 }}>Пока нет желаний</div>
  }

  return (
    <div className="grid">
      {wishes.map(w => (
        <div key={w.id} style={{ position: 'relative' }}>
          <WishCard
            wish={w}
            onComplete={onComplete}
            onDelete={onDelete}
            onEdit={onEdit}
            isAdmin={isAdmin}
            isDeleting={isDeletingMap?.[w.id] || false}
          />
        </div>
      ))}
    </div>
  )
}
