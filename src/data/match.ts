// Matching: a transparent scoring model (no black box) — every point comes with
// a human-readable reason shown on the member card.

import type { Member, Opportunity } from './types'
import { CITIES, NICHES, SKILL_CATALOG, EXTRA_LOOKING } from './seed'

export interface Match {
  score: number
  reasons: string[]
}

const DAY = 86_400_000

export function matchMembers(me: Member, other: Member): Match {
  const reasons: string[] = []
  let points = 0

  const theyOffer = other.skills.filter((s) => me.lookingFor.includes(s))
  theyOffer.slice(0, 2).forEach((s, i) => {
    points += i ? 14 : 24
    reasons.push(`${s} بلده — همون چیزی که دنبالشی`)
  })

  const iOffer = me.skills.filter((s) => other.lookingFor.includes(s))
  iOffer.slice(0, 2).forEach((s, i) => {
    points += i ? 8 : 14
    reasons.push(`دنبال ${s}ه و تو بلدی`)
  })

  if (me.lookingFor.includes('منتور') && other.role === 'mentor') {
    points += 18
    reasons.push('منتور هیلزه')
  }
  if (me.lookingFor.includes('هم‌تیمی لایو') && other.skills.includes('لایو')) {
    points += 12
    reasons.push('اهل لایو مشترکه')
  }

  const niches = other.niches.filter((n) => me.niches.includes(n))
  if (niches.length) {
    points += 8 + (niches.length - 1) * 4
    reasons.push(`هر دو در حوزه‌ی ${niches[0]}`)
  }
  if (other.city === me.city) {
    points += 10
    reasons.push(`هر دو در ${me.city}`)
  }
  if (other.collab === 'open') points += 5
  if (other.collab === 'hiring' && iOffer.length) {
    points += 6
    reasons.push('الان دنبال نیروئه')
  }
  if (Date.now() - other.lastActive < 3 * DAY) points += 4
  if (other.launch === me.launch) points += 2

  const score = points ? Math.min(98, Math.round(38 + points * 0.72)) : 12 + (other.id.length * 7) % 18
  return { score, reasons: reasons.slice(0, 3) }
}

export function opportunityFit(me: Member, o: Opportunity): number {
  if (!o.skills.length) return 0
  const hit = o.skills.filter((s) => me.skills.includes(s)).length
  if (!hit) return 0
  let s = 55 + (hit / o.skills.length) * 35
  if (o.remote || o.city === me.city) s += 8
  return Math.min(97, Math.round(s))
}

export function profileCompleteness(m: Member): { pct: number; missing: string[] } {
  const checks: [boolean, string][] = [
    [!!m.avatar, 'عکس پروفایل'],
    [m.bio.trim().length > 20, 'بیوی کامل'],
    [m.skills.length >= 2, 'حداقل ۲ مهارت'],
    [m.lookingFor.length >= 1, 'اینکه دنبال چی هستی'],
    [m.niches.length >= 1, 'حوزه‌ی محتوا'],
    [Object.keys(m.platforms).length >= 1, 'یک پلتفرم'],
    [!!(m.contact.telegram || m.contact.instagram), 'راه ارتباطی'],
    [m.portfolio.length >= 1, 'نمونه‌کار'],
  ]
  const done = checks.filter(([ok]) => ok).length
  return { pct: Math.round((done / checks.length) * 100), missing: checks.filter(([ok]) => !ok).map(([, l]) => l) }
}

export const allSkillNames = () => Object.values(SKILL_CATALOG).flat()

// Smart search ------------------------------------------------------------------

const SYNONYMS: [RegExp, string][] = [
  [/تدوین|ادیت|ادیتور/, 'تدوین'],
  [/موشن|انیمیشن|اینترو/, 'موشن‌گرافیک'],
  [/فیلمبردار|فیلم‌بردار|تصویربردار|دوربین/, 'فیلمبرداری'],
  [/تامنیل|thumbnail/i, 'طراحی تامنیل'],
  [/کاور/, 'کاور ریلز'],
  [/لوگو|برند|هویت بصری/, 'برندینگ'],
  [/عکاس|عکس/, 'عکاسی'],
  [/سناریو|فیلمنامه|اسکریپت/, 'سناریونویسی'],
  [/کپی|متن فروش/, 'کپی‌رایتینگ'],
  [/کپشن/, 'کپشن‌نویسی'],
  [/ادمین|مدیر پیج|مدیریت پیج/, 'مدیریت پیج'],
  [/استراتژی/, 'استراتژی محتوا'],
  [/تبلیغ|مارکتینگ/, 'تبلیغات'],
  [/سئو|seo/i, 'سئوی یوتیوب'],
  [/مجری|اجرا|جلوی دوربین/, 'اجرا جلوی دوربین'],
  [/گوینده|صداپیشه|گویندگی|ویس/, 'گویندگی'],
  [/صدا|میکس/, 'صداگذاری'],
  [/لایو|live/i, 'لایو'],
  [/هوش مصنوعی|ai\b|AI/, 'هوش مصنوعی'],
  [/سایت|وب/, 'سایت‌سازی'],
  [/رنگ/, 'رنگ‌بندی'],
]

export interface ParsedQuery {
  skills: string[]
  cities: string[]
  niches: string[]
  mentor: boolean
  open: boolean
  rest: string
}

export function parseQuery(q: string): ParsedQuery {
  const text = q.trim()
  const skills = new Set<string>()
  for (const [re, skill] of SYNONYMS) if (re.test(text)) skills.add(skill)
  for (const s of [...allSkillNames(), ...EXTRA_LOOKING]) if (text.includes(s)) skills.add(s)
  const cities = CITIES.filter((c) => text.includes(c))
  const niches = NICHES.filter((n) => text.includes(n) || (n === 'آشپزی' && /آشپز|غذا/.test(text)) || (n === 'فیتنس' && /ورزش|باشگاه/.test(text)))
  const mentor = /منتور|مربی|استاد/.test(text)
  const open = /آزاد|آماده|همکاری/.test(text)
  let rest = text
  for (const w of [...cities, ...niches]) rest = rest.replace(w, '')
  return { skills: [...skills], cities, niches, mentor, open, rest: rest.replace(/\s+/g, ' ').trim() }
}

export function searchMembers(members: Member[], q: string, me: Member) {
  const p = parseQuery(q)
  const structured = p.skills.length || p.cities.length || p.niches.length || p.mentor
  const words = p.rest.split(' ').filter((w) => w.length > 1)
  return members
    .map((m) => {
      let s = 0
      s += p.skills.filter((x) => m.skills.includes(x)).length * 30
      if (p.cities.includes(m.city)) s += 20
      s += p.niches.filter((x) => m.niches.includes(x)).length * 15
      if (p.mentor && m.role === 'mentor') s += 30
      if (p.open && m.collab !== 'busy') s += 5
      if (!structured) {
        const hay = [m.name, m.username, m.headline, m.bio, ...m.skills, ...m.niches, m.city].join(' ')
        s += words.filter((w) => hay.includes(w)).length * 12
      }
      if (structured && p.skills.length && !p.skills.some((x) => m.skills.includes(x))) s = 0
      if (structured && p.cities.length && !p.cities.includes(m.city)) s = Math.min(s, 0)
      return { m, s: s ? s + matchMembers(me, m).score / 10 : 0 }
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.m)
}
