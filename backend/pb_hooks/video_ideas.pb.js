/**
 * 剪辑工作台：按账号自动重算爆款标记。
 * 规则：完播率 >= 60%，或播放量 >= 同账号平均播放量的 2 倍。
 *
 * PocketBase 会隔离执行每个已注册回调，因此 SQL 保持在回调内部。
 * 直接批量更新可避免逐条 $app.save() 递归触发本 Hook。
 */
onRecordAfterCreateSuccess((event) => {
  $app
    .db()
    .newQuery(`
      UPDATE video_ideas AS idea
      SET is_viral = CASE
        WHEN idea.completion_rate >= 60 THEN 1
        WHEN idea.views >= 2 * (
          SELECT AVG(peer.views)
          FROM video_ideas AS peer
          WHERE peer.account = idea.account
        ) THEN 1
        ELSE 0
      END
    `)
    .execute()
  event.next()
}, 'video_ideas')

onRecordAfterUpdateSuccess((event) => {
  $app
    .db()
    .newQuery(`
      UPDATE video_ideas AS idea
      SET is_viral = CASE
        WHEN idea.completion_rate >= 60 THEN 1
        WHEN idea.views >= 2 * (
          SELECT AVG(peer.views)
          FROM video_ideas AS peer
          WHERE peer.account = idea.account
        ) THEN 1
        ELSE 0
      END
    `)
    .execute()
  event.next()
}, 'video_ideas')

onRecordAfterDeleteSuccess((event) => {
  $app
    .db()
    .newQuery(`
      UPDATE video_ideas AS idea
      SET is_viral = CASE
        WHEN idea.completion_rate >= 60 THEN 1
        WHEN idea.views >= 2 * (
          SELECT AVG(peer.views)
          FROM video_ideas AS peer
          WHERE peer.account = idea.account
        ) THEN 1
        ELSE 0
      END
    `)
    .execute()
  event.next()
}, 'video_ideas')
