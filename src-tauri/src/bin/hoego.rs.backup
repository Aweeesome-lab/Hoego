// hoego - 메인 실행 파일
// 인자 없이 실행하면 자동으로 CLI 모드로 진입

use hoego::cli;

fn main() {
    // 환경 변수에서 트레이싱 레벨 설정 (선택 사항)
    if std::env::var("RUST_LOG").is_err() {
        std::env::set_var("RUST_LOG", "error");
    }

    // 트레이싱 초기화
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    // 인자 확인: 기본적으로 cli 모드
    let args: Vec<String> = std::env::args().collect();

    // "hoego" 또는 "hoego cli" 모두 Daily Log 모드로 진입
    let cli_args = if args.len() > 1 && args[1] == "cli" {
        // "hoego cli --session ..." 형태
        cli::LogCliArgs::from_env()
    } else if args.len() == 1 {
        // "hoego" 만 입력 → 기본 Daily Log
        cli::LogCliArgs { session_title: None }
    } else {
        // "hoego --session ..." 형태도 지원
        cli::LogCliArgs::from_env()
    };

    // Daily Log 모드 실행
    if let Err(err) = cli::run_daily_log(cli_args) {
        eprintln!("\n[hoego] 오류: {}", err);
        eprintln!("문제가 계속되면 다음을 확인하세요:");
        eprintln!("  - 문서 폴더(~/Documents) 접근 권한");
        eprintln!("  - 디스크 여유 공간");
        std::process::exit(1);
    }
}
