//! TK观察桌面应用入口。业务逻辑全部位于 Vite SPA 和 PocketBase。

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();
    #[cfg(feature = "updater")]
    let builder = builder.plugin(tauri_plugin_updater::Builder::new().build());
    #[cfg(feature = "process")]
    let builder = builder.plugin(tauri_plugin_process::init());
    builder
        .run(tauri::generate_context!())
        .expect("TK观察工作台启动失败");
}
