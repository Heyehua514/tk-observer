import type { UserRole } from '@/types/auth'

export type AiProfile = {
  assistantName: string
  focus: readonly string[]
  taskTypes: readonly string[]
}

const profiles: Record<UserRole, AiProfile> = {
  owner: {
    assistantName: '系统维护助手',
    focus: ['系统维护', '权限管理', '数据质量', '工作台配置'],
    taskTypes: ['分析', '总结复盘'],
  },
  boss: {
    assistantName: '经营助手',
    focus: ['经营分析', '审批风险', '团队进度', '复盘'],
    taskTypes: ['分析', '总结复盘', '调研'],
  },
  business: {
    assistantName: '商务助手',
    focus: ['客户跟进', '商机推进', '渠道商单', '商务调研'],
    taskTypes: ['分析', '调研', '文案'],
  },
  market: {
    assistantName: '活动助手',
    focus: ['活动策划', '场地匹配', '招商', '财务复盘'],
    taskTypes: ['分析', '总结复盘', '调研'],
  },
  design: {
    assistantName: '设计助手',
    focus: ['需求拆解', '参考方向', '交付检查', '修改建议'],
    taskTypes: ['分析', '文案', '总结复盘'],
  },
  editing: {
    assistantName: '内容助手',
    focus: ['选题分析', '爆款规律', '对标账号', '视频任务'],
    taskTypes: ['分析', '调研', '文案'],
  },
}

const fallback: AiProfile = {
  assistantName: '工作助手',
  focus: ['任务推进', '问题分析'],
  taskTypes: ['分析', '总结复盘'],
}

export function getAiProfile(role: string | null | undefined): AiProfile {
  return (role && profiles[role as UserRole]) || fallback
}
