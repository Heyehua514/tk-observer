import { useState } from 'react'
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { formatBeijingTime } from '@/lib/format'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import { FilterBar } from '@/components/shared/filter-bar'
import { SearchBar } from '@/components/shared/search-bar'
import { companyKindLabels, companyKinds, regions } from '../constants'
import { useCompanies } from '../hooks/use-companies'
import { useDeleteCompany } from '../hooks/use-company-mutations'
import type { Company, CompanyListParams } from '../types'
import { CompanyFormDialog } from './company-form'

export function CompanyTable({
  params,
  onParamsChange,
}: {
  params: CompanyListParams
  onParamsChange: (patch: Partial<CompanyListParams>) => void
}) {
  const companies = useCompanies(params)
  const remove = useDeleteCompany()
  const [editing, setEditing] = useState<Company | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const reset = () =>
    onParamsChange({
      query: '',
      region: 'all',
      kind: 'all',
      sort: '-updated',
      page: 1,
    })
  const latest = companies.data?.items.reduce(
    (value, item) => (item.updated > value ? item.updated : value),
    ''
  )
  return (
    <div className='space-y-4'>
      <FilterBar onReset={reset}>
        <SearchBar
          value={params.query}
          onChange={(query) => onParamsChange({ query, page: 1 })}
          placeholder='搜索公司、联系人或邮箱'
        />
        <Select
          value={params.kind}
          onValueChange={(kind) =>
            onParamsChange({ kind: kind as CompanyListParams['kind'], page: 1 })
          }
        >
          <SelectTrigger className='w-32'>
            <SelectValue placeholder='类型' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>全部类型</SelectItem>
            {companyKinds.map((kind) => (
              <SelectItem key={kind} value={kind}>
                {companyKindLabels[kind]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={params.region}
          onValueChange={(region) =>
            onParamsChange({
              region: region as CompanyListParams['region'],
              page: 1,
            })
          }
        >
          <SelectTrigger className='w-28'>
            <SelectValue placeholder='地区' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>全部地区</SelectItem>
            {regions.map((region) => (
              <SelectItem key={region} value={region}>
                {region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={params.sort}
          onValueChange={(sort) =>
            onParamsChange({ sort: sort as CompanyListParams['sort'], page: 1 })
          }
        >
          <SelectTrigger className='w-32'>
            <SelectValue placeholder='排序' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='-updated'>最近更新</SelectItem>
            <SelectItem value='-created'>最近创建</SelectItem>
            <SelectItem value='company_name'>名称 A-Z</SelectItem>
            <SelectItem value='-company_name'>名称 Z-A</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>
      <div className='flex justify-end'>
        <Button
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          <Plus className='size-4' />
          新增公司
        </Button>
      </div>
      {companies.isLoading ? (
        <div className='flex min-h-64 items-center justify-center text-sm text-muted-foreground'>
          正在加载公司数据…
        </div>
      ) : companies.data?.items.length === 0 ? (
        <EmptyState
          title='还没有客户或供应商'
          description='新增公司资料，集中维护合作方联系信息。'
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className='size-4' />
              新增公司
            </Button>
          }
        />
      ) : (
        <div className='overflow-hidden rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>公司名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>联系人</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>地区</TableHead>
                <TableHead>更新时间</TableHead>
                <TableHead className='w-12' />
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.data?.items.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className='font-medium'>
                    {company.companyName}
                  </TableCell>
                  <TableCell>
                    <Badge variant='secondary'>
                      {companyKindLabels[company.kind]}
                    </Badge>
                  </TableCell>
                  <TableCell>{company.contactName || '—'}</TableCell>
                  <TableCell>{company.contactEmail || '—'}</TableCell>
                  <TableCell>{company.region}</TableCell>
                  <TableCell>{formatBeijingTime(company.updated)}</TableCell>
                  <TableCell>
                    <Dropdown
                      company={company}
                      onEdit={() => {
                        setEditing(company)
                        setFormOpen(true)
                      }}
                      onDelete={() => setDeleteId(company.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <div className='flex items-center justify-between text-sm text-muted-foreground'>
        <span>
          {latest ? `数据更新于 ${formatBeijingTime(latest)}` : '等待首条数据'}
        </span>
        <span>
          第 {companies.data?.page || params.page} /{' '}
          {Math.max(companies.data?.totalPages || 1, 1)} 页，共{' '}
          {companies.data?.totalItems || 0} 条
        </span>
      </div>
      <CompanyFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        company={editing}
      />
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除公司资料？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后无法恢复，关联的审计记录仍会保留。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) void remove.mutateAsync(deleteId)
                setDeleteId(null)
              }}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function Dropdown({
  company,
  onEdit,
  onDelete,
}: {
  company: Company
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          aria-label={`${company.companyName}操作`}
        >
          <MoreHorizontal className='size-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil className='size-4' />
          编辑
        </DropdownMenuItem>
        <DropdownMenuItem variant='destructive' onSelect={onDelete}>
          <Trash2 className='size-4' />
          删除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
