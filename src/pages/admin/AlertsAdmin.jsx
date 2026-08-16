import { useState } from 'react'
import { useAdmin } from '../../context/AdminContext'
import { useStore } from '../../context/StoreContext'
import { useToast } from '../../context/ToastContext'
import { formatPrice } from '../../utils/format'
import Ic from '../../components/Ic'

export default function AlertsAdmin() {
  const { getPriceAlerts, getStockAlerts, markAlertDone, getQA, answerQA } = useAdmin()
  const { products } = useStore()
  const { toast } = useToast()
  const [answering, setAnswering] = useState(null) // {productId, id}
  const [answerText, setAnswerText] = useState('')
  const qaAll = Object.entries(getQA()).flatMap(([pid, list]) => list.map(x => ({ ...x, productId: Number(pid) })))
  const pendingQA = qaAll.filter(x => !x.a)
  const priceAlerts = getPriceAlerts()
  const stockAlerts = getStockAlerts()
  const pname = (id) => products.find(p => p.id === id)?.name || `#${id}`
  const pprice = (id) => products.find(p => p.id === id)?.price

  return (
    <div className="admin-content">
      <div className="admin-cols">
        <div className="glass panel">
          <h3>📉 Báo giá giảm ({priceAlerts.length})</h3>
          {priceAlerts.length === 0 ? <p className="panel-empty">Chưa có yêu cầu nào</p> : (
            <div className="alert-list">
              {priceAlerts.map(a => {
                const current = pprice(a.productId)
                const hit = current && current <= a.price
                return (
                  <div key={a.id} className={`alert-item ${a.done ? 'done' : ''} ${hit ? 'hit' : ''}`}>
                    <div className="alert-info">
                      <strong>{pname(a.productId)}</strong>
                      <small>SĐT: {a.phone} • Muốn: {formatPrice(a.price)} {hit && '• ⚡ ĐÃ ĐẠT GIÁ!'}</small>
                    </div>
                    {!a.done && (
                      <button className="ghost-btn small" onClick={() => { markAlertDone('price', a.id); toast('Đã thông báo khách! 🔔') }}>
                        <Ic e="🔔" size={13} /> Thông báo
                      </button>
                    )}
                    {a.done && <span className="muted">✓ Đã xong</span>}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="glass panel">
          <h3>📋 Báo có hàng ({stockAlerts.length})</h3>
          {stockAlerts.length === 0 ? <p className="panel-empty">Chưa có yêu cầu nào</p> : (
            <div className="alert-list">
              {stockAlerts.map(a => (
                <div key={a.id} className={`alert-item ${a.done ? 'done' : ''}`}>
                  <div className="alert-info">
                    <strong>{pname(a.productId)}</strong>
                    <small>SĐT: {a.phone}</small>
                  </div>
                  {!a.done ? (
                    <button className="ghost-btn small" onClick={() => { markAlertDone('stock', a.id); toast('Đã thông báo khách! 🔔') }}>
                      <Ic e="🔔" size={13} /> Thông báo
                    </button>
                  ) : <span className="muted">✓ Đã xong</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="glass panel" style={{ marginTop: 16 }}>
        <h3>❓ Câu hỏi cần trả lời ({pendingQA.length})</h3>
        {pendingQA.length === 0 ? <p className="panel-empty">Tất cả câu hỏi đã được trả lời</p> : (
          <div className="alert-list">
            {pendingQA.map(item => (
              <div key={item.id} className="alert-item">
                <div className="alert-info">
                  <strong>{pname(item.productId)}</strong>
                  <small>"{item.q}" — {new Date(item.date).toLocaleDateString('vi-VN')}</small>
                </div>
                {answering?.id === item.id ? (
                  <div className="qa-answer-row">
                    <input autoFocus value={answerText} onChange={e => setAnswerText(e.target.value)} placeholder="Trả lời..." />
                    <button className="ghost-btn small" onClick={() => {
                      if (!answerText.trim()) return
                      answerQA(item.productId, item.id, answerText.trim())
                      setAnswering(null); setAnswerText('')
                      toast('Đã trả lời!')
                    }}>OK</button>
                  </div>
                ) : (
                  <button className="ghost-btn small" onClick={() => { setAnswering(item); setAnswerText('') }}>
                    <Ic e="💬" size={13} /> Trả lời
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="muted" style={{ marginTop: 12, fontSize: '.8rem' }}>
        💡 Mẹo: khi hạ giá sản phẩm hoặc nhập hàng mới, vào đây bấm "Thông báo" — khách sẽ nhận thông báo ngay trong app.
      </p>
    </div>
  )
}
