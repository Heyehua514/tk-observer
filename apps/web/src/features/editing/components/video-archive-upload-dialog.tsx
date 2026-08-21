/** 成片归档上传对话框：标题/站点/发布日期/产品/达人 + 视频文件（Storage video-files）。 */
import { useState } from 'react'
import { format, parseISO } from 'date-fns'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/date-picker'
import { useCreateVideoArchive } from '../hooks/use-create-video-archive'
import type { VideoArchiveInput } from '../types'
import { isSupportedVideoFile } from './video-archive-upload'

const emptyInput: Omit<VideoArchiveInput, 'file'> = {
  title: '',
  region: 'US',
  publishAt: '',
  productName: '',
  creatorName: '',
}

export function VideoArchiveUploadDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const uploadArchive = useCreateVideoArchive()
  const [values, setValues] = useState(emptyInput)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')

  const pickFile = (next: File | undefined) => {
    setFileError('')
    if (!next) {
      setFile(null)
      return
    }
    setFile(next)
    if (!isSupportedVideoFile(next)) {
      setFileError('仅支持 MP4 / WebM / MOV，且文件不超过 512MB')
    }
  }

  const canSubmit =
    values.title.trim().length > 0 &&
    Boolean(file) &&
    isSupportedVideoFile(file ?? { type: '', size: 0 }) &&
    !uploadArchive.isPending

  const submit = () => {
    if (!file) return
    void uploadArchive.mutateAsync({ ...values, file }).then(() => {
      setValues(emptyInput)
      setFile(null)
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>上传成片</DialogTitle>
          <DialogDescription>
            归档后的成片会存入私有存储，并在列表内支持浏览器预览。
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label>成片标题</Label>
            <Input
              placeholder='如：厦门闭门沙龙正片'
              value={values.title}
              onChange={(event) =>
                setValues({ ...values, title: event.target.value })
              }
            />
          </div>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>目标站点</Label>
              <Select
                value={values.region}
                onValueChange={(region) => setValues({ ...values, region })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>发布日期</Label>
              <DatePicker
                selected={
                  values.publishAt ? parseISO(values.publishAt) : undefined
                }
                onSelect={(date) =>
                  setValues({
                    ...values,
                    publishAt: date ? format(date, 'yyyy-MM-dd') : '',
                  })
                }
                placeholder='选择发布日期'
              />
            </div>
          </div>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>关联产品</Label>
              <Input
                placeholder='如：TK 店铺运营陪跑'
                value={values.productName}
                onChange={(event) =>
                  setValues({ ...values, productName: event.target.value })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>关联达人</Label>
              <Input
                placeholder='如：磊哥'
                value={values.creatorName}
                onChange={(event) =>
                  setValues({ ...values, creatorName: event.target.value })
                }
              />
            </div>
          </div>
          <div className='space-y-2'>
            <Label>视频文件</Label>
            <Input
              type='file'
              accept='video/mp4,video/webm,video/quicktime'
              onChange={(event) => pickFile(event.target.files?.[0])}
            />
            {fileError && (
              <p className='text-sm text-destructive'>{fileError}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {uploadArchive.isPending && (
              <LoaderCircle className='animate-spin' />
            )}
            上传归档
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
