import { useState } from 'react'
import { useAdmin } from '../../context/AdminContext'
import { useStore } from '../../context/StoreContext'
import { useToast } from '../../context/ToastContext'
import { formatPrice } from '../../utils/format'
import Ic from '../../components/Ic'
import ProductImg from '../../components/ProductImg'

const CATS = ['Điện thoại', 'Laptop', 'Tablet', 'Phụ kiện', 'Game']

export default function ProductsAdmin() {
  const { getProducts, updateProduct, addProduct, deleteProduct, getSold } = useAdmin()
  const { getStock } = useStore()
  const { toast } = useToast()
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null)
  const [adding, setAdding] = useState(false)

  const products = getProducts().filter(p => !q || p.name.toLowerCase().includes(q.toLowerCase()))
  const sold = getSold()

  const remove = (p) => {
    if (confirm(`Xóa sản phẩm "${p.name}"?`)) {
      deleteProduct(p.id)
      toast(`Đã xóa "${p.name}"`, 'info')
    }
  }

  return (
    <div className="admin-content">
      <div className="admin-toolbar">
        <input className="admin-search" placeholder="🔍 Tìm sản phẩm..." value={q} onChange={e => setQ(e.target.value)} />
        <button className="primary-btn" onClick={() => setAdding(true)}><Ic e="✨" size={16} /> Thêm sản phẩm</button>
      </div>

      <div className="admin-table-wrap glass">
        <table className="admin-table">
          <thead>
            <tr><th>Sản phẩm</th><th>Danh mục</th><th>Giá</th><th>Tồn kho</th><th>Flash</th><th></th></tr>
          </thead>
          <tbody>
            {products.map(p => {
              const left = getStock(p)
              return (
                <tr key={p.id}>
                  <td>
                    <div className="prod-cell">
                      <span className="prod-thumb"><ProductImg src={p.image} alt={p.name} /></span>
                      <div><strong>{p.name}</strong><small className="muted">ID {p.id}</small></div>
                    </div>
                  </td>
                  <td><small>{p.category}</small></td>
                  <td><strong>{formatPrice(p.price)}</strong>{p.oldPrice && <small className="muted"> {formatPrice(p.oldPrice)}</small>}</td>
                  <td>
                    <span className={`stock-pill ${left <= 0 ? 'out' : left <= 5 ? 'low' : 'ok'}`}>
                      {left <= 0 ? 'Hết' : left}
                    </span>
                  </td>
                  <td>{p.flash ? '⚡' : '—'}</td>
                  <td className="row-actions">
                    <button className="ghost-btn small" onClick={() => setEditing(p)}><Ic e="✏️" size={14} /> Sửa</button>
                    <button className="ghost-btn small danger" onClick={() => remove(p)}><Ic e="🗑️" size={14} /></button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {editing && <EditModal product={editing} onClose={() => setEditing(null)} onSave={(f) => { updateProduct(editing.id, f); toast('Đã cập nhật sản phẩm'); setEditing(null) }} />}
      {adding && <AddModal onClose={() => setAdding(false)} onSave={(f) => { addProduct(f); toast('Đã thêm sản phẩm'); setAdding(false) }} />}
    </div>
  )
}

function EditModal({ product, onClose, onSave }) {
  const [f, setF] = useState({ price: product.price, oldPrice: product.oldPrice || '', stock: product.stock, name: product.name, category: product.category, flash: product.flash, image: product.image, desc: product.desc || '' })
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head"><h2><Ic e="✏️" size={18} /> Sửa sản phẩm</h2><button className="close-btn" onClick={onClose}><Ic e="✕" size={18} /></button></div>
        <form className="auth-form" onSubmit={e => { e.preventDefault(); onSave({ ...f, oldPrice: f.oldPrice === '' ? null : Number(f.oldPrice), stock: Number(f.stock), price: Number(f.price) }) }}>
          <label>Tên <input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></label>
          <div className="form-2col">
            <label>Giá <input required type="number" value={f.price} onChange={e => setF({ ...f, price: e.target.value })} /></label>
            <label>Giá gốc <input type="number" value={f.oldPrice} onChange={e => setF({ ...f, oldPrice: e.target.value })} /></label>
          </div>
          <div className="form-2col">
            <label>Tồn kho <input required type="number" value={f.stock} onChange={e => setF({ ...f, stock: e.target.value })} /></label>
            <label>Danh mục
              <select value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>
                {CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
          </div>
          <label>Ảnh (URL) <input value={f.image} onChange={e => setF({ ...f, image: e.target.value })} placeholder="/images/... hoặc emoji" /></label>
          <label>Mô tả <textarea rows="2" value={f.desc} onChange={e => setF({ ...f, desc: e.target.value })} /></label>
          <label className="pay-opt"><input type="checkbox" checked={f.flash} onChange={e => setF({ ...f, flash: e.target.checked })} /><span><Ic e="⚡" size={15} /> Flash sale</span></label>
          <button className="primary-btn" type="submit"><Ic e="💾" size={16} /> Lưu thay đổi</button>
        </form>
      </div>
    </div>
  )
}

function AddModal({ onClose, onSave }) {
  const [f, setF] = useState({ name: '', price: '', oldPrice: '', stock: 10, category: 'Phụ kiện', flash: false, image: '📦', desc: '' })
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head"><h2><Ic e="✨" size={18} /> Thêm sản phẩm</h2><button className="close-btn" onClick={onClose}><Ic e="✕" size={18} /></button></div>
        <form className="auth-form" onSubmit={e => { e.preventDefault(); onSave({ ...f, price: Number(f.price), oldPrice: f.oldPrice ? Number(f.oldPrice) : null, stock: Number(f.stock) }) }}>
          <label>Tên <input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></label>
          <div className="form-2col">
            <label>Giá <input required type="number" value={f.price} onChange={e => setF({ ...f, price: e.target.value })} /></label>
            <label>Giá gốc <input type="number" value={f.oldPrice} onChange={e => setF({ ...f, oldPrice: e.target.value })} /></label>
          </div>
          <div className="form-2col">
            <label>Tồn kho <input required type="number" value={f.stock} onChange={e => setF({ ...f, stock: e.target.value })} /></label>
            <label>Danh mục
              <select value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>
                {CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
          </div>
          <label>Ảnh (URL hoặc emoji) <input value={f.image} onChange={e => setF({ ...f, image: e.target.value })} placeholder="/images/... hoặc 📱" /></label>
          <label>Mô tả <textarea rows="2" value={f.desc} onChange={e => setF({ ...f, desc: e.target.value })} /></label>
          <label className="pay-opt"><input type="checkbox" checked={f.flash} onChange={e => setF({ ...f, flash: e.target.checked })} /><span><Ic e="⚡" size={15} /> Flash sale</span></label>
          <button className="primary-btn" type="submit"><Ic e="✅" size={16} /> Thêm sản phẩm</button>
        </form>
      </div>
    </div>
  )
}
