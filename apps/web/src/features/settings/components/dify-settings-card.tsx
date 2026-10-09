import { useState } from 'react'
import { CheckCircle2, Database, LoaderCircle, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  getDifyConfig,
  saveDifyConfig,
  searchDifyKnowledge,
  type DifyConfig,
} from '@/lib/dify-client'

export function DifySettingsCard() {
  const [config, setConfig] = useState<DifyConfig>(getDifyConfig)
  const [testing, setTesting] = useState(false)
  const [testSuccess, setTestSuccess] = useState(false)

  const handleToggle = (checked: boolean) => {
    const updated = { ...config, enabled: checked }
    setConfig(updated)
    saveDifyConfig(updated)
    toast.success(checked ? '已开启 Dify 知识库集成' : '已关闭 Dify 知识库集成')
  }

  const handleSave = () => {
    saveDifyConfig(config)
    toast.success('Dify 知识库配置已保存')
  }

  const handleTest = async () => {
    if (!config.endpoint || !config.apiKey || !config.datasetId) {
      toast.error('请先完整填写 API 接口地址、API Key 与 Dataset ID')
      return
    }
    setTesting(true)
    setTestSuccess(false)
    try {
      saveDifyConfig({ ...config, enabled: true })
      const records = await searchDifyKnowledge({
        query: '测试',
        datasetId: config.datasetId,
        topK: 1,
      })
      setTestSuccess(true)
      toast.success(`Dify 连通成功！知识库已可正常检索（探测到 ${records.length} 条测试数据）`)
    } catch {
      toast.error('连接失败，请检查 Dify 地址与 API Key 是否有效')
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card className='glass-card max-w-2xl rounded-2xl border bg-background/60 shadow-none backdrop-blur-xl'>
      <CardHeader>
        <CardTitle className='flex items-center justify-between text-base'>
          <div className='flex items-center gap-2'>
            <Database className='size-4 text-primary' />
            <span>Dify 开源知识库中台</span>
          </div>
          <div className='flex items-center gap-2 text-xs'>
            <Label htmlFor='dify-enabled' className='cursor-pointer text-muted-foreground'>
              启用状态
            </Label>
            <Switch
              id='dify-enabled'
              checked={config.enabled}
              onCheckedChange={handleToggle}
            />
          </div>
        </CardTitle>
        <CardDescription>
          接入企业内部或本地部署的 Dify 知识库。开启后，全局搜索及各工作台 AI 助手将实时召回文档经验。
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <Label>Dify API 接口地址</Label>
          <Input
            placeholder='http://localhost/v1 或 https://api.dify.ai/v1'
            value={config.endpoint}
            onChange={(e) => setConfig({ ...config, endpoint: e.target.value.trim() })}
          />
        </div>
        <div className='space-y-2'>
          <Label>API Key (Dataset API 密钥)</Label>
          <Input
            type='password'
            placeholder='app-xxxx 或 dataset-xxxx'
            value={config.apiKey}
            onChange={(e) => setConfig({ ...config, apiKey: e.target.value.trim() })}
          />
        </div>
        <div className='space-y-2'>
          <Label>Dataset ID (数据集 / 知识库 ID)</Label>
          <Input
            placeholder='例如：e3a985a1-79bc-4df1-8e05-...'
            value={config.datasetId}
            onChange={(e) => setConfig({ ...config, datasetId: e.target.value.trim() })}
          />
        </div>

        <div className='flex items-center gap-2 pt-2'>
          <Button
            type='button'
            variant='outline'
            onClick={handleTest}
            disabled={testing || !config.apiKey}
          >
            {testing ? (
              <LoaderCircle className='size-4 animate-spin' />
            ) : testSuccess ? (
              <CheckCircle2 className='size-4 text-green-600' />
            ) : null}
            连通性测试
          </Button>
          <Button type='button' onClick={handleSave}>
            <Save className='mr-1 size-4' />
            保存配置
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
