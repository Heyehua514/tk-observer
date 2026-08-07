/** 市场工作台类型：为选品库和后续列表 CRUD 预留统一搜索参数。 */
export type MarketSearchParams = {
  query: string
  recordType?: 'product'
  recordId?: string
}

export type EventType =
  'closed_salon' | 'private_dinner' | 'annual_summit' | 'global_study_tour'
export type EventStatus =
  'preparing' | 'sponsoring' | 'scheduled' | 'ongoing' | 'ended' | 'reviewed'
export type Event = {
  id: string
  name: string
  type: EventType
  theme: string
  startDate: string
  locationCity: string
  targetAttendees: number
  targetSponsorship: number
  totalBudget: number
  status: EventStatus
  created: string
  updated: string
}
export type EventInput = Omit<Event, 'id' | 'created' | 'updated'>
export type VenueType =
  'hotel' | 'club' | 'industrial_park' | 'creative_space' | 'study_destination'
export type Venue = {
  id: string
  name: string
  type: VenueType
  city: string
  address: string
  capacityMin: number
  capacityMax: number
  priceRange: string
  sceneTags: string
  pros: string
  cons: string
  contactName: string
  contactPhone: string
  siteVisitDate: string
  siteVisitNotes: string
  isVerified: boolean
  usageCount: number
  created: string
  updated: string
}
export type VenueInput = Omit<Venue, 'id' | 'created' | 'updated'>
