/** 成片归档上传纯函数：文件校验、存储路径与 videos 行序列化。 */

export const VIDEO_FILE_SIZE_LIMIT = 512 * 1024 * 1024
export const SUPPORTED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
] as const

export function isSupportedVideoFile(file: { type: string; size: number }) {
  return (
    SUPPORTED_VIDEO_TYPES.includes(file.type as (typeof SUPPORTED_VIDEO_TYPES)[number]) &&
    file.size > 0 &&
    file.size <= VIDEO_FILE_SIZE_LIMIT
  )
}

export function buildVideoFilePath(ownerId: string, fileName: string) {
  const safeName = fileName.replace(/[^\w.-]+/g, '-')
  return `${ownerId || 'anonymous'}/${Date.now()}-${safeName}`
}

export type VideoArchiveRowInput = {
  title: string
  region: string
  file_path: string
  publish_at: string | null
  product_name: string | null
  creator_name: string | null
}

export function serializeVideoArchiveInput(
  input: {
    title: string
    region: string
    publishAt: string
    productName: string
    creatorName: string
  },
  filePath: string
): VideoArchiveRowInput {
  return {
    title: input.title,
    region: input.region,
    file_path: filePath,
    publish_at: input.publishAt || null,
    product_name: input.productName || null,
    creator_name: input.creatorName || null,
  }
}
