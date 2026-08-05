/**
 * 设计工作台审批安全边界：驳回设计稿时必须提交非空驳回理由。
 * 旧 migration 不修改，通过新版 API Rule 约束后续请求。
 */
migrate(
  (app) => {
    const designAssets = app.findCollectionByNameOrId('design_assets')
    designAssets.updateRule =
      '@request.auth.id != "" && (@request.auth.role = "boss" || (@request.auth.role = "design" && (status = "" || status = "draft" || status = "rejected") && (@request.body.status:isset = false || @request.body.status = "draft" || @request.body.status = "pending_review"))) && (@request.body.status:isset = false || @request.body.status != "rejected" || @request.body.review_reason != "")'
    app.save(designAssets)
  },
  (app) => {
    const designAssets = app.findCollectionByNameOrId('design_assets')
    designAssets.updateRule =
      '@request.auth.id != "" && (@request.auth.role = "boss" || (@request.auth.role = "design" && (@request.body.status:isset = false || @request.body.status = "draft" || @request.body.status = "pending_review")))'
    app.save(designAssets)
  }
)
