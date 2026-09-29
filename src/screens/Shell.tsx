import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Briefcase, Compass, Handshake, Home as HomeIcon, LayoutDashboard, UserRound } from 'lucide-react'
import { useMe, useStore, type Tab } from '../store'
import { faNum } from '../lib/format'
import { HillsIcon } from '../components/Brand'
import { Avatar } from '../components/ui'
import { Home } from './Home'
import { Discover } from './Discover'
import { Opportunities, OpportunitySheet, NewOpportunitySheet } from './Opportunities'
import { Network } from './Network'
import { MyProfile, ProfileSheet, EditProfileSheet } from './Profile'
import { Admin } from './Admin'
import { NotificationsSheet } from './Notifications'

const TABS: { id: Tab; label: string; icon: typeof HomeIcon }[] = [
  { id: 'home', label: 'خانه', icon: HomeIcon },
  { id: 'discover', label: 'کشف و مچ', icon: Compass },
  { id: 'opps', label: 'فرصت‌ها', icon: Briefcase },
  { id: 'network', label: 'شبکه‌ی من', icon: Handshake },
  { id: 'profile', label: 'پروفایل', icon: UserRound },
]

export function Shell() {
  const tab = useStore((s) => s.tab)
  const adminMode = useStore((s) => s.adminMode)
  const pending = useStore((s) => s.db.connections.filter((c) => c.to === s.meId && c.status === 'pending').length)
  const tabs = adminMode ? [...TABS, { id: 'admin' as Tab, label: 'مدیریت', icon: LayoutDashboard }] : TABS
  const setTab = useStore((s) => s.setTab)

  return (
    <div className="shell">
      <nav className="rail">
        <div style={{ marginBottom: 16 }}>
          <HillsIcon size={48} />
        </div>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} className={'rail-item' + (tab === id ? ' active' : '')} onClick={() => setTab(id)}>
            {tab === id && <motion.span layoutId="rail-bg" className="active-bg" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
            <Icon size={23} strokeWidth={tab === id ? 2.2 : 1.8} />
            {label}
            {id === 'network' && pending > 0 && <span className="badge">{faNum(pending)}</span>}
          </button>
        ))}
        <div className="spacer" />
      </nav>

      <main className="content">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            className="page"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {tab === 'home' && <Home />}
            {tab === 'discover' && <Discover />}
            {tab === 'opps' && <Opportunities />}
            {tab === 'network' && <Network />}
            {tab === 'profile' && <MyProfile />}
            {tab === 'admin' && <Admin />}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="bottom-nav">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} className={'nav-item' + (tab === id ? ' active' : '')} onClick={() => setTab(id)}>
            {tab === id && <motion.span layoutId="nav-bg" className="active-bg" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
            <Icon size={22} strokeWidth={tab === id ? 2.2 : 1.8} />
            <span>{label}</span>
            {id === 'network' && pending > 0 && <span className="badge">{faNum(pending)}</span>}
          </button>
        ))}
      </nav>

      <Overlays />
    </div>
  )
}

function Overlays() {
  const profileId = useStore((s) => s.profileId)
  const oppId = useStore((s) => s.oppId)
  const sheet = useStore((s) => s.sheet)
  const toast = useStore((s) => s.toast)
  return (
    <>
      <AnimatePresence>{profileId && <ProfileSheet key={'p' + profileId} id={profileId} />}</AnimatePresence>
      <AnimatePresence>{oppId && <OpportunitySheet key={'o' + oppId} id={oppId} />}</AnimatePresence>
      <AnimatePresence>
        {sheet === 'edit' && <EditProfileSheet key="edit" />}
        {sheet === 'notifications' && <NotificationsSheet key="notif" />}
        {sheet === 'new-opp' && <NewOpportunitySheet key="new" />}
      </AnimatePresence>
      <Celebrate />
      {createPortal(
        <AnimatePresence>
          {toast && (
            <motion.div key={toast.n} className="toast" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}>
              {toast.text}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}

/** "You're a team!" moment when someone accepts your request. */
function Celebrate() {
  const me = useMe()
  const notes = useStore((s) => s.db.notifications[s.meId])
  const members = useStore((s) => s.db.members)
  const seen = useRef<Set<string>>()
  const [who, setWho] = useState<string>()

  useEffect(() => {
    if (!seen.current) {
      seen.current = new Set((notes ?? []).map((n) => n.id))
      return
    }
    for (const n of notes ?? []) {
      if (seen.current.has(n.id)) continue
      seen.current.add(n.id)
      if (n.kind === 'accepted' && n.memberId) setWho(n.memberId)
    }
  }, [notes])

  const other = who ? members[who] : undefined
  return createPortal(
    <AnimatePresence>
      {other && me && (
        <motion.div className="celebrate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setWho(undefined)}>
          <motion.div
            className="celebrate-card"
            initial={{ scale: 0.8, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pair">
              <Avatar m={me} size={84} />
              <Avatar m={other} size={84} />
            </div>
            <div style={{ fontSize: 34, marginBottom: 6 }}>🎉</div>
            <h3>تیم شدید!</h3>
            <p>
              {other.name} درخواست همکاریت رو قبول کرد. راه‌های ارتباطیش الان توی پروفایلش باز شده.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn ghost" style={{ flex: 1, background: 'rgba(255,255,255,.1)', color: '#fff' }} onClick={() => setWho(undefined)}>
                بعداً
              </button>
              <button
                className="btn primary"
                style={{ flex: 1.4 }}
                onClick={() => {
                  setWho(undefined)
                  useStore.getState().openProfile(other.id)
                }}
              >
                دیدن پروفایل
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
