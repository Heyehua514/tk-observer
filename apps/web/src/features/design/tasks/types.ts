/** 设计任务看板类型；权限：design、boss。 */
import type { Region } from '@/types/commerce'

export const designTaskStatuses = ['todo', 'doing', 'review', 'done'] as const
export type DesignTaskStatus = (typeof designTaskStatuses)[number]

export type DesignTask = {
  id: string
  title: string
  status: DesignTaskStatus
  dueAt: string
  region: Region
}

export type DesignTaskInput = Omit<DesignTask, 'id' | 'status'>
