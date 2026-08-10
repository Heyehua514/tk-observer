/**
 * 工作台背景信号轨道；仅负责视觉氛围，不接触业务数据。
 * reduced-motion 下由 CSS 关闭扫描线，组件仍保持静态网格。
 */
export function WorkspaceAtmosphere() {
  return (
    <div
      aria-hidden='true'
      className='signal-rail pointer-events-none absolute inset-0 z-0 overflow-hidden'
      data-motion='ambient'
      data-testid='signal-rail'
    >
      <div className='signal-grid pointer-events-none absolute inset-0' />
      <div className='signal-scan pointer-events-none absolute inset-x-0 top-0 h-px' />
      <div className='signal-marker pointer-events-none absolute top-24 right-[12%] h-1.5 w-1.5 rounded-full bg-[var(--success)]' />
    </div>
  )
}
