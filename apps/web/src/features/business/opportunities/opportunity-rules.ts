export const opportunityStages = [
  'contact',
  'proposal',
  'negotiation',
  'contract',
  'won',
  'lost',
] as const
export type OpportunityStage = (typeof opportunityStages)[number]

export const stageProbability: Record<OpportunityStage, number> = {
  contact: 10,
  proposal: 30,
  negotiation: 60,
  contract: 80,
  won: 100,
  lost: 0,
}

export function opportunityStagePatch(
  stage: OpportunityStage,
  lostReason = ''
) {
  if (stage === 'lost' && !lostReason.trim())
    throw new Error('LOST_REASON_REQUIRED')
  return {
    stage,
    probability: stageProbability[stage],
    lost_reason: stage === 'lost' ? lostReason.trim() : '',
  }
}
