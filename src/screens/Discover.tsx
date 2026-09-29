import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import { Check, Handshake, Info, MapPin, RotateCcw, Search, Sparkles, Star, X } from 'lucide-react'
import type { Member } from '../data/types'
import { matchMembers, parseQuery, searchMembers } from '../data/match'
import { connectionWith, useMe, useStore } from '../store'
import * as api from '../data/api'
import { compact, faNum } from '../lib/format'
import { Avatar, COLLAB_LABEL, Empty, MatchRing, MemberCard, coverStyle } from '../components/ui'
import { Verified } from '../components/Brand'

export function Discover() {
  const [mode, setMode] = useState<'deck' | 'search'>('deck')
  return (
    <>
      <header className="page-head">
        <h1>
          کشف و مچ
          <span className="sub">اعضایی که بیشترین هم‌خوانی رو با تو دارن</span>
        </h1>
      </header>
      <div className="segmented" style={{ maxWidth: 420 }}>
        {(
          [
            ['deck', 'مچ سریع', Sparkles],
            ['search', 'جستجوی هوشمند', Search],
          ] as const
        ).map(([id, label, Icon]) => (
          <button key={id} className={mode === id ? 'active' : ''} onClick={() => setMode(id)}>
            {mode === id && <motion.span layoutId="disc-seg" className="seg-bg" />}
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>
      {mode === 'deck' ? <Deck /> : <SmartSearch />}
    </>
  )
}

// Swipe deck ----------------------------------------------------------------------

function Deck() {
  const me = useMe()
  const db = useStore((s) => s.db)
  const [gone, setGone] = useState<string[]>([])
  const [dir, setDir] = useState(1)

  const queue = useMemo(() => {
    if (!me) return []
    const passed = new Set(db.passed[me.id] ?? [])
    return Object.values(db.members)
      .filter((m) => m.id !== me.id && !m.suspended && !passed.has(m.id) && !connectionWith(db, me.id, m.id))
      .map((m) => ({ m, match: matchMembers(me, m) }))
      .sort((a, b) => b.match.score - a.match.score)
  }, [me, db])

  if (!me) return null
  const visible = queue.filter((x) => !gone.includes(x.m.id)).slice(0, 3)

  const decide = (m: Member, yes: boolean) => {
    setDir(yes ? 1 : -1)
    setGone((g) => [...g, m.id])
    if (yes) useStore.getState().connect(m.id)
    else useStore.getState().pass(m.id)
  }

  if (!visible.length)
    return (
      <Empty
        icon={Sparkles}
        title="همه‌ی مچ‌های امروز رو دیدی"
        text="فردا مچ‌های تازه برات میاد. تا اون موقع می‌تونی با جستجوی هوشمند دنبال آدم مناسب بگردی."
        action={
          <button
            className="btn soft"
            onClick={() => {
              void api.resetPassed(me.id)
              setGone([])
            }}
          >
            <RotateCcw size={17} /> دوباره از اول
          </button>
        }
      />
    )

  const top = visible[0]
  return (
    <>
      <div className="deck">
        <AnimatePresence custom={dir}>
          {[...visible].reverse().map(({ m, match }, i, arr) => {
            const depth = arr.length - 1 - i
            return <SwipeCard key={m.id} m={m} score={match.score} reasons={match.reasons} depth={depth} onDecide={(yes) => decide(m, yes)} />
          })}
        </AnimatePresence>
      </div>
      <div className="deck-actions">
        <button className="round info" onClick={() => useStore.getState().openProfile(top.m.id)} aria-label="پروفایل">
          <Info size={24} />
        </button>
        <button className="round yes" onClick={() => decide(top.m, true)} aria-label="درخواست همکاری">
          <Handshake size={32} />
        </button>
        <button className="round no" onClick={() => decide(top.m, false)} aria-label="رد کردن">
          <X size={28} strokeWidth={2.6} />
        </button>
      </div>
      <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--text-3)', margin: '6px 0 0' }}>
        بکش به راست برای درخواست همکاری · به چپ برای رد کردن
      </p>
    </>
  )
}

function SwipeCard({
  m, score, reasons, depth, onDecide,
}: {
  m: Member
  score: number
  reasons: string[]
  depth: number
  onDecide: (yes: boolean) => void
}) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-220, 220], [-14, 14])
  const yesOpacity = useTransform(x, [30, 120], [0, 1])
  const noOpacity = useTransform(x, [-120, -30], [1, 0])
  const top = depth === 0
  const followers = Math.max(0, ...Object.values(m.platforms).map((p) => p?.followers ?? 0))

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 110 || info.velocity.x > 700) onDecide(true)
    else if (info.offset.x < -110 || info.velocity.x < -700) onDecide(false)
  }

  return (
    <motion.div
      className="swipe"
      style={{ x, rotate, zIndex: 10 - depth }}
      initial={{ scale: 0.9, y: 30, opacity: 0 }}
      animate={{ scale: 1 - depth * 0.05, y: depth * 16, opacity: 1 }}
      variants={{ gone: (d: number) => ({ x: d * 600, rotate: d * 18, opacity: 0, transition: { duration: 0.32 } }) }}
      exit="gone"
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      drag={top ? 'x' : false}
      dragSnapToOrigin
      onDragEnd={onDragEnd}
    >
      {top && (
        <>
          <motion.div className="stamp yes" style={{ opacity: yesOpacity }}>
            همکاری 🤝
          </motion.div>
          <motion.div className="stamp no" style={{ opacity: noOpacity }}>
            بعداً
          </motion.div>
        </>
      )}
      <div className="swipe-cover" style={coverStyle(m.color * 3 + m.name.length)}>
        <Avatar m={m} size={118} />
        <MatchRing score={score} size={66} />
      </div>
      <div className="swipe-body">
        <div>
          <div className="mcard-name" style={{ fontSize: 21 }}>
            {m.name}
            {m.verified && <Verified size={18} />}
          </div>
          <div className="mcard-headline" style={{ fontSize: 14.5 }}>
            {m.headline}
          </div>
          <div className="meta-line" style={{ marginTop: 6 }}>
            <span>
              <MapPin size={13} /> {m.city}
            </span>
            {followers > 0 && <span>{compact(followers)} دنبال‌کننده</span>}
            <span>لانچ {faNum(m.launch)}</span>
            <span style={{ color: m.collab === 'open' ? 'var(--online)' : m.collab === 'hiring' ? 'var(--warn)' : undefined }}>{COLLAB_LABEL[m.collab]}</span>
          </div>
        </div>
        <div className="reasons">
          {reasons.map((r) => (
            <div key={r} className="reason">
              <Check size={14} strokeWidth={3} /> {r}
            </div>
          ))}
        </div>
        <div className="chips">
          {m.role === 'mentor' && (
            <span className="chip mentor">
              <Star size={12} fill="currentColor" /> منتور
            </span>
          )}
          {m.skills.map((s) => (
            <span key={s} className="chip">
              {s}
            </span>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {m.bio}
        </p>
      </div>
    </motion.div>
  )
}

// Smart search --------------------------------------------------------------------

const SUGGESTIONS = ['تدوینگر ریلز در تهران', 'طراح تامنیل', 'منتور یوتیوب', 'فیلمبردار اصفهان', 'هم‌تیمی لایو آموزش زبان', 'گوینده برای پادکست']
const QUICK = ['همه', 'منتورها', 'آماده‌ی همکاری', 'هم‌شهری من', 'لانچ من'] as const

function SmartSearch() {
  const me = useMe()
  const members = useStore((s) => s.db.members)
  const [q, setQ] = useState('')
  const [quick, setQuick] = useState<(typeof QUICK)[number]>('همه')

  const results = useMemo(() => {
    if (!me) return []
    let list = Object.values(members).filter((m) => m.id !== me.id && !m.suspended)
    if (quick === 'منتورها') list = list.filter((m) => m.role === 'mentor')
    if (quick === 'آماده‌ی همکاری') list = list.filter((m) => m.collab !== 'busy')
    if (quick === 'هم‌شهری من') list = list.filter((m) => m.city === me.city)
    if (quick === 'لانچ من') list = list.filter((m) => m.launch === me.launch)
    if (q.trim()) return searchMembers(list, q, me)
    return list.sort((a, b) => matchMembers(me, b).score - matchMembers(me, a).score)
  }, [members, me, q, quick])

  if (!me) return null
  const parsed = q.trim() ? parseQuery(q) : undefined
  const understood = parsed && [...parsed.skills.map((s) => '🎯 ' + s), ...parsed.cities.map((c) => '📍 ' + c), ...parsed.niches.map((n) => '🏷 ' + n), ...(parsed.mentor ? ['⭐ منتور'] : [])]

  return (
    <>
      <div className="smart">
        <Sparkles className="spark" size={20} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="به زبان خودت بگو دنبال کی هستی… مثلاً «تدوینگر ریلز در تهران»" />
        {q && (
          <button className="icon-btn side" onClick={() => setQ('')}>
            <X size={18} />
          </button>
        )}
      </div>
      {understood && understood.length > 0 ? (
        <div className="parsed">
          فهمیدم دنبال:
          {understood.map((u) => (
            <span key={u} className="chip accent">
              {u}
            </span>
          ))}
        </div>
      ) : (
        !q && (
          <div className="suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => setQ(s)}>
                {s}
              </button>
            ))}
          </div>
        )
      )}
      <div className="filters" style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {QUICK.map((f) => (
          <button key={f} className={'pick' + (quick === f ? ' on' : '')} onClick={() => setQuick(f)}>
            {f}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 2px 10px', fontWeight: 600 }}>
        {faNum(results.length)} نتیجه {q ? 'به ترتیب مرتبط‌ترین' : 'به ترتیب بیشترین مچ'}
      </div>
      {results.length ? (
        <div className="grid auto">
          <AnimatePresence initial={false}>
            {results.map((m) => (
              <MemberCard key={m.id} m={m} me={me} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <Empty icon={Search} title="کسی پیدا نشد" text="یه جور دیگه بگو، یا فیلترها رو بردار. مثلاً «طراح» یا «فیلمبردار»." />
      )}
    </>
  )
}
