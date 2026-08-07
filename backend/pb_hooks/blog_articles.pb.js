/**
 * 商务工作台：公众号文章爆款标记自动计算。
 * 规则：文章阅读量 >= 同账号文章平均阅读量的 2 倍。
 * 权限：客户端不能写入 is_viral，由服务端 Hook 统一维护。
 */
const recalculate = () => {
  $app
    .db()
    .newQuery(`
      UPDATE blog_articles AS article
      SET is_viral = CASE
        WHEN article.views >= 2 * (
          SELECT AVG(peer.views)
          FROM blog_articles AS peer
          WHERE peer.account = article.account
        ) THEN 1
        ELSE 0
      END
    `)
    .execute()
  console.log('blog-analysis: 已重算公众号爆款状态')
}

onRecordAfterCreateSuccess((event) => {
  recalculate()
  event.next()
}, 'blog_articles')

onRecordAfterUpdateSuccess((event) => {
  recalculate()
  event.next()
}, 'blog_articles')

onRecordAfterDeleteSuccess((event) => {
  recalculate()
  event.next()
}, 'blog_articles')
