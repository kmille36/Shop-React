import { useCompare } from '../context/CompareContext'
import { useStore } from '../context/StoreContext'
import { useLang } from '../utils/i18n'
import { formatPrice } from '../utils/format'
import ProductImg from './ProductImg'
import Ic from './Ic'

export function CompareBar() {
  const { ids, clear, setOpen } = useCompare()
  const { products } = useStore()
  const { t } = useLang()
  if (ids.length === 0) return null
  const items = ids.map(id => products.find(p => p.id === id)).filter(Boolean)
  return (
    <div className="compare-bar glass">
      <span className="cb-title"><Ic e="⚖️" size={16} /> {t('compare.bar')} ({ids.length}/4)</span>
      <div className="cb-items">
        {items.map(p => (
          <span key={p.id} className="cb-chip">
            <ProductImg src={p.image} className="chip-img" /> {p.name}
          </span>
        ))}
      </div>
      <button className="primary-btn small" onClick={() => setOpen(true)} disabled={ids.length < 2}>
        {t('compare.bar')}
      </button>
      <button className="ghost-btn small" onClick={clear}><Ic e="✕" size={13} /> {t('compare.clear')}</button>
    </div>
  )
}

export function CompareModal() {
  const { ids, open, setOpen, toggle } = useCompare()
  const { products, getStock, avgRating } = useStore()
  const { t } = useLang()
  if (!open) return null
  const items = ids.map(id => products.find(p => p.id === id)).filter(Boolean)
  if (items.length < 2) return null

  const ATTRS = [
    { key: 'price', label: t('compare.attr.price'), render: p => <strong className="price">{formatPrice(p.price)}</strong> },
    { key: 'oldPrice', label: t('compare.attr.oldPrice'), render: p => p.oldPrice ? <span className="old-price">{formatPrice(p.oldPrice)}</span> : '—' },
    { key: 'rating', label: t('compare.attr.rating'), render: p => <span>⭐ {avgRating(p.id)}</span> },
    { key: 'stock', label: t('compare.attr.stock'), render: p => { const s = getStock(p); return s <= 0 ? 'Hết hàng' : `${s} sp` } },
    { key: 'category', label: t('compare.attr.category'), render: p => p.category },
    { key: 'desc', label: t('compare.attr.desc'), render: p => <small>{p.desc}</small> },
  ]

  return (
    <div className="modal-overlay" onClick={() => setOpen(false)}>
      <div className="glass modal compare-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2><Ic e="⚖️" size={20} /> {t('compare.title')}</h2>
          <button className="close-btn" onClick={() => setOpen(false)}><Ic e="✕" size={18} /></button>
        </div>
        <div className="compare-table-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th className="attr-col"></th>
                {items.map(p => (
                  <th key={p.id}>
                    <div className="cmp-prod">
                      <span className="cmp-img"><ProductImg src={p.image} alt={p.name} /></span>
                      <strong>{p.name}</strong>
                      <button className="ghost-btn small" onClick={() => toggle(p.id)}><Ic e="✕" size={12} /></button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ATTRS.map(a => (
                <tr key={a.key}>
                  <td className="attr-col">{a.label}</td>
                  {items.map(p => <td key={p.id}>{a.render(p)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
