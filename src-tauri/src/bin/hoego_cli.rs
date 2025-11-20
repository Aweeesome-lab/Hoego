// hoego CLI - Daily Log 모드
//
// 사용법:
//   hoego cli                         - 오늘 데일리 로그 모드 시작
//   hoego cli --session "세션 제목"   - 세션과 함께 시작

// 기존 hoego 크레이트의 모듈들을 사용하기 위해 lib.rs를 참조
use hoego::cli;

fn print_help() {
    println!("Hoego CLI - Daily Log 모드");
    println!();
    println!("사용법:");
    println!("  hoego                           - 오늘의 데일리 로그 모드 시작");
    println!("  hoego --session \"세션 제목\"      - 세션과 함께 시작");
    println!("  hoego --help                    - 도움말 표시");
    println!();
    println!("TUI 명령어 (실행 중):");
    println!("  :q, :quit  - 종료");
    println!("  :h, :help  - 도움말");
    println!();
    println!("로그 파일 위치: ~/Documents/Hoego/history/");
}

fn main() {
    // 환경 변수에서 트레이싱 레벨 설정 (선택 사항)
    if std::env::var("RUST_LOG").is_err() {
        std::env::set_var("RUST_LOG", "error");
    }

    // CLI 인자 파싱
    let args = cli::LogCliArgs::from_env();

    // Help 플래그 확인
    if args.show_help {
        print_help();
        return;
    }

    // 트레이싱 초기화 (TUI 모드에서만)
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    // Daily Log 모드 실행
    if let Err(err) = cli::run_daily_log(args) {
        eprintln!("\n[hoego] 오류: {}", err);
        eprintln!("문제가 계속되면 다음을 확인하세요:");
        eprintln!("  - 문서 폴더(~/Documents) 접근 권한");
        eprintln!("  - 디스크 여유 공간");
        std::process::exit(1);
    }
}
