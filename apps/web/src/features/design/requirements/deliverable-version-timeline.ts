/** 设计交付版本时间线：按交付时间排序并生成稳定版本编号。 */
export function createDeliverableVersionTimeline<
  T extends { deliveredAt: string },
>(deliverables: readonly T[]): Array<T & { version: number }> {
  const ordered = [...deliverables].sort(
    (left, right) =>
      new Date(right.deliveredAt).getTime() -
      new Date(left.deliveredAt).getTime()
  )

  return ordered.map((item, index) => ({
    ...item,
    version: ordered.length - index,
  }))
}
