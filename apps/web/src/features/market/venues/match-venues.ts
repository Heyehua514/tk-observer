/** 场地快速匹配的确定性规则，供 UI 和测试复用。 */
import type { Venue, VenueFilters } from './types'

export function matchesVenue(venue: Venue, filters: VenueFilters) {
  const q = filters.query.trim().toLocaleLowerCase()
  return (
    (!q ||
      `${venue.name} ${venue.sceneTags}`.toLocaleLowerCase().includes(q)) &&
    (!filters.city || venue.city === filters.city) &&
    (filters.type === 'all' || venue.type === filters.type) &&
    (!filters.attendees ||
      (venue.capacityMin <= filters.attendees &&
        venue.capacityMax >= filters.attendees))
  )
}
export const matchVenues = (venues: Venue[], filters: VenueFilters) =>
  venues.filter((venue) => matchesVenue(venue, filters))
