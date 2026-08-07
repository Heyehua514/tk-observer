import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { companyKindLabels, companyKinds, regions } from '../constants'
import {
  useCreateCompany,
  useUpdateCompany,
} from '../hooks/use-company-mutations'
import type { Company, CompanyInput } from '../types'

const schema = z.object({
  companyName: z.string().trim().min(1, '请输入公司名称').max(160),
  kind: z.enum(companyKinds),
  contactName: z.string().trim().max(80),
  contactEmail: z.union([z.literal(''), z.string().email('请输入有效邮箱')]),
  region: z.enum(regions),
})
const empty: CompanyInput = {
  companyName: '',
  kind: 'client',
  contactName: '',
  contactEmail: '',
  region: 'US',
}

export function CompanyFormDialog({
  open,
  onOpenChange,
  company,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  company: Company | null
}) {
  const create = useCreateCompany()
  const update = useUpdateCompany()
  const form = useForm<CompanyInput>({
    resolver: zodResolver(schema),
    defaultValues: empty,
  })
  useEffect(() => {
    form.reset(
      company
        ? {
            companyName: company.companyName,
            kind: company.kind,
            contactName: company.contactName,
            contactEmail: company.contactEmail,
            region: company.region,
          }
        : empty
    )
  }, [company, form, open])
  const submit = async (input: CompanyInput) => {
    if (company) await update.mutateAsync({ id: company.id, input })
    else await create.mutateAsync(input)
    onOpenChange(false)
  }
  const pending = create.isPending || update.isPending
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{company ? '编辑公司' : '新增公司'}</DialogTitle>
          <DialogDescription>维护客户或供应商的联系资料。</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className='grid gap-4 sm:grid-cols-2'
            onSubmit={form.handleSubmit(submit)}
          >
            <FormField
              control={form.control}
              name='companyName'
              render={({ field }) => (
                <FormItem className='sm:col-span-2'>
                  <FormLabel>公司名称</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='kind'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>类型</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {companyKinds.map((kind) => (
                        <SelectItem key={kind} value={kind}>
                          {companyKindLabels[kind]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='region'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>地区</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='contactName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>联系人</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='contactEmail'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>邮箱</FormLabel>
                  <FormControl>
                    <Input type='email' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className='sm:col-span-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button type='submit' disabled={pending}>
                {pending && <LoaderCircle className='size-4 animate-spin' />}
                保存
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
