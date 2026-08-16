import { useState } from 'react'
import { useAdmin } from '../../context/AdminContext'
import { seedBlog } from '../../data/blog'
import { useToast } from '../../context/ToastContext'
import { detailImage } from '../../utils/imggen'
import Ic from '../../components/Ic'

export default function BlogAdmin() {
  const { getBlog, addBlogPost, deleteBlogPost } = useAdmin()
  const { toast } = useToast()
  const [adding, setAdding] = useState(false)
  const [f, setF] = useState({ title: '', excerpt: '', content: '' })

  const posts = [...getBlog(), ...seedBlog]

  const doAdd = (e) => {
    e.preventDefault()
    if (!f.title.trim() || !f.content.trim()) return toast('Nhập tiêu đề và nội dung!', 'error')
    addBlogPost({ title: f.title.trim(), excerpt: f.excerpt.trim() || f.content.slice(0, 100), content: f.content.trim(), image: detailImage(f.title, 200, 'BLOG') })
    toast('Đã thêm bài viết!')
    setAdding(false)
    setF({ title: '', excerpt: '', content: '' })
  }

  return (
    <div className="admin-content">
      <div className="admin-toolbar">
        <span className="muted">{posts.length} bài viết ({getBlog().length} tự tạo)</span>
        <button className="primary-btn" onClick={() => setAdding(true)}><Ic e="✨" size={16} /> Thêm bài viết</button>
      </div>

      <div className="admin-table-wrap glass">
        <table className="admin-table">
          <thead><tr><th>Bài viết</th><th>Ngày</th><th></th></tr></thead>
          <tbody>
            {posts.map(p => (
              <tr key={p.id}>
                <td>
                  <div className="prod-cell">
                    <span className="prod-thumb"><img src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} /></span>
                    <div><strong>{p.title}</strong><small className="muted">{p.excerpt.slice(0, 60)}...</small></div>
                  </div>
                </td>
                <td><small>{new Date(p.date).toLocaleDateString('vi-VN')}</small></td>
                <td className="row-actions">
                  {getBlog().some(x => x.id === p.id) && (
                    <button className="ghost-btn small danger" onClick={() => { if (confirm('Xóa bài?')) { deleteBlogPost(p.id); toast('Đã xóa bài', 'info') } }}><Ic e="🗑️" size={14} /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {adding && (
        <div className="modal-overlay" onClick={() => setAdding(false)}>
          <div className="glass modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head"><h2><Ic e="📰" size={18} /> Thêm bài viết</h2><button className="close-btn" onClick={() => setAdding(false)}><Ic e="✕" size={18} /></button></div>
            <form className="auth-form" onSubmit={doAdd}>
              <label>Tiêu đề <input required value={f.title} onChange={e => setF({ ...f, title: e.target.value })} autoFocus /></label>
              <label>Tóm tắt <input value={f.excerpt} onChange={e => setF({ ...f, excerpt: e.target.value })} placeholder="Để trống = tự lấy từ nội dung" /></label>
              <label>Nội dung <textarea required rows="5" value={f.content} onChange={e => setF({ ...f, content: e.target.value })} /></label>
              <button className="primary-btn" type="submit"><Ic e="✅" size={15} /> Đăng bài</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
