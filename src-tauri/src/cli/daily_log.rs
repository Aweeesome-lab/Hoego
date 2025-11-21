use std::fs::{File, OpenOptions};
use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
use time::OffsetDateTime;

use crate::models::dump::HistoryState;
use crate::services::history_service::ensure_daily_file;
use crate::utils::{current_local_time, format_date_label, format_time_with_seconds};

// ANSI 색상 코드
const RESET: &str = "\x1b[0m";
const BOLD: &str = "\x1b[1m";
const DIM: &str = "\x1b[2m";
const CYAN: &str = "\x1b[36m";
#[allow(dead_code)]
const GREEN: &str = "\x1b[32m";
const YELLOW: &str = "\x1b[33m";
#[allow(dead_code)]
const BLUE: &str = "\x1b[34m";
#[allow(dead_code)]
const MAGENTA: &str = "\x1b[35m";
const GRAY: &str = "\x1b[90m";

/// 오늘 파일 경로를 가져옵니다
pub fn get_today_file_path() -> Result<(PathBuf, OffsetDateTime), String> {
    let state = HistoryState::default();
    let now = current_local_time()?;
    let (file_path, _date_key) = ensure_daily_file(&state, &now)?;
    Ok((file_path, now))
}

/// 파일의 마지막 N줄을 읽어옵니다 (전체 파일 읽기)
pub fn read_last_n_lines(file_path: &std::path::Path, n: usize) -> Result<Vec<String>, String> {
    if !file_path.exists() {
        return Ok(Vec::new());
    }

    let file = File::open(file_path).map_err(|e| format!("파일 열기 실패: {}", e))?;
    let reader = BufReader::new(file);
    let lines: Vec<String> = reader
        .lines()
        .map_while(Result::ok)
        .collect();

    let start_idx = if lines.len() > n {
        lines.len() - n
    } else {
        0
    };

    Ok(lines[start_idx..].to_vec())
}

/// 로그 항목을 파일에 추가합니다
pub fn append_log_entry(file_path: &Path, content: &str) -> Result<(), String> {
    let now = current_local_time()?;
    let time_label = format_time_with_seconds(&now)?;

    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(file_path)
        .map_err(|e| format!("파일 열기 실패: {}", e))?;

    writeln!(file, "- {} ({})", content, time_label)
        .map_err(|e| format!("파일 쓰기 실패: {}", e))?;

    file.flush()
        .map_err(|e| format!("파일 flush 실패: {}", e))?;

    Ok(())
}

/// 세션 헤더를 파일에 추가합니다
pub fn append_session_header(file_path: &Path, session_title: &str) -> Result<(), String> {
    let now = current_local_time()?;
    let time_label = format_time_with_seconds(&now)?;

    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(file_path)
        .map_err(|e| format!("파일 열기 실패: {}", e))?;

    writeln!(file, "\n## 세션: {} ({})\n", session_title, time_label)
        .map_err(|e| format!("파일 쓰기 실패: {}", e))?;

    file.flush()
        .map_err(|e| format!("파일 flush 실패: {}", e))?;

    Ok(())
}

/// 화면을 지웁니다
pub fn clear_screen() {
    print!("\x1b[2J\x1b[H");
}

/// 화면 헤더를 출력합니다
pub fn print_header(file_path: &Path, now: &OffsetDateTime) {
    let date_label = format_date_label(now);
    let path_str = file_path
        .to_string_lossy()
        .replace(&std::env::var("HOME").unwrap_or_default(), "~");

    // 깔끔한 헤더
    println!();
    println!("{}{}  Hoego{} {}", BOLD, CYAN, RESET, GRAY);
    println!("  Daily Log — {}{}{}", BOLD, date_label, RESET);
    println!("  {}{}{}{}", DIM, path_str, RESET, GRAY);
    println!();
}

/// 최근 로그를 출력합니다
pub fn print_recent_lines(file_path: &Path, n: usize) -> Result<(), String> {
    let lines = read_last_n_lines(file_path, n)?;

    if lines.is_empty() {
        println!("  {}아직 기록된 내용이 없습니다{}", DIM, RESET);
        println!();
    } else {
        // 로그 출력 (시각화)
        for line in lines {
            print_formatted_line(&line);
        }
        println!();
    }

    Ok(())
}

/// 로그 라인을 포맷팅해서 출력합니다
fn print_formatted_line(line: &str) {
    if line.starts_with("# ") {
        // 헤더
        println!("  {}{}{}", BOLD, line, RESET);
    } else if line.starts_with("## ") {
        // 세션 헤더
        println!("  {}{}{}", YELLOW, line, RESET);
    } else if line.starts_with("- ") {
        // 로그 항목
        // "- 내용 (HH:MM:SS)" 형식에서 시간 부분을 추출
        if let Some(time_start) = line.rfind('(') {
            if let Some(time_end) = line.rfind(')') {
                let content = &line[2..time_start].trim();
                let time = &line[time_start..=time_end];
                println!("  {}- {}{} {}{}{}",
                    GRAY, RESET, content, DIM, time, RESET);
            } else {
                println!("  {}", line);
            }
        } else {
            println!("  {}", line);
        }
    } else if line.trim().is_empty() {
        // 빈 줄
        println!();
    } else {
        // 일반 텍스트
        println!("  {}{}{}", DIM, line, RESET);
    }
}

/// 도움말을 출력합니다
pub fn print_help() {
    println!();
    println!("  {}명령어{}", BOLD, RESET);
    println!("  {}:q{}, {}:quit{}   종료", CYAN, RESET, CYAN, RESET);
    println!("  {}:h{}, {}:help{}   도움말", CYAN, RESET, CYAN, RESET);
    println!();
    println!("  {}사용법{}", BOLD, RESET);
    println!("  평문 입력 후 Enter → 로그에 자동 기록");
    println!("  빈 줄은 무시됨");
    println!();
}

/// 입력 구분선을 출력합니다
pub fn print_separator() {
    println!("{}────────────────────────────────────────────────────────────────{}", DIM, RESET);
}
