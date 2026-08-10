export const requirementStatuses = [
  'pending',
  'in_progress',
  'delivered',
  'revised',
] as const

export type RequirementStatus = (typeof requirementStatuses)[number]

const transitions: Record<RequirementStatus, RequirementStatus[]> = {
  pending: ['in_progress'],
  in_progress: ['delivered'],
  delivered: ['revised'],
  revised: ['in_progress'],
}

export const canTransitionRequirement = (
  from: RequirementStatus,
  to: RequirementStatus
) => transitions[from].includes(to)

export const nextRequirementStatuses = (status: RequirementStatus) =>
  transitions[status]
