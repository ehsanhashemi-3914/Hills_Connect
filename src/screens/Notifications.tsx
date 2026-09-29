import { useEffect } from 'react'
import { Bell, Briefcase, Handshake, PartyPopper, ThumbsUp } from 'lucide-react'
import type { Notification } from '../data/types'
import * as api from '../data/api'
import { useStore } from '../store'
import { formatListTime } from '../lib/format'
import { Sheet } from '../components/Sheet'
import { Avatar, Empty } from '../components/ui'

const ICONS: Record<Notification['kind'], typeof Bell> = {
  accepted: PartyPopper,
  request: Handshake,
  endorse: ThumbsUp,
  opportunity: Briefcase,
  system: Bell,
}

export function NotificationsSheet() {
  const meId = useStore((s) => s.meId)
  const list = useStore((s) => s.db.notifications[s.meId]) ?? []
  const members = useStore((s) => s.db.members)
  const close = () => useStore.getState().openSheet(undefined)

  // Mark as read when the sheet closes, so unread rows stay highlighted while open.
  useEffect(() => () => void api.markNotificationsRead(meId), [meId])

  return (
    <Sheet title="اعلان‌ها" onClose={close}>
      {list.length === 0 && <Empty icon={Bell} title="اعلانی نداری" />}
      <div style={{ paddingBottom: 12 }}>
        {list.map((n) => {
          const m = n.memberId ? members[n.memberId] : undefined
          const Icon = ICONS[n.kind]
          return (
            <button
              key={n.id}
              className={'notif' + (n.read ? '' : ' unread')}
              onClick={() => {
                const s = useStore.getState()
                close()
                if (n.kind === 'request') s.setTab('network')
                else if (m) s.openProfile(m.id)
                else if (n.kind === 'opportunity') s.setTab('opps')
              }}
            >
              {m ? (
                <Avatar m={m} size={44} />
              ) : (
                <span className="ico">
                  <Icon size={20} />
                </span>
              )}
              <div style={{ flex: 1 }}>
                <div className="t">{n.text}</div>
                <div className="time">{formatListTime(n.at)}</div>
              </div>
            </button>
          )
        })}
      </div>
    </Sheet>
  )
}
