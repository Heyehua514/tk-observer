//! TK观察桌面应用入口。业务逻辑全部位于 Vite SPA 和 PocketBase。

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("TK观察工作台启动失败");
}

