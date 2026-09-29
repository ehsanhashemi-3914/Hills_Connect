import { create } from 'zustand'
import type { DB, Member, Opportunity } from './data/types'
import * as api from './data/api'

export type Tab = 'home' | 'discover' | 'opps' | 'network' | 'profile' | 'admin'
export type Theme = 'dark' | 'light'

const TOKEN_KEY = 'hills-connect.token'
const THEME_KEY = 'hills-connect.theme'

const read = (k: string) => {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
const write = (k: string, v: string | null) => {
  try {
    if (v === null) localStorage.removeItem(k)
    else localStorage.setItem(k, v)
  } catch {
    /* ignore */
  }
}

interface Store {
  phase: 'splash' | 'auth' | 'onboarding' | 'ready'
  db: DB
  meId: string
  pendingPhone?: string
  tab: Tab
  theme: Theme
  adminMode: boolean
  profileId?: string
  oppId?: string
  sheet?: 'edit' | 'notifications' | 'new-opp' | 'about'
  toast?: { text: string; n: number }

  boot(): void
  setPhone(phone: string): void
  signedIn(token: string): void
  logout(): void
  setTab(t: Tab): void
  setTheme(t: Theme): void
  setAdminMode(on: boolean): void
  openProfile(id?: string): void
  openOpp(id?: string): void
  openSheet(s?: Store['sheet']): void
  showToast(text: string): void

  connect(memberId: string, note?: string): Promise<void>
  pass(memberId: string): void
  respond(connectionId: string, accept: boolean): Promise<void>
  endorse(memberId: string, skill: string): void
  updateMe(patch: Partial<Member>): Promise<void>
  apply(o: Opportunity, note?: string): Promise<void>
}

let toastN = 0

export const useStore = create<Store>((set, get) => ({
  phase: 'splash',
  db: structuredClone(api.snapshot()),
  meId: '',
  tab: 'home',
  theme: read(THEME_KEY) === 'light' ? 'light' : 'dark',
  adminMode: false,

  boot() {
    api.subscribe(() => set({ db: structuredClone(api.snapshot()) }))
    const me = api.memberForToken(read(TOKEN_KEY))
    setTimeout(() => set(me ? { phase: 'ready', meId: me.id } : { phase: 'auth' }), 1500)
  },

  setPhone: (phone) => set({ pendingPhone: phone }),

  signedIn(token) {
    write(TOKEN_KEY, token)
    const me = api.memberForToken(token)
    if (me) set({ phase: 'ready', meId: me.id, tab: 'home', db: structuredClone(api.snapshot()) })
  },

  logout() {
    write(TOKEN_KEY, null)
    set({ phase: 'auth', meId: '', tab: 'home', adminMode: false, profileId: undefined, oppId: undefined, sheet: undefined })
  },

  setTab: (tab) => {
    set({ tab })
    document.querySelector('.content')?.scrollTo({ top: 0 })
  },
  setTheme(theme) {
    write(THEME_KEY, theme)
    set({ theme })
  },
  setAdminMode: (adminMode) => set({ adminMode, tab: adminMode ? 'admin' : get().tab === 'admin' ? 'profile' : get().tab }),
  openProfile: (profileId) => set({ profileId }),
  openOpp: (oppId) => set({ oppId }),
  openSheet: (sheet) => set({ sheet }),

  showToast(text) {
    const n = ++toastN
    set({ toast: { text, n } })
    setTimeout(() => get().toast?.n === n && set({ toast: undefined }), 2400)
  },

  async connect(memberId, note) {
    await api.requestConnection(get().meId, memberId, note)
    get().showToast(`درخواست همکاری برای ${get().db.members[memberId]?.name.split(' ')[0]} فرستاده شد 🤝`)
  },
  pass: (memberId) => void api.passMember(get().meId, memberId),
  async respond(connectionId, accept) {
    await api.respondConnection(connectionId, accept)
    get().showToast(accept ? 'به شبکه‌ت اضافه شد 🎉 راه‌های ارتباطی الان در دسترسه' : 'درخواست رد شد')
  },
  endorse: (memberId, skill) => void api.endorse(get().meId, memberId, skill),
  async updateMe(patch) {
    await api.updateMe(get().meId, patch)
  },
  async apply(o, note) {
    await api.applyOpportunity(get().meId, o.id, note)
    get().showToast('درخواستت برای صاحب آگهی فرستاده شد ✅')
  },
}))

export const useMe = () => useStore((s) => s.db.members[s.meId])

export function connectionWith(db: DB, meId: string, otherId: string) {
  return db.connections.find((c) => (c.from === meId && c.to === otherId) || (c.from === otherId && c.to === meId))
}
