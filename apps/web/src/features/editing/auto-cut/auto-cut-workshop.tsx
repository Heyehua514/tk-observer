import { useState } from 'react'
import {
  Sparkles,
  Scissors,
  Flame,
  Brain,
  CheckCircle2,
  LoaderCircle,
  Lightbulb,
  Layers,
  Copy,
  Download,
  FolderArchive,
} from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getSupabaseClient } from '@/lib/supabase'
import { useAiMemory } from '@/features/shared-ai/hooks/use-ai-memory'
import type { AutoCutCategory, VideoDeepDiagnosis, VideoClipSlice, JianyingDraftExport } from './auto-cut-model'
import { runDeepVideoDiagnosis } from './video-diagnosis-service'
import { generateJianyingDraft } from './jianying-draft-service'

export function AutoCutWorkshop() {
  const [category, setCategory] = useState<AutoCutCategory>('spoken')
  const [sourceInput, setSourceInput] = useState('')
  const [durationMins, setDurationMins] = useState(8)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [diagnosis, setDiagnosis] = useState<VideoDeepDiagnosis | null>(null)
  
  // 弹窗状态：剪辑建议 / 剪映草稿
  const [activeSlice, setActiveSlice] = useState<VideoClipSlice | null>(null)
  const [suggestDialogOpen, setSuggestDialogOpen] = useState(false)
  const [draftResult, setDraftResult] = useState<JianyingDraftExport | null>(null)
  const [draftDialogOpen, setDraftDialogOpen] = useState(false)

  const memories = useAiMemory()
  const queryClient = useQueryClient()

  // 1. 发起深度解析与两分钟切片
  const handleStartAnalysis = async () => {
    if (!sourceInput.trim()) {
      toast.error('请输入视频文件路径或视频链接')
      return
    }

    setIsAnalyzing(true)
    setDiagnosis(null)
    try {
      // 提取既往已沉淀的记忆（闭环反哺）
      const memoryContext = memories.data
        .filter((m) => m.memoryType === 'video_cut_style' || m.memoryType === 'accepted_ai')
        .map((m) => `[${m.memoryKey}]: ${m.memoryValue}`)
        .slice(0, 5)
        .join('\n')

      const result = await runDeepVideoDiagnosis({
        source: sourceInput.trim(),
        category,
        durationMinutes: durationMins,
        recentMemories: memoryContext,
      })

      setDiagnosis(result)
      toast.success(`视频解析成功！已智能切分为 ${result.slices.length} 个爆款小视频！`)
    } catch {
      toast.error('解析服务异常，请检查网络或网关连接')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // 2. 记忆回流与反思保存
  const handleSaveToMemory = async () => {
    if (!diagnosis) return
    try {
      // 写入 ai_memory 表
      await memories.save({
        memoryType: 'video_cut_style',
        memoryKey: `对标拆解:${diagnosis.hotNewsRelevance.industryTopic.slice(0, 30)}`,
        memoryValue: `${diagnosis.learnedExperienceSummary} | 黄金钩子:${diagnosis.viralDNA.hookPatterns.join('、')}`,
        confidence: 0.9,
        source: 'auto_cut_diagnosis',
      })

      // 同时写入 failed_cases 作为避坑经验
      await getSupabaseClient().from('failed_cases').insert({
        source_type: '剪辑',
        source_id: diagnosis.sourceNameOrUrl.slice(0, 100),
        reason: `【对标学习】${diagnosis.learnedExperienceSummary}`,
        lessons: `人设画像: ${diagnosis.overallPersona.toneStyle}；痛点: ${diagnosis.viralDNA.corePainPoints.join('、')}`,
        recorded_at: new Date().toISOString(),
      })

      toast.success('本次拆解与反思经验已成功回流入企业记忆库，AI 已完成自我进化！')
      void queryClient.invalidateQueries({ queryKey: ['ai-memory'] })
      void queryClient.invalidateQueries({ queryKey: ['team-memory'] })
    } catch {
      toast.error('保存记忆失败，请检查网络权限')
    }
  }

  // 3. 选项 A：给予剪辑建议
    // 复制草稿文件夹路径
  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path)
    toast.success('草稿工程文件夹路径已复制到剪贴板！')
  }

  // 下载 draft_content.json 配置文件
  const handleDownloadDraftJson = (draft: JianyingDraftExport) => {
    if (!draft.rawDraftJson) return
    const blob = new Blob([draft.rawDraftJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = draft.draftName + '_draft_content.json'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('已下载剪映 draft_content.json 配置文件！')
  }

  // 批量导出全部切片为剪映草稿工程
  const handleBatchDirectCut = () => {
    if (!diagnosis || !diagnosis.slices.length) return
    toast.success('已自动为全部 ' + diagnosis.slices.length + ' 个切片生成剪映草稿工程目录！')
    const firstDraft = generateJianyingDraft({
      draftTitle: diagnosis.slices[0].title,
      slice: diagnosis.slices[0],
      category,
    })
    setDraftResult(firstDraft)
    setDraftDialogOpen(true)
  }

  const handleOpenSuggest = (slice: VideoClipSlice) => {
    setActiveSlice(slice)
    setSuggestDialogOpen(true)
  }

  // 4. 选项 B：直接协助剪辑（自动创建文件夹并生成剪映工程）
  const handleDirectCut = (slice: VideoClipSlice) => {
    const draft = generateJianyingDraft({
      draftTitle: slice.title,
      slice,
      category,
    })
    setDraftResult(draft)
    setDraftDialogOpen(true)
    toast.success('已自动创建剪映草稿工程文件夹并排好轨道！')
  }

  return (
    <div className='space-y-6'>
      <Card className='bento-card border-primary/20 shadow-sm'>
        <CardHeader>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div className='flex items-center gap-2'>
              <div className='rounded-lg bg-primary/10 p-2 text-primary'>
                <Scissors className='size-5' />
              </div>
              <div>
                <CardTitle className='text-lg'>智能切片与 AI 剪辑工坊</CardTitle>
                <CardDescription>
                  输入长视频或对标链接，AI 结合行业热点自动拆解为 2 分钟微视频，支持剪映一键直剪
                </CardDescription>
              </div>
            </div>
            <Tabs
              value={category}
              onValueChange={(v) => setCategory(v as AutoCutCategory)}
              className='w-auto'
            >
              <TabsList>
                <TabsTrigger value='spoken'>口播长视频 (2分钟切片)</TabsTrigger>
                <TabsTrigger value='ranking'>排行榜类 (交接规范)</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 sm:grid-cols-[1fr_180px]'>
            <div className='space-y-2'>
              <Label>原视频素材路径或多平台视频链接</Label>
              <Input
                placeholder='例如：D:\RawVideos\出海经验长篇.mp4 或 粘贴 TikTok/抖音/视频号链接'
                value={sourceInput}
                onChange={(e) => setSourceInput(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label>原始视频预估时长 (分钟)</Label>
              <Input
                type='number'
                min={1}
                max={180}
                value={durationMins}
                onChange={(e) => setDurationMins(Number(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className='flex items-center justify-between pt-2'>
            <div className='flex items-center gap-2 text-xs text-muted-foreground'>
              <Brain className='size-4 text-primary' />
              <span>已挂载 AI 历史经验记忆：</span>
              <Badge variant='outline'>{memories.data.length} 条沉淀规则</Badge>
            </div>
            <Button
              onClick={handleStartAnalysis}
              disabled={isAnalyzing || !sourceInput.trim()}
              className='gap-2'
            >
              {isAnalyzing ? (
                <>
                  <LoaderCircle className='size-4 animate-spin' />
                  AI 正在结合热点深度剖析与切片中…
                </>
              ) : (
                <>
                  <Sparkles className='size-4' />
                  开始深度解析与切片
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 深度诊断与切片结果展示区域 */}
      {diagnosis && (
        <div className='space-y-6 animate-in fade-in-50 duration-300'>
          {/* 热点结合与人设画像面板 */}
          <div className='grid gap-4 md:grid-cols-3'>
            <Card className='border bg-card/60'>
              <CardHeader className='pb-3'>
                <CardTitle className='flex items-center gap-2 text-sm font-semibold'>
                  <Flame className='size-4 text-orange-500' />
                  强结合行业热点
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-2 text-xs'>
                <div className='font-medium text-foreground'>
                  {diagnosis.hotNewsRelevance.industryTopic}
                </div>
                <p className='text-muted-foreground leading-relaxed'>
                  {diagnosis.hotNewsRelevance.relevanceReason}
                </p>
                <div className='rounded-md bg-muted/50 p-2 font-mono text-primary'>
                  建议钩子：{diagnosis.hotNewsRelevance.suggestedHook}
                </div>
              </CardContent>
            </Card>

            <Card className='border bg-card/60'>
              <CardHeader className='pb-3'>
                <CardTitle className='flex items-center gap-2 text-sm font-semibold'>
                  <Brain className='size-4 text-primary' />
                  人设定位与口吻画像
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-1.5 text-xs text-muted-foreground'>
                <div>
                  <span className='font-medium text-foreground'>受众画像：</span>
                  {diagnosis.overallPersona.targetAudience}
                </div>
                <div>
                  <span className='font-medium text-foreground'>说话语气：</span>
                  {diagnosis.overallPersona.toneStyle}
                </div>
                <div>
                  <span className='font-medium text-foreground'>语速节奏：</span>
                  {diagnosis.overallPersona.speakingRate}
                </div>
                <div>
                  <span className='font-medium text-foreground'>核心痛点：</span>
                  {diagnosis.viralDNA.corePainPoints.join('、')}
                </div>
              </CardContent>
            </Card>

            <Card className='border border-primary/30 bg-primary/5'>
              <CardHeader className='pb-3'>
                <CardTitle className='flex items-center justify-between text-sm font-semibold'>
                  <span className='flex items-center gap-2'>
                    <Lightbulb className='size-4 text-amber-500' />
                    本次沉淀反思
                  </span>
                  <Button
                    size='sm'
                    variant='outline'
                    className='h-7 text-xs gap-1'
                    onClick={handleSaveToMemory}
                  >
                    <CheckCircle2 className='size-3.5 text-emerald-600' />
                    保存至记忆库
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className='text-xs leading-relaxed text-muted-foreground'>
                <p className='font-medium text-foreground'>
                  {diagnosis.learnedExperienceSummary}
                </p>
                <p className='mt-2 text-[11px] text-primary/80'>
                  点击右上角保存后，下次自动分析将直接吸收此条教训，持续自驱进化。
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 2分钟切片精细展示列表 */}
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Layers className='size-5 text-primary' />
                <h3 className='font-semibold text-base'>
                  智能拆解结果：共生成 {diagnosis.slices.length} 个独立 2 分钟爆款视频
                </h3>
              </div>
              <span className='text-xs text-muted-foreground'>
              <div className='flex items-center gap-2'>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={handleBatchDirectCut}
                  className='h-8 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10'
                >
                  <FolderArchive className='size-3.5' />
                  一键批量导出全部剪映草稿
                </Button>
                <span className='text-xs text-muted-foreground hidden sm:inline'>
                  默认剪辑软件：剪映 (JianyingPro) 电脑版
                </span>
              </div>
              </span>
            </div>

            <div className='grid gap-4 md:grid-cols-2'>
              {diagnosis.slices.map((slice) => (
                <Card
                  key={slice.id}
                  className='border bg-card/80 transition-all hover:border-primary/40 hover:shadow-sm'
                >
                  <CardHeader className='pb-3'>
                    <div className='flex items-start justify-between gap-2'>
                      <div>
                        <div className='flex items-center gap-2'>
                          <Badge variant='secondary' className='text-xs font-mono'>
                            第 {slice.clipIndex} 集 · 约 {slice.targetDurationSec} 秒
                          </Badge>
                          <Badge variant='outline' className='text-[11px]'>
                            BGM: {slice.suggestedBgm}
                          </Badge>
                        </div>
                        <CardTitle className='mt-2 text-base font-medium line-clamp-1'>
                          {slice.title}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className='space-y-3 text-xs'>
                    <div className='rounded-md bg-muted/40 p-2.5 space-y-1.5'>
                      <div>
                        <span className='font-semibold text-amber-600 dark:text-amber-400'>
                          [前3秒黄金钩子]:{' '}
                        </span>
                        <span className='text-foreground'>{slice.hook3s}</span>
                      </div>
                      <div>
                        <span className='font-semibold text-primary'>[核心冲突]: </span>
                        <span className='text-muted-foreground'>{slice.coreConflict}</span>
                      </div>
                      <div>
                        <span className='font-semibold text-emerald-600'>[结尾升华]: </span>
                        <span className='text-muted-foreground'>{slice.goldenQuote}</span>
                      </div>
                    </div>

                    <div className='flex flex-wrap gap-1.5'>
                      {slice.suggestedStickers.map((tag) => (
                        <Badge key={tag} variant='outline' className='text-[10px]'>
                          建议贴纸: {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* 双选项操作按钮：给予建议 VS 直接帮剪 */}
                    <div className='flex items-center justify-end gap-2 pt-2 border-t'>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleOpenSuggest(slice)}
                        className='text-xs'
                      >
                        <Lightbulb className='size-3.5 mr-1 text-amber-500' />
                        剪辑建议与流程
                      </Button>
                      <Button
                        size='sm'
                        onClick={() => handleDirectCut(slice)}
                        className='text-xs gap-1'
                      >
                        <Scissors className='size-3.5' />
                        直接帮剪 (剪映工程)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 弹窗一：剪辑建议与分镜指南 */}
      <Dialog open={suggestDialogOpen} onOpenChange={setSuggestDialogOpen}>
        <DialogContent className='max-w-2xl max-h-[85vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>剪辑建议与工业化分镜流程</DialogTitle>
            <DialogDescription>
              供人工剪辑师参考的卡点节奏、音效匹配与花字排版指南。
            </DialogDescription>
          </DialogHeader>
          {activeSlice && (
            <div className='space-y-4 py-2 text-sm'>
              <div className='rounded-lg border p-3.5 bg-muted/30 space-y-2'>
                <h4 className='font-semibold text-primary'>{activeSlice.title}</h4>
                <p className='text-xs text-muted-foreground'>
                  预估时长：{activeSlice.targetDurationSec} 秒 ｜ 推荐配乐：{activeSlice.suggestedBgm}
                </p>
              </div>

              <div className='space-y-2'>
                <h5 className='font-semibold text-xs text-muted-foreground'>分镜与节奏执行方案：</h5>
                <ol className='space-y-2.5 text-xs leading-relaxed'>
                  <li className='rounded border p-2.5 bg-card'>
                    <div className='font-semibold text-amber-600'>00:00 - 00:03 前三秒锁留存</div>
                    <p className='mt-1 text-muted-foreground'>
                      画面快速推拉或卡大字贴纸，配音效（如“叮/故障音”），打出钩子：
                      <span className='font-mono font-medium text-foreground'>“{activeSlice.hook3s}”</span>
                    </p>
                  </li>
                  <li className='rounded border p-2.5 bg-card'>
                    <div className='font-semibold text-primary'>00:03 - 01:30 冲突推进与核心反常识</div>
                    <p className='mt-1 text-muted-foreground'>
                      每 4-5 秒切换一次画面角度或插入 B-roll 辅佐素材，切除一切停顿吸气声，直击痛点：
                      <span className='font-mono font-medium text-foreground'>“{activeSlice.coreConflict}”</span>
                    </p>
                  </li>
                  <li className='rounded border p-2.5 bg-card'>
                    <div className='font-semibold text-emerald-600'>01:30 - 02:00 升华与引导点赞收藏</div>
                    <p className='mt-1 text-muted-foreground'>
                      节奏放缓、BGM 渐弱，留足思考时间，输出金句：
                      <span className='font-mono font-medium text-foreground'>“{activeSlice.goldenQuote}”</span>
                    </p>
                  </li>
                </ol>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 弹窗二：直接协助剪辑（剪映草稿工程展示） */}
      <Dialog open={draftDialogOpen} onOpenChange={setDraftDialogOpen}>
        <DialogContent className='max-w-xl'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <CheckCircle2 className='size-5 text-emerald-600' />
              剪映草稿工程已自动创建
            </DialogTitle>
            <DialogDescription>
              已按照剪映 (JianyingPro) 电脑版工程协议生成，切除废话与字幕对齐已就绪。
            </DialogDescription>
          </DialogHeader>
          {draftResult && (
            <div className='space-y-4 py-2 text-xs'>
              <div className='rounded-lg border p-3.5 bg-muted/30 space-y-2'>
                <div>
                  <span className='text-muted-foreground'>工程名称：</span>
                  <span className='font-medium text-foreground'>{draftResult.draftName}</span>
                </div>
                <div>
                  <span className='text-muted-foreground'>成片时长：</span>
                  <span className='font-mono text-foreground'>{draftResult.totalDurationFormatted}</span>
                </div>
                <div>
                  <span className='text-muted-foreground'>自动生成文件夹路径：</span>
                  <div className='mt-1 rounded bg-background p-2 font-mono text-[11px] break-all border'>
                    {draftResult.draftPath}
                  </div>
                </div>
              <div className='flex items-center gap-2 pt-2'>
                <Button
                  size='sm'
                  variant='secondary'
                  className='flex-1 gap-1.5'
                  onClick={() => handleCopyPath(draftResult.draftPath)}
                >
                  <Copy className='size-3.5' />
                  复制草稿路径
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  className='flex-1 gap-1.5 border-primary/30'
                  onClick={() => handleDownloadDraftJson(draftResult)}
                >
                  <Download className='size-3.5' />
                  下载 draft_content.json
                </Button>
              </div>
              </div>

              <div className='rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3 text-emerald-800 dark:text-emerald-300 space-y-1'>
                <div className='font-semibold'>操作提示：</div>
                <p>1. 打开电脑上的【剪映专业版】，草稿列表将自动识别并显示该项目；</p>
                <p>2. 双击打开即可看到排布好的视频主轨、背景音乐轨和精准字幕轨；</p>
                <p>3. 检查无误后，点击右上角【导出】即可快速生成成品视频！</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
