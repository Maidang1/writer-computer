use crate::commands::settings::config_value_to_json;
use crate::commands::workspace::{
    build_restore_bundle, load_recent_workspaces, RestoreWorkspaceResponse,
};
use crate::error::AppError;
use crate::state::AppState;
use serde::Serialize;
use serde_json::Value;
use std::path::Path;
use tauri::Manager;

const RESTORE_WORKSPACE_KEY: &str = "window.restore-workspace";

#[derive(Debug, Serialize)]
pub struct StartupState {
    pub settings: Value,
    pub recent_workspaces: Vec<String>,
    /// Single source of truth for what to render on startup. Built from
    /// either an explicit open (CLI arg / drag-drop — `open_file` is set,
    /// `session` is `None`) or a workspace restore (`session` is populated,
    /// `open_file` is `None`). The frontend only looks at this one payload.
    pub restore_bundle: Option<RestoreWorkspaceResponse>,
}

#[tauri::command]
pub async fn get_startup_state(
    webview: tauri::Webview,
    app: tauri::AppHandle,
) -> Result<StartupState, AppError> {
    let label = webview.label().to_string();
    let state = app.state::<AppState>().get_or_create(&label);

    let (settings, restore_enabled) = {
        let guard = state.settings.read();
        match guard.as_ref() {
            Some(s) => {
                let merged = s.merged();
                let restore_enabled = merged
                    .get(RESTORE_WORKSPACE_KEY)
                    .and_then(|v| v.as_bool())
                    .unwrap_or(true);
                let mut obj = serde_json::Map::new();
                for (k, v) in &merged {
                    obj.insert(k.clone(), config_value_to_json(v));
                }
                (Value::Object(obj), restore_enabled)
            }
            None => return Err(AppError::Io("Settings not initialized".into())),
        }
    };

    let recent_workspaces = load_recent_workspaces(&app).unwrap_or_default();
    let startup_open = state.take_startup_open();

    // Pick a workspace to prefetch a bundle for so the frontend can hydrate
    // synchronously on first render — no second IPC waterfall, no welcome
    // screen flash. startup_open is set during window creation (from CLI
    // args or open_new_workspace_window) before the webview loads — same
    // lifecycle as settings. No runtime event touches it.
    let restore_target = if let Some(payload) = &startup_open {
        Some(payload.workspace.clone())
    } else if restore_enabled {
        recent_workspaces
            .first()
            .filter(|path| Path::new(path).is_dir())
            .cloned()
    } else {
        None
    };

    let mut restore_bundle = if let Some(path) = restore_target {
        match build_restore_bundle(&app, &label, &path).await {
            Ok(bundle) => Some(bundle),
            Err(err) => {
                // Don't let a failed restore abort startup — settings still
                // need to hydrate and the welcome screen should render.
                eprintln!("failed to prefetch restore bundle for {path}: {err:?}");
                None
            }
        }
    } else {
        None
    };

    // Fold the explicit open into the bundle so the frontend has a single
    // source of truth. Strip the saved session (old tabs) — the user asked
    // for a specific file, not their previous editor state.
    if let Some(pending) = startup_open {
        if let Some(ref mut bundle) = restore_bundle {
            bundle.session = None;
            bundle.active_file = None;
            bundle.open_file = pending.file;
        }
    }

    Ok(StartupState {
        settings,
        recent_workspaces,
        restore_bundle,
    })
}
