import { motion } from 'framer-motion'

// The Hills mark: three rounded pillars whose white fill rises left → right.
const PILLARS = [
  { x: 0, fill: 0.67 },
  { x: 11.6, fill: 0.84 },
  { x: 23.2, fill: 1 },
]
const W = 10
const H = 28

export function HillsMark({ size = 28, animate = false, gray = '#c9c3d6' }: { size?: number; animate?: boolean; gray?: string }) {
  return (
    <svg width={(size * 33.2) / H} height={size} viewBox={`0 0 33.2 ${H}`} aria-label="Hills" role="img" style={{ flex: 'none', direction: 'ltr' }}>
      {PILLARS.map((p, i) => {
        const h = H * p.fill
        return (
          <g key={i}>
            {p.fill < 1 && <rect x={p.x} y={0} width={W} height={H} rx={W / 2} fill={gray} />}
            <motion.rect
              x={p.x}
              width={W}
              rx={W / 2}
              fill="#fff"
              initial={animate ? { y: H - W, height: W } : false}
              animate={{ y: H - h, height: h }}
              transition={{ delay: animate ? 0.25 + i * 0.14 : 0, duration: 0.7, ease: [0.2, 0.9, 0.3, 1] }}
            />
          </g>
        )
      })}
    </svg>
  )
}

export function HillsIcon({ size = 44, radius }: { size?: number; radius?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius ?? size * 0.3,
        background: 'linear-gradient(135deg, #9a66ff, #6a28dc)',
        display: 'grid',
        placeItems: 'center',
        flex: 'none',
        boxShadow: '0 6px 20px rgba(120, 60, 240, 0.35)',
      }}
    >
      <HillsMark size={size * 0.42} />
    </div>
  )
}

export function Wordmark({ size = 18 }: { size?: number }) {
  return (
    <span
      style={{
        fontFamily: "'Segoe UI', Arial, sans-serif",
        fontWeight: 800,
        fontSize: size,
        letterSpacing: '0.06em',
        direction: 'ltr',
      }}
    >
      HILLS
    </span>
  )
}

export function Verified({ size = 16 }: { size?: number }) {
  return (
    <svg className="verified" width={size} height={size} viewBox="0 0 24 24" aria-label="تأییدشده">
      <defs>
        <linearGradient id="vgrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d33bff" />
          <stop offset="1" stopColor="#8a56ff" />
        </linearGradient>
      </defs>
      <path
        fill="url(#vgrad)"
        d="M12 1.5l2.4 1.8 3-.3 1.1 2.8 2.8 1.1-.3 3 1.8 2.4-1.8 2.4.3 3-2.8 1.1-1.1 2.8-3-.3L12 22.5l-2.4-1.8-3 .3-1.1-2.8-2.8-1.1.3-3L1.2 12l1.8-2.4-.3-3 2.8-1.1 1.1-2.8 3 .3z"
      />
      <path d="M7.8 12.3l2.8 2.7 5.6-5.8" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Brand glyphs (lucide no longer ships logos).
const glyph = (d: React.ReactNode) =>
  function Glyph({ size = 18 }: { size?: number }) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {d}
      </svg>
    )
  }

export const InstagramGlyph = glyph(
  <>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
  </>,
)
export const YoutubeGlyph = glyph(
  <>
    <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
    <path d="M10 9.5l5 2.5-5 2.5z" fill="currentColor" />
  </>,
)
export const LinkedinGlyph = glyph(
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7" />
  </>,
)
