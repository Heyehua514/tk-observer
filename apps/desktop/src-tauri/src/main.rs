//! 桌面二进制入口。Windows 发布时隐藏额外控制台窗口。

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tk_observer_desktop_lib::run();
}

