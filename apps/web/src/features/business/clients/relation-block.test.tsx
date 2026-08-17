// 客户详情关联面板点击跳转；权限：business/boss 可读客户关联商机与商单。
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { RelationBlock } from './clients-workbench'

it('点击关联商机条目触发跳转回调（类型+ID）', async () => {
  const onOpenRelated = vi.fn()
  const screen = await render(
    <RelationBlock
      type='opportunity'
      title='关联商机'
      empty='该客户还没有商机'
      items={[
        { id: 'o1', title: '金鳞会年度赞助', meta: '¥50,000 · 30% · 方案报价' },
      ]}
      loading={false}
      onOpenRelated={onOpenRelated}
    />
  )
  await screen.getByRole('button', { name: /金鳞会年度赞助/ }).click()
  expect(onOpenRelated).toHaveBeenCalledWith('opportunity', 'o1')
})

it('点击关联商单条目触发跳转回调（类型+ID）', async () => {
  const onOpenRelated = vi.fn()
  const screen = await render(
    <RelationBlock
      type='order'
      title='关联商单'
      empty='该客户还没有商单'
      items={[
        {
          id: 'r1',
          title: 'TikTok 口播植入',
          meta: '¥30,000 · 已确认 · 2026-08-20',
        },
      ]}
      loading={false}
      onOpenRelated={onOpenRelated}
    />
  )
  await screen.getByRole('button', { name: /TikTok 口播植入/ }).click()
  expect(onOpenRelated).toHaveBeenCalledWith('order', 'r1')
})

it('空列表显示引导文案且不渲染按钮', async () => {
  const onOpenRelated = vi.fn()
  const screen = await render(
    <RelationBlock
      type='opportunity'
      title='关联商机'
      empty='该客户还没有商机'
      items={[]}
      loading={false}
      onOpenRelated={onOpenRelated}
    />
  )
  await expect.element(screen.getByText('该客户还没有商机')).toBeVisible()
  expect(screen.getByRole('button').all()).toHaveLength(0)
})
