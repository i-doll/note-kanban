mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_process::init())
    .plugin(tauri_plugin_clipboard_manager::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      commands::notes::list_notes,
      commands::notes::read_note,
      commands::notes::create_note,
      commands::notes::update_note,
      commands::notes::delete_note,
      commands::notes::create_folder,
      commands::notes::rename_folder,
      commands::notes::delete_folder,
      commands::notes::move_note,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
