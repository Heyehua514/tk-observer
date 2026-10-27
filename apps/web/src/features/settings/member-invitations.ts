/** 成员邀请的数据契约与 Supabase 读写；角色始终由 owner 显式指定，不接受注册端角色字段。 */
import type { UserRole } from '@/types/auth'
import type { Database } from '@/types/database.generated'
import { getDataProvider } from '@/lib/data-provider'
import { getSupabaseClient } from '@/lib/supabase'

type InvitationRow = Database['public']['Tables']['member_invitations']['Row']

export const invitationRoles = [
  'boss',
  'business',
  'market',
  'design',
  'editing',
] as const satisfies readonly Exclude<UserRole, 'owner'>[]

export type InvitationRole = (typeof invitationRoles)[number]
export type InvitationStatus = 'invited' | 'accepted' | 'revoked' | 'expired'

export type MemberInvitation = {
  id: string
  email: string
  name: string
  role: InvitationRole
  status: InvitationStatus
  expiresAt: string
  acceptedAt: string | null
  createdAt: string
}

export type CreateInvitationInput = {
  email: string
  name: string
  role: InvitationRole
}

function isInvitationRole(value: string): value is InvitationRole {
  return invitationRoles.some((role) => role === value)
}

export function normalizeInvitationEmail(email: string) {
  return email.trim().toLowerCase()
}

export function getEffectiveInvitationStatus(
  invitation: Pick<MemberInvitation, 'status' | 'expiresAt'>,
  now = Date.now()
): InvitationStatus {
  if (invitation.status !== 'invited') return invitation.status
  return new Date(invitation.expiresAt).getTime() <= now ? 'expired' : 'invited'
}

export function mapMemberInvitation(
  row: Pick<
    InvitationRow,
    | 'id'
    | 'email'
    | 'name'
    | 'role'
    | 'status'
    | 'expires_at'
    | 'accepted_at'
    | 'created_at'
  >
): MemberInvitation | null {
  if (!isInvitationRole(row.role)) return null
  if (!['invited', 'accepted', 'revoked', 'expired'].includes(row.status)) {
    return null
  }
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    status: row.status as InvitationStatus,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at,
  }
}

const invitationSelect =
  'id,email,name,role,status,expires_at,accepted_at,created_at'

export async function listMemberInvitations() {
  if (getDataProvider() !== 'supabase') return []
  const { data, error } = await getSupabaseClient()
    .from('member_invitations')
    .select(invitationSelect)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || [])
    .map((row) => mapMemberInvitation(row))
    .filter((row): row is MemberInvitation => Boolean(row))
}

export async function saveMemberInvitation(
  input: CreateInvitationInput,
  invitedBy: string
) {
  if (getDataProvider() !== 'supabase') {
    throw new Error('成员邀请仅在 Supabase 数据源可用')
  }

  const email = normalizeInvitationEmail(input.email)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const supabase = getSupabaseClient()
  const { data: existing, error: lookupError } = await supabase
    .from('member_invitations')
    .select('id,status')
    .eq('email', email)
    .maybeSingle()
  if (lookupError) throw lookupError
  if (existing?.status === 'accepted') {
    throw new Error('该邮箱已完成邀请，不能重复邀请')
  }

  const payload = {
    email,
    name: input.name.trim(),
    role: input.role,
    status: 'invited' as const,
    invited_by: invitedBy,
    expires_at: expiresAt,
    accepted_at: null,
  }

  const query = existing
    ? supabase.from('member_invitations').update(payload).eq('id', existing.id)
    : supabase.from('member_invitations').insert(payload)
  const { data, error } = await query.select(invitationSelect).single()
  if (error) throw error
  const invitation = mapMemberInvitation(data)
  if (!invitation) throw new Error('邀请数据无效')
  return invitation
}

export async function revokeMemberInvitation(id: string) {
  if (getDataProvider() !== 'supabase') {
    throw new Error('成员邀请仅在 Supabase 数据源可用')
  }
  const { data, error } = await getSupabaseClient()
    .from('member_invitations')
    .update({ status: 'revoked', accepted_at: null })
    .eq('id', id)
    .select(invitationSelect)
    .single()
  if (error) throw error
  const invitation = mapMemberInvitation(data)
  if (!invitation) throw new Error('邀请数据无效')
  return invitation
}
