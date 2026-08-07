/**
 * 剪辑工作台：爆款选题库只读 SQL 分析视图。
 * summary 汇总核心指标；account/type 对比账号和视频类型；features 汇总爆款特征。
 * 所有视图仅允许 boss 与 editing 读取，浏览器不再拉取全表做统计。
 */
migrate(
  (app) => {
    const editingAccess =
      '@request.auth.id != "" && (@request.auth.role = "boss" || @request.auth.role = "editing")'

    const summary = new Collection({
      type: 'view',
      name: 'video_idea_summary',
      viewQuery: `
        SELECT
          'videoideasum001' AS id,
          COUNT(*) AS total_videos,
          SUM(
            CASE
              WHEN strftime('%Y-%m', created) = strftime('%Y-%m', 'now') THEN 1
              ELSE 0
            END
          ) AS monthly_new,
          SUM(CASE WHEN is_viral = 1 THEN 1 ELSE 0 END) AS viral_count,
          COALESCE(
            100.0 * SUM(CASE WHEN is_viral = 1 THEN 1 ELSE 0 END)
              / NULLIF(COUNT(*), 0),
            0
          ) AS viral_rate,
          COALESCE(AVG(completion_rate), 0) AS average_completion_rate,
          COALESCE(AVG(views), 0) AS average_views,
          COALESCE(SUM(follower_gain), 0) AS total_follower_gain
        FROM video_ideas
      `,
    })
    summary.listRule = editingAccess
    summary.viewRule = editingAccess
    for (const name of [
      'total_videos',
      'monthly_new',
      'viral_count',
      'viral_rate',
      'average_completion_rate',
      'average_views',
      'total_follower_gain',
    ]) {
      summary.fields.add(new NumberField({ name }))
    }
    app.save(summary)

    const accountStats = new Collection({
      type: 'view',
      name: 'video_idea_account_stats',
      viewQuery: `
        WITH accounts(id, account) AS (
          VALUES
            ('videoideaacc001', '跨境TK磊哥'),
            ('videoideaacc002', 'TK观察磊哥'),
            ('videoideaacc003', '磊哥出海笔记')
        )
        SELECT
          accounts.id,
          accounts.account,
          COALESCE(SUM(video_ideas.views), 0) AS views,
          COALESCE(AVG(video_ideas.completion_rate), 0) AS average_completion_rate,
          COALESCE(
            SUM(CASE WHEN video_ideas.is_viral = 1 THEN 1 ELSE 0 END),
            0
          ) AS viral_count
        FROM accounts
        LEFT JOIN video_ideas ON video_ideas.account = accounts.account
        GROUP BY accounts.id, accounts.account
      `,
    })
    accountStats.listRule = editingAccess
    accountStats.viewRule = editingAccess
    accountStats.fields.add(
      new TextField({ name: 'account', required: true, max: 80 })
    )
    accountStats.fields.add(new NumberField({ name: 'views' }))
    accountStats.fields.add(
      new NumberField({ name: 'average_completion_rate' })
    )
    accountStats.fields.add(new NumberField({ name: 'viral_count' }))
    app.save(accountStats)

    const typeStats = new Collection({
      type: 'view',
      name: 'video_idea_type_stats',
      viewQuery: `
        WITH types(id, video_type) AS (
          VALUES
            ('videoideatype01', '口播'),
            ('videoideatype02', '专访预热'),
            ('videoideatype03', '专访正片'),
            ('videoideatype04', '专访花絮'),
            ('videoideatype05', '快问快答'),
            ('videoideatype06', '茶话会'),
            ('videoideatype07', '饭局交流'),
            ('videoideatype08', '饭局感受')
        )
        SELECT
          types.id,
          types.video_type,
          COALESCE(
            AVG(video_ideas.completion_rate),
            0
          ) AS average_completion_rate
        FROM types
        LEFT JOIN video_ideas ON video_ideas.video_type = types.video_type
        GROUP BY types.id, types.video_type
        ORDER BY average_completion_rate DESC
      `,
    })
    typeStats.listRule = editingAccess
    typeStats.viewRule = editingAccess
    typeStats.fields.add(
      new TextField({ name: 'video_type', required: true, max: 80 })
    )
    typeStats.fields.add(
      new NumberField({ name: 'average_completion_rate' })
    )
    app.save(typeStats)

    const viralFeatures = new Collection({
      type: 'view',
      name: 'video_idea_viral_features',
      viewQuery: `
        WITH RECURSIVE
        viral AS (
          SELECT
            id,
            replace(
              replace(
                replace(
                  replace(
                    replace(
                      replace(
                        replace(replace(title, ' ', ','), '，', ','),
                        '。',
                        ','
                      ),
                      '！',
                      ','
                    ),
                    '？',
                    ','
                  ),
                  '、',
                  ','
                ),
                '/',
                ','
              ),
              '|',
              ','
            ) || ',' AS title_rest,
            replace(tags, '，', ',') || ',' AS tag_rest,
            video_type,
            CASE
              WHEN CAST(strftime('%d', publish_date) AS INTEGER) <= 7 THEN '月初 1-7 日'
              WHEN CAST(strftime('%d', publish_date) AS INTEGER) <= 14 THEN '月中 8-14 日'
              WHEN CAST(strftime('%d', publish_date) AS INTEGER) <= 21 THEN '下旬 15-21 日'
              ELSE '月底 22-31 日'
            END AS date_segment
          FROM video_ideas
          WHERE is_viral = 1
        ),
        title_tokens(record_id, rest, token) AS (
          SELECT id, title_rest, '' FROM viral
          UNION ALL
          SELECT
            record_id,
            substr(rest, instr(rest, ',') + 1),
            trim(substr(rest, 1, instr(rest, ',') - 1))
          FROM title_tokens
          WHERE rest <> ''
        ),
        tag_tokens(record_id, rest, token) AS (
          SELECT id, tag_rest, '' FROM viral
          UNION ALL
          SELECT
            record_id,
            substr(rest, instr(rest, ',') + 1),
            trim(substr(rest, 1, instr(rest, ',') - 1))
          FROM tag_tokens
          WHERE rest <> ''
        ),
        raw_features AS (
          SELECT 'title_word' AS feature_type, token AS value, COUNT(*) AS count
          FROM title_tokens
          WHERE length(token) > 1
            AND token NOT IN (
              '我们', '这个', '那个', '视频', '一个', '怎么', '为什么', '以及', '可以'
            )
          GROUP BY token
          UNION ALL
          SELECT 'video_type', video_type, COUNT(*) FROM viral GROUP BY video_type
          UNION ALL
          SELECT 'tag', token, COUNT(*) FROM tag_tokens
          WHERE token <> '' GROUP BY token
          UNION ALL
          SELECT 'date_segment', date_segment, COUNT(*)
          FROM viral GROUP BY date_segment
        ),
        ranked AS (
          SELECT
            feature_type,
            value,
            count,
            ROW_NUMBER() OVER (
              PARTITION BY feature_type
              ORDER BY count DESC, value ASC
            ) AS feature_rank
          FROM raw_features
        ),
        identified AS (
          SELECT
            CASE feature_type
              WHEN 'title_word' THEN 'w'
              WHEN 'video_type' THEN 'v'
              WHEN 'tag' THEN 't'
              ELSE 'd'
            END || printf(
              '%014d',
              ROW_NUMBER() OVER (ORDER BY feature_type, feature_rank, value)
            ) AS id,
            feature_type,
            value,
            count,
            feature_rank
          FROM ranked
          WHERE feature_rank <= 5
        )
        SELECT
          id,
          feature_type,
          value,
          count,
          feature_rank
        FROM identified
      `,
    })
    viralFeatures.listRule = editingAccess
    viralFeatures.viewRule = editingAccess
    viralFeatures.fields.add(
      new TextField({ name: 'feature_type', required: true, max: 40 })
    )
    viralFeatures.fields.add(
      new TextField({ name: 'value', required: true, max: 240 })
    )
    viralFeatures.fields.add(new NumberField({ name: 'count' }))
    viralFeatures.fields.add(new NumberField({ name: 'feature_rank' }))
    app.save(viralFeatures)
  },
  (app) => {
    for (const name of [
      'video_idea_viral_features',
      'video_idea_type_stats',
      'video_idea_account_stats',
      'video_idea_summary',
    ]) {
      const collection = app.findCollectionByNameOrId(name)
      app.delete(collection)
    }
  }
)
