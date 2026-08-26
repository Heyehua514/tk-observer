//! TK观察桌面应用入口。业务逻辑全部位于 Vite SPA 和 PocketBase。

#[cfg(desktop)]
mod workbuddy_gateway;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();
    #[cfg(feature = "updater")]
    let builder = builder.plugin(tauri_plugin_updater::Builder::new().build());
    #[cfg(feature = "process")]
    let builder = builder.plugin(tauri_plugin_process::init());
    builder
        .setup(|_app| {
            #[cfg(desktop)]
            workbuddy_gateway::spawn();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("TK观察工作台启动失败");
}
