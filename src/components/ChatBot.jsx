import { useState, useRef, useEffect } from 'react'
import { formatPrice } from '../utils/format'
import Ic from './Ic'
import Emj from './Emj'

const BOT_RULES = [
  { keys: ['giá', 'bao nhiêu', 'giá bao nhiêu'], reply: '💰 Giá các sản phẩm từ 3.990.000đ (Kindle) đến 42.990.000đ (MacBook Pro 14). Bạn xem danh mục để chọn nhé!' },
  { keys: ['ship', 'giao', 'vận chuyển', 'phí ship'], reply: '🚚 Phí ship 30.000đ, MIỄN PHÍ cho đơn từ 10 triệu hoặc dùng mã FREESHIP. Giao 1-3 ngày toàn quốc!' },
  { keys: ['mã', 'giảm giá', 'khuyến mãi', 'voucher', 'coupon'], reply: '🎟️ Có 4 mã giảm giá đang áp dụng:\n• GIAM10: giảm 10% (tối đa 500K)\n• SAVE50: giảm 50K (đơn từ 1tr)\n• VIP20: giảm 20% (đơn từ 5tr)\n• FREESHIP: miễn phí ship' },
  { keys: ['điểm', 'tích điểm', 'loyalty'], reply: '🎁 Mỗi 10.000đ bạn mua sẽ tích 1 điểm. 100 điểm = 10.000đ, dùng khi thanh toán! Đăng ký mới tặng 100 điểm + 50K vào ví.' },
  { keys: ['đổi', 'trả', 'bảo hành'], reply: '🔄 Đổi trả miễn phí trong 7 ngày nếu lỗi do nhà sản xuất. Bảo hành chính hãng 12 tháng, 1 đổi 1 trong 30 ngày đầu.' },
  { keys: ['nạp', 'ví', 'số dư'], reply: '👛 Vào menu "Ví" để nạp tiền (từ 10.000đ) qua thẻ ATM, chuyển khoản hoặc ví điện tử. Nạp xong dùng để thanh toán nhanh!' },
  { keys: ['điện thoại', 'iphone', 'samsung', 'galaxy'], reply: '📱 Chúng tôi có iPhone 15/15 Pro Max, Galaxy S24 Ultra, iPhone 15. Xem danh mục "Điện thoại" nhé!' },
  { keys: ['laptop', 'macbook', 'dell', 'lg gram'], reply: '💻 Laptop: MacBook Pro 14 M3, Dell XPS 13 Plus, LG Gram 17. MacBook đang FLASH SALE ⚡ kìa!' },
  { keys: ['flash', 'sale'], reply: '⚡ Flash sale hôm nay: MacBook Pro 14 M3, PlayStation 5 Slim, Sony WH-1000XM5, AirPods Pro 2. Xem mục FLASH SALE trên trang chủ!' },
  { keys: ['chào', 'xin chào', 'hello', 'hi'], reply: 'Xin chào! 👋 Mình là ShopBot. Hỏi mình về: giá, ship, mã giảm giá, bảo hành, tích điểm nhé!' },
  { keys: ['cảm ơn', 'thank'], reply: 'Không có gì! 😊 Chúc bạn mua sắm vui vẻ tại ShopReact! 🛍️' },
]

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState([{ bot: true, text: 'Xin chào! 👋 Mình là ShopBot. Bạn cần gì nào?' }])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, typing, open])

  const send = (text) => {
    const t = (text ?? input).trim()
    if (!t) return
    setMsgs(prev => [...prev, { bot: false, text: t }])
    setInput('')
    setTyping(true)
    const lower = t.toLowerCase()
    // Score-based matching: the rule with the most keyword hits wins
    // (so "mã giảm giá?" hits the coupon rule, not the generic "giá" price rule)
    let rule = null, bestScore = 0
    for (const r of BOT_RULES) {
      const score = r.keys.filter(k => lower.includes(k)).length
      if (score > bestScore) { rule = r; bestScore = score }
    }
    setTimeout(() => {
      setTyping(false)
      setMsgs(prev => [...prev, {
        bot: true,
        text: rule ? rule.reply : '🤔 Mình chưa hiểu rõ. Bạn có thể hỏi về: giá, phí ship, mã giảm giá, bảo hành, tích điểm, flash sale nhé!'
      }])
    }, 900)
  }

  const quick = ['Mã giảm giá?', 'Phí ship bao nhiêu?', 'Flash sale gì hôm nay?']

  return (
    <>
      <button className="bot-fab" onClick={() => setOpen(o => !o)} title="Chat với ShopBot">
        {open ? <Ic e="✕" size={22} /> : <Ic e="💬" size={24} />}
        {!open && <span className="bot-dot" />}
      </button>
      {open && (
        <div className="glass bot-box">
          <div className="bot-head">
            <span className="bot-avatar"><Ic e="🤖" size={26} /></span>
            <div>
              <strong>ShopBot</strong>
              <small className="bot-online">● Trực tuyến</small>
            </div>
          </div>
          <div className="bot-msgs">
            {msgs.map((m, i) => (
              <div key={i} className={`bot-msg ${m.bot ? 'in' : 'out'}`}><Emj size={15}>{m.text}</Emj></div>
            ))}
            {typing && <div className="bot-msg in typing"><span/><span/><span/></div>}
            <div ref={endRef} />
          </div>
          <div className="bot-quick">
            {quick.map(q => (
              <button key={q} className="hint-chip" onClick={() => send(q)}>{q}</button>
            ))}
          </div>
          <div className="bot-input">
            <input placeholder="Nhắn tin..." value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()} />
            <button className="primary-btn small" onClick={() => send()}><Ic e="➤" size={16} /></button>
          </div>
        </div>
      )}
    </>
  )
}
