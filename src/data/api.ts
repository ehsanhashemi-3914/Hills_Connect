// The "backend" of the demo. Every exported function maps 1:1 to a REST
// endpoint documented in docs/ARCHITECTURE.md, so a real server can replace
// this file without touching the UI. In the demo, data lives in localStorage.

import type {
  Connection, CustomField, DB, Member, Notification, Opportunity, Platform_,
} from './types'
import { seedDb } from './seed'

const KEY = 'hills-connect.db'
const MAX_AGE = 12 * 60 * 60 * 1000
const DEMO_CODE = '12345'

let db: DB
let savedAt = Date.now()
const listeners = new Set<() => void>()

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (raw && Date.now() - raw.savedAt < MAX_AGE) {
      db = raw.db
      savedAt = raw.savedAt
      return
    }
  } catch {
    /* reseed */
  }
  db = seedDb()
  persist()
}

function persist() {
  savedAt = Date.now()
  try {
    localStorage.setItem(KEY, JSON.stringify({ savedAt, db }))
  } catch {
    /* quota or private mode — keep in memory */
  }
}

/** Mutations notify subscribers (the store re-reads) and persist. */
function commit() {
  persist()
  listeners.forEach((fn) => fn())
}

export function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function snapshot(): DB {
  if (!db) load()
  return db
}

const wait = (ms = 220) => new Promise((r) => setTimeout(r, ms + Math.random() * 120))
const id = (p: string) => p + Math.random().toString(36).slice(2, 10)
const faToEn = (s: string) => s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))

// Auth: POST /auth/code, POST /auth/verify ----------------------------------------

export async function requestCode(phoneRaw: string) {
  snapshot()
  await wait(350)
  const phone = faToEn(phoneRaw).replace(/\D/g, '').replace(/^(98|0)/, '')
  if (!/^9\d{9}$/.test(phone)) throw new Error('شماره موبایل معتبر نیست')
  return { phone, exists: !!db.phones[phone] }
}

export async function verifyCode(phone: string, code: string): Promise<{ token?: string; isNew: boolean }> {
  await wait(350)
  if (faToEn(code) !== DEMO_CODE) throw new Error('کد وارد شده اشتباهه')
  const existing = db.phones[phone]
  if (!existing) return { isNew: true }
  return { token: issueToken(existing), isNew: false }
}

function issueToken(memberId: string) {
  const t = id('t') + id('')
  db.tokens[t] = memberId
  commit()
  return t
}

/** POST /members — finish onboarding and create the profile. */
export async function register(phone: string, profile: Partial<Member>): Promise<string> {
  await wait(500)
  const now = Date.now()
  const m: Member = {
    id: id('me'),
    name: profile.name?.trim() || 'عضو هیلز',
    username: profile.username || 'member' + phone.slice(-4),
    color: Math.floor(Math.random() * 7),
    avatar: profile.avatar,
    headline: profile.headline ?? '',
    bio: profile.bio ?? '',
    city: profile.city ?? 'تهران',
    role: 'member',
    launch: 2,
    skills: profile.skills ?? [],
    lookingFor: profile.lookingFor ?? [],
    niches: profile.niches ?? [],
    platforms: profile.platforms ?? {},
    collab: profile.collab ?? 'open',
    portfolio: [],
    endorsements: {},
    collabs: 0,
    rating: 0,
    contact: profile.contact ?? {},
    custom: {},
    joinedAt: now,
    lastActive: now,
    phone,
  }
  db.members[m.id] = m
  db.phones[phone] = m.id
  welcome(m)
  return issueToken(m.id)
}

/** Seed a new account with a couple of incoming requests so the demo has something to act on. */
function welcome(me: Member) {
  const now = Date.now()
  const pick = Object.values(db.members).filter((x) => x.seeded && x.role === 'member')
  const [a, b, c] = [pick.find((x) => x.lookingFor.some((l) => me.skills.includes(l))) ?? pick[0], pick[5], pick[9]]
  db.connections.push(
    { id: id('c'), from: a.id, to: me.id, status: 'pending', createdAt: now - 40 * 60_000, note: `سلام ${me.name.split(' ')[0]} 👋 پروفایلت رو دیدم، به نظرم برای یه همکاری با هم مچیم. پایه‌ای؟` },
    { id: id('c'), from: b.id, to: me.id, status: 'pending', createdAt: now - 3 * 3600_000, note: 'سلام! برای پروژه‌ی جدیدم دنبال هم‌تیمی‌ام. خوشحال می‌شم وصل بشیم 🌱' },
    { id: id('c'), from: me.id, to: c.id, status: 'accepted', createdAt: now - 26 * 3600_000, respondedAt: now - 20 * 3600_000 },
  )
  notify(me.id, { kind: 'system', text: 'به هیلز کانکت خوش اومدی! پروفایلت ساخته شد و مچ‌های امروزت آماده‌ست ✨' })
  notify(me.id, { kind: 'request', text: `${a.name} برات درخواست همکاری فرستاد`, memberId: a.id })
}

export function memberForToken(token: string | null): Member | undefined {
  snapshot()
  const mid = token ? db.tokens[token] : undefined
  return mid ? db.members[mid] : undefined
}

function notify(memberId: string, n: Omit<Notification, 'id' | 'at'>) {
  ;(db.notifications[memberId] ??= []).unshift({ id: id('n'), at: Date.now(), ...n })
}

// Members: PATCH /me, POST /members/:id/endorse --------------------------------------

export async function updateMe(meId: string, patch: Partial<Member>) {
  await wait()
  Object.assign(db.members[meId], patch, { lastActive: Date.now() })
  commit()
}

export async function endorse(meId: string, memberId: string, skill: string) {
  const list = (db.members[memberId].endorsements[skill] ??= [])
  const i = list.indexOf(meId)
  if (i >= 0) list.splice(i, 1)
  else list.push(meId)
  commit()
}

// Connections: POST /connections, PATCH /connections/:id ---------------------------

export async function requestConnection(meId: string, to: string, note?: string) {
  await wait()
  if (db.connections.some((c) => (c.from === meId && c.to === to) || (c.from === to && c.to === meId))) return
  const c: Connection = { id: id('c'), from: meId, to, note, status: 'pending', createdAt: Date.now() }
  db.connections.push(c)
  commit()
  // Demo: seeded members respond after a few seconds.
  const other = db.members[to]
  if (other?.seeded) {
    const accept = other.collab !== 'busy' || Math.random() < 0.4
    setTimeout(() => {
      if (!accept || c.status !== 'pending') return
      c.status = 'accepted'
      c.respondedAt = Date.now()
      notify(meId, { kind: 'accepted', text: `${other.name} درخواست همکاریت رو قبول کرد 🎉`, memberId: to })
      commit()
    }, 4000 + Math.random() * 5000)
  }
}

export async function respondConnection(connectionId: string, accept: boolean) {
  await wait()
  const c = db.connections.find((x) => x.id === connectionId)
  if (!c) return
  c.status = accept ? 'accepted' : 'declined'
  c.respondedAt = Date.now()
  commit()
}

export async function passMember(meId: string, memberId: string) {
  ;(db.passed[meId] ??= []).push(memberId)
  commit()
}

export async function resetPassed(meId: string) {
  db.passed[meId] = []
  commit()
}

// Opportunities: POST /opportunities, POST /opportunities/:id/apply ------------------

export async function createOpportunity(meId: string, o: Pick<Opportunity, 'type' | 'title' | 'description' | 'skills' | 'budget' | 'remote' | 'city'>) {
  await wait(400)
  db.opportunities.unshift({ ...o, id: id('o'), authorId: meId, createdAt: Date.now(), status: 'pending', applicants: [] })
  commit()
}

export async function applyOpportunity(meId: string, oppId: string, note?: string) {
  await wait()
  const o = db.opportunities.find((x) => x.id === oppId)
  if (!o || o.applicants.some((a) => a.memberId === meId)) return
  o.applicants.push({ memberId: meId, note, at: Date.now() })
  commit()
}

export async function rsvp(meId: string, eventId: string) {
  const e = db.events.find((x) => x.id === eventId)
  if (!e) return
  e.going = e.going.includes(meId) ? e.going.filter((x) => x !== meId) : [...e.going, meId]
  commit()
}

export async function markNotificationsRead(meId: string) {
  for (const n of db.notifications[meId] ?? []) n.read = true
  commit()
}

// Admin: /admin/* ------------------------------------------------------------------

export async function adminUpdateMember(memberId: string, patch: Partial<Pick<Member, 'verified' | 'featured' | 'suspended' | 'role'>>) {
  await wait(150)
  Object.assign(db.members[memberId], patch)
  commit()
}

export async function adminModerate(oppId: string, status: 'approved' | 'rejected') {
  await wait(150)
  const o = db.opportunities.find((x) => x.id === oppId)
  if (!o) return
  o.status = status
  if (status === 'approved') notify(o.authorId, { kind: 'opportunity', text: `فرصت «${o.title}» تأیید و منتشر شد ✅` })
  commit()
}

export async function adminUpdatePlatform(patch: Partial<Platform_>) {
  await wait(150)
  Object.assign(db.platform, patch)
  commit()
}

export async function adminAddField(field: Omit<CustomField, 'id'>) {
  db.platform.customFields.push({ ...field, id: id('f') })
  commit()
}

export async function adminRemoveField(fieldId: string) {
  db.platform.customFields = db.platform.customFields.filter((f) => f.id !== fieldId)
  commit()
}

export function exportMembersCsv(): string {
  const rows = [['نام', 'نام کاربری', 'شهر', 'لانچ', 'نقش', 'مهارت‌ها', 'وضعیت همکاری']]
  for (const m of Object.values(db.members)) rows.push([m.name, m.username, m.city, String(m.launch), m.role, m.skills.join('، '), m.collab])
  return '﻿' + rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
}

export function resetDemo() {
  localStorage.removeItem(KEY)
  load()
  listeners.forEach((fn) => fn())
}
