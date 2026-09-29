import { motion } from 'framer-motion'
import { BadgeCheck, Camera, Check, Clapperboard, Image as ImageIcon, MapPin, Mic, Palette, Play, Sparkles, Star } from 'lucide-react'
import type { Member, PortfolioItem } from '../data/types'
import { peerGradient } from '../lib/colors'
import { compact, faNum, initials } from '../lib/format'
import { matchMembers } from '../data/match'
import { useStore } from '../store'
import { Verified } from './Brand'

export function Avatar({ m, size = 48, online, onClick }: { m?: Pick<Member, 'name' | 'color' | 'avatar'>; size?: number; online?: boolean; onClick?: () => void }) {
  return (
    <div className="avatar" style={{ width: size, height: size, cursor: onClick ? 'pointer' : undefined }} onClick={onClick}>
      <div className="face" style={{ background: peerGradient(m?.color ?? 2) }}>
        {m?.avatar ? <img src={m.avatar} alt="" draggable={false} /> : <span style={{ fontSize: size * 0.38, lineHeight: 1 }}>{initials(m?.name ?? '')}</span>}
      </div>
      {online && <span className="dot" />}
    </div>
  )
}

export const isOnline = (m: Member) => Date.now() - m.lastActive < 2 * 3600_000

export function MatchRing({ score, size = 54, label = 'مچ' }: { score: number; size?: number; label?: string }) {
  const r = size / 2 - 4
  const c = 2 * Math.PI * r
  const color = score >= 75 ? '#3fe08a' : score >= 55 ? '#b36bff' : '#8e84a9'
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth={4} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - score / 100) }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </svg>
      <div>
        <b>{faNum(score)}٪</b>
        {label && <small>{label}</small>}
      </div>
    </div>
  )
}

/** Deterministic abstract artwork — stands in for portfolio thumbnails and profile covers. */
const COVER_HUES = [262, 286, 306, 326, 214, 238, 342, 190]

export function coverStyle(seed: number, alt = 0): React.CSSProperties {
  const i = Math.abs(Math.round(seed)) % COVER_HUES.length
  const h1 = COVER_HUES[i]
  const h2 = COVER_HUES[(i + 3 + alt) % COVER_HUES.length]
  return {
    background: `radial-gradient(120% 90% at 100% 0%, hsl(${h1} 88% 62% / .95), transparent 60%),
      radial-gradient(120% 100% at 0% 100%, hsl(${h2} 80% 56% / .95), transparent 65%),
      linear-gradient(135deg, hsl(${h1} 55% 22%), hsl(${h2} 50% 16%))`,
  }
}

const KIND_ICON = { reels: Play, video: Clapperboard, design: Palette, photo: Camera, podcast: Mic }
const KIND_LABEL = { reels: 'ریلز', video: 'ویدیو', design: 'طراحی', photo: 'عکاسی', podcast: 'پادکست' }

export function PortfolioTile({ p }: { p: PortfolioItem }) {
  const Icon = KIND_ICON[p.kind] ?? ImageIcon
  return (
    <div className="pf" style={coverStyle(p.hue)}>
      <Icon className="pf-ico" size={20} />
      <div>
        <div style={{ fontSize: 11, opacity: 0.8 }}>{KIND_LABEL[p.kind]}</div>
        {p.title}
      </div>
    </div>
  )
}

export const COLLAB_LABEL = { open: 'آماده‌ی همکاری', busy: 'فعلاً مشغول', hiring: 'دنبال نیرو' } as const

export function MemberCard({ m, me, compactCard }: { m: Member; me: Member; compactCard?: boolean }) {
  const { score, reasons } = matchMembers(me, m)
  const openProfile = useStore((s) => s.openProfile)
  const topFollowers = Math.max(0, ...Object.values(m.platforms).map((p) => p?.followers ?? 0))
  return (
    <motion.button
      layout
      className="card mcard"
      onClick={() => openProfile(m.id)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <div className="mcard-top">
        <Avatar m={m} size={56} online={isOnline(m)} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="mcard-name">
            <span className="ellipsis">{m.name}</span>
            {m.verified && <Verified size={16} />}
          </div>
          <div className="mcard-headline ellipsis">{m.headline}</div>
          <div className="meta-line" style={{ marginTop: 4 }}>
            <span>
              <MapPin size={13} /> {m.city}
            </span>
            {topFollowers > 0 && <span>{compact(topFollowers)} دنبال‌کننده</span>}
          </div>
        </div>
        <MatchRing score={score} />
      </div>
      {!compactCard && reasons.length > 0 && (
        <div className="reasons">
          {reasons.slice(0, 2).map((r) => (
            <div key={r} className="reason">
              <Check size={14} strokeWidth={3} /> {r}
            </div>
          ))}
        </div>
      )}
      <div className="chips">
        {m.role === 'mentor' && (
          <span className="chip mentor">
            <Star size={12} fill="currentColor" /> منتور
          </span>
        )}
        {m.skills.slice(0, compactCard ? 2 : 3).map((s) => (
          <span key={s} className="chip">
            {s}
          </span>
        ))}
      </div>
    </motion.button>
  )
}

export function Empty({ icon: Icon = Sparkles, title, text, action }: { icon?: typeof Sparkles; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="empty">
      <div className="big">
        <Icon size={34} />
      </div>
      <h3>{title}</h3>
      {text && <div style={{ fontSize: 14, lineHeight: 1.8, maxWidth: 320 }}>{text}</div>}
      {action}
    </div>
  )
}

export function SkillPicker({ groups, value, onChange, max }: { groups: Record<string, string[]>; value: string[]; onChange: (v: string[]) => void; max?: number }) {
  const toggle = (s: string) => {
    if (value.includes(s)) onChange(value.filter((x) => x !== s))
    else if (!max || value.length < max) onChange([...value, s])
  }
  return (
    <div>
      {Object.entries(groups).map(([g, items]) => (
        <div key={g} className="picker-group">
          <h5>{g}</h5>
          <div className="chips" style={{ gap: 7 }}>
            {items.map((s) => (
              <button key={s} type="button" className={'pick' + (value.includes(s) ? ' on' : '')} onClick={() => toggle(s)}>
                {value.includes(s) && <Check size={14} strokeWidth={3} />}
                {s}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function VerifiedMark() {
  return <BadgeCheck size={16} />
}

export const AUTHOR = {
  name: 'سید احسان هاشمی',
  url: 'https://my-personal-site-rho-one.vercel.app/',
  telegram: 'https://t.me/EhsanHashemi_1453',
  telegramHandle: 'EhsanHashemi_1453',
}

/** Maker credit, linked to the author's personal site and Telegram. */
export function Credit({ variant = 'line' }: { variant?: 'line' | 'card' }) {
  if (variant === 'card')
    return (
      <div className="credit-card">
        <span className="credit-ico">
          <Sparkles size={18} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className="credit-k">طراحی و توسعه</span>
          <span className="credit-v">{AUTHOR.name}</span>
        </span>
        <span className="credit-links">
          <a href={AUTHOR.url} target="_blank" rel="noopener">
            سایت
          </a>
          <a href={AUTHOR.telegram} target="_blank" rel="noopener">
            تلگرام
          </a>
        </span>
      </div>
    )
  return (
    <span className="credit">
      طراحی و توسعه:{' '}
      <a href={AUTHOR.url} target="_blank" rel="noopener">
        <b>{AUTHOR.name}</b>
      </a>
      <span className="credit-sep">·</span>
      <a href={AUTHOR.telegram} target="_blank" rel="noopener" className="credit-tg">
        تلگرام
      </a>
    </span>
  )
}
