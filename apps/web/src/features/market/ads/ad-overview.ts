/** 市场工作台投放概览模型；后续接真实投放表时保持组件入参不变。 */
export type AdRegionDatum = {
  region: string
  value: number
}

export type AdSummaryDatum = {
  label: string
  value: string
  delta: string
}

export type AdOverview = {
  regions: AdRegionDatum[]
  summary: AdSummaryDatum[]
}

export function buildAdOverview(): AdOverview {
  return {
    regions: [
      { region: 'US', value: 18 },
      { region: 'UK', value: 12 },
      { region: 'TH', value: 9 },
      { region: 'ID', value: 15 },
    ],
    summary: [
      { label: '本月投放', value: '8 条', delta: '+2' },
      { label: '高转化素材', value: '3 条', delta: '+1' },
      { label: '有效站点', value: '4 个', delta: '+1' },
    ],
  }
}
