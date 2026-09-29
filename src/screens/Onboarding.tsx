import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Send } from 'lucide-react'
import type { CollabStatus, Member } from '../data/types'
import { CITIES, EXTRA_LOOKING, NICHES, SKILL_CATALOG } from '../data/seed'
import * as api from '../data/api'
import { useStore } from '../store'
import { COLLAB_LABEL, SkillPicker } from '../components/ui'
import { InstagramGlyph, LinkedinGlyph, YoutubeGlyph } from '../components/Brand'
import { toFaDigits } from '../lib/format'

const STEPS = [
  { title: 'خودت رو معرفی کن', text: 'این اطلاعات روی کارت پروفایلت دیده می‌شه.' },
  { title: 'چه کارهایی بلدی؟', text: 'تا ۵ مهارت انتخاب کن. بر اساس همین‌ها بقیه پیدات می‌کنن.' },
  { title: 'دنبال چی هستی؟', text: 'بگو دنبال چه کسی یا چه مهارتی هستی و توی چه حوزه‌ای محتوا می‌سازی. مچ‌ها از همین‌جا ساخته می‌شن.' },
  { title: 'کجا فعالی؟', text: 'پلتفرم‌ها و راه ارتباطیت. راه ارتباطی فقط بعد از قبول درخواست همکاری نمایش داده می‌شه.' },
]

const FOLLOWER_RANGES: [string, number][] = [
  ['زیر ۱ هزار', 500],
  ['۱ تا ۱۰ هزار', 5000],
  ['۱۰ تا ۵۰ هزار', 25000],
  ['۵۰ تا ۱۰۰ هزار', 70000],
  ['بالای ۱۰۰ هزار', 150000],
]

export function Onboarding() {
  const phone = useStore((s) => s.pendingPhone) ?? ''
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [p, setP] = useState({
    name: '',
    username: '',
    headline: '',
    city: 'تهران',
    bio: '',
    skills: [] as string[],
    lookingFor: [] as string[],
    niches: [] as string[],
    instagram: '',
    youtube: '',
    linkedin: '',
    followers: 5000,
    telegram: '',
    collab: 'open' as CollabStatus,
  })
  const set = (patch: Partial<typeof p>) => setP((x) => ({ ...x, ...patch }))

  const canNext = [
    p.name.trim().length > 1 && p.headline.trim().length > 1,
    p.skills.length > 0,
    p.lookingFor.length > 0 && p.niches.length > 0,
    true,
  ][step]

  async function finish() {
    setBusy(true)
    const platforms: Member['platforms'] = {}
    if (p.instagram.trim()) platforms.instagram = { handle: p.instagram.trim().replace(/^@/, ''), followers: p.followers }
    if (p.youtube.trim()) platforms.youtube = { handle: p.youtube.trim(), followers: p.followers }
    if (p.linkedin.trim()) platforms.linkedin = { handle: p.linkedin.trim() }
    const token = await api.register(phone, {
      name: p.name,
      username: p.username,
      headline: p.headline,
      city: p.city,
      bio: p.bio,
      skills: p.skills,
      lookingFor: p.lookingFor,
      niches: p.niches,
      platforms,
      collab: p.collab,
      contact: { telegram: p.telegram.trim().replace(/^@/, '') || undefined, instagram: platforms.instagram?.handle },
    })
    useStore.getState().signedIn(token)
  }

  const lookingGroups = { ...SKILL_CATALOG, 'افراد و حمایت': EXTRA_LOOKING }

  return (
    <div className="stage">
      <div className="grid-lines" />
      <div className="onb">
        <div className="onb-head">
          <div className="progress">
            <motion.div animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }} transition={{ type: 'spring', stiffness: 200, damping: 30 }} />
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-2)', fontWeight: 700, marginBottom: 6 }}>
            مرحله‌ی {toFaDigits(String(step + 1))} از {toFaDigits(String(STEPS.length))}
          </div>
          <h2>{STEPS[step].title}</h2>
          <p>{STEPS[step].text}</p>
        </div>
        <div className="onb-body">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
              {step === 0 && (
                <div className="stack">
                  <div>
                    <label className="label">نام و نام خانوادگی</label>
                    <input className="field" autoFocus value={p.name} onChange={(e) => set({ name: e.target.value.slice(0, 40) })} placeholder="مثلاً: مینا رحیمی" />
                  </div>
                  <div>
                    <label className="label">عنوان کوتاه</label>
                    <input className="field" value={p.headline} onChange={(e) => set({ headline: e.target.value.slice(0, 50) })} placeholder="مثلاً: تدوینگر ریلز · پیج آشپزی" />
                  </div>
                  <div>
                    <label className="label">شهر</label>
                    <div className="chips" style={{ gap: 7 }}>
                      {CITIES.map((c) => (
                        <button key={c} type="button" className={'pick' + (p.city === c ? ' on' : '')} onClick={() => set({ city: c })}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label">درباره‌ی خودت (اختیاری)</label>
                    <textarea className="field" value={p.bio} onChange={(e) => set({ bio: e.target.value.slice(0, 200) })} placeholder="چه محتوایی می‌سازی و دنبال چه همکاری‌ای هستی؟" />
                  </div>
                </div>
              )}
              {step === 1 && <SkillPicker groups={SKILL_CATALOG} value={p.skills} onChange={(skills) => set({ skills })} max={5} />}
              {step === 2 && (
                <>
                  <SkillPicker groups={lookingGroups} value={p.lookingFor} onChange={(lookingFor) => set({ lookingFor })} max={5} />
                  <div className="picker-group" style={{ marginTop: 22 }}>
                    <h5>حوزه‌ی محتوای تو</h5>
                    <div className="chips" style={{ gap: 7 }}>
                      {NICHES.map((n) => (
                        <button
                          key={n}
                          type="button"
                          className={'pick' + (p.niches.includes(n) ? ' on' : '')}
                          onClick={() => set({ niches: p.niches.includes(n) ? p.niches.filter((x) => x !== n) : [...p.niches, n].slice(0, 3) })}
                        >
                          {p.niches.includes(n) && <Check size={14} strokeWidth={3} />}
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {step === 3 && (
                <div className="stack">
                  <div>
                    <div className="platform-row">
                      <span className="platform-ico" style={{ background: 'linear-gradient(45deg,#feda75,#d62976,#4f5bd5)' }}>
                        <InstagramGlyph size={18} />
                      </span>
                      <input className="field sm ltr" dir="ltr" placeholder="instagram id" value={p.instagram} onChange={(e) => set({ instagram: e.target.value })} />
                      <select className="field sm" value={p.followers} onChange={(e) => set({ followers: Number(e.target.value) })}>
                        {FOLLOWER_RANGES.map(([l, v]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="platform-row">
                      <span className="platform-ico" style={{ background: '#ff0033' }}>
                        <YoutubeGlyph size={18} />
                      </span>
                      <input className="field sm ltr" dir="ltr" placeholder="youtube channel" value={p.youtube} onChange={(e) => set({ youtube: e.target.value })} />
                      <span />
                    </div>
                    <div className="platform-row">
                      <span className="platform-ico" style={{ background: '#0a66c2' }}>
                        <LinkedinGlyph size={18} />
                      </span>
                      <input className="field sm ltr" dir="ltr" placeholder="linkedin profile" value={p.linkedin} onChange={(e) => set({ linkedin: e.target.value })} />
                      <span />
                    </div>
                  </div>
                  <div>
                    <label className="label">آیدی تلگرام برای هماهنگی همکاری</label>
                    <div className="platform-row" style={{ gridTemplateColumns: '38px 1fr' }}>
                      <span className="platform-ico" style={{ background: '#2aa3df' }}>
                        <Send size={17} style={{ transform: 'scaleX(-1)' }} />
                      </span>
                      <input className="field sm ltr" dir="ltr" placeholder="@username" value={p.telegram} onChange={(e) => set({ telegram: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="label">وضعیت همکاری</label>
                    <div className="chips" style={{ gap: 7 }}>
                      {(Object.keys(COLLAB_LABEL) as CollabStatus[]).map((c) => (
                        <button key={c} type="button" className={'pick' + (p.collab === c ? ' on' : '')} onClick={() => set({ collab: c })}>
                          {COLLAB_LABEL[c]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="onb-foot">
          {step > 0 && (
            <button className="btn ghost" onClick={() => setStep(step - 1)}>
              <ArrowRight size={18} /> قبلی
            </button>
          )}
          <button
            className="btn primary"
            disabled={!canNext || busy}
            onClick={() => (step < STEPS.length - 1 ? setStep(step + 1) : finish())}
          >
            {busy ? (
              <span className="spinner" />
            ) : step < STEPS.length - 1 ? (
              <>
                بعدی <ArrowLeft size={18} />
              </>
            ) : (
              <>
                ساخت پروفایل و دیدن مچ‌ها <ArrowLeft size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
