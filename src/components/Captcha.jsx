import { useState, useEffect } from 'react'
import Ic from './Ic'

// Simple math CAPTCHA (anti-spam) — regenerates on each mount / refresh
export function newChallenge() {
  const a = Math.floor(Math.random() * 8) + 1
  const b = Math.floor(Math.random() * 8) + 1
  const op = Math.random() < 0.5 ? '+' : '−'
  const answer = op === '+' ? a + b : Math.abs(a - b)
  return { text: `${a} ${op} ${b} = ?`, answer }
}

export default function Captcha({ onValid }) {
  const [ch, setCh] = useState(newChallenge)
  const [val, setVal] = useState('')
  const valid = val !== '' && Number(val) === ch.answer

  // report validity (boolean) to parent whenever it changes
  useEffect(() => { onValid && onValid(valid) }, [valid])

  const refresh = () => { setCh(newChallenge()); setVal('') }

  return (
    <div className="captcha-row">
      <span className="captcha-q"><Ic e="🔢" size={15} /> {ch.text}</span>
      <input
        className="captcha-input"
        type="number"
        placeholder="?"
        value={val}
        onChange={e => setVal(e.target.value)}
      />
      <button type="button" className="ghost-btn small" onClick={refresh} title="Câu khác">
        <Ic e="🔄" size={13} />
      </button>
    </div>
  )
}
