// WorkBuddy 真实输出质量评估；所属剪辑工作台；仅服务端显式启用并消耗本机 WorkBuddy credits。
const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')
const test = require('node:test')
const { parseWorkBuddyAnalysis } = require('../pb_hooks/lib/workbuddy-analysis.js')

const DEFAULT_CLI =
  '/Applications/WorkBuddy.app/Contents/Resources/app.asar.unpacked/cli/bin/codebuddy'

const prompt = `你是短视频内容分析师。不要调用任何工具，只返回一个 JSON 对象。根据下面三条代表性视频，归纳标题规律、发布时间规律、内容类型偏好，并给出简洁中文总结。JSON 必须且只能包含 titlePatterns、publishTimePatterns、contentTypePreferences、summary 四个字段；前三项是字符串数组，summary 是非空字符串。不要虚构输入中不存在的数据。

1. 标题：3 个动作让 TikTok 新店首周破百单；发布时间：周二 20:00；类型：实操教程；播放量：128000
2. 标题：复盘：美妆品牌如何用达人矩阵提升转化；发布时间：周四 19:30；类型：案例拆解；播放量：96000
3. 标题：别再盲目投流，先检查这 5 个账户指标；发布时间：周日 20:30；类型：避坑清单；播放量：154000`

test(
  'real WorkBuddy analysis meets the structured quality threshold',
  { skip: process.env.WORKBUDDY_EVAL !== '1' },
  () => {
    const cli = process.env.WORKBUDDY_CLI || DEFAULT_CLI
    const result = spawnSync(
      '/usr/bin/perl',
      [
        '-e',
        'alarm shift; exec @ARGV',
        '120',
        cli,
        '-p',
        prompt,
        '--output-format',
        'json',
        '--tools',
        '',
        '--permission-mode',
        'dontAsk',
        '--max-turns',
        '1',
        '--no-session-persistence',
      ],
      { encoding: 'utf8', timeout: 125_000, maxBuffer: 10 * 1024 * 1024 },
    )

    assert.equal(
      result.status,
      0,
      result.error?.message || result.stderr || 'WorkBuddy CLI failed',
    )
    let parsed
    try {
      parsed = parseWorkBuddyAnalysis(result.stdout)
    } catch (error) {
      assert.fail(
        `${error.message}\nWorkBuddy stdout tail:\n${result.stdout.slice(-4000)}`,
      )
    }
    assert.deepEqual(Object.keys(parsed), [
      'titlePatterns',
      'publishTimePatterns',
      'contentTypePreferences',
      'summary',
    ])
    assert.ok(parsed.titlePatterns.length >= 1)
    assert.ok(parsed.publishTimePatterns.length >= 1)
    assert.ok(parsed.contentTypePreferences.length >= 1)
    assert.ok(parsed.summary.trim().length >= 1)
    assert.match(parsed.titlePatterns.join(' '), /数字|动作|复盘|指标|结果|警示|避坑/)
    assert.match(parsed.publishTimePatterns.join(' '), /19|20|晚间|周二|周四|周日/)
    assert.match(
      parsed.contentTypePreferences.join(' '),
      /教程|案例|清单|实操|拆解|避坑/,
    )
  },
)
