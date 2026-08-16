import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { useLang } from '../utils/i18n'
import { BADGES, earnedBadges } from '../utils/badges'
import Ic from './Ic'

export default function Badges() {
  const { user } = useAuth()
  const { wishlist, reviews } = useStore()
  const { t } = useLang()
  if (!user) return null
  const earned = new Set(earnedBadges(user, wishlist, reviews).map(b => b.id))

  return (
    <div className="badges-card glass">
      <h3><Ic e="🏅" size={17} /> {t('badges.title')} ({earned.size}/{BADGES.length})</h3>
      <div className="badges-grid">
        {BADGES.map(b => (
          <div key={b.id} className={`badge-item ${earned.has(b.id) ? 'earned' : 'locked'}`} title={b.desc}>
            <span className="badge-icon">{b.icon}</span>
            <strong>{b.name}</strong>
            <small>{b.desc}</small>
          </div>
        ))}
      </div>
    </div>
  )
}
