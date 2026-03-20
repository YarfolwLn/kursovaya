import React from 'react'
import { api } from '../api.js'
import StarRating from './StarRating.jsx'

export default function WishCard({ wish, onComplete, onDelete, onEdit, isAdmin, isDeleting }) {
  const img = wish.image ? api.imageUrl(wish.image) : '/images/placeholder.png'

  return (
    <div className="card" style={{ opacity: wish.completed ? 0.6 : 1 }}>
      <img className="wishImg" src={img} alt={wish.title} />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
        <div style={{ fontWeight: 800 }}>{wish.title}</div>
        <div className="row" style={{ alignItems: 'center', gap: 8 }}>
          {isAdmin && wish.user_name ? <div className="badge">👤 {wish.user_name}</div> : null}
        </div>
      </div>
      {wish.category && wish.category !== 'Без категории' ? <div className="badge" style={{ marginTop: 10 }}>📁 {wish.category}</div> : null}
      {wish.description ? <div className="muted" style={{ marginTop: 10 }}>{wish.description}</div> : null}
      <div style={{ marginTop: 10 }}>
        <StarRating value={wish.rating || 3} readonly />
      </div>
      <div className="row" style={{ marginTop: 12, justifyContent: 'space-between' }}>
        {wish.price ? <div className="badge">~{wish.price} руб.</div> : <span />}
        {wish.link ? (
          <a className="badge" href={wish.link} target="_blank" rel="noreferrer">🔗 Ссылка</a>
        ) : null}
      </div>
      {wish.completed ? <div style={{ marginTop: 12 }} className="badge">✅ Выполнено</div> : null}
      <div className="row" style={{ marginTop: 'auto', gap: 12, paddingTop: 12 }}>
        <button
          id="btn-complete"
          className="button secondary"
          onClick={() => onComplete(wish)}
          disabled={isDeleting || (!!wish.completed && !isAdmin)}
          title={wish.completed ? (isAdmin ? 'Уже выполнено' : 'Уже выполнено') : 'Отметить выполненным'}
          style={{ flex: 1 }}
        >
          ✅
        </button>
        <button
          id="btn-edit"
          className="button secondary"
          onClick={() => onEdit(wish)}
          disabled={isDeleting || (!!wish.completed && !isAdmin)}
          title={wish.completed ? (isAdmin ? 'Редактировать выполненное желание' : 'Нельзя редактировать выполненное желание') : 'Редактировать'}
          style={{ flex: 1 }}
        >
          Редактировать
        </button>
        <button
          id="btn-delete"
          className={`button secondary ${isDeleting ? 'deleting' : ''}`}
          onClick={() => onDelete(wish)}
          disabled={isDeleting || (!!wish.completed && !isAdmin)}
          style={{ flex: 1 }}
        >
          {isDeleting ? 'Удаление...' : 'Удалить'}
        </button>
      </div>
    </div>
  )
}
