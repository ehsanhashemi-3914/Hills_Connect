export type Role = 'member' | 'mentor' | 'admin'
export type CollabStatus = 'open' | 'busy' | 'hiring'
export type PlatformKey = 'instagram' | 'youtube' | 'linkedin' | 'telegram'

export interface Platform {
  handle: string
  followers?: number
}

export interface PortfolioItem {
  id: string
  title: string
  kind: 'reels' | 'video' | 'design' | 'photo' | 'podcast'
  /** Seed for the generated cover art. */
  hue: number
}

export interface Member {
  id: string
  name: string
  username: string
  color: number
  avatar?: string
  headline: string
  bio: string
  city: string
  role: Role
  verified?: boolean
  featured?: boolean
  suspended?: boolean
  launch: number
  skills: string[]
  lookingFor: string[]
  niches: string[]
  platforms: Partial<Record<PlatformKey, Platform>>
  collab: CollabStatus
  portfolio: PortfolioItem[]
  /** skill → member ids who endorsed it */
  endorsements: Record<string, string[]>
  /** Seeded endorsement counts on top of real endorsers. */
  baseEndorsements?: Record<string, number>
  collabs: number
  rating: number
  /** Revealed only to accepted connections. */
  contact: { telegram?: string; instagram?: string; phone?: string }
  /** Answers to admin-defined custom profile fields. */
  custom: Record<string, string>
  joinedAt: number
  lastActive: number
  phone?: string
  seeded?: boolean
}

export type ConnectionStatus = 'pending' | 'accepted' | 'declined'

export interface Connection {
  id: string
  from: string
  to: string
  note?: string
  status: ConnectionStatus
  createdAt: number
  respondedAt?: number
}

export type OpportunityType = 'collab' | 'job' | 'sponsor' | 'studio'

export interface Opportunity {
  id: string
  authorId: string
  type: OpportunityType
  title: string
  description: string
  skills: string[]
  city?: string
  remote?: boolean
  budget?: string
  status: 'pending' | 'approved' | 'rejected'
  applicants: { memberId: string; note?: string; at: number }[]
  createdAt: number
}

export interface HillsEvent {
  id: string
  title: string
  kind: 'live' | 'meetup' | 'workshop'
  at: number
  place: string
  host: string
  going: string[]
  baseGoing: number
}

export interface Notification {
  id: string
  kind: 'accepted' | 'request' | 'endorse' | 'opportunity' | 'system'
  text: string
  memberId?: string
  at: number
  read?: boolean
}

export interface CustomField {
  id: string
  label: string
  type: 'text' | 'select'
  options?: string[]
  placeholder?: string
  showOnCard?: boolean
}

export interface Launch {
  id: number
  title: string
  members: number
  status: 'done' | 'active' | 'upcoming'
}

export interface Platform_ {
  announcement: { text: string; enabled: boolean }
  customFields: CustomField[]
  launches: Launch[]
  skillCatalog: Record<string, string[]>
}

export interface DB {
  members: Record<string, Member>
  phones: Record<string, string>
  tokens: Record<string, string>
  connections: Connection[]
  opportunities: Opportunity[]
  events: HillsEvent[]
  notifications: Record<string, Notification[]>
  /** Members a user swiped past in the match deck. */
  passed: Record<string, string[]>
  platform: Platform_
  /** Aggregated platform numbers shown on dashboards (the seed is a sample of a 2,800-member community). */
  totals: { members: number; activeWeek: number; collabs: number; weekly: number[] }
}
