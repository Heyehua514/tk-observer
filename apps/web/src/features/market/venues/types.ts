/** 市场工作台场地资源类型。权限：market、boss。 */
export const venueTypes = [
  'hotel',
  'club',
  'industrial_park',
  'creative_space',
  'study_destination',
] as const
export type VenueType = (typeof venueTypes)[number]
export const venueTypeLabels: Record<VenueType, string> = {
  hotel: '五星酒店',
  club: '高端会所',
  industrial_park: '产业园区',
  creative_space: '创意空间',
  study_destination: '游学目的地',
}
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
  photos: string[]
  isVerified: boolean
  usageCount: number
  created: string
  updated: string
}
export type VenueFilters = {
  query: string
  city: string
  type: VenueType | 'all'
  attendees: number
}
export type VenueInput = Omit<
  Venue,
  'id' | 'photos' | 'usageCount' | 'created' | 'updated'
>
