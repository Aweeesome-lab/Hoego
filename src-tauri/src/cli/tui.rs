use crossterm::{
    event::{self, DisableMouseCapture, EnableMouseCapture, Event, KeyCode, KeyModifiers, MouseEventKind},
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};
use ratatui::{
    backend::CrosstermBackend,
    layout::{Alignment, Constraint, Direction, Layout},
    style::{Color, Modifier, Style},
    text::{Line, Span, Text},
    widgets::{Block, Borders, Paragraph},
    Terminal,
};
use std::io;
use time::OffsetDateTime;
use unicode_width::UnicodeWidthStr;

use crate::utils::format_date_label;

pub struct TuiApp {
    pub input: String,
    pub cursor_position: usize,
    pub logs: Vec<String>,
    pub date_label: String,
    pub file_path: String,
    pub scroll_offset: usize,
    pub should_scroll_to_bottom: bool,
}

impl TuiApp {
    pub fn new(now: &OffsetDateTime, file_path: String, initial_logs: Vec<String>) -> Self {
        let date_label = format_date_label(now);
        let file_path_display = file_path
            .replace(&std::env::var("HOME").unwrap_or_default(), "~");

        Self {
            input: String::new(),
            cursor_position: 0,
            logs: initial_logs,
            date_label,
            file_path: file_path_display,
            scroll_offset: 0,
            should_scroll_to_bottom: true, // 초기에는 최하단으로
        }
    }

    pub fn update_logs(&mut self, new_logs: Vec<String>) {
        self.logs = new_logs;
        self.should_scroll_to_bottom = true; // 새 로그 추가 시 최하단으로
    }

    pub fn move_cursor_left(&mut self) {
        if self.cursor_position == 0 {
            return;
        }

        // 현재 커서 위치를 문자 경계로 보정
        let safe_pos = self.ensure_char_boundary(self.cursor_position);
        if safe_pos == 0 {
            return;
        }

        // 이전 문자의 시작 위치 찾기
        let mut new_pos = safe_pos - 1;
        while new_pos > 0 && !self.input.is_char_boundary(new_pos) {
            new_pos -= 1;
        }
        self.cursor_position = new_pos;
    }

    pub fn move_cursor_right(&mut self) {
        let len = self.input.len();
        if self.cursor_position >= len {
            return;
        }

        // 현재 커서 위치를 문자 경계로 보정
        let safe_pos = self.ensure_char_boundary(self.cursor_position);
        if safe_pos >= len {
            self.cursor_position = len;
            return;
        }

        // 다음 문자의 시작 위치 찾기
        let mut new_pos = safe_pos + 1;
        while new_pos < len && !self.input.is_char_boundary(new_pos) {
            new_pos += 1;
        }
        self.cursor_position = new_pos.min(len);
    }

    pub fn enter_char(&mut self, new_char: char) {
        // 현재 커서 위치를 문자 경계로 보정
        let safe_pos = self.ensure_char_boundary(self.cursor_position);

        // 안전한 방식으로 문자 삽입
        let mut new_input = String::with_capacity(self.input.len() + new_char.len_utf8());
        new_input.push_str(&self.input[..safe_pos]);
        new_input.push(new_char);
        new_input.push_str(&self.input[safe_pos..]);

        self.input = new_input;
        self.cursor_position = safe_pos + new_char.len_utf8();
    }

    pub fn ensure_char_boundary(&self, pos: usize) -> usize {
        let len = self.input.len();
        if pos > len {
            return len;
        }
        if pos == 0 || self.input.is_char_boundary(pos) {
            return pos;
        }
        // 가장 가까운 이전 문자 경계 찾기
        let mut safe_pos = pos;
        while safe_pos > 0 && !self.input.is_char_boundary(safe_pos) {
            safe_pos -= 1;
        }
        safe_pos
    }

    pub fn delete_char(&mut self) {
        if self.cursor_position == 0 {
            return;
        }

        // 현재 커서 위치를 문자 경계로 보정
        let safe_pos = self.ensure_char_boundary(self.cursor_position);
        if safe_pos == 0 {
            return;
        }

        // 이전 문자의 시작 위치 찾기
        let mut prev_pos = safe_pos - 1;
        while prev_pos > 0 && !self.input.is_char_boundary(prev_pos) {
            prev_pos -= 1;
        }

        // 안전한 방식으로 문자 삭제
        let mut new_input = String::with_capacity(self.input.len());
        new_input.push_str(&self.input[..prev_pos]);
        new_input.push_str(&self.input[safe_pos..]);

        self.input = new_input;
        self.cursor_position = prev_pos;
    }

    pub fn clamp_cursor(&self, new_cursor_pos: usize) -> usize {
        new_cursor_pos.clamp(0, self.input.len())
    }

    pub fn submit_message(&mut self) -> Option<String> {
        if self.input.is_empty() {
            return None;
        }
        let message = self.input.clone();
        self.input.clear();
        self.cursor_position = 0;
        Some(message)
    }

    pub fn scroll_up(&mut self, lines: usize) {
        self.scroll_offset = self.scroll_offset.saturating_sub(lines);
        self.should_scroll_to_bottom = false; // 수동 스크롤 시 자동 스크롤 해제
    }

    pub fn scroll_down(&mut self, lines: usize) {
        // scroll_offset은 로그 인덱스이므로 단순히 증가
        // 최대값 체크는 adjust_scroll_if_needed에서 처리
        self.scroll_offset = self.scroll_offset.saturating_add(lines);
        self.should_scroll_to_bottom = false; // 수동 스크롤 시 자동 스크롤 해제
    }

    pub fn scroll_to_top(&mut self) {
        self.scroll_offset = 0;
        self.should_scroll_to_bottom = false;
    }

    pub fn scroll_to_bottom(&mut self, visible_lines: usize) {
        if self.logs.len() > visible_lines {
            self.scroll_offset = self.logs.len() - visible_lines;
        } else {
            self.scroll_offset = 0;
        }
        self.should_scroll_to_bottom = false;
    }

    pub fn adjust_scroll_if_needed(&mut self, _visible_lines: usize) {
        // 최하단으로 스크롤해야 하는 경우
        if self.should_scroll_to_bottom {
            // 마지막 로그로 이동 (UI에서 wrap 처리)
            self.scroll_offset = self.logs.len().saturating_sub(1);
            self.should_scroll_to_bottom = false;
            return;
        }

        // scroll_offset이 로그 범위를 벗어나지 않도록 제한
        if self.scroll_offset >= self.logs.len() {
            self.scroll_offset = self.logs.len().saturating_sub(1);
        }
    }
}

pub fn setup_terminal() -> Result<Terminal<CrosstermBackend<io::Stdout>>, String> {
    enable_raw_mode().map_err(|e| format!("Raw mode 활성화 실패: {}", e))?;
    let mut stdout = io::stdout();
    execute!(stdout, EnterAlternateScreen, EnableMouseCapture)
        .map_err(|e| format!("터미널 초기화 실패: {}", e))?;
    let backend = CrosstermBackend::new(stdout);
    Terminal::new(backend).map_err(|e| format!("터미널 생성 실패: {}", e))
}

pub fn restore_terminal(
    terminal: &mut Terminal<CrosstermBackend<io::Stdout>>,
) -> Result<(), String> {
    disable_raw_mode().map_err(|e| format!("Raw mode 비활성화 실패: {}", e))?;
    execute!(
        terminal.backend_mut(),
        LeaveAlternateScreen,
        DisableMouseCapture
    )
    .map_err(|e| format!("터미널 복원 실패: {}", e))?;
    terminal
        .show_cursor()
        .map_err(|e| format!("커서 표시 실패: {}", e))?;
    Ok(())
}

pub fn run_tui_loop(
    terminal: &mut Terminal<CrosstermBackend<io::Stdout>>,
    app: &mut TuiApp,
) -> Result<Option<String>, String> {
    run_app(terminal, app)
}

fn run_app<B: ratatui::backend::Backend>(
    terminal: &mut Terminal<B>,
    app: &mut TuiApp,
) -> Result<Option<String>, String> {
    loop {
        // 터미널 크기에 맞춰 스크롤 조정
        let terminal_size = terminal.size().map_err(|e| format!("터미널 크기 확인 실패: {}", e))?;
        let log_area_height = terminal_size.height.saturating_sub(5) as usize; // 입력 영역과 여백 제외
        app.adjust_scroll_if_needed(log_area_height);

        terminal
            .draw(|f| ui(f, app))
            .map_err(|e| format!("그리기 실패: {}", e))?;

        match event::read().map_err(|e| format!("이벤트 읽기 실패: {}", e))? {
            Event::Key(key) => match (key.code, key.modifiers) {
                // Ctrl+C 또는 Ctrl+D로 종료
                (KeyCode::Char('c'), KeyModifiers::CONTROL)
                | (KeyCode::Char('d'), KeyModifiers::CONTROL) => {
                    return Ok(None);
                }
                // Esc로 종료
                (KeyCode::Esc, _) => {
                    return Ok(None);
                }
                // Ctrl+A: 줄 맨 앞으로
                (KeyCode::Char('a'), KeyModifiers::CONTROL) => {
                    app.cursor_position = 0;
                }
                // Ctrl+E: 줄 맨 뒤로
                (KeyCode::Char('e'), KeyModifiers::CONTROL) => {
                    app.cursor_position = app.input.len();
                }
                // Ctrl+U: 커서 앞 전체 삭제
                (KeyCode::Char('u'), KeyModifiers::CONTROL) => {
                    let safe_pos = app.ensure_char_boundary(app.cursor_position);
                    app.input = app.input[safe_pos..].to_string();
                    app.cursor_position = 0;
                }
                // Ctrl+K: 커서 뒤 전체 삭제
                (KeyCode::Char('k'), KeyModifiers::CONTROL) => {
                    let safe_pos = app.ensure_char_boundary(app.cursor_position);
                    app.input.truncate(safe_pos);
                    app.cursor_position = safe_pos;
                }
                // Ctrl+W: 이전 단어 삭제
                (KeyCode::Char('w'), KeyModifiers::CONTROL) => {
                    if app.cursor_position > 0 {
                        let safe_pos = app.ensure_char_boundary(app.cursor_position);
                        let before = &app.input[..safe_pos];
                        let trimmed = before.trim_end();

                        let new_pos = if let Some(pos) = trimmed.rfind(char::is_whitespace) {
                            pos + 1
                        } else {
                            0
                        };

                        // 안전한 방식으로 삭제
                        let mut new_input = String::with_capacity(app.input.len());
                        new_input.push_str(&app.input[..new_pos]);
                        new_input.push_str(&app.input[safe_pos..]);
                        app.input = new_input;
                        app.cursor_position = new_pos;
                    }
                }
                // 명령어 모드
                (KeyCode::Char(':'), KeyModifiers::NONE) if app.input.is_empty() => {
                    app.enter_char(':');
                }
                // Enter로 제출
                (KeyCode::Enter, _) => {
                    if let Some(message) = app.submit_message() {
                        // :q 명령어 처리
                        if message == ":q" || message == ":quit" {
                            return Ok(None);
                        }
                        return Ok(Some(message));
                    }
                }
                // 문자 입력
                (KeyCode::Char(c), KeyModifiers::NONE | KeyModifiers::SHIFT) => {
                    app.enter_char(c);
                }
                // 백스페이스
                (KeyCode::Backspace, _) => {
                    app.delete_char();
                }
                // 커서 이동 - modifier 명시적 처리
                (KeyCode::Left, KeyModifiers::NONE | KeyModifiers::SHIFT) => {
                    app.move_cursor_left();
                }
                (KeyCode::Right, KeyModifiers::NONE | KeyModifiers::SHIFT) => {
                    app.move_cursor_right();
                }
                // 로그 스크롤 (Up/Down)
                (KeyCode::Up, KeyModifiers::NONE) => {
                    app.scroll_up(1);
                }
                (KeyCode::Down, KeyModifiers::NONE) => {
                    app.scroll_down(1);
                }
                // 페이지 단위 스크롤
                (KeyCode::PageUp, _) => {
                    app.scroll_up(10);
                }
                (KeyCode::PageDown, _) => {
                    app.scroll_down(10);
                }
                // Home/End - 입력 커서 또는 스크롤
                (KeyCode::Home, KeyModifiers::NONE) => {
                    app.cursor_position = 0;
                }
                (KeyCode::End, KeyModifiers::NONE) => {
                    app.cursor_position = app.input.len();
                }
                // Ctrl+Home/End - 스크롤 최상단/최하단
                (KeyCode::Home, KeyModifiers::CONTROL) => {
                    app.scroll_to_top();
                }
                (KeyCode::End, KeyModifiers::CONTROL) => {
                    // 최하단으로 스크롤 (현재 터미널 크기의 log_area_height 사용)
                    app.scroll_to_bottom(log_area_height);
                }
                _ => {}
            },
            Event::Mouse(mouse) => match mouse.kind {
                MouseEventKind::ScrollUp => {
                    app.scroll_up(3); // 마우스 휠 한 번에 3줄씩
                }
                MouseEventKind::ScrollDown => {
                    app.scroll_down(3);
                }
                _ => {}
            },
            _ => {}
        }
    }
}

fn ui(f: &mut ratatui::Frame, app: &mut TuiApp) {
    // 입력 텍스트 길이에 따라 필요한 줄 수 계산 (unicode width 고려)
    // 프롬프트(4칸) + 입력 영역을 고려
    let available_width = f.area().width.saturating_sub(8) as usize; // 프롬프트(4) + borders(4)
    let input_visual_width = app.input.width(); // 한글 2칸, 영문 1칸
    let required_lines = if input_visual_width == 0 {
        1
    } else {
        ((input_visual_width) as f32 / available_width as f32).ceil() as u16
    };
    let input_height = (required_lines + 2).clamp(3, 10); // 최소 3줄, 최대 10줄

    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Min(1),              // 로그 영역 (최소 1줄)
            Constraint::Length(input_height), // 입력 영역 (동적 높이)
        ])
        .split(f.area());

    // 상단: 로그 영역
    // 스크롤 오프셋 적용
    // Block with Borders::NONE but with title + title_bottom
    // ratatui renders: title (1 line) + content + title_bottom (1 line)
    let log_area_height = chunks[0].height.saturating_sub(2) as usize;
    let total_logs = app.logs.len();

    // 텍스트가 wrap될 수 있으므로 실제 렌더링되는 줄 수 계산
    let content_width = chunks[0].width.saturating_sub(4) as usize; // 좌우 여백 제외

    // scroll_offset부터 화면에 채울 수 있는 만큼의 로그 가져오기
    let visible_start = app.scroll_offset.min(total_logs.saturating_sub(1));

    // 화면에 표시할 로그 범위 계산 (wrap 고려)
    let mut accumulated_lines = 0;
    let mut visible_end = visible_start;

    for idx in visible_start..total_logs {
        let log_line = &app.logs[idx];

        // 이 줄이 차지하는 화면 줄 수 계산
        let visual_width = log_line.width() + 2;
        let lines_taken = if content_width > 0 {
            ((visual_width as f32) / (content_width as f32)).ceil() as usize
        } else {
            1
        };
        let lines_taken = lines_taken.max(1);

        // 화면에 들어갈 수 있으면 추가
        if accumulated_lines + lines_taken <= log_area_height {
            accumulated_lines += lines_taken;
            visible_end = idx + 1;
        } else {
            break;
        }
    }

    // 만약 마지막까지 도달했는데 화면이 남으면, 위로 올려서 채우기
    if visible_end >= total_logs && accumulated_lines < log_area_height {
        let mut extra_lines_needed = log_area_height - accumulated_lines;
        let mut new_start = visible_start;

        while new_start > 0 && extra_lines_needed > 0 {
            new_start -= 1;
            let log_line = &app.logs[new_start];
            let visual_width = log_line.width() + 2;
            let lines_taken = if content_width > 0 {
                ((visual_width as f32) / (content_width as f32)).ceil() as usize
            } else {
                1
            };
            let lines_taken = lines_taken.max(1);

            if lines_taken <= extra_lines_needed {
                extra_lines_needed -= lines_taken;
                accumulated_lines += lines_taken;
            } else {
                break;
            }
        }

        // scroll_offset와 visible_start 모두 업데이트
        app.scroll_offset = new_start;
    }

    // 최종 범위: scroll_offset가 업데이트되었을 수 있으므로 다시 계산
    let final_start = app.scroll_offset.min(total_logs.saturating_sub(1));

    let log_lines: Vec<Line> = app
        .logs
        .iter()
        .skip(final_start)
        .take(visible_end - final_start)
        .map(|line| format_log_line(line))
        .collect();

    let logs_text = Text::from(log_lines);

    // 스크롤 인디케이터 생성
    let scroll_indicator = if total_logs > log_area_height {
        let can_scroll_up = final_start > 0;
        let can_scroll_down = visible_end < total_logs;
        let max_offset = total_logs.saturating_sub(1);
        let percentage = if max_offset > 0 {
            (final_start * 100) / max_offset
        } else {
            0
        };

        let up_arrow = if can_scroll_up { "↑" } else { " " };
        let down_arrow = if can_scroll_down { "↓" } else { " " };

        format!(" [{}{}{}] {}-{}/{} ",
            up_arrow,
            percentage.min(100),
            down_arrow,
            final_start + 1,
            visible_end,
            total_logs
        )
    } else {
        format!(" {}/{} ", total_logs, total_logs)
    };

    let logs_paragraph = Paragraph::new(logs_text)
        .wrap(ratatui::widgets::Wrap { trim: false })
        .alignment(Alignment::Left)
        .block(
            Block::default()
                .borders(Borders::NONE)
                .title(Span::styled(
                    format!("  Hoego  Daily Log — {}", app.date_label),
                    Style::default()
                        .fg(Color::Cyan)
                        .add_modifier(Modifier::BOLD),
                ))
                .title_bottom(Span::styled(
                    format!("  {}{}", app.file_path, scroll_indicator),
                    Style::default().fg(Color::DarkGray),
                )),
        );

    f.render_widget(logs_paragraph, chunks[0]);

    // 하단: 입력 영역을 프롬프트와 입력으로 분할
    let input_chunks = Layout::default()
        .direction(Direction::Horizontal)
        .constraints([
            Constraint::Length(4),   // 프롬프트 "> " (4칸으로 여유 확보)
            Constraint::Min(10),     // 입력 영역 (최소 10칸)
        ])
        .split(chunks[1]);

    // 왼쪽: 프롬프트 영역
    let prompt_widget = Paragraph::new("> ")
        .style(Style::default().fg(Color::Cyan))
        .block(
            Block::default()
                .borders(Borders::TOP | Borders::BOTTOM | Borders::RIGHT)
                .border_style(Style::default().fg(Color::DarkGray)),
        );

    f.render_widget(prompt_widget, input_chunks[0]);

    // 오른쪽: 입력 영역
    let input_area_width = input_chunks[1].width.saturating_sub(3) as usize; // left border(1) + 여유(2)
    let input_visual_width = app.input.width();

    // 입력 텍스트를 패딩하여 이전 텍스트 잔상 제거
    let padded_text = if input_visual_width < input_area_width {
        format!(" {}{}", app.input, " ".repeat(input_area_width.saturating_sub(input_visual_width + 1)))
    } else {
        format!(" {}", app.input)
    };

    let input_widget = Paragraph::new(padded_text)
        .style(Style::default().fg(Color::White))
        .wrap(ratatui::widgets::Wrap { trim: false })
        .block(
            Block::default()
                .borders(Borders::TOP | Borders::BOTTOM | Borders::LEFT)
                .border_style(Style::default().fg(Color::DarkGray)),
        );

    f.render_widget(input_widget, input_chunks[1]);

    // 커서 위치 설정 (입력 영역 기준으로 간단하게 계산)
    let safe_cursor_pos = app.ensure_char_boundary(app.cursor_position);

    // 커서 앞의 텍스트
    let text_before_cursor = if safe_cursor_pos <= app.input.len() {
        &app.input[..safe_cursor_pos]
    } else {
        &app.input[..]
    };

    // 커서 앞 텍스트의 실제 화면 너비 (한글 2칸, 영문 1칸)
    let cursor_visual_width = text_before_cursor.width();

    // 입력 영역의 실제 너비 (border + 앞 공백 제외)
    let content_width = input_chunks[1].width.saturating_sub(3) as usize; // left border(1) + padding(1) + 여유(1)

    // 커서 위치: 입력 영역 시작 + 앞 공백(1) + 텍스트 너비
    let display_col = cursor_visual_width + 1; // +1 for leading space

    if content_width > 0 {
        let line = (display_col / content_width) as u16;
        let col = (display_col % content_width) as u16;

        f.set_cursor_position((
            input_chunks[1].x + col + 1, // +1 for left border
            input_chunks[1].y + line + 1, // +1 for top border
        ));
    } else {
        // fallback
        f.set_cursor_position((
            input_chunks[1].x + 2, // +1 border +1 space
            input_chunks[1].y + 1,
        ));
    }
}

fn format_log_line(line: &str) -> Line<'_> {
    if line.starts_with("# ") {
        // 헤더
        Line::from(Span::styled(
            format!("  {}", line),
            Style::default()
                .fg(Color::White)
                .add_modifier(Modifier::BOLD),
        ))
    } else if line.starts_with("## ") {
        // 세션 헤더
        Line::from(Span::styled(
            format!("  {}", line),
            Style::default().fg(Color::Yellow),
        ))
    } else if line.starts_with("- ") {
        // 로그 항목: "- 내용 (HH:MM:SS)" 형식 파싱
        if let Some(time_start) = line.rfind('(') {
            if let Some(time_end) = line.rfind(')') {
                let content = line[2..time_start].trim();
                let time = &line[time_start..=time_end];
                return Line::from(vec![
                    Span::styled("  - ", Style::default().fg(Color::DarkGray)),
                    Span::raw(content.to_string()),
                    Span::styled(
                        format!(" {}", time),
                        Style::default().fg(Color::DarkGray),
                    ),
                ]);
            }
        }
        Line::from(format!("  {}", line))
    } else if line.trim().is_empty() {
        Line::from("")
    } else {
        // 일반 텍스트
        Line::from(Span::styled(
            format!("  {}", line),
            Style::default().fg(Color::DarkGray),
        ))
    }
}
