import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useLang } from '../utils/i18n'
import Ic from './Ic'

const DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

export default function CheckinCard() {
  const { user, dailyCheckin } = useAuth()
  const { toast } = useToast()
  const { t } = useLang()
  const [result, setResult] = useState(null)
  if (!user) return null

  const today = new Date().toDateString()
  const doneToday = user.lastCheckin === today
  const streak = user.checkinStreak || 0
  // next reward preview
  const nextPts = Math.min(50, 10 + (doneToday ? streak : streak + 1) * 10)

  const claim = () => {
    const res = dailyCheckin()
    if (!res.ok) return toast(res.msg, 'error')
    setResult(res)
    toast(res.msg)
  }

  return (
    <div className="checkin-card glass">
      <div className="checkin-head">
        <h3><Ic e="📅" size={17} /> {t('checkin.title')}</h3>
        <span className="checkin-streak"><Ic e="🔥" size={14} /> {t('checkin.streak')} {streak} {t('checkin.days')}</span>
      </div>
      <div className="checkin-days">
        {[0, 1, 2, 3, 4, 5, 6].map(i => {
          const pts = Math.min(50, 10 + i * 10)
          const reached = streak > i
          return (
            <div key={i} className={`checkin-day ${reached ? 'reached' : ''} ${i === 6 ? 'big' : ''}`}>
              <small>{DOW[i]}</small>
              <span className="checkin-pts">+{pts}</span>
            </div>
          )
        })}
      </div>
      {doneToday ? (
        <div className="checkin-done"><Ic e="✅" size={16} /> {t('checkin.today')}</div>
      ) : (
        <button className="primary-btn checkin-btn" onClick={claim}>
          <Ic e="🎁" size={15} /> {t('checkin.claim')} +{nextPts}
        </button>
      )}
    </div>
  )
}
