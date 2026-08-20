/** 通知偏好模型；权限：当前登录用户；用途：稳定默认值与表单标签。 */
export type NotificationPreferences = {
  deadlineEnabled: boolean
  reviewEnabled: boolean
  followUpEnabled: boolean
}

export const defaultNotificationPreferences: NotificationPreferences = {
  deadlineEnabled: true,
  reviewEnabled: true,
  followUpEnabled: true,
}

export const notificationPreferenceItems = [
  {
    key: 'deadlineEnabled',
    title: '到期提醒',
    description: '活动任务和预计成交商机临近截止时提醒。',
  },
  {
    key: 'reviewEnabled',
    title: '审核提醒',
    description: '设计素材提交审核或审批结果变化时提醒。',
  },
  {
    key: 'followUpEnabled',
    title: '合作跟进提醒',
    description: '商机和渠道商单需要跟进时提醒。',
  },
] as const
