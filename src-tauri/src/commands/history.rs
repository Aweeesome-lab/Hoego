// commands/history.rs
// History browsing and exploration commands for sidebar
// Lists, filters, and navigates through dump entries

use tauri::{AppHandle, Manager, State};
use time::macros::format_description;
use time::{Date, Duration, Time, UtcOffset};

use crate::models::dump::{HistoryOverview, HistoryState};
use crate::models::weekly::{GetWeekDataPayload, WeekData};
use crate::services::history_service;
use crate::services::weekly_service;
use crate::utils::format_date_key;

/// Get week data including all daily entries and aggregated statistics
#[tauri::command]
pub async fn get_week_data(
    history_state: State<'_, HistoryState>,
    payload: GetWeekDataPayload,
) -> Result<WeekData, String> {
    // Parse the start date from YYYY-MM-DD format
    let date_format = format_description!("[year]-[month]-[day]");
    let date = Date::parse(&payload.start_date, &date_format)
        .map_err(|e| format!("Invalid start date format '{}': {}", payload.start_date, e))?;

    // Create OffsetDateTime at midnight local time
    let time = Time::from_hms(0, 0, 0).unwrap();
    let start_date = date.with_time(time)
        .assume_offset(UtcOffset::current_local_offset().unwrap_or(UtcOffset::UTC));

    let week_start_day = weekly_service::parse_week_start_day(&payload.week_start_day)?;

    // Get the actual week start
    let week_start = weekly_service::get_week_start(&start_date, week_start_day);
    let week_dates = weekly_service::get_week_dates(&week_start);

    // Build week data
    let (daily_entries, aggregated_stats) = weekly_service::build_week_data(
        history_state.inner(),
        &week_dates,
    )?;

    let start_date_str = format_date_key(&week_start)?;
    let end_date = week_start + Duration::days(6);
    let end_date_str = format_date_key(&end_date)?;

    Ok(WeekData {
        start_date: start_date_str,
        end_date: end_date_str,
        daily_entries,
        aggregated_stats,
    })
}

/// List all history files
#[tauri::command]
pub fn list_history(state: State<'_, HistoryState>) -> Result<HistoryOverview, String> {
    history_service::collect_history(state.inner())
}

/// Open the history folder in file explorer
#[tauri::command]
pub fn open_history_folder(app: AppHandle, state: State<'_, HistoryState>) -> Result<(), String> {
    history_service::ensure_history_dir(&state.directory)?;
    let target = state.directory.to_string_lossy().to_string();
    tauri::api::shell::open(&app.shell_scope(), target, None).map_err(|error| error.to_string())
}
