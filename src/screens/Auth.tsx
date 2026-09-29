import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Handshake, Lock, ShieldCheck, Sparkles, Users } from 'lucide-react'
import * as api from '../data/api'
import { toEnDigits, toFaDigits } from '../lib/format'
import { useStore } from '../store'
import { HillsIcon } from '../components/Brand'
import { Credit } from '../components/ui'

const slide = {
  initial: { opacity: 0, x: -24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 24 },
  transition: { duration: 0.25 },
}

export function Auth() {
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [phone, setPhone] = useState('')
  const [normalized, setNormalized] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const digits = toEnDigits(phone).replace(/\D/g, '').replace(/^0/, '')
  const valid = /^9\d{9}$/.test(digits)

  async function submitPhone(e?: React.FormEvent) {
    e?.preventDefault()
    if (!valid || busy) return
    setBusy(true)
    setError('')
    try {
      const r = await api.requestCode(digits)
      setNormalized(r.phone)
      setStep('code')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function submitCode(value: string) {
    setBusy(true)
    setError('')
    try {
      const r = await api.verifyCode(normalized, value)
      if (r.token) useStore.getState().signedIn(r.token)
      else {
        useStore.getState().setPhone(normalized)
        useStore.setState({ phase: 'onboarding' })
      }
    } catch (err) {
      setError((err as Error).message)
      setCode('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stage">
      <div className="grid-lines" />
      <div className="auth-card">
        <AnimatePresence mode="wait">
          {step === 'phone' ? (
            <motion.form key="phone" {...slide} onSubmit={submitPhone}>
              <div className="demo-badge">نسخه‌ی نمایشی · پیشنهاد طراحی برای پروژه هیلز</div>
              <div className="mark">
                <HillsIcon size={76} />
              </div>
              <h1>
                <span className="grad-text">هیلز کانکت</span>
              </h1>
              <p className="lead">جایی که اعضای هیلز همدیگه رو پیدا می‌کنن، مچ می‌شن و با هم می‌سازن.</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 18, margin: '-8px 0 22px', fontSize: 12.5, color: 'var(--text-2)', fontWeight: 600 }}>
                <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
                  <Users size={15} /> ۲٬۸۰۰+ عضو
                </span>
                <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
                  <Sparkles size={15} /> مچینگ هوشمند
                </span>
                <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
                  <Handshake size={15} /> فرصت همکاری
                </span>
              </div>
              <div className="phone-field">
                <span className="cc">+۹۸</span>
                <input
                  autoFocus
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="۹۱۲ ۳۴۵ ۶۷۸۹"
                  value={toFaDigits(phone)}
                  onChange={(e) => setPhone(toEnDigits(e.target.value).replace(/[^\d ]/g, '').slice(0, 13))}
                />
              </div>
              {error && <div className="auth-error">{error}</div>}
              <button className="btn primary block" style={{ marginTop: 18 }} disabled={!valid || busy}>
                {busy ? <span className="spinner" /> : 'ورود با حساب پنل هیلز'}
              </button>
              <div className="auth-foot">
                <Lock size={14} /> فقط اعضای پروژه هیلز امکان ورود دارن
              </div>
              <div className="credit-wrap" style={{ marginTop: 14 }}>
                <Credit />
              </div>
            </motion.form>
          ) : (
            <motion.div key="code" {...slide}>
              <div className="mark">
                <div style={{ width: 76, height: 76, borderRadius: 26, background: 'rgba(197,139,255,.14)', display: 'grid', placeItems: 'center' }}>
                  <ShieldCheck size={38} color="#c58bff" />
                </div>
              </div>
              <h1>کد تأیید</h1>
              <p className="lead">
                کد ۵ رقمی به شماره‌ی <b className="ltr">{toFaDigits('0' + normalized)}</b> پیامک شد.
              </p>
              <Otp
                value={code}
                error={!!error}
                disabled={busy}
                onChange={(v) => {
                  setCode(v)
                  setError('')
                  if (v.length === 5) submitCode(v)
                }}
              />
              {error && <div className="auth-error">{error}</div>}
              <div className="demo-hint">
                <Sparkles size={14} /> نسخه‌ی نمایشی — کد: ۱۲۳۴۵
              </div>
              <div className="row-center">
                <button className="link-btn" onClick={() => { setStep('phone'); setCode(''); setError('') }}>
                  ویرایش شماره
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function Otp({ value, onChange, error, disabled }: { value: string; onChange: (v: string) => void; error: boolean; disabled: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  useEffect(() => {
    refs.current[Math.min(value.length, 4)]?.focus()
  }, [value, error])
  return (
    <div className={'otp' + (error ? ' shake' : '')}>
      {[0, 1, 2, 3, 4].map((i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          className={value[i] ? 'filled' : ''}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={5}
          disabled={disabled}
          value={value[i] ? toFaDigits(value[i]) : ''}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !value[i] && i > 0) onChange(value.slice(0, i - 1))
          }}
          onChange={(e) => {
            const d = toEnDigits(e.target.value).replace(/\D/g, '')
            if (!d) return onChange(value.slice(0, i))
            onChange((value.slice(0, i) + d).slice(0, 5))
          }}
        />
      ))}
    </div>
  )
}
