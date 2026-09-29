import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Building2, Check, Clock, Globe2, Handshake, MapPin, Megaphone, Plus, Send, Sparkles, UserSearch, Users } from 'lucide-react'
import type { Opportunity, OpportunityType } from '../data/types'
import { opportunityFit } from '../data/match'
import { CITIES } from '../data/seed'
import * as api from '../data/api'
import { useMe, useStore } from '../store'
import { faNum, formatListTime } from '../lib/format'
import { useTick } from '../lib/hooks'
import { Avatar, Empty, SkillPicker } from '../components/ui'
import { Verified } from '../components/Brand'
import { Sheet } from '../components/Sheet'

export const OPP_TYPES: Record<OpportunityType, { label: string; icon: typeof Handshake }> = {
  collab: { label: 'همکاری', icon: Handshake },
  job: { label: 'استخدام', icon: UserSearch },
  sponsor: { label: 'تبلیغات و اسپانسر', icon: Megaphone },
  studio: { label: 'استودیو و تجهیزات', icon: Building2 },
}

export function OppCard({ o, fit }: { o: Opportunity; fit?: number }) {
  const author = useStore((s) => s.db.members[o.authorId])
  const meId = useStore((s) => s.meId)
  const T = OPP_TYPES[o.type]
  const applied = o.applicants.some((a) => a.memberId === meId)
  return (
    <motion.button
      layout
      className="card opp"
      onClick={() => useStore.getState().openOpp(o.id)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="opp-top">
        <span className={'opp-type t-' + o.type}>
          <T.icon size={14} /> {T.label}
        </span>
        {o.status === 'pending' && <span className="status-pill pending">در انتظار تأیید</span>}
        {!!fit && fit >= 55 && (
          <span className="fit">
            <Sparkles size={14} /> {faNum(fit)}٪ مناسب تو
          </span>
        )}
      </div>
      <h3>{o.title}</h3>
      <p>{o.description}</p>
      <div className="chips">
        {o.skills.map((s) => (
          <span key={s} className="chip">
            {s}
          </span>
        ))}
      </div>
      <div className="opp-foot">
        {author && <Avatar m={author} size={26} />}
        <span className="ellipsis" style={{ flex: 1, fontWeight: 700, color: 'var(--text)' }}>
          {author?.name}
        </span>
        <span>{o.remote ? 'دورکاری' : o.city}</span>
        <span>·</span>
        <span>{formatListTime(o.createdAt)}</span>
        {applied && <Check size={16} style={{ color: 'var(--online)' }} />}
      </div>
    </motion.button>
  )
}

export function Opportunities() {
  useTick()
  const me = useMe()
  const opportunities = useStore((s) => s.db.opportunities)
  const [type, setType] = useState<OpportunityType | 'all' | 'fit' | 'mine'>('fit')
  if (!me) return null

  const approved = opportunities.filter((o) => o.status === 'approved' || o.authorId === me.id)
  const list = approved
    .map((o) => ({ o, fit: opportunityFit(me, o) }))
    .filter(({ o, fit }) => {
      if (type === 'fit') return fit > 0 && o.authorId !== me.id
      if (type === 'mine') return o.authorId === me.id || o.applicants.some((a) => a.memberId === me.id)
      if (type === 'all') return true
      return o.type === type
    })
    .sort((a, b) => (type === 'fit' ? b.fit - a.fit : b.o.createdAt - a.o.createdAt))

  const FILTERS: [typeof type, string][] = [
    ['fit', '✨ مناسب من'],
    ['all', 'همه'],
    ...(Object.keys(OPP_TYPES) as OpportunityType[]).map((t) => [t, OPP_TYPES[t].label] as [typeof type, string]),
    ['mine', 'مال من'],
  ]

  return (
    <>
      <header className="page-head">
        <h1>
          فرصت‌ها
          <span className="sub">{faNum(opportunities.filter((o) => o.status === 'approved').length)} فرصت همکاری، استخدام و اسپانسری</span>
        </h1>
        <button className="btn primary sm" onClick={() => useStore.getState().openSheet('new-opp')}>
          <Plus size={17} /> ثبت فرصت
        </button>
      </header>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {FILTERS.map(([id, label]) => (
          <button key={id} className={'pick' + (type === id ? ' on' : '')} style={{ flex: 'none' }} onClick={() => setType(id)}>
            {label}
          </button>
        ))}
      </div>
      {list.length ? (
        <div className="grid auto">
          <AnimatePresence initial={false}>
            {list.map(({ o, fit }) => (
              <OppCard key={o.id} o={o} fit={fit} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <Empty
          icon={Handshake}
          title={type === 'fit' ? 'فعلاً فرصتی با مهارت‌هات جور نیست' : 'فرصتی نیست'}
          text={type === 'fit' ? 'مهارت‌های بیشتری به پروفایلت اضافه کن یا همه‌ی فرصت‌ها رو ببین.' : undefined}
        />
      )}
    </>
  )
}

export function OpportunitySheet({ id }: { id: string }) {
  const me = useMe()
  const o = useStore((s) => s.db.opportunities.find((x) => x.id === id))
  const members = useStore((s) => s.db.members)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const close = () => useStore.getState().openOpp(undefined)
  if (!o || !me) return null
  const author = members[o.authorId]
  const T = OPP_TYPES[o.type]
  const fit = opportunityFit(me, o)
  const applied = o.applicants.find((a) => a.memberId === me.id)
  const mine = o.authorId === me.id

  return (
    <Sheet title="" onClose={close}>
      <div className="sheet-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="opp-top">
          <span className={'opp-type t-' + o.type}>
            <T.icon size={14} /> {T.label}
          </span>
          {fit > 0 && !mine && (
            <span className="fit">
              <Sparkles size={14} /> {faNum(fit)}٪ مناسب تو
            </span>
          )}
        </div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, lineHeight: 1.6 }}>{o.title}</h2>
        <div className="meta-line">
          <span>{o.remote ? <Globe2 size={13} /> : <MapPin size={13} />} {o.remote ? 'دورکاری' : o.city}</span>
          <span>
            <Clock size={13} /> {formatListTime(o.createdAt)}
          </span>
          <span>
            <Users size={13} /> {faNum(o.applicants.length)} درخواست
          </span>
          {o.budget && <span>💰 {o.budget}</span>}
        </div>
        <p style={{ margin: 0, lineHeight: 2, fontSize: 15 }}>{o.description}</p>
        <div className="chips">
          {o.skills.map((s) => (
            <span key={s} className={'chip' + (me.skills.includes(s) ? ' accent' : '')}>
              {me.skills.includes(s) && <Check size={12} strokeWidth={3} />} {s}
            </span>
          ))}
        </div>
        {author && (
          <button className="card" style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12, textAlign: 'right' }} onClick={() => useStore.getState().openProfile(author.id)}>
            <Avatar m={author} size={44} />
            <div style={{ flex: 1 }}>
              <div className="mcard-name" style={{ fontSize: 15 }}>
                {author.name} {author.verified && <Verified size={15} />}
              </div>
              <div className="mcard-headline">{author.headline}</div>
            </div>
          </button>
        )}

        {mine ? (
          <div className="card pad">
            <div style={{ fontWeight: 800, marginBottom: 10 }}>درخواست‌ها ({faNum(o.applicants.length)})</div>
            {o.applicants.length === 0 && <div className="muted" style={{ fontSize: 14 }}>هنوز درخواستی نیومده.</div>}
            {o.applicants.map((a) => {
              const m = members[a.memberId]
              return m ? (
                <button key={a.memberId} className="notif" style={{ padding: '8px 0' }} onClick={() => useStore.getState().openProfile(m.id)}>
                  <Avatar m={m} size={38} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{m.name}</div>
                    <div className="time">{a.note || m.headline}</div>
                  </div>
                </button>
              ) : null
            })}
          </div>
        ) : applied ? (
          <div className="contact-box">
            <div className="line">
              <Check size={18} style={{ color: 'var(--online)' }} /> درخواستت فرستاده شد. اگه صاحب آگهی قبول کنه، بهت خبر می‌دیم.
            </div>
          </div>
        ) : (
          <>
            <textarea className="field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="یه پیام کوتاه برای صاحب آگهی (اختیاری): چرا تو گزینه‌ی مناسبی هستی؟" />
            <button
              className="btn primary block"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                await useStore.getState().apply(o, note.trim() || undefined)
                setBusy(false)
              }}
            >
              {busy ? <span className="spinner" /> : <><Send size={17} style={{ transform: 'scaleX(-1)' }} /> ارسال درخواست</>}
            </button>
          </>
        )}
      </div>
    </Sheet>
  )
}

export function NewOpportunitySheet() {
  const me = useMe()
  const catalog = useStore((s) => s.db.platform.skillCatalog)
  const [type, setType] = useState<OpportunityType>('collab')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [remote, setRemote] = useState(true)
  const [city, setCity] = useState(me?.city ?? 'تهران')
  const [budget, setBudget] = useState('')
  const [busy, setBusy] = useState(false)
  const close = () => useStore.getState().openSheet(undefined)
  const valid = title.trim().length > 4 && description.trim().length > 10 && skills.length > 0

  const submit = async () => {
    if (!me || !valid) return
    setBusy(true)
    await api.createOpportunity(me.id, { type, title: title.trim(), description: description.trim(), skills, remote, city: remote ? undefined : city, budget: budget.trim() || undefined })
    close()
    useStore.getState().showToast('فرصتت ثبت شد و بعد از تأیید تیم هیلز منتشر می‌شه ✅')
  }

  return (
    <Sheet
      title="ثبت فرصت جدید"
      onClose={close}
      actions={
        <button className="btn primary sm" disabled={!valid || busy} onClick={submit}>
          {busy ? <span className="spinner" /> : 'ثبت'}
        </button>
      }
    >
      <div className="sheet-body stack">
        <div className="chips" style={{ gap: 7 }}>
          {(Object.keys(OPP_TYPES) as OpportunityType[]).map((t) => (
            <button key={t} className={'pick' + (type === t ? ' on' : '')} onClick={() => setType(t)}>
              {OPP_TYPES[t].label}
            </button>
          ))}
        </div>
        <div>
          <label className="label">عنوان</label>
          <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً: تدوینگر برای ریلزهای هفتگی" />
        </div>
        <div>
          <label className="label">توضیحات</label>
          <textarea className="field" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="چه کاری، با چه حجمی و چه شرایطی؟" />
        </div>
        <div>
          <label className="label">مهارت‌های لازم</label>
          <SkillPicker groups={catalog} value={skills} onChange={setSkills} max={4} />
        </div>
        <div>
          <label className="label">محل کار</label>
          <div className="chips" style={{ gap: 7 }}>
            <button className={'pick' + (remote ? ' on' : '')} onClick={() => setRemote(true)}>
              دورکاری
            </button>
            {CITIES.slice(0, 6).map((c) => (
              <button key={c} className={'pick' + (!remote && city === c ? ' on' : '')} onClick={() => { setRemote(false); setCity(c) }}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">بودجه یا شرایط (اختیاری)</label>
          <input className="field" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="مثلاً: پروژه‌ای، توافقی" />
        </div>
      </div>
    </Sheet>
  )
}
