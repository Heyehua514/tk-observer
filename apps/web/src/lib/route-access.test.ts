import type { UserRole } from '@/types/auth'
import { describe, expect, it } from 'vitest'
import {
  canAccessPath,
  canRoleAccess,
  getRouteRoles,
  type ProtectedAppPath,
} from './route-access'

const visibleMatrix: Record<
  Exclude<UserRole, 'owner' | 'boss'>,
  Record<ProtectedAppPath, boolean>
> = {
  business: {
    '/overview': false,
    '/overview/calendar': false,
    '/business': true,
    '/market': false,
    '/design': true,
    '/editing': true,
    '/intelligence': true,
    '/search': true,
    '/notifications': true,
    '/settings': true,
  },
  market: {
    '/overview': false,
    '/overview/calendar': false,
    '/business': false,
    '/market': true,
    '/design': false,
    '/editing': false,
    '/intelligence': true,
    '/search': true,
    '/notifications': true,
    '/settings': true,
  },
  design: {
    '/overview': false,
    '/overview/calendar': false,
    '/business': false,
    '/market': false,
    '/design': true,
    '/editing': false,
    '/intelligence': true,
    '/search': true,
    '/notifications': true,
    '/settings': true,
  },
  editing: {
    '/overview': false,
    '/overview/calendar': false,
    '/business': false,
    '/market': false,
    '/design': false,
    '/editing': true,
    '/intelligence': true,
    '/search': true,
    '/notifications': true,
    '/settings': true,
  },
}

describe('route access matrix', () => {
  it('enforces the five-role workbench and shared-route matrix', () => {
    for (const [role, paths] of Object.entries(visibleMatrix) as Array<
      [keyof typeof visibleMatrix, Record<ProtectedAppPath, boolean>]
    >) {
      for (const [path, expected] of Object.entries(paths) as Array<
        [ProtectedAppPath, boolean]
      >) {
        expect(canAccessPath(role, path), `${role} -> ${path}`).toBe(expected)
      }
    }
  })

  it('gives owner and boss supervisory access to every protected path', () => {
    const paths = Object.keys(visibleMatrix.business) as ProtectedAppPath[]
    for (const path of paths) {
      expect(canAccessPath('owner', path), `owner -> ${path}`).toBe(true)
      expect(canAccessPath('boss', path), `boss -> ${path}`).toBe(true)
    }
  })

  it('keeps role checks pure and reusable by route guards', () => {
    expect(canRoleAccess('business', ['business'])).toBe(true)
    expect(canRoleAccess('market', ['business'])).toBe(false)
    expect(getRouteRoles('/design')).toEqual(['design', 'business'])
    expect(getRouteRoles('/settings')).toHaveLength(6)
  })
})
