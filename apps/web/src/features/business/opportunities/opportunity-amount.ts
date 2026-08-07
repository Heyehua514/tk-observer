import { formatMoney } from '@/lib/format'

const MAX_SAFE_FEN = BigInt(Number.MAX_SAFE_INTEGER)

export type OpportunityAmountDraft = {
  title: string
  client: string
  amount: string
}

export function yuanToFen(value: string): number | null {
  const normalized = value.trim()
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(normalized)
  if (!match) return null

  const yuan = BigInt(match[1])
  const fraction = (match[2] || '').padEnd(2, '0')
  const fen = yuan * 100n + BigInt(fraction || '0')

  return fen <= MAX_SAFE_FEN ? Number(fen) : null
}

export function formatCny(amountFen: number) {
  return formatMoney(amountFen, 'CNY')
}

export function opportunityCreateInput(draft: OpportunityAmountDraft) {
  const title = draft.title.trim()
  const client = draft.client.trim()
  if (!title || !client) return null

  const amount = yuanToFen(draft.amount)
  if (amount === null) return null

  return {
    title,
    client,
    amount,
  }
}
