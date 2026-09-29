import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Copy, Handshake, Inbox, Send, X } from 'lucide-react'
import type { Connection } from '../data/types'
import { matchMembers } from '../data/match'
import { useMe, useStore } from '../store'
import { faNum, formatListTime } from '../lib/format'
import { useTick } from '../lib/hooks'
import { Avatar, Empty, MatchRing } from '../components/ui'
import { Verified } from '../components/Brand'

type Seg = 'in' | 'out' | 'team'

export function Network() {
  useTick()
  const me = useMe()
  const connections = useStore((s) => s.db.connections)
  const [seg, setSeg] = useState<Seg>('in')
  if (!me) return null

  const incoming = connections.filter((c) => c.to === me.id && c.status === 'pending')
  const outgoing = connections.filter((c) => c.from === me.id && c.status !== 'accepted')
  const team = connections.filter((c) => (c.from === me.id || c.to === me.id) && c.status === 'accepted')
  const list = seg === 'in' ? incoming : seg === 'out' ? outgoing : team

  const SEGS: [Seg, string, number][] = [
    ['in', 'درخواست‌های دریافتی', incoming.length],
    ['out', 'ارسال‌شده', outgoing.length],
    ['team', 'تیم من', team.length],
  ]

  return (
    <>
      <header className="page-head">
        <h1>
          شبکه‌ی من
          <span className="sub">
            {faNum(team.length)} هم‌تیمی، {faNum(incoming.length)} درخواست در انتظار
          </span>
        </h1>
      </header>
      <div className="segmented">
        {SEGS.map(([id, label, n]) => (
          <button key={id} className={seg === id ? 'active' : ''} onClick={() => setSeg(id)}>
            {seg === id && <motion.span layoutId="net-seg" className="seg-bg" />}
            {label}
            {n > 0 && id === 'in' && <span className="badge">{faNum(n)}</span>}
          </button>
        ))}
      </div>
      {list.length ? (
        <div className="grid two">
          <AnimatePresence initial={false}>
            {[...list]
              .sort((a, b) => (b.respondedAt ?? b.createdAt) - (a.respondedAt ?? a.createdAt))
              .map((c) => (
                <RequestCard key={c.id} c={c} seg={seg} />
              ))}
          </AnimatePresence>
        </div>
      ) : (
        <Empty
          icon={seg === 'in' ? Inbox : seg === 'out' ? Send : Handshake}
          title={seg === 'in' ? 'درخواست تازه‌ای نداری' : seg === 'out' ? 'هنوز درخواستی نفرستادی' : 'هنوز هم‌تیمی نداری'}
          text="از بخش «کشف و مچ» آدم‌های مناسبت رو پیدا کن و درخواست همکاری بفرست."
          action={
            <button className="btn primary" onClick={() => useStore.getState().setTab('discover')}>
              رفتن به کشف و مچ
            </button>
          }
        />
      )}
    </>
  )
}

function RequestCard({ c, seg }: { c: Connection; seg: Seg }) {
  const me = useMe()!
  const otherId = c.from === me.id ? c.to : c.from
  const other = useStore((s) => s.db.members[otherId])
  const [busy, setBusy] = useState(false)
  if (!other) return null
  const { score } = matchMembers(me, other)
  const s = useStore.getState()

  return (
    <motion.div layout className="card req" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}>
      <div className="req-top">
        <Avatar m={other} size={52} onClick={() => s.openProfile(other.id)} />
        <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => s.openProfile(other.id)}>
          <div className="mcard-name" style={{ fontSize: 15.5 }}>
            <span className="ellipsis">{other.name}</span>
            {other.verified && <Verified size={15} />}
          </div>
          <div className="mcard-headline ellipsis">{other.headline}</div>
          <div className="meta-line" style={{ marginTop: 2 }}>
            <span>{formatListTime(c.respondedAt ?? c.createdAt)}</span>
          </div>
        </div>
        {seg === 'out' ? (
          <span className={'status-pill ' + c.status}>{c.status === 'pending' ? 'در انتظار پاسخ' : 'رد شد'}</span>
        ) : (
          <MatchRing score={score} size={50} />
        )}
      </div>
      {c.note && seg !== 'team' && <p className="req-note">{c.note}</p>}

      {seg === 'in' && (
        <div className="card-actions" style={{ marginTop: 12 }}>
          <button
            className="btn primary sm"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              await s.respond(c.id, true)
            }}
          >
            <Check size={17} /> قبول همکاری
          </button>
          <button
            className="btn ghost sm"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              await s.respond(c.id, false)
            }}
          >
            <X size={17} /> رد
          </button>
        </div>
      )}

      {seg === 'team' && (
        <div className="contact-box" style={{ marginTop: 12 }}>
          {other.contact.telegram && (
            <div className="line">
              <span style={{ color: '#2aa3df', fontWeight: 800 }}>تلگرام</span>
              <span className="ltr">@{other.contact.telegram}</span>
              <button
                className="icon-btn"
                style={{ width: 32, height: 32 }}
                onClick={() => {
                  navigator.clipboard?.writeText('@' + other.contact.telegram)
                  s.showToast('آیدی کپی شد')
                }}
              >
                <Copy size={16} />
              </button>
            </div>
          )}
          {other.contact.instagram && (
            <div className="line">
              <span style={{ color: '#d62976', fontWeight: 800 }}>اینستاگرام</span>
              <span className="ltr">@{other.contact.instagram}</span>
            </div>
          )}
          {!other.contact.telegram && !other.contact.instagram && <div className="line">راه ارتباطی ثبت نکرده</div>}
        </div>
      )}
    </motion.div>
  )
}
