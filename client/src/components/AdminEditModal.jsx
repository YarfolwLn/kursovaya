import React from 'react'
import StarRating from './StarRating.jsx'
import { api } from '../api.js'

export default function AdminEditModal({
  editingWish, setEditingWish,
  uploading, handleUpload,
  uploadError,
  uploadedImageUrl,
  onSave, onClose
}) {
  if (!editingWish) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontWeight: 800, marginBottom: 12 }}>Редактировать желание</div>
        <div className="row" style={{ flexDirection: 'column', gap: 12 }}>
          <label htmlFor="admin-title">Название</label>
          <input
            id="admin-title"
            className="input"
            value={editingWish.title}
            onChange={(e) => setEditingWish({ ...editingWish, title: e.target.value })}
            placeholder="Название"
            required
          />
          <label htmlFor="admin-category">Категория</label>
          <input
            id="admin-category"
            className="input"
            value={editingWish.category}
            onChange={(e) => setEditingWish({ ...editingWish, category: e.target.value })}
            placeholder="Категория"
          />
          <label htmlFor="admin-description">Описание</label>
          <textarea
            id="admin-description"
            className="input"
            style={{ height: 88, paddingTop: 10 }}
            value={editingWish.description}
            onChange={(e) => setEditingWish({ ...editingWish, description: e.target.value })}
            placeholder="Описание"
          />
          <label htmlFor="admin-price">Цена</label>
          <input
            id="admin-price"
            className="input"
            value={editingWish.price}
            onChange={(e) => setEditingWish({ ...editingWish, price: e.target.value })}
            placeholder="Цена"
          />
          <label htmlFor="admin-link">Ссылка</label>
          <input
            id="admin-link"
            className="input"
            value={editingWish.link}
            onChange={(e) => setEditingWish({ ...editingWish, link: e.target.value })}
            placeholder="Ссылка"
          />
          <div style={{ marginTop: 8 }}>
            <div style={{ marginBottom: 4, fontSize: 14, color: 'var(--muted)' }}>Важность</div>
            <StarRating value={editingWish.rating || 3} onChange={(r) => setEditingWish({ ...editingWish, rating: r })} />
          </div>

          <label htmlFor="admin-image">Изображение</label>
          <div className="row" style={{ alignItems: 'center' }}>
            <input
              id="admin-image"
              className="input"
              type="file"
              accept="image/*"
              onChange={(e) => handleUpload(e.target.files?.[0])}
            />
            <span className="muted">{uploading ? 'Загрузка изображения…' : ''}</span>
          </div>

          {uploadError ? <div className="error">{uploadError}</div> : null}
          {(uploadedImageUrl || editingWish.image) ? (
            <div className="card" style={{ padding: 12 }}>
              <div className="muted" style={{ marginBottom: 8 }}>Предпросмотр</div>
              <img className="wishImg" src={api.imageUrl(uploadedImageUrl || editingWish.image)} alt="preview" />
            </div>
          ) : null}

          <div className="row">
            <button id="btn-admin-save" className="button" onClick={onSave}>Сохранить изменения</button>
            <button id="btn-admin-cancel" type="button" className="button secondary" onClick={onClose}>Отмена</button>
          </div>
        </div>
      </div>
    </div>
  )
}
