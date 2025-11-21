// services/weekly_service.rs
// Weekly data processing and aggregation service

use std::collections::HashMap;
use std::fs;
use time::{Duration, OffsetDateTime, Weekday};

use crate::models::dump::HistoryState;
use crate::models::weekly::{AggregatedStats, DailyEntry, DailyTrend, ProductivityStats};
use crate::utils::*;

/// Parse week start day from string
pub fn parse_week_start_day(day: &str) -> Result<Weekday, String> {
    match day.to_lowercase().as_str() {
        "sunday" => Ok(Weekday::Sunday),
        "monday" => Ok(Weekday::Monday),
        _ => Err(format!("Invalid week start day: {}. Must be 'sunday' or 'monday'", day)),
    }
}

/// Get the start of the week for a given date
pub fn get_week_start(date: &OffsetDateTime, week_start_day: Weekday) -> OffsetDateTime {
    let current_weekday = date.weekday();
    let days_diff = (current_weekday.number_days_from_monday() as i64
        - week_start_day.number_days_from_monday() as i64 + 7)
        % 7;

    *date - Duration::days(days_diff)
}

/// Get all 7 dates for a week
pub fn get_week_dates(start_date: &OffsetDateTime) -> Vec<OffsetDateTime> {
    (0..7)
        .map(|i| *start_date + Duration::days(i))
        .collect()
}

/// Load daily dump file
pub fn load_daily_dump(history_state: &HistoryState, date: &OffsetDateTime) -> Result<String, String> {
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
pub fn load_ai_feedback(date: &OffsetDateTime) -> Result<Option<String>, String> {
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

    // Work/개발 related keywords (highest priority - most specific)
    if text_lower.contains("개발") || text_lower.contains("코딩") || text_lower.contains("프로그래밍")
        || text_lower.contains("디버깅") || text_lower.contains("버그") || text_lower.contains("코드")
        || text_lower.contains("구현") || text_lower.contains("리팩토링") || text_lower.contains("테스트")
        || text_lower.contains("api") || text_lower.contains("ui") || text_lower.contains("레이아웃")
        || text_lower.contains("컴포넌트") || text_lower.contains("기능") || text_lower.contains("빌드")
        || text_lower.contains("배포") || text_lower.contains("에러") || text_lower.contains("수정")
        || text_lower.contains("패널") || text_lower.contains("섹션") || text_lower.contains("추가")
        || text_lower.contains("변경") || text_lower.contains("조정") || text_lower.contains("최적화")
        || text_lower.contains("작업") || text_lower.contains("프로젝트") || text_lower.contains("앱")
        || text_lower.contains("서비스") || text_lower.contains("웹") || text_lower.contains("모바일")
        || text_lower.contains("css") || text_lower.contains("html") || text_lower.contains("javascript")
        || text_lower.contains("typescript") || text_lower.contains("react") || text_lower.contains("tauri")
        || text_lower.contains("rust") || text_lower.contains("프론트") || text_lower.contains("백엔드")
        || text_lower.contains("db") || text_lower.contains("데이터베이스") || text_lower.contains("쿼리")
        || text_lower.contains("디자인시스템") || text_lower.contains("와이어프레임")
        || text_lower.contains("프로토타입") || text_lower.contains("mvp") {
        return "개발".to_string();
    }

    // Meetings/회의 related keywords
    if text_lower.contains("회의") || text_lower.contains("미팅") || text_lower.contains("논의")
        || text_lower.contains("협의") || text_lower.contains("상의") || text_lower.contains("회의록")
        || text_lower.contains("브리핑") || text_lower.contains("발표") {
        return "회의".to_string();
    }

    // Planning/기획 related keywords
    if text_lower.contains("기획") || text_lower.contains("계획") || text_lower.contains("설계")
        || text_lower.contains("구상") || text_lower.contains("아이디어") || text_lower.contains("전략")
        || text_lower.contains("로드맵") || text_lower.contains("스펙") || text_lower.contains("요구사항") {
        return "기획".to_string();
    }

    // Study/학습 related keywords
    if text_lower.contains("공부") || text_lower.contains("학습") || text_lower.contains("강의")
        || text_lower.contains("책") || text_lower.contains("독서") || text_lower.contains("읽기")
        || text_lower.contains("강좌") || text_lower.contains("튜토리얼") || text_lower.contains("문서")
        || text_lower.contains("docs") || text_lower.contains("매뉴얼") || text_lower.contains("가이드")
        || text_lower.contains("배우") || text_lower.contains("조사") || text_lower.contains("리서치")
        || text_lower.contains("아티클") || text_lower.contains("글") || text_lower.contains("자료") {
        return "학습".to_string();
    }

    // Exercise/운동 related keywords
    if text_lower.contains("운동") || text_lower.contains("헬스") || text_lower.contains("달리기")
        || text_lower.contains("러닝") || text_lower.contains("조깅") || text_lower.contains("산책")
        || text_lower.contains("요가") || text_lower.contains("스트레칭") || text_lower.contains("근력")
        || text_lower.contains("웨이트") || text_lower.contains("트레이닝") || text_lower.contains("수영")
        || text_lower.contains("자전거") || text_lower.contains("등산") || text_lower.contains("필라테스")
        || text_lower.contains("케이던스") || text_lower.contains("뛰") || text_lower.contains("걷") {
        return "운동".to_string();
    }

    // Meal/식사 related keywords
    if text_lower.contains("식사") || text_lower.contains("아침") || text_lower.contains("점심")
        || text_lower.contains("저녁") || text_lower.contains("간식") || text_lower.contains("먹")
        || text_lower.contains("밥") || text_lower.contains("음식") || text_lower.contains("요리")
        || text_lower.contains("커피") || text_lower.contains("카페") || text_lower.contains("마시")
        || text_lower.contains("물") || text_lower.contains("차") || text_lower.contains("음료")
        || text_lower.contains("배고") || text_lower.contains("계란") || text_lower.contains("빵")
        || text_lower.contains("샐러드") || text_lower.contains("고구마") || text_lower.contains("바나나") {
        return "식사".to_string();
    }

    // Rest/휴식 related keywords
    if text_lower.contains("휴식") || text_lower.contains("쉬") || text_lower.contains("낮잠")
        || text_lower.contains("잠") || text_lower.contains("수면") || text_lower.contains("침대")
        || text_lower.contains("눕") || text_lower.contains("누워") || text_lower.contains("취침")
        || text_lower.contains("일어남") || text_lower.contains("기상") || text_lower.contains("자고")
        || text_lower.contains("졸") {
        return "휴식".to_string();
    }

    // Social/약속 related keywords
    if text_lower.contains("약속") || text_lower.contains("친구") || text_lower.contains("만남")
        || text_lower.contains("모임") || text_lower.contains("만나") || text_lower.contains("연락")
        || text_lower.contains("톡") || text_lower.contains("전화") || text_lower.contains("메시지")
        || text_lower.contains("엄마") || text_lower.contains("가족") {
        return "약속".to_string();
    }

    // Entertainment/오락 related keywords
    if text_lower.contains("게임") || text_lower.contains("유튜브") || text_lower.contains("sns")
        || text_lower.contains("영상") || text_lower.contains("드라마") || text_lower.contains("영화")
        || text_lower.contains("유튜브 돌림") || text_lower.contains("넷플릭스") || text_lower.contains("트위치")
        || text_lower.contains("스트리밍") || text_lower.contains("기타") && text_lower.contains("연습")
        || text_lower.contains("악기") || text_lower.contains("취미") {
        return "오락".to_string();
    }

    // Personal care/개인관리 related keywords
    if text_lower.contains("샤워") || text_lower.contains("세면") || text_lower.contains("화장")
        || text_lower.contains("옷") || text_lower.contains("준비") || text_lower.contains("씻")
        || text_lower.contains("세수") || text_lower.contains("양치") || text_lower.contains("면도")
        || text_lower.contains("머리") || text_lower.contains("입고") {
        return "개인관리".to_string();
    }

    // Commute/이동 related keywords
    if text_lower.contains("이동") || text_lower.contains("출근") || text_lower.contains("퇴근")
        || text_lower.contains("버스") || text_lower.contains("지하철") || text_lower.contains("운전")
        || text_lower.contains("택시") || text_lower.contains("걷") && text_lower.contains("집")
        || text_lower.contains("도착") || text_lower.contains("복귀") || text_lower.contains("귀가")
        || text_lower.contains("집 나섬") || text_lower.contains("외출") {
        return "이동".to_string();
    }

    // Thinking/사고 related keywords
    if text_lower.contains("생각") || text_lower.contains("고민") || text_lower.contains("메모")
        || text_lower.contains("기록") || text_lower.contains("정리") || text_lower.contains("떠오름")
        || text_lower.contains("아이디어") && !text_lower.contains("개발")
        || text_lower.contains("회고") || text_lower.contains("복기") {
        return "사고".to_string();
    }

    // Default category
    "기타".to_string()
}

/// Parse categorized time from dump content
/// Looks for patterns like "- task (HH:MM:SS)" and calculates time spent
pub fn parse_categorized_time(dump_content: &str) -> HashMap<String, i64> {
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
pub fn classify_productivity(categories: &HashMap<String, i64>) -> ProductivityStats {
    // Productive categories
    let productive_categories = ["개발", "회의", "기획", "학습", "운동"];

    // Non-productive/waste categories
    let waste_categories = ["오락", "휴식"];

    // Neutral categories (not counted in either): 식사, 개인관리, 이동, 약속, 사고, 기타

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

/// Build week data from daily entries
pub fn build_week_data(
    history_state: &HistoryState,
    week_dates: &[OffsetDateTime],
) -> Result<(Vec<DailyEntry>, AggregatedStats), String> {
    let mut daily_entries = Vec::new();
    let mut total_categories: HashMap<String, i64> = HashMap::new();
    let mut daily_trends = Vec::new();

    for date in week_dates {
        let dump_content = load_daily_dump(history_state, date)?;
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

    let aggregated_stats = AggregatedStats {
        total_categories,
        productivity_vs_waste,
        daily_trend: daily_trends,
    };

    Ok((daily_entries, aggregated_stats))
}
