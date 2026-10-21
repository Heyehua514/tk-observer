/**
 * 全局搜索结果联动：跨工作台路由与筛选参数携带纯契约
 * 确保点击单项或“在工作台中查看全部”时，完整带入搜索关键词与定位参数。
 */
import type { GlobalSearchKind } from '@/components/shared/global-search-core'

export interface TargetWorkbenchRoute {
  to: string
  search: Record<string, unknown>
  label: string
}

export function buildWorkbenchNavigation(
  kind: GlobalSearchKind,
  searchQuery: string,
  item?: { id: string; label?: string }
): TargetWorkbenchRoute {
  const trimmed = searchQuery.trim()

  switch (kind) {
    case 'creator':
      return {
        to: '/business',
        search: {
          page: 1,
          perPage: 20,
          query: trimmed,
          region: 'all',
          status: 'all',
          bizOnly: false,
          sort: '-updated',
          tab: 'creators',
          companyPage: 1,
          companyQuery: '',
          companyRegion: 'all',
          companyKind: 'all',
          companySort: '-updated',
          ...(item ? { recordType: 'creator', recordId: item.id } : {}),
        },
        label: trimmed
          ? `前往达人管理 (带入「${trimmed}」筛选)`
          : '前往达人管理',
      }

    case 'company':
      return {
        to: '/business',
        search: {
          page: 1,
          perPage: 20,
          query: '',
          region: 'all',
          status: 'all',
          bizOnly: false,
          sort: '-updated',
          tab: 'companies',
          companyPage: 1,
          companyQuery: trimmed,
          companyRegion: 'all',
          companyKind: 'all',
          companySort: '-updated',
          ...(item ? { recordType: 'company', recordId: item.id } : {}),
        },
        label: trimmed
          ? `前往客户管理 (带入「${trimmed}」筛选)`
          : '前往客户管理',
      }

    case 'product':
      return {
        to: '/market',
        search: {
          query: trimmed,
          ...(item ? { recordType: 'product', recordId: item.id } : {}),
        },
        label: trimmed ? `前往选品库 (带入「${trimmed}」筛选)` : '前往选品库',
      }

    case 'account':
      return {
        to: '/editing',
        search: {
          section: 'competitors',
          tab: 'list',
          page: 1,
          perPage: 20,
          query: trimmed,
          account: 'all',
          videoType: 'all',
          tag: '',
          dateFrom: '',
          dateTo: '',
          viral: 'all',
          sort: '-views',
          ...(item ? { recordType: 'account', recordId: item.id } : {}),
        },
        label: trimmed
          ? `前往对标账号 (带入「${trimmed}」筛选)`
          : '前往对标账号',
      }

    case 'video':
      return {
        to: '/editing',
        search: {
          section: 'production',
          tab: 'list',
          page: 1,
          perPage: 20,
          query: trimmed,
          account: 'all',
          videoType: 'all',
          tag: '',
          dateFrom: '',
          dateTo: '',
          viral: 'all',
          sort: '-views',
          ...(item ? { recordType: 'video', recordId: item.id } : {}),
        },
        label: trimmed ? `前往成片库 (带入「${trimmed}」筛选)` : '前往成片库',
      }

    case 'knowledge':
    case 'ai_memory':
      return {
        to: '/overview',
        search: {
          ...(item ? { recordType: kind, recordId: item.id } : {}),
        },
        label: '前往团队总览知识库',
      }
  }
}
