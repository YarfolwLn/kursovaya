import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../auth.jsx'
import AppHeader from '../components/AppHeader.jsx'
import ShareUrlCard from '../components/ShareUrlCard.jsx'
import WishForm from '../components/WishForm.jsx'
import WishesFilters from '../components/WishesFilters.jsx'
import WishesGrid from '../components/WishesGrid.jsx'
import AdminEditModal from '../components/AdminEditModal.jsx'

export default function DashboardPage() {
  const nav = useNavigate()
  const { user, logout } = useAuth()

  const isAdmin = user?.role === 'admin' || !!user?.is_admin

  useEffect(() => {
    document.title = isAdmin ? 'Админ-панель — Wishlist' : 'Мои желания — Wishlist'
  }, [isAdmin])

  const [users, setUsers] = useState([])
  const [wishes, setWishes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [copyStatus, setCopyStatus] = useState('')

  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedUser, setSelectedUser] = useState('all')
  const [sort, setSort] = useState('date-desc')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Без категории')
  const [price, setPrice] = useState('')
  const [link, setLink] = useState('')
  const [rating, setRating] = useState(3)

  const [editingId, setEditingId] = useState(null)
  const [editingImage, setEditingImage] = useState('')

  const [uploading, setUploading] = useState(false)
  const [uploadedImageUrl, setUploadedImageUrl] = useState('')
  const [uploadError, setUploadError] = useState('')

  const [editingWish, setEditingWish] = useState(null)
  const [deletingWishId, setDeletingWishId] = useState(null)

  const shareUrl = `${window.location.origin}/share/${encodeURIComponent(user?.id || '')}`

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        // getUsers только для админа
        const promises = [api.getWishes()]
        if (isAdmin) {
          promises.push(api.getUsers())
        }
        
        const results = await Promise.all(promises)
        const w = results[0]
        const u = isAdmin ? results[1] : []
        
        if (!mounted) return
        setUsers(Array.isArray(u) ? u : [])
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
  }, [])

  const myWishes = useMemo(() => {
    let base = isAdmin ? wishes : wishes.filter(w => w.user_id === user?.id)
    if (isAdmin && selectedUser !== 'all') {
      base = base.filter(w => String(w.user_id) === selectedUser)
    }

    let filtered = base
    if (selectedCategory !== 'all') {
      const byCat = base.filter(w => w.category === selectedCategory)
      const completed = base.filter(w => w.completed)
      filtered = Array.from(new Set([...byCat, ...completed]))
    }

    const arr = [...filtered]
    arr.sort((a, b) => {
      if (sort === 'rating-desc') return (b.rating || 0) - (a.rating || 0)
      if (sort === 'rating-asc') return (a.rating || 0) - (b.rating || 0)
      if (sort === 'price-desc') return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0)
      if (sort === 'price-asc') return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0)
      if (sort === 'date-asc') return new Date(a.created_at || 0) - new Date(b.created_at || 0)
      return new Date(b.created_at || 0) - new Date(a.created_at || 0)
    })
    return arr
  }, [isAdmin, wishes, user?.id, selectedCategory, selectedUser, sort])

  const categories = useMemo(() => {
    const set = new Set()
    const base = isAdmin ? wishes : wishes.filter(w => w.user_id === user?.id)
    base.forEach(w => {
      if (w.category && w.category !== 'Без категории') set.add(w.category)
    })
    return Array.from(set).sort()
  }, [isAdmin, wishes, user?.id])

  async function handleUpload(file) {
    setUploadError('')
    setUploadedImageUrl('')
    if (!file) return

    setUploading(true)
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const result = await api.uploadBase64({
        image: base64,
        fileName: file.name,
        mimeType: file.type || 'image/png',
      })

      if (!result?.success || !result?.imageUrl) throw new Error('Ошибка загрузки изображения')

      setUploadedImageUrl(result.imageUrl)
    } catch (err) {
      setUploadError(err.message || 'Ошибка загрузки изображения')
    } finally {
      setUploading(false)
    }
  }

  function beginEdit(wish) {
    setError('')
    setUploadError('')
    setUploadedImageUrl('')
    setEditingId(wish.id)
    setTitle(wish.title || '')
    setDescription(wish.description || '')
    setCategory(wish.category || 'Без категории')
    setPrice(wish.price != null ? String(wish.price) : '')
    setLink(wish.link || '')
    setRating(wish.rating != null ? wish.rating : 3)
    setEditingImage(wish.image || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openAdminEdit(wish) {
    setError('')
    setUploadError('')
    setUploadedImageUrl('')
    setEditingWish({
      ...wish,
      title: wish.title || '',
      description: wish.description || '',
      category: wish.category || 'Без категории',
      price: wish.price != null ? String(wish.price) : '',
      link: wish.link || '',
      rating: wish.rating != null ? wish.rating : 3,
      image: wish.image || '',
    })
  }

  function closeAdminEdit() {
    setEditingWish(null)
    setUploadedImageUrl('')
    setUploadError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingImage('')
    setTitle('')
    setDescription('')
    setCategory('Без категории')
    setPrice('')
    setLink('')
    setRating(3)
    setUploadedImageUrl('')
    setUploadError('')
  }

  async function createWish(e) {
    e.preventDefault()
    setError('')
    try {
      if (editingId) {
        const imageToSave = uploadedImageUrl || editingImage || ''
        await api.updateWish(editingId, {
          title,
          description,
          category,
          price,
          link,
          rating,
          image: imageToSave,
        })
        const w = await api.getWishes()
        setWishes(Array.isArray(w) ? w : [])
        cancelEdit()
        setUploadedImageUrl('')
        setUploadError('')
        return
      }

      const payload = {
        user_id: user?.id,
        title,
        description,
        category,
        price,
        link,
        rating,
        image: uploadedImageUrl || '',
      }

      await api.createWish(payload)
      const w = await api.getWishes()
      setWishes(Array.isArray(w) ? w : [])

      setTitle('')
      setDescription('')
      setCategory('Без категории')
      setPrice('')
      setLink('')
      setRating(3)
      setUploadedImageUrl('')
    } catch (err) {
      setError(err.message || 'Ошибка создания желания')
    }
  }

  async function completeWish(wish) {
    try {
      await api.completeWish(wish.id, true)
      const w = await api.getWishes()
      setWishes(Array.isArray(w) ? w : [])
    } catch (err) {
      setError(err.message || 'Ошибка выполнения')
    }
  }

  async function saveAdminEdit() {
    if (!editingWish) return
    setError('')
    setUploadError('')
    try {
      await api.updateWish(editingWish.id, {
        title: editingWish.title,
        description: editingWish.description,
        category: editingWish.category,
        price: editingWish.price,
        link: editingWish.link,
        rating: editingWish.rating,
        image: uploadedImageUrl || editingWish.image,
      })
      const w = await api.getWishes()
      setWishes(Array.isArray(w) ? w : [])
      closeAdminEdit()
    } catch (err) {
      setUploadError(err.message || 'Ошибка сохранения')
    }
  }

  async function deleteWish(wish) {
    setDeletingWishId(wish.id)
    try {
      await api.deleteWish(wish.id)
      const w = await api.getWishes()
      setWishes(Array.isArray(w) ? w : [])
    } catch (err) {
      setError(err.message || 'Ошибка удаления')
    } finally {
      setDeletingWishId(null)
    }
  }

  return (
    <div className="container">
      <AppHeader
        badge={<span className="badge">{isAdmin ? '👑 Админ' : '👤 Пользователь'}: {user?.name || user?.email}</span>}
        right={<button className="button secondary" onClick={() => { logout(); nav('/login') }}>Выйти</button>}
      />

      {!isAdmin ? (
        <ShareUrlCard
          shareUrl={shareUrl}
          copyStatus={copyStatus}
          setCopyStatus={setCopyStatus}
        />
      ) : null}

      {loading ? <div className="muted">Загрузка…</div> : null}
      {error ? <div className="error" style={{ marginTop: 12 }}>{error}</div> : null}

      {!isAdmin ? (
        <WishForm
          title={title} setTitle={setTitle}
          category={category} setCategory={setCategory}
          description={description} setDescription={setDescription}
          price={price} setPrice={setPrice}
          link={link} setLink={setLink}
          rating={rating} setRating={setRating}
          editingId={editingId}
          uploading={uploading}
          handleUpload={handleUpload}
          uploadError={uploadError}
          uploadedImageUrl={uploadedImageUrl}
          editingImage={editingImage}
          onSubmit={createWish}
          onCancel={cancelEdit}
        />
      ) : null}

      <div className="card" style={{ marginTop: 16 }}>
        <WishesFilters
          isAdmin={isAdmin}
          users={users}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          sort={sort}
          setSort={setSort}
        />
        <WishesGrid
          wishes={myWishes}
          isAdmin={isAdmin}
          isDeletingMap={{ [deletingWishId]: true }}
          onComplete={completeWish}
          onDelete={deleteWish}
          onEdit={isAdmin ? openAdminEdit : beginEdit}
        />
      </div>

      {isAdmin ? (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="muted">Админ видит все желания. Категории берутся из всех желаний.</div>
          <div className="muted" style={{ marginTop: 8 }}>Пользователи: {users.length}</div>
        </div>
      ) : null}

      <AdminEditModal
        editingWish={editingWish}
        setEditingWish={setEditingWish}
        uploading={uploading}
        handleUpload={handleUpload}
        uploadError={uploadError}
        uploadedImageUrl={uploadedImageUrl}
        onSave={saveAdminEdit}
        onClose={closeAdminEdit}
      />
    </div>
  )
}
