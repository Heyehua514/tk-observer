/** 总览活动阶段分布图数据模型测试。 */
import { expect, it } from 'vitest'
import { buildActivityStatusChart } from './activity-status-chart-model'

it('按活动状态聚合并保留既定状态顺序', () => {
  expect(
    buildActivityStatusChart([
      { id: '1', status: 'scheduled' },
      { id: '2', status: 'preparing' },
      { id: '3', status: 'scheduled' },
    ])
  ).toEqual([
    { status: '筹备中', count: 1 },
    { status: '已定档', count: 2 },
  ])
})
