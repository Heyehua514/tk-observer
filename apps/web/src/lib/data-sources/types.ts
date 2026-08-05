/**
 * 外部数据源扩展契约。
 * 后续 API 或定时任务只需实现此接口并写入 PocketBase，前端读取层无需改变。
 */
export type ExternalRecord = Record<string, unknown>

export interface ExternalDataSource<
  TParams,
  TRaw,
  TRecord extends ExternalRecord,
> {
  name: string
  fetch(params: TParams): Promise<TRaw[]>
  normalize(raw: TRaw): TRecord
}
