import { useState, useEffect } from 'react'
import { useToast } from '../../context/ToastContext'
import { uploadImage } from '../../utils/upload'
import { loadBranding, saveBranding, applyBranding, DEFAULT_BRANDING } from '../../utils/branding'
import Ic from '../../components/Ic'

export default function BrandingAdmin() {
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [favicon, setFavicon] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const b = loadBranding()
    setTitle(b.title); setFavicon(b.favicon)
  }, [])

  const onFaviconFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return toast('Ảnh quá lớn (tối đa 2MB)!', 'error')
    uploadImage(file, 128)
      .then(url => { setFavicon(url); toast('Đã chọn favicon mới — nhớ bấm Lưu!') })
      .catch(() => toast('Không đọc được file ảnh!', 'error'))
    e.target.value = ''
  }

  const save = () => {
    const b = { title: title.trim() || DEFAULT_BRANDING.title, favicon }
    saveBranding(b)
    applyBranding(b)
    setSaved(true)
    toast('Đã lưu thương hiệu! Tiêu đề & favicon đã cập nhật ✅')
    setTimeout(() => setSaved(false), 2500)
  }

  const reset = () => {
    saveBranding({ ...DEFAULT_BRANDING })
    applyBranding(DEFAULT_BRANDING)
    setTitle(DEFAULT_BRANDING.title); setFavicon(null)
    toast('Đã khôi phục mặc định', 'info')
  }

  return (
    <div className="admin-content">
      <div className="glass panel" style={{ maxWidth: 640 }}>
        <h3><Ic e="🎨" size={16} /> Thương hiệu website</h3>
        <p className="muted" style={{ marginTop: -6, marginBottom: 16 }}>
          Đổi tiêu đề trang (hiện trên tab trình duyệt) và favicon (biểu tượng tab). Áp dụng ngay cho tất cả khách.
        </p>

        <label>Tiêu đề trang web
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder={DEFAULT_BRANDING.title} />
        </label>

        <label>Favicon
          <input
            value={favicon && !favicon.startsWith('/uploads/') ? '' : favicon || ''}
            placeholder={favicon ? 'Đã chọn favicon (xem preview bên dưới)' : 'https://... hoặc tải ảnh lên'}
            onChange={e => setFavicon(e.target.value.trim() || null)}
          />
        </label>
        <div className="img-upload-row">
          <label className="ghost-btn small" title="Chọn favicon từ máy">
            <Ic e="📤" size={14} /> Tải favicon lên
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onFaviconFile} />
          </label>
          <span className="img-preview" title="Preview favicon">
            {favicon
              ? <img src={favicon} alt="favicon preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              : <Ic e="🛒" size={22} />}
          </span>
          {favicon && (
            <button className="ghost-btn small danger" onClick={() => setFavicon(null)}>
              <Ic e="🗑️" size={13} /> Xóa
            </button>
          )}
        </div>

        <div className="btn-row" style={{ marginTop: 16 }}>
          <button className="primary-btn" onClick={save}><Ic e="💾" size={15} /> Lưu thay đổi</button>
          <button className="ghost-btn" onClick={reset}><Ic e="↩️" size={15} /> Khôi phục mặc định</button>
          {saved && <span className="muted">✓ Đã lưu</span>}
        </div>

        <div className="branding-live" style={{ marginTop: 18 }}>
          <small className="muted">Xem trước tab trình duyệt:</small>
          <div className="branding-tab-preview">
            <img src={favicon || undefined} alt="" style={{ width: 16, height: 16, borderRadius: 3 }} />
            <span>{title || DEFAULT_BRANDING.title}</span>
            <span style={{ opacity: .5 }}>×</span>
          </div>
        </div>
      </div>
    </div>
  )
}
