import { useCart, FREE_SHIP_THRESHOLD } from '../context/CartContext'
import { useLang } from '../utils/i18n'
import { formatPrice } from '../utils/format'

export default function FreeShippingBar() {
  const { subtotal } = useCart()
  const { t } = useLang()
  if (subtotal <= 0) return null
  const pct = Math.min(100, (subtotal / FREE_SHIP_THRESHOLD) * 100)
  const left = FREE_SHIP_THRESHOLD - subtotal
  return (
    <div className="shipbar glass">
      {left > 0 ? (
        <div className="shipbar-inner">
          <span className="shipbar-text">
            {t('shipbar.left')} <strong>{formatPrice(left)}</strong> {t('shipbar.toFree')}
          </span>
          <div className="shipbar-track">
            <div className="shipbar-fill" style={{ width: pct + '%' }} />
            <span className="shipbar-marker">🚚</span>
          </div>
        </div>
      ) : (
        <div className="shipbar-inner achieved"><span className="shipbar-text">{t('shipbar.achieved')}</span></div>
      )}
    </div>
  )
}
