const DAY = 86_400_000

export const faNum = (n: number) => n.toLocaleString('fa-IR')

export const toFaDigits = (s: string) => s.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])

export const toEnDigits = (s: string) =>
  s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))

const timeFmt = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false })
const weekdayFmt = new Intl.DateTimeFormat('fa-IR', { weekday: 'long' })
const shortDateFmt = new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long' })
const fullDateFmt = new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long', year: 'numeric' })

export const formatTime = (t: number) => timeFmt.format(t)

const startOfDay = (t: number) => {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function formatDay(t: number) {
  const diff = Math.round((startOfDay(Date.now()) - startOfDay(t)) / DAY)
  if (diff === 0) return 'امروز'
  if (diff === 1) return 'دیروز'
  if (diff < 7) return weekdayFmt.format(t)
  return new Date(t).getFullYear() === new Date().getFullYear() ? shortDateFmt.format(t) : fullDateFmt.format(t)
}

export function formatListTime(t: number) {
  const diff = Math.round((startOfDay(Date.now()) - startOfDay(t)) / DAY)
  if (diff === 0) return formatTime(t)
  if (diff === 1) return 'دیروز'
  if (diff < 7) return weekdayFmt.format(t)
  return shortDateFmt.format(t)
}

export const sameDay = (a: number, b: number) => startOfDay(a) === startOfDay(b)

export function lastSeenText(t: number, online?: boolean) {
  if (online) return 'آنلاین'
  const mins = Math.floor((Date.now() - t) / 60_000)
  if (mins < 1) return 'لحظاتی پیش آنلاین بود'
  if (mins < 60) return `${faNum(mins)} دقیقه پیش آنلاین بود`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${faNum(hours)} ساعت پیش آنلاین بود`
  return 'اخیراً آنلاین بود'
}

export function compact(n: number) {
  if (n >= 1_000_000) return faNum(Math.round(n / 100_000) / 10) + 'M'
  if (n >= 1000) return faNum(Math.round(n / 100) / 10) + 'K'
  return faNum(n)
}

export function fileSize(bytes = 0) {
  if (bytes < 1024) return faNum(bytes) + ' بایت'
  if (bytes < 1024 * 1024) return faNum(Math.round(bytes / 102.4) / 10) + ' کیلوبایت'
  return faNum(Math.round(bytes / 104857.6) / 10) + ' مگابایت'
}

export function duration(sec = 0) {
  const s = Math.max(0, Math.round(sec))
  return toFaDigits(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`)
}

export function plural(n: number, word: string) {
  return `${faNum(n)} ${word}`
}

export const initials = (name: string) =>
  name
    .replace(/[^\p{L}\s]/gu, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('‌')
