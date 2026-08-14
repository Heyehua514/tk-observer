/** 商务工作台领域类型；新增商务模块时在此补充类型。 */
import type { Region } from '@/types/commerce'
import type { ListResult } from 'pocketbase'

export type { Region } from '@/types/commerce'
export type CooperationStatus =
  'pending' | 'contacting' | 'signed' | 'terminated'

export type Creator = {
  id: string
  nickname: string
  tiktokUrl: string
  followers: number
  region: Region
  cooperationStatus: CooperationStatus
  commissionRate: number
  owner: string
  isBizAvailable: boolean
  cooperationPrice: number
  cooperationNotes: string
  created: string
  updated: string
}

export type CreatorInput = Omit<Creator, 'id' | 'created' | 'updated'>

export type CreatorListParams = {
  page: number
  perPage: number
  query: string
  region: Region | 'all'
  status: CooperationStatus | 'all'
  bizOnly: boolean
  sort:
    'created' | '-created' | 'updated' | '-updated' | 'nickname' | '-nickname'
}

export type CreatorListResult = Omit<ListResult<Creator>, 'items'> & {
  items: Creator[]
}

export type CompanyKind = 'client' | 'supplier'

export type Company = {
  id: string
  companyName: string
  kind: CompanyKind
  contactName: string
  contactEmail: string
  region: Region
  created: string
  updated: string
}

export type CompanyInput = Omit<Company, 'id' | 'created' | 'updated'>

export type CompanyListParams = {
  page: number
  perPage: number
  query: string
  region: Region | 'all'
  kind: CompanyKind | 'all'
  sort: '-updated' | '-created' | 'company_name' | '-company_name'
}

export type CompanyListResult = Omit<ListResult<Company>, 'items'> & {
  items: Company[]
}

export type CreatorVideo = {
  id: string
  title: string
  productName: string
  region: Region
  publishAt: string
  updated: string
}
