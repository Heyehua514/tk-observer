/**
 * 设计审批规则收尾：驳回请求必须明确包含非空 review_reason。
 * 使用 PocketBase :isset 修饰符，防止缺失字段被错误当作空字符串。
 */
migrate(
  (app) => {
    const designAssets = app.findCollectionByNameOrId('design_assets')
    designAssets.updateRule =
      '@request.auth.id != "" && (@request.auth.role = "boss" || (@request.auth.role = "design" && (status = "" || status = "draft" || status = "rejected") && (@request.body.status:isset = false || @request.body.status = "draft" || @request.body.status = "pending_review"))) && (@request.body.status:isset = false || @request.body.status != "rejected" || (@request.body.review_reason:isset = true && @request.body.review_reason != ""))'
    app.save(designAssets)
  },
  (app) => {
    const designAssets = app.findCollectionByNameOrId('design_assets')
    designAssets.updateRule =
      '@request.auth.id != "" && (@request.auth.role = "boss" || (@request.auth.role = "design" && (status = "" || status = "draft" || status = "rejected") && (@request.body.status:isset = false || @request.body.status = "draft" || @request.body.status = "pending_review")))'
    app.save(designAssets)
  }
)
