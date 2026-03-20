import React, { useState } from 'react'

export default function StarRating({ value, onChange, readonly = false }) {
  const [hover, setHover] = useState(0)
  const stars = [1, 2, 3, 4, 5]

  return (
    <div className="row star-rating" style={{ alignItems: 'center', gap: 4 }}>
      {stars.map((star) => {
        const filled = star <= (hover || value)
        return (
          <span
            key={star}
            className="star"
            style={{
              fontSize: 20,
              cursor: readonly ? 'default' : 'pointer',
              opacity: filled ? 1 : 0.3,
              transition: 'opacity 0.2s',
            }}
            onClick={() => !readonly && onChange(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
          >
            {filled ? '⭐' : '☆'}
          </span>
        )
      })}
    </div>
  )
}
