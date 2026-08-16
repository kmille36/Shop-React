import { useState } from 'react'
import { seedBlog } from '../data/blog'
import { useAdmin } from '../context/AdminContext'
import { useLang } from '../utils/i18n'
import Ic from '../components/Ic'

export default function BlogPage({ onBack, onView }) {
  const { getBlog } = useAdmin()
  const { t } = useLang()
  const [reading, setReading] = useState(null)
  // admin-created posts (localStorage) + seed
  const posts = [...getBlog(), ...seedBlog]

  if (reading) {
    return (
      <div className="page">
        <button className="ghost-btn blog-back" onClick={() => setReading(null)}><Ic e="→" size={14} className="flip" /> {t('blog.back')}</button>
        <article className="glass blog-article">
          <h1>{reading.title}</h1>
          <small className="blog-date">{new Date(reading.date).toLocaleDateString('vi-VN')}</small>
          <img className="blog-hero" src={reading.image} alt={reading.title} />
          <div className="blog-body">{reading.content}</div>
        </article>
      </div>
    )
  }

  return (
    <div className="page">
      <h1 className="page-title"><Ic e="📰" size={24} className="inline-ic" /> {t('blog.title')}</h1>
      <div className="blog-grid">
        {posts.map(p => (
          <article key={p.id} className="glass blog-card" onClick={() => setReading(p)}>
            <div className="blog-card-img"><img src={p.image} alt={p.title} /></div>
            <div className="blog-card-body">
              <small className="blog-date">{new Date(p.date).toLocaleDateString('vi-VN')}</small>
              <h3>{p.title}</h3>
              <p>{p.excerpt}</p>
              <span className="blog-read"><Ic e="→" size={14} /> {t('blog.read')}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
