// 解析并校验 WorkBuddy 分析结果；所属剪辑工作台；仅供服务端 Hook 调用，客户端无权限。
const CONTRACT_FIELDS = [
  'titlePatterns',
  'publishTimePatterns',
  'contentTypePreferences',
  'summary',
]
const WRAPPER_FIELDS = ['result', 'structured_output', 'content']

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function parseJson(value, message) {
  try {
    return JSON.parse(value)
  } catch {
    throw new Error(message)
  }
}

function parseStringCandidate(value) {
  const source = value.trim()
  if (!source) throw new Error('WorkBuddy analysis is empty')

  const fences = Array.from(
    source.matchAll(/```json[ \t]*\r?\n([\s\S]*?)```/gi),
  )
  if (fences.length > 1) {
    throw new Error('WorkBuddy analysis contains multiple JSON fences')
  }
  if (fences.length === 1) {
    return parseJson(fences[0][1].trim(), 'WorkBuddy fenced JSON is invalid')
  }
  return parseJson(source, 'WorkBuddy analysis is not valid JSON')
}

function extractCandidate(outer) {
  if (Array.isArray(outer)) {
    if (outer.length === 0) throw new Error('WorkBuddy event array is empty')
    const last = outer[outer.length - 1]
    if (
      !last ||
      typeof last !== 'object' ||
      Array.isArray(last) ||
      last.type !== 'result' ||
      last.is_error === true ||
      typeof last.result !== 'string'
    ) {
      throw new Error('WorkBuddy event array has no final successful result')
    }
    return parseStringCandidate(last.result)
  }

  if (!outer || typeof outer !== 'object') {
    throw new Error('WorkBuddy analysis must be an object')
  }
  const presentWrappers = WRAPPER_FIELDS.filter((field) =>
    hasOwn(outer, field),
  )
  if (presentWrappers.length === 0) return outer
  if (presentWrappers.length !== 1) {
    throw new Error('WorkBuddy analysis wrapper is ambiguous')
  }
  const candidate = outer[presentWrappers[0]]
  return typeof candidate === 'string'
    ? parseStringCandidate(candidate)
    : candidate
}

function normalizeStringArray(value, field) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`WorkBuddy ${field} must be a string array`)
  }
  return value.map((item) => item.trim()).filter(Boolean)
}

function validateAnalysis(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('WorkBuddy structured analysis must be an object')
  }
  const keys = Object.keys(value)
  if (
    keys.length !== CONTRACT_FIELDS.length ||
    !CONTRACT_FIELDS.every((field) => hasOwn(value, field))
  ) {
    throw new Error('WorkBuddy structured analysis must contain exactly four fields')
  }
  if (typeof value.summary !== 'string' || !value.summary.trim()) {
    throw new Error('WorkBuddy summary must be a non-empty string')
  }
  return {
    titlePatterns: normalizeStringArray(value.titlePatterns, 'titlePatterns'),
    publishTimePatterns: normalizeStringArray(
      value.publishTimePatterns,
      'publishTimePatterns',
    ),
    contentTypePreferences: normalizeStringArray(
      value.contentTypePreferences,
      'contentTypePreferences',
    ),
    summary: value.summary.trim(),
  }
}

function parseWorkBuddyAnalysis(raw) {
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new Error('WorkBuddy output must be a non-empty string')
  }
  const outer = parseJson(raw, 'WorkBuddy output is not valid JSON')
  return validateAnalysis(extractCandidate(outer))
}

module.exports = { parseWorkBuddyAnalysis }
