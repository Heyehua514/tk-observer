/** 成员邀请查询与写入；仅 owner 设置页启用。 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listMemberInvitations,
  revokeMemberInvitation,
  saveMemberInvitation,
  type CreateInvitationInput,
} from '../member-invitations'

const memberInvitationsKey = ['settings', 'member-invitations'] as const

export function useMemberInvitations(enabled: boolean) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: memberInvitationsKey,
    enabled,
    queryFn: listMemberInvitations,
  })
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: memberInvitationsKey })
  const save = useMutation({
    mutationFn: ({
      input,
      invitedBy,
    }: {
      input: CreateInvitationInput
      invitedBy: string
    }) => saveMemberInvitation(input, invitedBy),
    onSuccess: async () => invalidate(),
  })
  const revoke = useMutation({
    mutationFn: revokeMemberInvitation,
    onSuccess: async () => invalidate(),
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    save: save.mutateAsync,
    revoke: revoke.mutateAsync,
    isSaving: save.isPending || revoke.isPending,
  }
}
