export type DesktopUpdateResult =
  | { state: 'current'; message: string }
  | { state: 'updated'; version: string; message: string }
  | { state: 'error'; message: string }

type UpdateHandle = {
  version?: string
  downloadAndInstall: () => Promise<void>
}

type UpdateDependencies = {
  check: () => Promise<UpdateHandle | null>
  relaunch?: () => Promise<void>
}

export async function checkForDesktopUpdate(
  dependencies: UpdateDependencies
): Promise<DesktopUpdateResult> {
  try {
    const update = await dependencies.check()
    if (!update) return { state: 'current', message: '当前已是最新版本' }

    await update.downloadAndInstall()
    await dependencies.relaunch?.()
    const version = update.version?.trim() || '新版本'
    return {
      state: 'updated',
      version,
      message: `已安装 ${version}，正在重启客户端`,
    }
  } catch {
    return { state: 'error', message: '检查更新失败，请稍后重试' }
  }
}

export async function checkAndInstallDesktopUpdate(): Promise<DesktopUpdateResult> {
  const [{ check }, { relaunch }] = await Promise.all([
    import('@tauri-apps/plugin-updater'),
    import('@tauri-apps/plugin-process'),
  ])
  return checkForDesktopUpdate({ check, relaunch })
}
