/** 总览工作台团队记忆只读类型；权限：boss。 */
export type TeamMemoryFailedCase = {
  id: string
  reason: string
  recordedAt: string
}

export type TeamMemoryMetrics = {
  topLessons: Array<{ reason: string; count: number }>
  loop: {
    cronRuns: number
    templateUses: number
    failedCases: number
  }
}

export type TeamMemoryData = TeamMemoryMetrics & {
  dailyHighlight: string
  dailyDate: string
}
