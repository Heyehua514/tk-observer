/**
 * 站内通知公共类型。
 * 通知属于跨工作台能力，不归属任一 feature。
 */
export type NotificationType = 'design_review' | 'gmv_target' | 'comment'

export type AppNotification = {
  id: string
  recipient: string
  type: NotificationType
  title: string
  content: string
  link: string
  isRead: boolean
  created: string
}
