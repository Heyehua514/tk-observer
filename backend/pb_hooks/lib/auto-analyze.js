/**
 * 用途：调用本机 WorkBuddy CLI 并严格校验视频分析后批量写回。
 * 所属工作台：剪辑工作台。
 * 权限：仅供服务端 hook 调用，客户端无权直接执行或写分析字段。
 */
const DEFAULT_WORKBUDDY_CLI =
  '/Applications/WorkBuddy.app/Contents/Resources/app.asar.unpacked/cli/bin/codebuddy'
const WATCHDOG_CLI = '/usr/bin/perl'
const WATCHDOG_SCRIPT = 'alarm shift; exec @ARGV'
const WORKBUDDY_TIMEOUT_SECONDS = '120'
const RUN_LOCK_KEY = 'tk-observer.auto-analyze.running'

function readByte(bytes, index) {
  if (index >= bytes.length) throw new Error('WorkBuddy output has truncated UTF-8')
  const value = Number(bytes[index])
  if (!Number.isInteger(value) || value < 0 || value > 0xff) {
    throw new Error('WorkBuddy output contains an invalid byte')
  }
  return value
}

function readContinuation(bytes, index) {
  const value = readByte(bytes, index)
  if (value < 0x80 || value > 0xbf) {
    throw new Error('WorkBuddy output contains invalid UTF-8 continuation')
  }
  return value
}

function decodeUtf8(bytes) {
  let decoded = ''
  for (let index = 0; index < bytes.length; ) {
    const first = readByte(bytes, index++)
    let codePoint
    if (first < 0x80) {
      codePoint = first
    } else if (first >= 0xc2 && first <= 0xdf) {
      codePoint =
        ((first & 0x1f) << 6) | (readContinuation(bytes, index++) & 0x3f)
    } else if (first >= 0xe0 && first <= 0xef) {
      const second = readContinuation(bytes, index++)
      const third = readContinuation(bytes, index++)
      if ((first === 0xe0 && second < 0xa0) || (first === 0xed && second > 0x9f)) {
        throw new Error('WorkBuddy output contains invalid UTF-8 code point')
      }
      codePoint =
        ((first & 0x0f) << 12) |
        ((second & 0x3f) << 6) |
        (third & 0x3f)
    } else if (first >= 0xf0 && first <= 0xf4) {
      const second = readContinuation(bytes, index++)
      const third = readContinuation(bytes, index++)
      const fourth = readContinuation(bytes, index++)
      if ((first === 0xf0 && second < 0x90) || (first === 0xf4 && second > 0x8f)) {
        throw new Error('WorkBuddy output contains invalid UTF-8 code point')
      }
      codePoint =
        ((first & 0x07) << 18) |
        ((second & 0x3f) << 12) |
        ((third & 0x3f) << 6) |
        (fourth & 0x3f)
    } else {
      throw new Error('WorkBuddy output contains invalid UTF-8 leading byte')
    }
    if (codePoint <= 0xffff) {
      decoded += String.fromCharCode(codePoint)
    } else {
      codePoint -= 0x10000
      decoded += String.fromCharCode(
        0xd800 + (codePoint >> 10),
        0xdc00 + (codePoint & 0x3ff)
      )
    }
  }
  return decoded
}

function decodeCommandOutput(value) {
  if (typeof value === 'string') return value
  if (value && typeof value.length === 'number') return decodeUtf8(value)
  return String(value || '')
}

function acquireRunLock(app) {
  let acquired = false
  app.store().setFunc(RUN_LOCK_KEY, (running) => {
    if (running) return running
    acquired = true
    return true
  })
  return acquired
}

function errorMessage(error) {
  return String(error && error.message ? error.message : error).slice(0, 300)
}

module.exports.run = (app, os) => {
  const { parseWorkBuddyAnalysis } = require('./workbuddy-analysis.js')
  if (!acquireRunLock(app)) {
    console.log('auto-analyze: in_progress, skipped=1')
    return { analyzed: 0, status: 'in_progress' }
  }
  let ideas = []
  try {
    ideas = app.findRecordsByFilter(
      'video_ideas',
      'ai_analysis = ""',
      '-created',
      50,
      0
    )
    if (!ideas.length) {
      console.log('auto-analyze: empty, pending=0')
      return { analyzed: 0, status: 'empty' }
    }
    const payload = ideas.map((idea) => ({
      title: String(idea.get('title') || ''),
      account: String(idea.get('account') || ''),
      videoType: String(idea.get('video_type') || ''),
      publishDate: String(idea.get('publish_date') || ''),
    }))
    const prompt = [
      '你是 TK 内容运营分析助手。不要调用任何工具，只返回一个 JSON 对象。',
      '分析以下视频的标题规律、发布时间规律和内容类型偏好。',
      '数组和总结使用简洁中文，不要编造输入中没有的数据。',
      'JSON 必须且只能包含 titlePatterns、publishTimePatterns、contentTypePreferences、summary 四个字段；前三项是字符串数组，summary 是非空字符串。',
      JSON.stringify(payload),
    ].join('\n')
    const configuredCli =
      typeof os.getenv === 'function' ? String(os.getenv('WORKBUDDY_CLI') || '') : ''
    const cli = configuredCli.trim() || DEFAULT_WORKBUDDY_CLI
    const output = decodeCommandOutput(
      os
        .cmd(
          WATCHDOG_CLI,
          '-e',
          WATCHDOG_SCRIPT,
          WORKBUDDY_TIMEOUT_SECONDS,
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
          '--no-session-persistence'
        )
        .output()
    ).trim()
    const parsed = parseWorkBuddyAnalysis(output)
    const serialized = JSON.stringify(parsed)
    const analyzedAt = new Date().toISOString()
    try {
      app.runInTransaction((transactionApp) => {
        for (const idea of ideas) {
          idea.set('ai_analysis', serialized)
          idea.set('analyzed_at', analyzedAt)
          transactionApp.save(idea)
        }
      })
    } catch (error) {
      console.log(
        `auto-analyze: write_failed, pending=${ideas.length}, reason=${errorMessage(error)}`
      )
      return { analyzed: 0, pending: ideas.length, status: 'write_failed' }
    }
    console.log(`auto-analyze: completed, analyzed=${ideas.length}`)
    return { analyzed: ideas.length, status: 'completed' }
  } catch (error) {
    console.log(
      `auto-analyze: workbuddy_unavailable, pending=${ideas.length}, reason=${errorMessage(error)}`
    )
    return {
      analyzed: 0,
      pending: ideas.length,
      status: 'workbuddy_unavailable',
    }
  } finally {
    app.store().remove(RUN_LOCK_KEY)
  }
}
