/** 成片表现趋势面板：验证增量、峰值与爆款预警渲染。 */
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import type { VideoMetricsLog } from '../video-metrics-model'
import { VideoMetricsTrendPanel } from './video-metrics-trend-panel'

const state = vi.hoisted(() => ({ logs: [] as VideoMetricsLog[] }))

vi.mock('../hooks/use-video-metrics-logs', () => ({
  useVideoMetricsLogs: () => ({ data: state.logs, isLoading: false }),
}))

function log(id: string, loggedAt: string, views: number, likes: number): VideoMetricsLog {
  return {
    id,
    videoId: 'video-1',
    loggedAt,
    views,
    likes,
    comments: 0,
    shares: 0,
    completionRate: 0,
    conversionGmvCents: 0,
    orderCount: 0,
    operatorName: '测试',
  }
}

it('renders incremental trend with viral warning', async () => {
  state.logs = [
    log('a', '2026-11-01T02:00:00.000Z', 1000, 10),
    log('b', '2026-11-02T02:00:00.000Z', 1100, 20),
    log('c', '2026-11-03T02:00:00.000Z', 1200, 30),
    log('d', '2026-11-04T02:00:00.000Z', 1500, 40),
  ]
  const screen = await render(<VideoMetricsTrendPanel videoId='video-1' />)

  await expect.element(screen.getByText('播放量增量走势（共 4 次打卡）')).toBeInTheDocument()
  await expect.element(screen.getByText('1 次爆款预警')).toBeInTheDocument()
  await expect.element(screen.getByText('+500')).toBeInTheDocument()
  expect(document.querySelectorAll('[data-viral="true"]').length).toBe(1)
})

it('shows baseline guidance when fewer than two check-ins exist', async () => {
  state.logs = [log('a', '2026-11-01T02:00:00.000Z', 1000, 10)]
  const screen = await render(<VideoMetricsTrendPanel videoId='video-1' />)

  await expect.element(screen.getByText('至少两次打卡后才会生成增量曲线与爆款预警。当前 1 次。')).toBeInTheDocument()
})