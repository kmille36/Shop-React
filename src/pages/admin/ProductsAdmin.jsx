import { useState } from 'react'
import { useAdmin } from '../../context/AdminContext'
import { useStore } from '../../context/StoreContext'
import { useToast } from '../../context/ToastContext'
import { uploadImage } from '../../utils/upload'
import { formatPrice } from '../../utils/format'
import { downloadCSV } from '../../utils/csv'
import { toLocalInput, fromLocalInput, flashActive } from '../../utils/flash'
import Ic from '../../components/Ic'
import ProductImg from '../../components/ProductImg'

const CATS = ['Điện thoại', 'Laptop', 'Tablet', 'Phụ kiện', 'Game']

export default function ProductsAdmin() {
  const { getProducts, updateProduct, addProduct, deleteProduct, getSold, importProducts } = useAdmin()
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
        <button className="ghost-btn" onClick={() => {
          downloadCSV(`products-${new Date().toISOString().slice(0, 10)}.csv`, [
            ['ID', 'Tên', 'Danh mục', 'Giá', 'Giá gốc', 'Tồn kho', 'Flash'],
            ...getProducts().map(p => [p.id, p.name, p.category, p.price, p.oldPrice || '', getStock(p), p.flash ? 'Có' : '']),
          ])
          toast('Đã xuất danh sách sản phẩm')
        }}><Ic e="📤" size={15} /> CSV</button>
        <button className="primary-btn" onClick={() => setAdding(true)}><Ic e="✨" size={16} /> Thêm sản phẩm</button>
        <label className="ghost-btn import-btn">
          <Ic e="📥" size={15} /> Nhập CSV
          <input type="file" accept=".csv" style={{ display: 'none' }} onChange={e => {
            const file = e.target.files[0]
            if (!file) return
            const reader = new FileReader()
            reader.onload = () => {
              try {
                const lines = String(reader.result).split(/\r?\n/).filter(l => l.trim())
                const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''))
                const rows = lines.slice(1).map(l => {
                  const cells = l.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
                  const o = {}
                  header.forEach((h, i) => { o[h] = cells[i] || '' })
                  return { name: o.name || o.tên, category: o.category || o.danh_mục, price: o.price || o.giá, oldPrice: o.oldprice || o.giá_gốc, stock: o.stock || o.tồn_kho, image: o.image || o.ảnh, desc: o.desc || o.mô_tả }
                })
                const n = importProducts(rows)
                toast(`Đã nhập ${n} sản phẩm từ CSV!`)
              } catch (err) { toast('File CSV không hợp lệ!', 'error') }
            }
            reader.readAsText(file)
            e.target.value = ''
          }} />
        </label>
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
                  <td>{p.flash ? (flashActive(p) ? <span title="Đang chạy">⚡ Đang chạy</span> : <span className="muted" title="Chưa bắt đầu hoặc đã kết thúc">⚡ {p.flashStart && Date.now() < p.flashStart ? 'Chờ đến ' + new Date(p.flashStart).toLocaleString('vi-VN') : 'Hết lịch'}</span>) : '—'}</td>
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
  const { toast } = useToast()
  const onUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) return toast('Ảnh quá lớn (tối đa 4MB)!', 'error')
    uploadImage(file, 800)
      .then(url => { setF(prev => ({ ...prev, image: url })); toast('Đã lưu ảnh! ✅') })
      .catch(() => toast('Không đọc được file ảnh!', 'error'))
    e.target.value = ''
  }
  const [f, setF] = useState({ price: product.price, oldPrice: product.oldPrice || '', stock: product.stock, name: product.name, category: product.category, flash: product.flash, image: product.image, desc: product.desc || '', flashStart: toLocalInput(product.flashStart), flashEnd: toLocalInput(product.flashEnd) })
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head"><h2><Ic e="✏️" size={18} /> Sửa sản phẩm</h2><button className="close-btn" onClick={onClose}><Ic e="✕" size={18} /></button></div>
        <form className="auth-form" onSubmit={e => {
        e.preventDefault()
        onSave({
          ...f, oldPrice: f.oldPrice === '' ? null : Number(f.oldPrice),
          stock: Number(f.stock), price: Number(f.price),
          flashStart: f.flash ? fromLocalInput(f.flashStart) : undefined,
          flashEnd: f.flash ? fromLocalInput(f.flashEnd) : undefined,
        })
      }}>
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
          <label>Ảnh (URL hoặc emoji)
            <input
              value={(f.image || '').startsWith('data:') ? '' : (f.image || '')}
              placeholder={(f.image || '').startsWith('data:') ? 'Đã chọn ảnh từ máy (xem bên dưới)' : '/images/... hoặc https://... hoặc emoji'}
              onChange={e => setF({ ...f, image: e.target.value })}
            />
          </label>
          <div className="img-upload-row">
            <label className="ghost-btn small img-upload-btn" title="Chọn ảnh từ máy">
              <Ic e="📤" size={14} /> Tải ảnh lên
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onUpload} />
            </label>
            {f.image && <span className="img-preview" title="Xem trước ảnh"><ProductImg src={f.image} alt="Xem trước" /></span>}
          </div>
          <label>Mô tả <textarea rows="2" value={f.desc} onChange={e => setF({ ...f, desc: e.target.value })} /></label>
          <label className="pay-opt"><input type="checkbox" checked={f.flash} onChange={e => setF({ ...f, flash: e.target.checked })} /><span><Ic e="⚡" size={15} /> Flash sale</span></label>
          {f.flash && (
            <div className="form-2col">
              <label>Bắt đầu (trống = ngay)
                <input type="datetime-local" value={f.flashStart} onChange={e => setF({ ...f, flashStart: e.target.value })} />
              </label>
              <label>Kết thúc (trống = hết hôm nay)
                <input type="datetime-local" value={f.flashEnd} onChange={e => setF({ ...f, flashEnd: e.target.value })} />
              </label>
            </div>
          )}
          <button className="primary-btn" type="submit"><Ic e="💾" size={16} /> Lưu thay đổi</button>
        </form>
      </div>
    </div>
  )
}

function AddModal({ onClose, onSave }) {
  const { toast } = useToast()
  const onUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) return toast('Ảnh quá lớn (tối đa 4MB)!', 'error')
    uploadImage(file, 800)
      .then(url => { setF(prev => ({ ...prev, image: url })); toast('Đã lưu ảnh! ✅') })
      .catch(() => toast('Không đọc được file ảnh!', 'error'))
    e.target.value = ''
  }
  const [f, setF] = useState({ name: '', price: '', oldPrice: '', stock: 10, category: 'Phụ kiện', flash: false, image: '📦', desc: '', flashStart: '', flashEnd: '' })
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head"><h2><Ic e="✨" size={18} /> Thêm sản phẩm</h2><button className="close-btn" onClick={onClose}><Ic e="✕" size={18} /></button></div>
        <form className="auth-form" onSubmit={e => {
        e.preventDefault()
        onSave({
          ...f, price: Number(f.price), oldPrice: f.oldPrice ? Number(f.oldPrice) : null, stock: Number(f.stock),
          flashStart: f.flash ? fromLocalInput(f.flashStart) : undefined,
          flashEnd: f.flash ? fromLocalInput(f.flashEnd) : undefined,
        })
      }}>
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
          <label>Ảnh (URL hoặc emoji)
            <input
              value={(f.image || '').startsWith('data:') ? '' : (f.image || '')}
              placeholder={(f.image || '').startsWith('data:') ? 'Đã chọn ảnh từ máy (xem bên dưới)' : '/images/... hoặc https://... hoặc emoji'}
              onChange={e => setF({ ...f, image: e.target.value })}
            />
          </label>
          <div className="img-upload-row">
            <label className="ghost-btn small img-upload-btn" title="Chọn ảnh từ máy">
              <Ic e="📤" size={14} /> Tải ảnh lên
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onUpload} />
            </label>
            {f.image && <span className="img-preview" title="Xem trước ảnh"><ProductImg src={f.image} alt="Xem trước" /></span>}
          </div>
          <label>Mô tả <textarea rows="2" value={f.desc} onChange={e => setF({ ...f, desc: e.target.value })} /></label>
          <label className="pay-opt"><input type="checkbox" checked={f.flash} onChange={e => setF({ ...f, flash: e.target.checked })} /><span><Ic e="⚡" size={15} /> Flash sale</span></label>
          {f.flash && (
            <div className="form-2col">
              <label>Bắt đầu (trống = ngay)
                <input type="datetime-local" value={f.flashStart} onChange={e => setF({ ...f, flashStart: e.target.value })} />
              </label>
              <label>Kết thúc (trống = hết hôm nay)
                <input type="datetime-local" value={f.flashEnd} onChange={e => setF({ ...f, flashEnd: e.target.value })} />
              </label>
            </div>
          )}
          <button className="primary-btn" type="submit"><Ic e="✅" size={16} /> Thêm sản phẩm</button>
        </form>
      </div>
    </div>
  )
}
