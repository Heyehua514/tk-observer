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
    <div
      className='page-header flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'
      data-page-header
    >
      <div>
        <p className='mb-2 text-[11px] font-semibold tracking-[0.16em] text-primary/75 uppercase'>
          TK观察 / 工作台
        </p>
        <h1 className='text-2xl font-semibold tracking-[-0.02em]'>{title}</h1>
        <p className='mt-2 max-w-2xl text-sm leading-6 text-muted-foreground'>
          {description}
        </p>
      </div>
      {action}
    </div>
  )
}
