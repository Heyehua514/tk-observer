/**
 * 设计素材上传表单。
 * 路由：/design；权限：design, boss；依赖：react-hook-form + zod。
 */
import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { regions } from '@/types/commerce'
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
import { useCreateDesignAsset } from '../hooks/use-create-design-asset'

const schema = z.object({
  fileName: z.string().trim().min(1, '请输入文件名').max(180),
  file: z.instanceof(File, { message: '请选择图片文件' }),
  dimensions: z.string().trim().max(40),
  region: z.enum(regions),
})
type Values = z.infer<typeof schema>

export function DesignAssetUploadDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const createAsset = useCreateDesignAsset()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { fileName: '', dimensions: '', region: 'US' },
  })
  useEffect(() => {
    if (!open) form.reset({ fileName: '', dimensions: '', region: 'US' })
  }, [form, open])

  const submit = async (values: Values) => {
    await createAsset.mutateAsync(values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>上传设计素材</DialogTitle>
          <DialogDescription>
            上传后默认为草稿，可再提交审核。
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className='space-y-4' onSubmit={form.handleSubmit(submit)}>
            <FormField
              control={form.control}
              name='fileName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>文件名</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='file'
              render={({ field: { onChange } }) => (
                <FormItem>
                  <FormLabel>图片文件</FormLabel>
                  <FormControl>
                    <Input
                      type='file'
                      accept='image/png,image/jpeg,image/webp,image/gif'
                      onChange={(event) => onChange(event.target.files?.[0])}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='dimensions'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>尺寸</FormLabel>
                    <FormControl>
                      <Input placeholder='1080 x 1920' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='region'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>站点</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className='w-full'>
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
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button type='submit' disabled={createAsset.isPending}>
                {createAsset.isPending && (
                  <LoaderCircle className='size-4 animate-spin' />
                )}
                上传素材
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
