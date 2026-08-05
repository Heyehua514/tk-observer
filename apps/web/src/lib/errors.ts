/**
 * PocketBase 请求统一错误转换。
 * UI 层通过此函数得到稳定的中文提示，不直接展示服务端内部信息。
 */
import { ClientResponseError } from 'pocketbase'

export function getRequestErrorMessage(error: unknown) {
  if (error instanceof ClientResponseError) {
    if (error.status === 0) return '无法连接服务器，请检查网络'
    if (error.status === 403) return '您没有执行此操作的权限'
    if (error.status === 404) return '目标数据不存在或已被删除'
    if (error.status === 400) return '提交的数据不符合要求，请检查后重试'
  }
  return '操作未完成，请稍后重试'
}
