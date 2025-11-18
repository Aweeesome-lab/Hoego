// hoego CLI - Daily Log 모드
//
// 사용법:
//   hoego cli                         - 오늘 데일리 로그 모드 시작
//   hoego cli --session "세션 제목"   - 세션과 함께 시작

// 기존 hoego 크레이트의 모듈들을 사용하기 위해 lib.rs를 참조
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

    // CLI 인자 파싱
    let args = cli::LogCliArgs::from_env();

    // Daily Log 모드 실행
    if let Err(err) = cli::run_daily_log(args) {
        eprintln!("\n[hoego] 오류: {}", err);
        eprintln!("문제가 계속되면 다음을 확인하세요:");
        eprintln!("  - 문서 폴더(~/Documents) 접근 권한");
        eprintln!("  - 디스크 여유 공간");
        std::process::exit(1);
    }
}
