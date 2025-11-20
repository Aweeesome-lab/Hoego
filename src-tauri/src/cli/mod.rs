pub mod daily_log;
pub mod tui;

/// CLI 인자 구조체
pub struct LogCliArgs {
    pub session_title: Option<String>,
    pub show_help: bool,
}

impl LogCliArgs {
    /// 환경 변수에서 CLI 인자를 파싱합니다
    pub fn from_env() -> Self {
        let args: Vec<String> = std::env::args().collect();
        let mut session_title = None;
        let mut show_help = false;

        // 간단한 인자 파싱
        // hoego
        // hoego --session "세션 제목"
        // hoego --help
        let mut i = 1; // 프로그램 이름 다음부터 시작
        while i < args.len() {
            match args[i].as_str() {
                "--help" | "-h" => {
                    show_help = true;
                    i += 1;
                }
                "--session" => {
                    if i + 1 < args.len() {
                        session_title = Some(args[i + 1].clone());
                        i += 2;
                    } else {
                        eprintln!("경고: --session 옵션에 제목이 필요합니다");
                        i += 1;
                    }
                }
                _ => {
                    i += 1;
                }
            }
        }

        Self {
            session_title,
            show_help,
        }
    }
}

/// Daily Log 모드를 실행합니다
pub fn run_daily_log(args: LogCliArgs) -> Result<(), String> {
    // 1. 오늘 파일 경로 확보
    let (file_path, now) = daily_log::get_today_file_path()?;

    // 2. 세션 제목이 있으면 세션 헤더 추가
    if let Some(ref title) = args.session_title {
        daily_log::append_session_header(&file_path, title)?;
    }

    // 3. 초기 로그 읽기
    let initial_logs = daily_log::read_last_n_lines(&file_path, 100)
        .unwrap_or_else(|_| Vec::new());

    // 4. TUI 앱 생성 (should_scroll_to_bottom이 자동으로 true로 설정됨)
    let mut app = tui::TuiApp::new(&now, file_path.to_string_lossy().to_string(), initial_logs);

    // 5. 터미널 설정
    let mut terminal = tui::setup_terminal()?;

    // 6. TUI 입력 루프
    let result = loop {
        match tui::run_tui_loop(&mut terminal, &mut app) {
            Ok(Some(input)) => {
                // 명령 처리
                if input.starts_with(':') {
                    match input.as_str() {
                        ":q" | ":quit" => {
                            break Ok(());
                        }
                        ":help" | ":h" => {
                            // TUI 모드에서는 헬프 메시지를 로그에 추가
                            continue;
                        }
                        _ => {
                            // 알 수 없는 명령은 무시
                            continue;
                        }
                    }
                } else {
                    // 평문 입력 → 로그 항목 추가
                    match daily_log::append_log_entry(&file_path, &input) {
                        Ok(_) => {
                            // 로그 갱신 (update_logs가 자동으로 should_scroll_to_bottom을 설정)
                            match daily_log::read_last_n_lines(&file_path, 100) {
                                Ok(updated_logs) => {
                                    app.update_logs(updated_logs);
                                }
                                Err(_e) => {
                                    // 로그 읽기 실패 시 기존 로그 유지
                                    continue;
                                }
                            }
                        }
                        Err(_e) => {
                            // 에러 처리 (TUI에서는 무시)
                            continue;
                        }
                    }
                }
            }
            Ok(None) => {
                // 종료
                break Ok(());
            }
            Err(e) => {
                break Err(e);
            }
        }
    };

    // 7. 터미널 복원
    tui::restore_terminal(&mut terminal)?;

    println!("\n  👋 종료합니다.\n");

    result
}
