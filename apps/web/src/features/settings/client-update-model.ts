export type ClientUpdateSurface = {
  title: string
  description: string
  actionLabel: string
  enabled: boolean
}

export function getClientUpdateSurface(
  isDesktop: boolean,
  updaterConfigured: boolean
): ClientUpdateSurface {
  if (!isDesktop) {
    return {
      title: '客户端更新',
      description: '当前使用的是网页端，发布新版本后刷新页面即可获取更新。',
      actionLabel: '网页端已自动更新',
      enabled: false,
    }
  }
  if (!updaterConfigured) {
    return {
      title: '客户端更新',
      description: '客户端更新服务尚未配置完成，当前版本需要手动替换安装包。',
      actionLabel: '更新服务配置中',
      enabled: false,
    }
  }
  return {
    title: '客户端更新',
    description: '检查新版本、查看更新说明并在客户端内完成安装。',
    actionLabel: '检查更新',
    enabled: true,
  }
}
