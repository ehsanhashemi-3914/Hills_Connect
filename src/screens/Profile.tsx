import { useState } from 'react'
import {
  Briefcase, Camera, Check, Clock, Copy, Handshake, Lock, LogOut, MapPin, Moon, Pencil, RotateCcw, Search, Shield, Star, ThumbsUp,
} from 'lucide-react'
import type { CollabStatus, Member } from '../data/types'
import { matchMembers, profileCompleteness } from '../data/match'
import { CITIES, EXTRA_LOOKING, NICHES } from '../data/seed'
import * as api from '../data/api'
import { connectionWith, useMe, useStore } from '../store'
import { compact, faNum, lastSeenText } from '../lib/format'
import { Avatar, COLLAB_LABEL, Credit, MatchRing, PortfolioTile, SkillPicker, coverStyle, isOnline } from '../components/ui'
import { InstagramGlyph, LinkedinGlyph, Verified, YoutubeGlyph } from '../components/Brand'
import { Sheet } from '../components/Sheet'

const PLATFORM_META = {
  instagram: { label: 'اینستاگرام', bg: 'linear-gradient(45deg,#feda75,#d62976,#4f5bd5)', icon: InstagramGlyph },
  youtube: { label: 'یوتیوب', bg: '#ff0033', icon: YoutubeGlyph },
  linkedin: { label: 'لینکدین', bg: '#0a66c2', icon: LinkedinGlyph },
  telegram: { label: 'تلگرام', bg: '#2aa3df', icon: Handshake },
} as const

function ProfileView({ m }: { m: Member }) {
  const me = useMe()!
  const db = useStore((s) => s.db)
  const isMe = m.id === me.id
  const conn = connectionWith(db, me.id, m.id)
  const connected = conn?.status === 'accepted'
  const match = !isMe ? matchMembers(me, m) : undefined
  const s = useStore.getState()
  const [note, setNote] = useState('')
  const [asking, setAsking] = useState(false)

  const endorsementCount = (skill: string) => (m.baseEndorsements?.[skill] ?? 0) + (m.endorsements[skill]?.length ?? 0)

  return (
    <div>
      <div className="prof-cover" style={coverStyle(m.color * 3 + m.name.length)} />
      <div className="prof-head">
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <Avatar m={m} size={104} online={!isMe && isOnline(m)} />
          {match && (
            <div style={{ background: 'var(--bg-2)', borderRadius: '50%', padding: 4, marginBottom: 4 }}>
              <MatchRing score={match.score} size={62} />
            </div>
          )}
        </div>
        <div className="prof-name">
          {m.name}
          {m.verified && <Verified size={20} />}
        </div>
        <div style={{ color: 'var(--text-2)', fontSize: 15, fontWeight: 500 }}>{m.headline}</div>
        <div className="meta-line" style={{ marginTop: 8 }}>
          <span>
            <MapPin size={13} /> {m.city}
          </span>
          <span>
            <Clock size={13} /> {isMe ? 'پروفایل تو' : lastSeenText(m.lastActive, isOnline(m)).replace('آنلاین بود', 'فعال بود')}
          </span>
        </div>
        <div className="chips" style={{ marginTop: 10 }}>
          {m.role === 'mentor' && (
            <span className="chip mentor">
              <Star size={12} fill="currentColor" /> منتور هیلز
            </span>
          )}
          {m.role === 'admin' && <span className="chip mentor">تیم هیلز</span>}
          <span className="chip launch">لانچ {faNum(m.launch)}</span>
          <span className="chip" style={{ color: m.collab === 'open' ? 'var(--online)' : m.collab === 'hiring' ? 'var(--warn)' : undefined }}>
            {COLLAB_LABEL[m.collab]}
          </span>
        </div>
      </div>

      {!isMe && (
        <div className="prof-actions">
          {!conn && !asking && (
            <button className="btn primary" onClick={() => setAsking(true)}>
              <Handshake size={19} /> درخواست همکاری
            </button>
          )}
          {conn?.status === 'pending' && (
            <button className="btn soft" disabled>
              <Clock size={18} /> {conn.from === me.id ? 'درخواستت در انتظار پاسخه' : 'برات درخواست فرستاده'}
            </button>
          )}
          {conn?.status === 'pending' && conn.to === me.id && (
            <button className="btn primary" onClick={() => s.respond(conn.id, true)}>
              <Check size={18} /> قبول
            </button>
          )}
          {connected && (
            <button className="btn soft" disabled>
              <Check size={18} /> هم‌تیمی شدید
            </button>
          )}
        </div>
      )}
      {asking && !conn && (
        <div className="prof-section">
          <textarea
            className="field"
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={`یه پیام کوتاه برای ${m.name.split(' ')[0]}: چه همکاری‌ای در نظرته؟`}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn ghost" onClick={() => setAsking(false)}>
              انصراف
            </button>
            <button
              className="btn primary"
              style={{ flex: 1 }}
              onClick={async () => {
                await s.connect(m.id, note.trim() || undefined)
                setAsking(false)
              }}
            >
              ارسال درخواست
            </button>
          </div>
        </div>
      )}

      {match && match.reasons.length > 0 && (
        <div className="prof-section">
          <h4>چرا با هم مچید؟</h4>
          <div className="reasons">
            {match.reasons.map((r) => (
              <div key={r} className="reason">
                <Check size={14} strokeWidth={3} /> {r}
              </div>
            ))}
          </div>
        </div>
      )}

      {!isMe && (
        <div className="prof-section">
          <h4>راه‌های ارتباطی</h4>
          {connected ? (
            <div className="contact-box">
              {m.contact.telegram && (
                <div className="line">
                  <span style={{ color: '#2aa3df', fontWeight: 800 }}>تلگرام</span>
                  <span className="ltr">@{m.contact.telegram}</span>
                  <button
                    className="icon-btn"
                    style={{ width: 32, height: 32 }}
                    onClick={() => {
                      navigator.clipboard?.writeText('@' + m.contact.telegram)
                      s.showToast('آیدی کپی شد')
                    }}
                  >
                    <Copy size={16} />
                  </button>
                </div>
              )}
              {m.contact.instagram && (
                <div className="line">
                  <span style={{ color: '#d62976', fontWeight: 800 }}>اینستاگرام</span>
                  <span className="ltr">@{m.contact.instagram}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="locked">
              <Lock size={20} style={{ flex: 'none' }} />
              بعد از قبول درخواست همکاری، راه‌های ارتباطی نمایش داده می‌شه. این‌طوری کسی بی‌اجازه مزاحم اعضا نمی‌شه.
            </div>
          )}
        </div>
      )}

      {m.bio && (
        <div className="prof-section">
          <h4>درباره</h4>
          <p>{m.bio}</p>
        </div>
      )}

      <div className="prof-section">
        <div className="kv">
          <div>
            <b>{faNum(m.collabs)}</b>
            <span>همکاری</span>
          </div>
          <div>
            <b>{m.rating ? faNum(m.rating) : '—'}</b>
            <span>امتیاز</span>
          </div>
          <div>
            <b>{faNum(Object.keys(m.skills).length ? m.skills.reduce((n, sk) => n + endorsementCount(sk), 0) : 0)}</b>
            <span>تأیید مهارت</span>
          </div>
        </div>
      </div>

      {m.skills.length > 0 && (
        <div className="prof-section">
          <h4>مهارت‌ها {!isMe && <span style={{ fontWeight: 500, fontSize: 12 }}>— اگه کارش رو دیدی، مهارتش رو تأیید کن</span>}</h4>
          <div className="chips" style={{ gap: 8 }}>
            {m.skills.map((sk) => {
              const mine = m.endorsements[sk]?.includes(me.id)
              return (
                <span key={sk} className="endorse">
                  {sk}
                  <button className={'count' + (mine ? ' mine' : '')} disabled={isMe} onClick={() => s.endorse(m.id, sk)} title="تأیید مهارت">
                    <ThumbsUp size={12} /> {faNum(endorsementCount(sk))}
                  </button>
                </span>
              )
            })}
          </div>
        </div>
      )}

      {m.lookingFor.length > 0 && (
        <div className="prof-section">
          <h4>
            <Search size={15} /> دنبال
          </h4>
          <div className="chips">
            {m.lookingFor.map((l) => (
              <span key={l} className="chip accent">
                {l}
              </span>
            ))}
          </div>
        </div>
      )}

      {m.niches.length > 0 && (
        <div className="prof-section">
          <h4>حوزه‌ی محتوا</h4>
          <div className="chips">
            {m.niches.map((n) => (
              <span key={n} className="chip">
                #{n}
              </span>
            ))}
          </div>
        </div>
      )}

      {Object.keys(m.platforms).length > 0 && (
        <div className="prof-section">
          <h4>پلتفرم‌ها</h4>
          <div className="stack" style={{ gap: 8 }}>
            {(Object.entries(m.platforms) as [keyof typeof PLATFORM_META, { handle: string; followers?: number }][]).map(([k, p]) => {
              const meta = PLATFORM_META[k]
              return (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="platform-ico" style={{ background: meta.bg, width: 34, height: 34 }}>
                    <meta.icon size={17} />
                  </span>
                  <span className="ltr" style={{ fontWeight: 600 }}>
                    {p.handle}
                  </span>
                  <span style={{ marginInlineStart: 'auto', color: 'var(--text-2)', fontSize: 13 }}>
                    {p.followers ? `${compact(p.followers)} دنبال‌کننده` : meta.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <CustomFieldsView m={m} />

      {m.portfolio.length > 0 && (
        <div className="prof-section">
          <h4>نمونه‌کارها</h4>
          <div className="portfolio">
            {m.portfolio.map((p) => (
              <PortfolioTile key={p.id} p={p} />
            ))}
          </div>
        </div>
      )}
      <div style={{ height: 20 }} />
    </div>
  )
}

function CustomFieldsView({ m }: { m: Member }) {
  const fields = useStore((s) => s.db.platform.customFields)
  const filled = fields.filter((f) => m.custom[f.id])
  if (!filled.length) return null
  return (
    <div className="prof-section">
      <h4>اطلاعات تکمیلی</h4>
      <div className="stack" style={{ gap: 6 }}>
        {filled.map((f) => (
          <div key={f.id} style={{ display: 'flex', gap: 8, fontSize: 14.5 }}>
            <span style={{ color: 'var(--text-2)', fontWeight: 600 }}>{f.label}:</span>
            <span>{m.custom[f.id]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ProfileSheet({ id }: { id: string }) {
  const m = useStore((s) => s.db.members[id])
  const close = () => useStore.getState().openProfile(undefined)
  if (!m) return null
  return (
    <Sheet title="" onClose={close}>
      <div style={{ padding: '0 4px' }}>
        <ProfileView m={m} />
      </div>
    </Sheet>
  )
}

export function MyProfile() {
  const me = useMe()
  const theme = useStore((s) => s.theme)
  const adminMode = useStore((s) => s.adminMode)
  if (!me) return null
  const s = useStore.getState()
  const { pct } = profileCompleteness(me)

  return (
    <>
      <header className="page-head">
        <h1>
          پروفایل من
          <span className="sub">پروفایلت {faNum(pct)}٪ کامله</span>
        </h1>
        <button className="btn primary sm" onClick={() => s.openSheet('edit')}>
          <Pencil size={16} /> ویرایش
        </button>
      </header>
      <div className="grid two" style={{ alignItems: 'start' }}>
        <div className="card" style={{ overflow: 'hidden', padding: 4 }}>
          <ProfileView m={me} />
        </div>
        <div className="stack" style={{ gap: 12 }}>
          <div className="card pad stack" style={{ gap: 4 }}>
            <SettingRow icon={Moon} label="حالت شب" on={theme === 'dark'} onClick={() => s.setTheme(theme === 'dark' ? 'light' : 'dark')} />
            <SettingRow
              icon={Shield}
              label="پنل مدیریت (نمایشی)"
              hint="نمای تیم هیلز: آمار، مدیریت اعضا، تأیید فرصت‌ها و فیلدهای سفارشی"
              on={adminMode}
              onClick={() => s.setAdminMode(!adminMode)}
            />
            <button className="item" style={{ padding: '0 4px' }} onClick={() => s.setTab('opps')}>
              <span className="ico" style={{ background: 'linear-gradient(180deg,#a0de7e,#54cb68)' }}>
                <Briefcase size={18} />
              </span>
              <span className="label-text">فرصت‌ها و درخواست‌های من</span>
            </button>
            <button
              className="item"
              style={{ padding: '0 4px' }}
              onClick={() => {
                api.resetDemo()
                s.logout()
              }}
            >
              <span className="ico" style={{ background: 'linear-gradient(180deg,#ffcd6a,#ffa85c)' }}>
                <RotateCcw size={18} />
              </span>
              <span className="label-text">
                شروع دوباره‌ی دمو
                <div className="muted" style={{ fontSize: 12 }}>
                  همه‌ی داده‌ها به حالت اول برمی‌گرده
                </div>
              </span>
            </button>
            <button className="item danger" style={{ padding: '0 4px' }} onClick={() => s.logout()}>
              <span className="ico" style={{ background: 'var(--danger)' }}>
                <LogOut size={18} />
              </span>
              <span className="label-text">خروج</span>
            </button>
          </div>
          <div className="card pad" style={{ lineHeight: 1.9, fontSize: 14 }}>
            <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 6 }}>درباره‌ی هیلز کانکت</div>
            <div className="muted">
              بخش شبکه‌سازی اعضای پروژه هیلز: پروفایل حرفه‌ای، مچینگ هوشمند بر اساس مهارت و نیاز، فرصت‌های همکاری و رویدادها. بدون پیام‌رسان؛ ارتباط بعد از قبول درخواست همکاری
              از راه‌های خود اعضا انجام می‌شه.
            </div>
          </div>
          <Credit variant="card" />
        </div>
      </div>
    </>
  )
}

function SettingRow({ icon: Icon, label, hint, on, onClick }: { icon: typeof Moon; label: string; hint?: string; on: boolean; onClick: () => void }) {
  return (
    <button className="item" style={{ padding: '0 4px', minHeight: 58 }} onClick={onClick}>
      <span className="ico" style={{ background: 'linear-gradient(135deg,#9a66ff,#6a28dc)' }}>
        <Icon size={18} />
      </span>
      <span className="label-text">
        {label}
        {hint && (
          <div className="muted" style={{ fontSize: 12 }}>
            {hint}
          </div>
        )}
      </span>
      <span className={'switch' + (on ? ' on' : '')} />
    </button>
  )
}

export function EditProfileSheet() {
  const me = useMe()!
  const catalog = useStore((s) => s.db.platform.skillCatalog)
  const fields = useStore((s) => s.db.platform.customFields)
  const [p, setP] = useState(() => structuredClone(me))
  const set = (patch: Partial<Member>) => setP((x) => ({ ...x, ...patch }))
  const close = () => useStore.getState().openSheet(undefined)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setBusy(true)
    await useStore.getState().updateMe(p)
    close()
    useStore.getState().showToast('پروفایلت به‌روز شد ✨')
  }

  const addSample = () =>
    set({
      portfolio: [...p.portfolio, { id: 'pf' + Date.now(), title: 'نمونه‌کار جدید', kind: p.skills.includes('طراحی تامنیل') ? 'design' : 'reels', hue: Math.floor(Math.random() * 360) }],
    })

  return (
    <Sheet
      title="ویرایش پروفایل"
      onClose={close}
      actions={
        <button className="btn primary sm" disabled={busy || !p.name.trim()} onClick={save}>
          {busy ? <span className="spinner" /> : 'ذخیره'}
        </button>
      }
    >
      <div className="sheet-body stack">
        <label style={{ alignSelf: 'center', position: 'relative', cursor: 'pointer' }}>
          <Avatar m={p} size={96} />
          <span className="cam" style={{ position: 'absolute', bottom: 0, left: 0, width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--grad)', color: '#fff' }}>
            <Camera size={16} />
          </span>
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f) return
              set({ avatar: await toSmallDataUrl(f) })
            }}
          />
        </label>
        <div className="row2">
          <div>
            <label className="label">نام</label>
            <input className="field" value={p.name} onChange={(e) => set({ name: e.target.value })} />
          </div>
          <div>
            <label className="label">شهر</label>
            <select className="field" value={p.city} onChange={(e) => set({ city: e.target.value })}>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">عنوان کوتاه</label>
          <input className="field" value={p.headline} onChange={(e) => set({ headline: e.target.value })} />
        </div>
        <div>
          <label className="label">درباره</label>
          <textarea className="field" value={p.bio} onChange={(e) => set({ bio: e.target.value.slice(0, 240) })} />
        </div>
        <div>
          <label className="label">وضعیت همکاری</label>
          <div className="chips" style={{ gap: 7 }}>
            {(Object.keys(COLLAB_LABEL) as CollabStatus[]).map((c) => (
              <button key={c} className={'pick' + (p.collab === c ? ' on' : '')} onClick={() => set({ collab: c })}>
                {COLLAB_LABEL[c]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">مهارت‌ها (تا ۵ تا)</label>
          <SkillPicker groups={catalog} value={p.skills} onChange={(skills) => set({ skills })} max={5} />
        </div>
        <div>
          <label className="label">دنبال</label>
          <SkillPicker groups={{ ...catalog, 'افراد و حمایت': EXTRA_LOOKING }} value={p.lookingFor} onChange={(lookingFor) => set({ lookingFor })} max={5} />
        </div>
        <div>
          <label className="label">حوزه‌ی محتوا</label>
          <SkillPicker groups={{ '': NICHES }} value={p.niches} onChange={(niches) => set({ niches })} max={3} />
        </div>
        <div className="row2">
          <div>
            <label className="label">آیدی تلگرام</label>
            <input className="field ltr" dir="ltr" value={p.contact.telegram ?? ''} onChange={(e) => set({ contact: { ...p.contact, telegram: e.target.value.replace(/^@/, '') } })} />
          </div>
          <div>
            <label className="label">آیدی اینستاگرام</label>
            <input
              className="field ltr"
              dir="ltr"
              value={p.platforms.instagram?.handle ?? ''}
              onChange={(e) => {
                const handle = e.target.value.replace(/^@/, '')
                set({
                  platforms: { ...p.platforms, instagram: handle ? { handle, followers: p.platforms.instagram?.followers } : undefined },
                  contact: { ...p.contact, instagram: handle || undefined },
                })
              }}
            />
          </div>
        </div>
        {fields.map((f) => (
          <div key={f.id}>
            <label className="label">
              {f.label} <span className="chip accent" style={{ height: 20, fontSize: 10.5 }}>فیلد سفارشی هیلز</span>
            </label>
            {f.type === 'select' ? (
              <select className="field" value={p.custom[f.id] ?? ''} onChange={(e) => set({ custom: { ...p.custom, [f.id]: e.target.value } })}>
                <option value="">انتخاب کن</option>
                {f.options?.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            ) : (
              <input className="field" placeholder={f.placeholder} value={p.custom[f.id] ?? ''} onChange={(e) => set({ custom: { ...p.custom, [f.id]: e.target.value } })} />
            )}
          </div>
        ))}
        <div>
          <label className="label">نمونه‌کارها</label>
          <div className="portfolio">
            {p.portfolio.map((x) => (
              <PortfolioTile key={x.id} p={x} />
            ))}
            <button className="pf" style={{ background: 'var(--bg-3)', color: 'var(--text-2)', justifyContent: 'center', alignItems: 'center', border: '1.5px dashed var(--line-2)' }} onClick={addSample}>
              + افزودن نمونه‌کار
            </button>
          </div>
        </div>
      </div>
    </Sheet>
  )
}

async function toSmallDataUrl(file: File, max = 320): Promise<string> {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * scale)
  c.height = Math.round(bmp.height * scale)
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
  return c.toDataURL('image/jpeg', 0.82)
}
