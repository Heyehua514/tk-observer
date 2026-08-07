/** 剪辑工作台稳定枚举、中文标签与默认筛选参数。 */
import type {
  EditingSearchParams,
  HeatLevel,
  VideoAccount,
  VideoType,
} from './types'

export const videoAccounts = [
  '跨境TK磊哥',
  'TK观察磊哥',
  '磊哥出海笔记',
] as const satisfies readonly VideoAccount[]

export const videoTypes = [
  '口播',
  '专访预热',
  '专访正片',
  '专访花絮',
  '快问快答',
  '茶话会',
  '饭局交流',
  '饭局感受',
] as const satisfies readonly VideoType[]

export const accountVideoTypes: Record<VideoAccount, readonly VideoType[]> = {
  跨境TK磊哥: ['口播', '专访预热', '专访正片', '专访花絮'],
  TK观察磊哥: ['快问快答'],
  磊哥出海笔记: ['茶话会', '饭局交流', '饭局感受'],
}

export const heatLevels = [
  '高',
  '中',
  '低',
] as const satisfies readonly HeatLevel[]

export const defaultEditingSearch: EditingSearchParams = {
  section: 'ideas',
  tab: 'list',
  page: 1,
  perPage: 20,
  query: '',
  account: 'all',
  videoType: 'all',
  tag: '',
  dateFrom: '',
  dateTo: '',
  viral: 'all',
  sort: '-views',
}

export const csvTemplateHeaders = [
  '标题',
  '账号',
  '视频类型',
  '播放量',
  '完播率',
  '涨粉',
  '点赞',
  '评论',
  '转发',
  '发布日期',
  '标签',
  '内容简述',
] as const

export const styleAnalysisSections = [
  ['contentStyle', '内容风格'],
  ['titlePattern', '标题套路'],
  ['hookMethod', '钩子手法'],
  ['editingStyle', '剪辑手法'],
  ['viralFactors', '爆款因素'],
  ['applicableToUs', '对 TK观察的可借鉴建议'],
] as const
