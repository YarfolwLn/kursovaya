import React from 'react'
import StarRating from './StarRating.jsx'
import { api } from '../api.js'

export default function WishForm({
  title, setTitle,
  category, setCategory,
  description, setDescription,
  price, setPrice,
  link, setLink,
  rating, setRating,
  editingId,
  uploading, handleUpload,
  uploadError,
  uploadedImageUrl, editingImage,
  onSubmit, onCancel
}) {
  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div style={{ fontWeight: 800, marginBottom: 12 }}>{editingId ? 'Редактировать желание' : 'Добавить желание'}</div>
      <form onSubmit={onSubmit} className="row" style={{ flexDirection: 'column' }}>
        <label htmlFor="wish-title">Название</label>
        <input id="wish-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название" required />
        <label htmlFor="wish-category" style={{ marginTop: 12 }}>Категория</label>
        <input id="wish-category" className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Категория" />
        <label htmlFor="wish-description" style={{ marginTop: 12 }}>Описание</label>
        <textarea id="wish-description" className="input" style={{ height: 88, paddingTop: 10 }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание" />
        <label htmlFor="wish-price" style={{ marginTop: 12 }}>Цена</label>
        <input id="wish-price" className="input" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Цена" />
        <label htmlFor="wish-link" style={{ marginTop: 12 }}>Ссылка</label>
        <input id="wish-link" className="input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="Ссылка" />
        <div style={{ marginTop: 12 }}>
          <div style={{ marginBottom: 4, fontSize: 14, color: 'var(--muted)' }}>Важность</div>
          <StarRating value={rating} onChange={setRating} />
        </div>

        <div className="row" style={{ alignItems: 'center', marginTop: 12 }}>
          <input id="wish-image" className="input" type="file" accept="image/*" onChange={(e) => handleUpload(e.target.files?.[0])} />
          <span className="muted">{uploading ? 'Загрузка изображения…' : ''}</span>
        </div>

        {uploadError ? <div className="error">{uploadError}</div> : null}

        {(uploadedImageUrl || editingImage) ? (
          <div className="card" style={{ padding: 12 }}>
            <div className="muted" style={{ marginBottom: 8 }}>Предпросмотр</div>
            <img className="wishImg" src={api.imageUrl(uploadedImageUrl || editingImage)} alt="preview" />
          </div>
        ) : null}

        <div className="row">
          <button id={editingId ? 'btn-save' : 'btn-create'} className="button">{editingId ? 'Сохранить изменения' : 'Создать желание'}</button>
          {editingId ? (
            <button id="btn-cancel" type="button" className="button secondary" onClick={onCancel}>Отмена</button>
          ) : null}
        </div>
      </form>
    </div>
  )
}
