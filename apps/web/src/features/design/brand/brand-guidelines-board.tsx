import { useState } from 'react'
import { Copy, Check, ShieldAlert, Type, Palette } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DEFAULT_BRAND_GUIDELINES, filterBrandColors } from './brand-guidelines-model'

export function BrandGuidelinesBoard() {
  const [activeRole, setActiveRole] = useState<string>('all')
  const [copiedHex, setCopiedHex] = useState<string | null>(null)

  const copyHex = (hex: string) => {
    navigator.clipboard.writeText(hex)
    setCopiedHex(hex)
    toast.success(`色值 ${hex} 已复制到剪贴板`)
    setTimeout(() => setCopiedHex(null), 1500)
  }

  const displayedColors = filterBrandColors(DEFAULT_BRAND_GUIDELINES.colors, activeRole)

  return (
    <div className='space-y-6'>
      <Card className='border-cyan-500/20 bg-slate-900/60 backdrop-blur'>
        <CardHeader className='flex flex-row items-center justify-between pb-3'>
          <div>
            <CardTitle className='flex items-center gap-2 text-lg text-slate-100'>
              <Palette className='h-5 w-5 text-cyan-400' />
              品牌规范数据看板 (Design System)
            </CardTitle>
            <CardDescription className='text-slate-400'>
              集中呈现品牌色彩体系、标准字阶规格与设计合规红线。点击色值可快速复制。
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue='colors' className='space-y-4'>
            <TabsList className='bg-slate-950/60 border border-slate-800'>
              <TabsTrigger value='colors' className='data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400'>
                <Palette className='mr-1.5 h-4 w-4' /> 调色板 ({DEFAULT_BRAND_GUIDELINES.colors.length})
              </TabsTrigger>
              <TabsTrigger value='typography' className='data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400'>
                <Type className='mr-1.5 h-4 w-4' /> 字阶层级 ({DEFAULT_BRAND_GUIDELINES.typography.length})
              </TabsTrigger>
              <TabsTrigger value='prohibitions' className='data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400'>
                <ShieldAlert className='mr-1.5 h-4 w-4' /> 合规红线 ({DEFAULT_BRAND_GUIDELINES.prohibitions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value='colors' className='space-y-4'>
              <div className='flex flex-wrap gap-2 pt-1'>
                {([
                  { label: '全部', val: 'all' },
                  { label: '品牌主色', val: 'primary' },
                  { label: '辅助/分类', val: 'secondary' },
                  { label: '状态点缀', val: 'accent' },
                  { label: '背景与中性', val: 'background' },
                ] as const).map((tab) => (
                  <Button
                    key={tab.val}
                    variant={activeRole === tab.val ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setActiveRole(tab.val)}
                    className={activeRole === tab.val ? 'bg-cyan-600 text-white hover:bg-cyan-500' : 'border-slate-800 text-slate-300 hover:bg-slate-800'}
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
              <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                {displayedColors.map((color) => (
                  <div
                    key={color.name}
                    onClick={() => copyHex(color.hex)}
                    className='group relative flex cursor-pointer items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/40 p-3 transition hover:border-cyan-500/40 hover:bg-slate-800/30'
                  >
                    <div className='flex items-center gap-3'>
                      <div
                        className='h-10 w-10 shrink-0 rounded-md border border-slate-700/60 shadow-inner'
                        style={{ backgroundColor: color.hex }}
                      />
                      <div>
                        <div className='text-sm font-medium text-slate-200'>{color.name}</div>
                        <div className='text-xs text-slate-400'>{color.usage}</div>
                      </div>
                    </div>
                    <div className='flex items-center gap-1.5 pl-2'>
                      <span className='font-mono text-xs text-cyan-400'>{color.hex}</span>
                      {copiedHex === color.hex ? (
                        <Check className='h-3.5 w-3.5 text-emerald-400' />
                      ) : (
                        <Copy className='h-3.5 w-3.5 text-slate-500 opacity-0 transition group-hover:opacity-100' />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value='typography'>
              <div className='divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-950/40'>
                {DEFAULT_BRAND_GUIDELINES.typography.map((t) => (
                  <div key={t.level} className='flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between'>
                    <div>
                      <div className='text-sm font-medium text-slate-200'>{t.level}</div>
                      <div className='text-xs text-slate-400'>{t.usage}</div>
                    </div>
                    <div className='flex items-center gap-3 font-mono text-xs text-slate-300'>
                      <Badge variant='outline' className='border-slate-700 bg-slate-900/60'>字号: {t.fontSize}</Badge>
                      <Badge variant='outline' className='border-slate-700 bg-slate-900/60'>行高: {t.lineHeight}</Badge>
                      <Badge variant='outline' className='border-slate-700 bg-slate-900/60'>字重: {t.fontWeight}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value='prohibitions'>
              <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                {DEFAULT_BRAND_GUIDELINES.prohibitions.map((p) => (
                  <div
                    key={p.rule}
                    className='rounded-lg border border-amber-500/20 bg-amber-500/5 p-3.5 text-slate-200'
                  >
                    <div className='flex items-center justify-between pb-1.5'>
                      <span className='text-sm font-semibold text-amber-400'>{p.rule}</span>
                      <Badge
                        variant='destructive'
                        className={p.severity === 'forbidden' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px]' : 'bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]'}
                      >
                        {p.severity === 'forbidden' ? '严禁' : '警示'}
                      </Badge>
                    </div>
                    <p className='text-xs text-slate-400'>{p.description}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
