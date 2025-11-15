use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use tauri::State;
use time::{Duration, OffsetDateTime, Weekday, Date, Time, UtcOffset};
use time::macros::format_description;

use crate::history::HistoryState;
use crate::utils::*;

// ============================================================================
// Data Structures
// ============================================================================

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WeekData {
    pub start_date: String,
    pub end_date: String,
    pub daily_entries: Vec<DailyEntry>,
    pub aggregated_stats: AggregatedStats,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DailyEntry {
    pub date: String,
    pub dump_content: String,
    pub ai_feedback: Option<String>,
    pub retrospect_content: Option<String>,
    pub categorized_time: HashMap<String, i64>, // category -> seconds
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AggregatedStats {
    pub total_categories: HashMap<String, i64>, // category -> total seconds
    pub productivity_vs_waste: ProductivityStats,
    pub daily_trend: Vec<DailyTrend>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ProductivityStats {
    pub productive_seconds: i64,
    pub waste_seconds: i64,
    pub productive_percentage: f64,
    pub waste_percentage: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DailyTrend {
    pub date: String,
    pub categories: HashMap<String, i64>, // category -> seconds for this day
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetWeekDataPayload {
    pub start_date: String, // ISO 8601 format: YYYY-MM-DD
    pub week_start_day: String, // "sunday" or "monday"
}

// ============================================================================
// Helper Functions
// ============================================================================

/// Parse week start day from string
fn parse_week_start_day(day: &str) -> Result<Weekday, String> {
    match day.to_lowercase().as_str() {
        "sunday" => Ok(Weekday::Sunday),
        "monday" => Ok(Weekday::Monday),
        _ => Err(format!("Invalid week start day: {}. Must be 'sunday' or 'monday'", day)),
    }
}

/// Get the start of the week for a given date
fn get_week_start(date: &OffsetDateTime, week_start_day: Weekday) -> OffsetDateTime {
    let current_weekday = date.weekday();
    let days_diff = (current_weekday.number_days_from_monday() as i64
        - week_start_day.number_days_from_monday() as i64 + 7)
        % 7;

    *date - Duration::days(days_diff)
}

/// Get all 7 dates for a week
fn get_week_dates(start_date: &OffsetDateTime) -> Vec<OffsetDateTime> {
    (0..7)
        .map(|i| *start_date + Duration::days(i))
        .collect()
}

/// Load daily dump file
fn load_daily_dump(history_state: &HistoryState, date: &OffsetDateTime) -> Result<String, String> {
    let date_key = format_date_key(date)?;
    let filename = format!("{}.md", date_key);
    let file_path = history_state.directory.join(filename);

    if file_path.exists() {
        fs::read_to_string(&file_path)
            .map_err(|e| format!("Failed to read dump file: {}", e))
    } else {
        Ok(String::new())
    }
}

/// Load AI feedback files for a specific date
fn load_ai_feedback(date: &OffsetDateTime) -> Result<Option<String>, String> {
    let summaries_dir = summaries_directory_path()?;

    if !summaries_dir.exists() {
        return Ok(None);
    }

    let date_key = date
        .format(&time::macros::format_description!("[year][month][day]"))
        .map_err(|e| e.to_string())?;

    // Find all AI feedback files for this date
    let entries = fs::read_dir(&summaries_dir)
        .map_err(|e| format!("Failed to read summaries directory: {}", e))?;

    let mut feedbacks = Vec::new();

    for entry in entries.flatten() {
        let filename = entry.file_name().to_string_lossy().to_string();
        if filename.starts_with(&format!("ai-feedback-{}", date_key)) && filename.ends_with(".md") {
            if let Ok(content) = fs::read_to_string(entry.path()) {
                feedbacks.push(content);
            }
        }
    }

    if feedbacks.is_empty() {
        Ok(None)
    } else {
        // Combine all feedbacks for the day
        Ok(Some(feedbacks.join("\n\n---\n\n")))
    }
}

/// Entry with timestamp parsed from dump content
#[derive(Debug, Clone)]
struct TimeEntry {
    text: String,
    total_seconds: u32,
}

/// Parse a timestamp from format (HH:MM:SS)
fn parse_timestamp(text: &str) -> Option<(u32, u32, u32)> {
    // Find the last occurrence of (HH:MM:SS) pattern
    let start = text.rfind('(')?;
    let end = text.rfind(')')?;

    if start >= end {
        return None;
    }

    let timestamp_part = &text[start + 1..end];
    let parts: Vec<&str> = timestamp_part.split(':').collect();

    if parts.len() != 3 {
        return None;
    }

    let hour = parts[0].parse::<u32>().ok()?;
    let minute = parts[1].parse::<u32>().ok()?;
    let second = parts[2].parse::<u32>().ok()?;

    if hour >= 24 || minute >= 60 || second >= 60 {
        return None;
    }

    Some((hour, minute, second))
}

/// Extract category from text using keyword matching
fn extract_category(text: &str) -> String {
    let text_lower = text.to_lowercase();

    // Work/업무 related keywords
    if text_lower.contains("업무") || text_lower.contains("작업") || text_lower.contains("개발")
        || text_lower.contains("회의") || text_lower.contains("미팅") || text_lower.contains("프로젝트")
        || text_lower.contains("코딩") || text_lower.contains("디자인") || text_lower.contains("기획") {
        return "업무".to_string();
    }

    // Study/학습 related keywords
    if text_lower.contains("공부") || text_lower.contains("학습") || text_lower.contains("강의")
        || text_lower.contains("책") || text_lower.contains("독서") || text_lower.contains("읽기") {
        return "학습".to_string();
    }

    // Exercise/운동 related keywords
    if text_lower.contains("운동") || text_lower.contains("헬스") || text_lower.contains("달리기")
        || text_lower.contains("산책") || text_lower.contains("요가") || text_lower.contains("스트레칭") {
        return "운동".to_string();
    }

    // Meal/식사 related keywords
    if text_lower.contains("식사") || text_lower.contains("아침") || text_lower.contains("점심")
        || text_lower.contains("저녁") || text_lower.contains("간식") || text_lower.contains("먹") {
        return "식사".to_string();
    }

    // Rest/휴식 related keywords
    if text_lower.contains("휴식") || text_lower.contains("쉬") || text_lower.contains("낮잠")
        || text_lower.contains("잠") || text_lower.contains("수면") {
        return "휴식".to_string();
    }

    // Entertainment/오락 related keywords
    if text_lower.contains("게임") || text_lower.contains("유튜브") || text_lower.contains("sns")
        || text_lower.contains("영상") || text_lower.contains("드라마") || text_lower.contains("영화") {
        return "오락".to_string();
    }

    // Personal care/개인관리 related keywords
    if text_lower.contains("샤워") || text_lower.contains("세면") || text_lower.contains("화장")
        || text_lower.contains("옷") || text_lower.contains("준비") {
        return "개인관리".to_string();
    }

    // Commute/이동 related keywords
    if text_lower.contains("이동") || text_lower.contains("출근") || text_lower.contains("퇴근")
        || text_lower.contains("버스") || text_lower.contains("지하철") || text_lower.contains("운전") {
        return "이동".to_string();
    }

    // Default category
    "기타".to_string()
}

/// Parse categorized time from dump content
/// Looks for patterns like "- task (HH:MM:SS)" and calculates time spent
fn parse_categorized_time(dump_content: &str) -> HashMap<String, i64> {
    let mut categories: HashMap<String, i64> = HashMap::new();
    let mut entries: Vec<TimeEntry> = Vec::new();

    // Parse all entries with timestamps
    for line in dump_content.lines() {
        let trimmed = line.trim();

        // Look for lines starting with "-"
        if !trimmed.starts_with("- ") {
            continue;
        }

        // Try to parse timestamp
        if let Some((hour, minute, second)) = parse_timestamp(trimmed) {
            let total_seconds = hour * 3600 + minute * 60 + second;

            // Extract text before the timestamp
            if let Some(end_pos) = trimmed.rfind('(') {
                let text = trimmed[2..end_pos].trim().to_string();

                entries.push(TimeEntry {
                    text,
                    total_seconds,
                });
            }
        }
    }

    // Sort entries by time
    entries.sort_by_key(|e| e.total_seconds);

    // Calculate time differences and categorize
    for i in 0..entries.len() {
        let current = &entries[i];

        // Calculate duration until next entry (or end of day)
        let duration_seconds = if i + 1 < entries.len() {
            let next = &entries[i + 1];
            (next.total_seconds - current.total_seconds) as i64
        } else {
            // Last entry: assume 1 hour duration (could be configurable)
            3600i64
        };

        // Extract category from text
        let category = extract_category(&current.text);

        // Add to categories
        *categories.entry(category).or_insert(0) += duration_seconds;
    }

    categories
}

/// Classify categories into productive vs waste
fn classify_productivity(categories: &HashMap<String, i64>) -> ProductivityStats {
    // Productive categories
    let productive_categories = vec!["업무", "학습", "운동"];

    // Non-productive/waste categories
    let waste_categories = vec!["오락", "휴식"];

    // Neutral categories (not counted in either): 식사, 개인관리, 이동, 기타

    let mut productive_seconds = 0i64;
    let mut waste_seconds = 0i64;

    for (category, seconds) in categories.iter() {
        if productive_categories.contains(&category.as_str()) {
            productive_seconds += seconds;
        } else if waste_categories.contains(&category.as_str()) {
            waste_seconds += seconds;
        }
        // Neutral categories are not counted in either
    }

    let total = productive_seconds + waste_seconds;
    let (productive_percentage, waste_percentage) = if total > 0 {
        (
            (productive_seconds as f64 / total as f64) * 100.0,
            (waste_seconds as f64 / total as f64) * 100.0,
        )
    } else {
        (0.0, 0.0)
    };

    ProductivityStats {
        productive_seconds,
        waste_seconds,
        productive_percentage,
        waste_percentage,
    }
}

// ============================================================================
// Tauri Commands
// ============================================================================

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

    let week_start_day = parse_week_start_day(&payload.week_start_day)?;

    // Get the actual week start
    let week_start = get_week_start(&start_date, week_start_day);
    let week_dates = get_week_dates(&week_start);

    // Load data for each day
    let mut daily_entries = Vec::new();
    let mut total_categories: HashMap<String, i64> = HashMap::new();
    let mut daily_trends = Vec::new();

    for date in &week_dates {
        let dump_content = load_daily_dump(history_state.inner(), date)?;
        let ai_feedback = load_ai_feedback(date)?;
        let categorized_time = parse_categorized_time(&dump_content);

        // TODO: Load retrospect content from localStorage backup or file
        let retrospect_content = None;

        // Aggregate categories
        for (category, seconds) in &categorized_time {
            *total_categories.entry(category.clone()).or_insert(0) += seconds;
        }

        // Add to daily trend
        let date_str = format_date_key(date)?;
        daily_trends.push(DailyTrend {
            date: date_str.clone(),
            categories: categorized_time.clone(),
        });

        daily_entries.push(DailyEntry {
            date: date_str,
            dump_content,
            ai_feedback,
            retrospect_content,
            categorized_time,
        });
    }

    // Calculate productivity stats
    let productivity_vs_waste = classify_productivity(&total_categories);

    let start_date_str = format_date_key(&week_start)?;
    let end_date = week_start + Duration::days(6);
    let end_date_str = format_date_key(&end_date)?;

    Ok(WeekData {
        start_date: start_date_str,
        end_date: end_date_str,
        daily_entries,
        aggregated_stats: AggregatedStats {
            total_categories,
            productivity_vs_waste,
            daily_trend: daily_trends,
        },
    })
}
