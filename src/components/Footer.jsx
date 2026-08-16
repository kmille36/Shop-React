import { useState } from 'react'
import { useToast } from '../context/ToastContext'
import { useLang } from '../utils/i18n'
import Ic from './Ic'

const FAQS = [
  { q: 'Thời gian giao hàng bao lâu?', a: 'Nội thành 1-2 ngày, toàn quốc 2-4 ngày làm việc.' },
  { q: 'Chính sách đổi trả như thế nào?', a: 'Đổi trả miễn phí trong 7 ngày nếu lỗi do nhà sản xuất, hàng còn nguyên tem.' },
  { q: 'Làm sao để dùng mã giảm giá?', a: 'Mở giỏ hàng → nhập mã vào ô "Mã giảm giá" → bấm Áp dụng.' },
  { q: 'Điểm thưởng hoạt động ra sao?', a: 'Mỗi 10.000đ mua hàng = 1 điểm. 1000 điểm = 10.000đ, dùng khi thanh toán.' },
]

export default function Footer({ onAdmin }) {
  const { toast } = useToast()
  const { t } = useLang()
  const [email, setEmail] = useState('')
  const [openFaq, setOpenFaq] = useState(null)

  const subscribe = (e) => {
    e.preventDefault()
    if (!email.includes('@')) return toast('Email không hợp lệ!', 'error')
    toast('Đăng ký nhận tin thành công! 📬')
    setEmail('')
  }

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="f-col">
          <h3><Ic e="🛍️" size={20} /> ShopReact</h3>
          <p>{t('footer.about')}</p>
          <div className="socials">
            <span><Ic e="📘" size={16} /></span><span><Ic e="📸" size={16} /></span><span><Ic e="▶️" size={16} /></span><span><Ic e="🐦" size={16} /></span>
          </div>
        </div>
        <div className="f-col">
          <h4>{t('footer.support')}</h4>
          <p><Ic e="📞" size={14} className="inline-ic" /> 1900 1234</p>
          <p><Ic e="✉️" size={14} className="inline-ic" /> hotro@shopreact.vn</p>
          <p><Ic e="🕐" size={14} className="inline-ic" /> 8:00 - 21:30 (T2-CN)</p>
        </div>
        <div className="f-col f-faq">
          <h4>{t('footer.faq')}</h4>
          {FAQS.map((f, i) => (
            <div className="faq" key={i}>
              <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                {f.q} <span>{openFaq === i ? '−' : '+'}</span>
              </button>
              {openFaq === i && <p className="faq-a">{f.a}</p>}
            </div>
          ))}
        </div>
        <div className="f-col">
          <h4><Ic e="📬" size={16} /> {t('footer.news')}</h4>
          <p>{t('footer.newsHint')}</p>
          <form className="news-form" onSubmit={subscribe}>
            <input placeholder={t('footer.email')} value={email} onChange={e => setEmail(e.target.value)} />
            <button className="primary-btn" type="submit"><Ic e="📬" size={15} /> {t('footer.subscribe')}</button>
          </form>
        </div>
      </div>
      <div className="f-bottom">© 2026 ShopReact — Demo e-commerce React + Vite • Liquid Glass UI • <a href="#" onClick={e => { e.preventDefault(); onAdmin && onAdmin() }}><Ic e="🛡️" size={13} className="inline-ic" /> {t('footer.admin')}</a></div>
    </footer>
  )
}
