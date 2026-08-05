/**
 * 工作台列表页统一标题区。
 * @param title 页面主标题
 * @param description 一句话业务说明
 * @param action 右侧主操作按钮
 */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
      <div>
        <h1 className='text-2xl font-semibold tracking-normal'>{title}</h1>
        <p className='mt-1 text-sm text-muted-foreground'>{description}</p>
      </div>
      {action}
    </div>
  )
}
