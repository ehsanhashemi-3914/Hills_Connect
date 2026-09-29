import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Bell, CalendarDays, ChevronLeft, MapPin, Megaphone, Moon, Sun, Users } from 'lucide-react'
import { useMe, useStore } from '../store'
import * as api from '../data/api'
import { matchMembers, opportunityFit, profileCompleteness } from '../data/match'
import { compact, faNum } from '../lib/format'
import { Avatar, Credit, MatchRing, MemberCard } from '../components/ui'
import { OppCard } from './Opportunities'

const dayFmt = new Intl.DateTimeFormat('fa-IR', { day: 'numeric' })
const monFmt = new Intl.DateTimeFormat('fa-IR', { month: 'short' })
const whenFmt = new Intl.DateTimeFormat('fa-IR', { weekday: 'long', hour: '2-digit', minute: '2-digit' })

export function Home() {
  const me = useMe()
  const db = useStore((s) => s.db)
  const theme = useStore((s) => s.theme)
  const s = useStore.getState()

  const matches = useMemo(() => {
    if (!me) return []
    return Object.values(db.members)
      .filter((m) => m.id !== me.id && !m.suspended)
      .map((m) => ({ m, score: matchMembers(me, m).score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
  }, [db.members, me])

  if (!me) return null
  const { pct, missing } = profileCompleteness(me)
  const unread = (db.notifications[me.id] ?? []).filter((n) => !n.read).length
  const opps = db.opportunities
    .filter((o) => o.status === 'approved' && o.authorId !== me.id)
    .map((o) => ({ o, fit: opportunityFit(me, o) }))
    .sort((a, b) => b.fit - a.fit)
    .slice(0, 3)
  const featured = Object.values(db.members).filter((m) => m.featured && !m.suspended && m.id !== me.id)
  const activeOpps = db.opportunities.filter((o) => o.status === 'approved').length
  const strong = matches.filter((x) => x.score >= 70).length

  return (
    <>
      <header className="page-head">
        <h1>
          سلام {me.name.split(' ')[0]} 👋
          <span className="sub">امروز {faNum(strong)} مچ قوی برات پیدا کردیم</span>
        </h1>
        <div className="actions">
          <button className="icon-btn" onClick={() => s.setTheme(theme === 'dark' ? 'light' : 'dark')} title="تغییر تم">
            {theme === 'dark' ? <Sun size={21} /> : <Moon size={21} />}
          </button>
          <button className="icon-btn bell" onClick={() => s.openSheet('notifications')} title="اعلان‌ها">
            <Bell size={21} />
            {unread > 0 && <span className="dot-badge">{faNum(unread)}</span>}
          </button>
          <Avatar m={me} size={40} onClick={() => s.setTab('profile')} />
        </div>
      </header>

      {db.platform.announcement.enabled && (
        <motion.div className="banner" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
          <Megaphone size={20} />
          <span>{db.platform.announcement.text}</span>
        </motion.div>
      )}

      <div className="grid two">
        <div className="hero" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ background: 'rgba(0,0,0,.25)', borderRadius: '50%', color: '#fff' }}>
            <MatchRing score={pct} size={86} label="پروفایل" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>{pct === 100 ? 'پروفایلت کامله ✨' : 'پروفایل کامل‌تر = مچ‌های بهتر'}</div>
            <div style={{ fontSize: 13.5, opacity: 0.85, lineHeight: 1.8 }}>
              {pct === 100 ? 'حالا بیشترین شانس رو برای دیده شدن توسط اعضا و صاحبان فرصت‌ها داری.' : `مونده: ${missing.slice(0, 3).join('، ')}`}
            </div>
            {pct < 100 && (
              <button className="btn sm" style={{ marginTop: 10, background: '#fff', color: '#5b21b6' }} onClick={() => s.openSheet('edit')}>
                تکمیل پروفایل
              </button>
            )}
          </div>
        </div>
        <div className="stats" style={{ alignContent: 'stretch' }}>
          <div className="stat" style={{ display: 'grid', placeContent: 'center' }}>
            <b>{compact(db.totals.members)}</b>
            <span>عضو هیلز</span>
          </div>
          <div className="stat" style={{ display: 'grid', placeContent: 'center' }}>
            <b>{faNum(db.totals.collabs)}</b>
            <span>همکاری موفق</span>
          </div>
          <div className="stat" style={{ display: 'grid', placeContent: 'center' }}>
            <b>{faNum(activeOpps)}</b>
            <span>فرصت فعال</span>
          </div>
        </div>
      </div>

      <div className="section">
        <h2>مچ‌های امروز تو</h2>
        <button className="more" onClick={() => s.setTab('discover')}>
          همه <ChevronLeft size={15} style={{ verticalAlign: -3 }} />
        </button>
      </div>
      <div className="carousel">
        {matches.map(({ m }) => (
          <MemberCard key={m.id} m={m} me={me} />
        ))}
      </div>

      <div className="section">
        <h2>فرصت‌های مناسب تو</h2>
        <button className="more" onClick={() => s.setTab('opps')}>
          همه <ChevronLeft size={15} style={{ verticalAlign: -3 }} />
        </button>
      </div>
      <div className="grid auto">
        {opps.map(({ o, fit }) => (
          <OppCard key={o.id} o={o} fit={fit} />
        ))}
      </div>

      <div className="section">
        <h2>رویدادهای پیش‌رو</h2>
      </div>
      <div className="grid three">
        {db.events.map((e) => {
          const going = e.going.includes(me.id)
          const host = db.members[e.host]
          return (
            <div key={e.id} className="card event">
              <div className="event-date">
                <b>{dayFmt.format(e.at)}</b>
                <span>{monFmt.format(e.at)}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4>{e.title}</h4>
                <div className="meta-line">
                  <span>
                    <CalendarDays size={13} /> {whenFmt.format(e.at)}
                  </span>
                  <span>
                    <MapPin size={13} /> {e.place}
                  </span>
                </div>
                <div className="meta-line" style={{ marginTop: 8, justifyContent: 'space-between' }}>
                  <span>
                    <Users size={13} /> {faNum(e.baseGoing + e.going.length)} نفر میان
                    {host && ` · میزبان: ${host.name}`}
                  </span>
                  <button
                    className={'btn sm ' + (going ? 'soft' : 'primary')}
                    style={{ height: 32, padding: '0 12px' }}
                    onClick={() => {
                      void api.rsvp(me.id, e.id)
                      if (!going) s.showToast('ثبت شد! یادآوری قبل از رویداد برات میاد 🔔')
                    }}
                  >
                    {going ? 'میام ✓' : 'میام'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {featured.length > 0 && (
        <>
          <div className="section">
            <h2>اعضای ویژه‌ی این هفته</h2>
          </div>
          <div className="grid auto">
            {featured.map((m) => (
              <MemberCard key={m.id} m={m} me={me} compactCard />
            ))}
          </div>
        </>
      )}

      <div className="credit-wrap">
        <Credit />
      </div>
    </>
  )
}
