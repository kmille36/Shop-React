import { useState } from 'react'
import { useAdmin } from '../../context/AdminContext'
import { seedCoupons, couponDesc } from '../../data/coupons'
import { useToast } from '../../context/ToastContext'
import { formatPrice } from '../../utils/format'
import Ic from '../../components/Ic'

export default function CouponsAdmin() {
  const { getCustomCoupons, addCoupon, deleteCoupon } = useAdmin()
  const { toast } = useToast()
  const [adding, setAdding] = useState(false)
  const [f, setF] = useState({ code: '', type: 'percent', value: 10, minTotal: 0, cap: '' })

  const all = { ...seedCoupons, ...getCustomCoupons() }
  const list = Object.values(all)

  const doAdd = (e) => {
    e.preventDefault()
    const code = f.code.trim().toUpperCase()
    if (!/^[A-Z0-9]{3,12}$/.test(code)) return toast('Mã phải 3-12 ký tự A-Z, 0-9!', 'error')
    if (all[code]) return toast('Mã này đã tồn tại!', 'error')
    const c = {
      id: code, label: code,
      type: f.type,
      value: f.type === 'freeship' ? 0 : Number(f.value),
      minTotal: Number(f.minTotal) || 0,
      cap: f.type === 'percent' && f.cap ? Number(f.cap) : undefined,
    }
    addCoupon(c)
    toast(`Đã thêm mã ${code}`)
    setAdding(false)
    setF({ code: '', type: 'percent', value: 10, minTotal: 0, cap: '' })
  }

  const doDelete = (id) => {
    const res = deleteCoupon(id)
    if (!res.ok) return toast(res.msg, 'error')
    toast(`Đã xóa mã ${id}`, 'info')
  }

  return (
    <div className="admin-content">
      <div className="admin-toolbar">
        <span className="muted">{list.length} mã giảm giá đang hoạt động</span>
        <button className="primary-btn" onClick={() => setAdding(true)}><Ic e="✨" size={16} /> Thêm mã</button>
      </div>

      <div className="admin-table-wrap glass">
        <table className="admin-table">
          <thead><tr><th>Mã</th><th>Ưu đãi</th><th>Điều kiện</th><th>Loại</th><th></th></tr></thead>
          <tbody>
            {list.map(c => (
              <tr key={c.id}>
                <td><strong className="coupon-code">{c.label}</strong></td>
                <td>{couponDesc(c)}</td>
                <td><small>{c.minTotal > 0 ? `Đơn từ ${formatPrice(c.minTotal)}` : 'Không giới hạn'}</small></td>
                <td><small>{c.type === 'percent' ? 'Tỷ lệ %' : c.type === 'fixed' ? 'Cố định' : 'Miễn ship'}</small></td>
                <td className="row-actions">
                  <button className="ghost-btn small danger" onClick={() => doDelete(c.id)} disabled={!!seedCoupons[c.id]}>
                    <Ic e="🗑️" size={14} /> {seedCoupons[c.id] ? 'Mặc định' : 'Xóa'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {adding && (
        <div className="modal-overlay" onClick={() => setAdding(false)}>
          <div className="glass modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head"><h2><Ic e="✨" size={18} /> Thêm mã giảm giá</h2><button className="close-btn" onClick={() => setAdding(false)}><Ic e="✕" size={18} /></button></div>
            <form className="auth-form" onSubmit={doAdd}>
              <label>Mã (A-Z, 0-9)
                <input required value={f.code} onChange={e => setF({ ...f, code: e.target.value.toUpperCase() })} placeholder="VD: TEASALE" autoFocus />
              </label>
              <div className="form-2col">
                <label>Loại
                  <select value={f.type} onChange={e => setF({ ...f, type: e.target.value })}>
                    <option value="percent">Giảm %</option>
                    <option value="fixed">Giảm cố định</option>
                    <option value="freeship">Miễn phí ship</option>
                  </select>
                </label>
                {f.type !== 'freeship' && (
                  <label>{f.type === 'percent' ? 'Giảm (%)' : 'Giảm (đ)'}
                    <input required type="number" value={f.value} onChange={e => setF({ ...f, value: e.target.value })} />
                  </label>
                )}
              </div>
              {f.type === 'percent' && (
                <label>Trần giảm (đ, để trống = không)
                  <input type="number" value={f.cap} onChange={e => setF({ ...f, cap: e.target.value })} />
                </label>
              )}
              <label>Đơn tối thiểu (đ)
                <input type="number" value={f.minTotal} onChange={e => setF({ ...f, minTotal: e.target.value })} />
              </label>
              <button className="primary-btn" type="submit"><Ic e="✅" size={16} /> Thêm mã</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
