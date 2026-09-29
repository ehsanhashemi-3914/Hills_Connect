import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity, BadgeCheck, Ban, Check, Download, GraduationCap, Handshake, Lightbulb, Megaphone, Plus, Search, Star, Trash2, TrendingUp, Users, X,
} from 'lucide-react'
import type { CustomField, Member } from '../data/types'
import * as api from '../data/api'
import { useStore } from '../store'
import { compact, faNum, formatListTime } from '../lib/format'
import { Avatar, Empty } from '../components/ui'
import { Verified } from '../components/Brand'
import { OPP_TYPES } from './Opportunities'

type Seg = 'dash' | 'members' | 'moderate' | 'platform'

export function Admin() {
  const [seg, setSeg] = useState<Seg>('dash')
  const pending = useStore((s) => s.db.opportunities.filter((o) => o.status === 'pending').length)
  const SEGS: [Seg, string][] = [
    ['dash', 'داشبورد'],
    ['members', 'اعضا'],
    ['moderate', 'تأیید فرصت‌ها'],
    ['platform', 'تنظیمات پلتفرم'],
  ]
  return (
    <>
      <header className="page-head">
        <h1>
          پنل مدیریت هیلز کانکت
          <span className="sub">نمای تیم هیلز — قابل اتصال به پنل فعلی هیلز</span>
        </h1>
      </header>
      <div className="segmented">
        {SEGS.map(([id, label]) => (
          <button key={id} className={seg === id ? 'active' : ''} onClick={() => setSeg(id)}>
            {seg === id && <motion.span layoutId="admin-seg" className="seg-bg" />}
            {label}
            {id === 'moderate' && pending > 0 && <span className="badge">{faNum(pending)}</span>}
          </button>
        ))}
      </div>
      {seg === 'dash' && <Dashboard />}
      {seg === 'members' && <MembersTable />}
      {seg === 'moderate' && <Moderation />}
      {seg === 'platform' && <PlatformSettings />}
    </>
  )
}

// Dashboard ---------------------------------------------------------------------

function Dashboard() {
  const db = useStore((s) => s.db)
  const members = Object.values(db.members)
  const accepted = db.connections.filter((c) => c.status === 'accepted').length
  const weekAgo = Date.now() - 7 * 86_400_000
  const thisWeek = db.connections.filter((c) => c.createdAt > weekAgo).length
  const weekly = [...db.totals.weekly.slice(0, -1), db.totals.weekly[db.totals.weekly.length - 1] + thisWeek]
  const activeOpps = db.opportunities.filter((o) => o.status === 'approved').length

  const skillStats = useMemo(() => {
    const total = members.length
    const all = new Set(members.flatMap((m) => [...m.skills, ...m.lookingFor]))
    return [...all]
      .map((s) => ({
        skill: s,
        supply: members.filter((m) => m.skills.includes(s)).length / total,
        demand: members.filter((m) => m.lookingFor.includes(s)).length / total,
      }))
      .filter((x) => x.supply > 0 && x.demand > 0)
      .sort((a, b) => b.demand - a.demand)
      .slice(0, 6)
  }, [members])
  const gap = [...skillStats].sort((a, b) => b.demand / b.supply - a.demand / a.supply)[0]
  const maxPct = Math.max(...skillStats.flatMap((x) => [x.supply, x.demand]))

  const launches = db.platform.launches
  const maxLaunch = Math.max(...launches.map((l) => l.members), 1)

  return (
    <>
      <div className="kpis">
        <Kpi icon={Users} label="کل اعضا" value={faNum(db.totals.members + members.filter((m) => !m.seeded).length)} delta="۴۸+ این هفته" />
        <Kpi icon={Activity} label="فعال این هفته" value={faNum(db.totals.activeWeek)} delta={`${faNum(Math.round((db.totals.activeWeek / db.totals.members) * 100))}٪ اعضا`} />
        <Kpi icon={Handshake} label="همکاری موفق" value={faNum(db.totals.collabs + accepted)} delta={`${faNum(accepted)}+ امروز`} />
        <Kpi icon={TrendingUp} label="فرصت فعال" value={faNum(activeOpps)} delta={`${faNum(db.opportunities.filter((o) => o.status === 'pending').length)} در انتظار تأیید`} />
      </div>

      <div className="grid two" style={{ marginTop: 12 }}>
        <div className="card pad">
          <h3 className="chart-title">درخواست‌های همکاری در ۸ هفته‌ی اخیر</h3>
          <p className="chart-sub">تعداد درخواست‌های همکاری ارسال‌شده بین اعضا</p>
          <ColumnChart values={weekly} labels={weekly.map((_, i) => (i === weekly.length - 1 ? 'این هفته' : `هفته ${faNum(i + 1)}`))} />
        </div>
        <div className="card pad">
          <h3 className="chart-title">اعضا به تفکیک لانچ</h3>
          <p className="chart-sub">لانچ سوم هنوز شروع نشده</p>
          {launches.map((l) => (
            <div key={l.id} className="hbar" title={`${l.title}: ${faNum(l.members)} عضو`}>
              <span style={{ fontWeight: 700 }}>{l.title}</span>
              <span className="track">
                <motion.span
                  style={{ display: 'block', height: '100%', background: 'var(--s1)', borderRadius: '4px 0 0 4px' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(l.members / maxLaunch) * 100}%` }}
                  transition={{ duration: 0.7 }}
                />
              </span>
              <span className="val">{l.members ? faNum(l.members) : '—'}</span>
            </div>
          ))}
          <div className="insight">
            <Lightbulb size={18} />
            <span>اعضای لانچ‌های قبلی داخل کانکت می‌مونن؛ یعنی هر لانچ جدید به یه شبکه‌ی آماده از هم‌دوره‌ای‌ها و منتورها وصل می‌شه.</span>
          </div>
        </div>
      </div>

      <div className="card pad" style={{ marginTop: 12 }}>
        <h3 className="chart-title">عرضه و تقاضای مهارت‌ها</h3>
        <p className="chart-sub">درصد اعضایی که یک مهارت رو دارن، در برابر درصد اعضایی که دنبالش هستن</p>
        <div className="legend">
          <span>
            <i style={{ background: 'var(--s1)' }} />
            عرضه (بلدن)
          </span>
          <span>
            <i style={{ background: 'var(--s2)' }} />
            تقاضا (دنبالشن)
          </span>
        </div>
        {skillStats.map((x) => (
          <div key={x.skill} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{x.skill}</div>
            {(['supply', 'demand'] as const).map((k) => (
              <div key={k} className="hbar" style={{ gridTemplateColumns: '1fr 44px', marginTop: 3 }} title={`${x.skill} — ${k === 'supply' ? 'عرضه' : 'تقاضا'}: ${faNum(Math.round(x[k] * 100))}٪`}>
                <span className="track" style={{ height: 8 }}>
                  <motion.span
                    style={{ display: 'block', height: '100%', background: k === 'supply' ? 'var(--s1)' : 'var(--s2)', borderRadius: '4px 0 0 4px' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(x[k] / maxPct) * 100}%` }}
                    transition={{ duration: 0.7 }}
                  />
                </span>
                <span className="val">{faNum(Math.round(x[k] * 100))}٪</span>
              </div>
            ))}
          </div>
        ))}
        {gap && (
          <div className="insight">
            <Lightbulb size={18} />
            <span>
              تقاضا برای <b>«{gap.skill}»</b> حدود {faNum(Math.round((gap.demand / gap.supply) * 10) / 10)} برابر عرضه‌ست. یه ورکشاپ یا دوره‌ی کوتاه روی همین مهارت، هم برای اعضا
              ارزش داره هم برای هیلز یه محصول آموزشی جدیده.
            </span>
          </div>
        )}
      </div>
    </>
  )
}

function Kpi({ icon: Icon, label, value, delta }: { icon: typeof Users; label: string; value: string; delta: string }) {
  return (
    <div className="card kpi">
      <div className="k">
        <Icon size={16} /> {label}
      </div>
      <div className="v">{value}</div>
      <div className="d">{delta}</div>
    </div>
  )
}

function ColumnChart({ values, labels }: { values: number[]; labels: string[] }) {
  const [hover, setHover] = useState<number>()
  const max = Math.max(...values, 1)
  const last = values.length - 1
  return (
    <div className="columns" onMouseLeave={() => setHover(undefined)}>
      {values.map((v, i) => (
        <div key={i} className="col" onMouseEnter={() => setHover(i)} onClick={() => setHover(i)}>
          {(hover === i || (hover === undefined && i === last)) && (
            <span className="tip">
              {labels[i]}: {faNum(v)}
            </span>
          )}
          <motion.div className="bar" initial={{ height: 0 }} animate={{ height: `${(v / max) * 100}%` }} transition={{ duration: 0.6, delay: i * 0.04 }} />
          <span className="lbl">{i === last ? 'اکنون' : faNum(i + 1)}</span>
        </div>
      ))}
    </div>
  )
}

// Members -----------------------------------------------------------------------

function MembersTable() {
  const members = useStore((s) => s.db.members)
  const [q, setQ] = useState('')
  const [launch, setLaunch] = useState(0)
  const list = Object.values(members)
    .filter((m) => !launch || m.launch === launch)
    .filter((m) => !q || [m.name, m.username, m.city, ...m.skills].some((x) => x.includes(q)))
    .sort((a, b) => (a.role === 'mentor' ? -1 : 0) - (b.role === 'mentor' ? -1 : 0) || b.lastActive - a.lastActive)

  const exportCsv = () => {
    const blob = new Blob([api.exportMembersCsv()], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'hills-connect-members.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const act = (m: Member, patch: Parameters<typeof api.adminUpdateMember>[1], msg: string) => {
    void api.adminUpdateMember(m.id, patch)
    useStore.getState().showToast(msg)
  }

  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
        <div className="smart" style={{ flex: 1, minWidth: 220, margin: 0 }}>
          <Search className="spark" size={18} />
          <input style={{ height: 44 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجوی نام، شهر یا مهارت" />
        </div>
        {[0, 1, 2].map((l) => (
          <button key={l} className={'pick' + (launch === l ? ' on' : '')} onClick={() => setLaunch(l)}>
            {l ? `لانچ ${faNum(l)}` : 'همه'}
          </button>
        ))}
        <button className="btn soft sm" onClick={exportCsv}>
          <Download size={16} /> خروجی اکسل
        </button>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>عضو</th>
              <th>مهارت‌ها</th>
              <th>شهر</th>
              <th>لانچ</th>
              <th>وضعیت</th>
              <th style={{ textAlign: 'left' }}>اقدام</th>
            </tr>
          </thead>
          <tbody>
            {list.map((m) => (
              <tr key={m.id} style={{ opacity: m.suspended ? 0.5 : 1 }}>
                <td>
                  <div className="who" style={{ cursor: 'pointer' }} onClick={() => useStore.getState().openProfile(m.id)}>
                    <Avatar m={m} size={36} />
                    <div>
                      <b>
                        {m.name} {m.verified && <Verified size={14} />}
                      </b>
                      <small className="ltr">@{m.username}</small>
                    </div>
                  </div>
                </td>
                <td style={{ color: 'var(--text-2)', fontSize: 13, minWidth: 150 }}>{m.skills.slice(0, 2).join('، ')}</td>
                <td>{m.city}</td>
                <td>{faNum(m.launch)}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {m.role === 'mentor' && <span className="tag-mini ok">منتور</span>}
                    {m.featured && <span className="tag-mini star">ویژه</span>}
                    {m.suspended && <span className="tag-mini warn">تعلیق</span>}
                    {!m.seeded && <span className="tag-mini">جدید</span>}
                  </div>
                </td>
                <td>
                  <div className="row-actions">
                    <button className={'icon-btn' + (m.verified ? ' on' : '')} title="تیک تأیید" onClick={() => act(m, { verified: !m.verified }, m.verified ? 'تیک تأیید برداشته شد' : `${m.name} تأیید شد ✅`)}>
                      <BadgeCheck size={18} />
                    </button>
                    <button className={'icon-btn' + (m.featured ? ' on' : '')} title="عضو ویژه در صفحه‌ی خانه" onClick={() => act(m, { featured: !m.featured }, m.featured ? 'از اعضای ویژه حذف شد' : `${m.name} توی صفحه‌ی خانه ویژه شد ⭐`)}>
                      <Star size={18} />
                    </button>
                    <button className={'icon-btn' + (m.role === 'mentor' ? ' on' : '')} title="منتور" onClick={() => act(m, { role: m.role === 'mentor' ? 'member' : 'mentor' }, m.role === 'mentor' ? 'نقش منتور برداشته شد' : `${m.name} منتور شد 🎓`)}>
                      <GraduationCap size={18} />
                    </button>
                    <button className={'icon-btn' + (m.suspended ? ' on' : '')} title="تعلیق" onClick={() => act(m, { suspended: !m.suspended }, m.suspended ? 'تعلیق برداشته شد' : `${m.name} تعلیق شد`)}>
                      <Ban size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 10 }}>نمایش {faNum(list.length)} عضو نمونه از {compact(2812)} عضو</div>
    </div>
  )
}

// Moderation ----------------------------------------------------------------------

function Moderation() {
  const opportunities = useStore((s) => s.db.opportunities)
  const members = useStore((s) => s.db.members)
  const pending = opportunities.filter((o) => o.status === 'pending')
  const decided = opportunities.filter((o) => o.status !== 'pending').slice(0, 5)

  return (
    <>
      {pending.length === 0 ? (
        <Empty icon={Check} title="همه‌ی فرصت‌ها بررسی شدن" text="فرصت‌هایی که اعضا ثبت می‌کنن، قبل از انتشار اینجا منتظر تأیید تیم هیلز می‌مونن." />
      ) : (
        <div className="grid two">
          {pending.map((o) => {
            const a = members[o.authorId]
            const T = OPP_TYPES[o.type]
            return (
              <motion.div key={o.id} layout className="card opp" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="opp-top">
                  <span className={'opp-type t-' + o.type}>
                    <T.icon size={14} /> {T.label}
                  </span>
                  <span className="status-pill pending" style={{ marginInlineStart: 'auto' }}>
                    در انتظار تأیید
                  </span>
                </div>
                <h3>{o.title}</h3>
                <p style={{ WebkitLineClamp: 4 }}>{o.description}</p>
                <div className="opp-foot" style={{ borderTop: 0, paddingTop: 0 }}>
                  {a && <Avatar m={a} size={26} />}
                  <span style={{ flex: 1, fontWeight: 700, color: 'var(--text)' }}>{a?.name}</span>
                  <span>{formatListTime(o.createdAt)}</span>
                </div>
                <div className="card-actions">
                  <button
                    className="btn primary sm"
                    onClick={() => {
                      void api.adminModerate(o.id, 'approved')
                      useStore.getState().showToast('منتشر شد ✅')
                    }}
                  >
                    <Check size={17} /> تأیید و انتشار
                  </button>
                  <button
                    className="btn ghost sm"
                    onClick={() => {
                      void api.adminModerate(o.id, 'rejected')
                      useStore.getState().showToast('رد شد')
                    }}
                  >
                    <X size={17} /> رد
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
      <div className="section">
        <h2>آخرین تصمیم‌ها</h2>
      </div>
      <div className="card" style={{ padding: '4px 16px' }}>
        {decided.map((o) => (
          <div key={o.id} className="field-row">
            <span className={'status-pill ' + (o.status === 'approved' ? 'accepted' : 'declined')}>{o.status === 'approved' ? 'منتشرشده' : 'ردشده'}</span>
            <span className="ellipsis" style={{ flex: 1, fontWeight: 600 }}>
              {o.title}
            </span>
            <span className="muted" style={{ fontSize: 12.5 }}>
              {faNum(o.applicants.length)} درخواست
            </span>
          </div>
        ))}
      </div>
    </>
  )
}

// Platform settings ----------------------------------------------------------------

function PlatformSettings() {
  const platform = useStore((s) => s.db.platform)
  const [text, setText] = useState(platform.announcement.text)
  const [label, setLabel] = useState('')
  const [type, setType] = useState<CustomField['type']>('text')
  const [options, setOptions] = useState('')
  const [cat, setCat] = useState(Object.keys(platform.skillCatalog)[0])
  const [skill, setSkill] = useState('')
  const toast = useStore.getState().showToast

  return (
    <div className="grid two" style={{ alignItems: 'start' }}>
      <div className="stack" style={{ gap: 12 }}>
        <div className="card pad">
          <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Megaphone size={17} /> اطلاعیه‌ی صفحه‌ی خانه
          </h3>
          <p className="chart-sub">بنری که بالای صفحه‌ی خانه‌ی همه‌ی اعضا دیده می‌شه</p>
          <textarea className="field" value={text} onChange={(e) => setText(e.target.value)} />
          <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
            <button
              className="item"
              style={{ padding: 0, minHeight: 40, flex: 1 }}
              onClick={() => void api.adminUpdatePlatform({ announcement: { ...platform.announcement, enabled: !platform.announcement.enabled } })}
            >
              <span className="label-text">نمایش اطلاعیه</span>
              <span className={'switch' + (platform.announcement.enabled ? ' on' : '')} />
            </button>
            <button
              className="btn primary sm"
              onClick={() => {
                void api.adminUpdatePlatform({ announcement: { text, enabled: true } })
                toast('اطلاعیه برای همه منتشر شد 📣')
              }}
            >
              انتشار
            </button>
          </div>
        </div>

        <div className="card pad">
          <h3 className="chart-title">لانچ‌ها</h3>
          <p className="chart-sub">هر لانچ یه دوره‌ی جدید از اعضای هیلزه</p>
          {platform.launches.map((l) => (
            <div key={l.id} className="launch-row">
              <span className={'launch-num' + (l.status === 'active' ? ' active' : '')}>{faNum(l.id)}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800 }}>{l.title}</div>
                <div className="muted" style={{ fontSize: 12.5 }}>
                  {l.status === 'done' ? 'تمام‌شده' : l.status === 'active' ? 'در حال برگزاری' : 'به‌زودی'} · {faNum(l.members)} عضو
                </div>
              </div>
              {l.status === 'upcoming' && (
                <button
                  className="btn soft sm"
                  onClick={() => {
                    void api.adminUpdatePlatform({ launches: platform.launches.map((x) => (x.id === l.id ? { ...x, status: 'active' } : x.status === 'active' ? { ...x, status: 'done' } : x)) })
                    toast(`ثبت‌نام ${l.title} باز شد 🚀`)
                  }}
                >
                  باز کردن ثبت‌نام
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="stack" style={{ gap: 12 }}>
        <div className="card pad">
          <h3 className="chart-title">فیلدهای سفارشی پروفایل</h3>
          <p className="chart-sub">هر فیلدی اضافه کنی، بلافاصله توی فرم پروفایل همه‌ی اعضا ظاهر می‌شه</p>
          {platform.customFields.map((f) => (
            <div key={f.id} className="field-row">
              <span style={{ flex: 1, fontWeight: 700 }}>{f.label}</span>
              <span className="tag-mini">{f.type === 'select' ? `چندگزینه‌ای (${faNum(f.options?.length ?? 0)})` : 'متن'}</span>
              <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => void api.adminRemoveField(f.id)} title="حذف">
                <Trash2 size={17} />
              </button>
            </div>
          ))}
          <div className="stack" style={{ gap: 8, marginTop: 12 }}>
            <input className="field sm" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="عنوان فیلد، مثلاً: سطح تجربه" />
            <div style={{ display: 'flex', gap: 6 }}>
              <button className={'pick' + (type === 'text' ? ' on' : '')} onClick={() => setType('text')}>
                متن آزاد
              </button>
              <button className={'pick' + (type === 'select' ? ' on' : '')} onClick={() => setType('select')}>
                چندگزینه‌ای
              </button>
            </div>
            {type === 'select' && <input className="field sm" value={options} onChange={(e) => setOptions(e.target.value)} placeholder="گزینه‌ها با ویرگول: مبتدی، متوسط، حرفه‌ای" />}
            <button
              className="btn primary sm"
              disabled={!label.trim() || (type === 'select' && !options.trim())}
              onClick={() => {
                void api.adminAddField({
                  label: label.trim(),
                  type,
                  options: type === 'select' ? options.split(/[,،]/).map((x) => x.trim()).filter(Boolean) : undefined,
                })
                setLabel('')
                setOptions('')
                toast('فیلد اضافه شد — توی «ویرایش پروفایل» ببینش')
              }}
            >
              <Plus size={16} /> افزودن فیلد
            </button>
          </div>
        </div>

        <div className="card pad">
          <h3 className="chart-title">دسته‌بندی مهارت‌ها</h3>
          <p className="chart-sub">مهارت‌هایی که اعضا می‌تونن انتخاب کنن</p>
          <div className="chips" style={{ marginBottom: 10 }}>
            {Object.keys(platform.skillCatalog).map((c) => (
              <button key={c} className={'pick' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>
                {c}
              </button>
            ))}
          </div>
          <div className="chips" style={{ marginBottom: 10 }}>
            {platform.skillCatalog[cat]?.map((s) => (
              <span key={s} className="chip">
                {s}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="field sm" value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="مهارت جدید" />
            <button
              className="btn soft sm"
              style={{ height: 46 }}
              disabled={!skill.trim()}
              onClick={() => {
                void api.adminUpdatePlatform({ skillCatalog: { ...platform.skillCatalog, [cat]: [...platform.skillCatalog[cat], skill.trim()] } })
                setSkill('')
              }}
            >
              <Plus size={16} /> افزودن
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
