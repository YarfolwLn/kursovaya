import React from 'react'

export default function WishesFilters({
  isAdmin,
  users, selectedUser, setSelectedUser,
  categories, selectedCategory, setSelectedCategory,
  sort, setSort
}) {
  return (
    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontWeight: 800 }}>Желания</div>
      <div className="row">
        {isAdmin ? (
          <>
            <select id="filter-user" className="select" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
              <option value="all">Все пользователи</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
            </select>
          </>
        ) : null}
        <select id="filter-category" className="select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
          <option value="all">Все категории</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select id="filter-sort" className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="rating-desc">По важности (убывание)</option>
          <option value="rating-asc">По важности (возрастание)</option>
          <option value="price-desc">По цене (убывание)</option>
          <option value="price-asc">По цене (возрастание)</option>
          <option value="date-desc">По дате (новые)</option>
          <option value="date-asc">По дате (старые)</option>
        </select>
      </div>
    </div>
  )
}
