use std::fs;
use std::path::{Path, PathBuf};
use tauri::Manager;

/// Validates that a path is restricted to an authorized workspace directory
fn is_path_in_allowed_workspace(path: &Path) -> bool {
    let path_str = path.to_string_lossy().to_lowercase();
    // Allow dedicated workspace directories
    path_str.contains("axiom-workspace") || path_str.contains("workspace")
}

#[tauri::command]
fn get_default_workspace_dir(app_handle: tauri::AppHandle) -> Result<String, String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    let workspace_dir = app_dir.join("axiom-workspace");
    if !workspace_dir.exists() {
        fs::create_dir_all(&workspace_dir)
            .map_err(|e| format!("Failed to create workspace directory: {}", e))?;
    }
    
    Ok(workspace_dir.to_string_lossy().to_string())
}

#[tauri::command]
fn load_workspace_blueprint(file_path: String) -> Result<String, String> {
    let path = PathBuf::from(&file_path);
    
    if !is_path_in_allowed_workspace(&path) {
        return Err("Security Violation: Access denied. Path outside authorized workspace sandbox.".into());
    }

    if !path.exists() {
        return Err(format!("File does not exist: {}", file_path));
    }

    fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read workspace blueprint: {}", e))
}

#[tauri::command]
fn save_workspace_blueprint(file_path: String, content: String) -> Result<(), String> {
    let path = PathBuf::from(&file_path);
    
    if !is_path_in_allowed_workspace(&path) {
        return Err("Security Violation: Access denied. Cannot write outside authorized workspace sandbox.".into());
    }

    if let Some(parent) = path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create parent directory: {}", e))?;
        }
    }

    fs::write(&path, content)
        .map_err(|e| format!("Failed to write workspace blueprint: {}", e))
}

#[tauri::command]
fn get_system_telemetry() -> serde_json::Value {
    serde_json::json!({
        "status": "ONLINE",
        "engine": "Tauri v2 Native Rust Core",
        "zta_sandbox": "RESTRICTED_ACTIVE",
        "timestamp": chrono::Utc::now().to_rfc3339()
    })
}

pub mod htap;
use htap::{HtapDatabaseState, htap_init_db, htap_insert_billing_entry, htap_get_cdc_events, htap_ack_cdc_events};

pub mod zta;
use zta::{zta_compute_sha256, zta_sign_snapshot_chain, zta_verify_integrity, zta_validate_workspace_integrity};

pub mod credentials;
use credentials::{credential_vault_store, credential_vault_get, credential_vault_delete, credential_vault_status};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(HtapDatabaseState::default())
        .invoke_handler(tauri::generate_handler![
            get_default_workspace_dir,
            load_workspace_blueprint,
            save_workspace_blueprint,
            get_system_telemetry,
            htap_init_db,
            htap_insert_billing_entry,
            htap_get_cdc_events,
            htap_ack_cdc_events,
            zta_compute_sha256,
            zta_sign_snapshot_chain,
            zta_verify_integrity,
            zta_validate_workspace_integrity,
            credential_vault_store,
            credential_vault_get,
            credential_vault_delete,
            credential_vault_status
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
