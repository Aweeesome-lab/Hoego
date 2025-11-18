# Hoego CLI (Daily Log 모드) Tasks

> **목적**: `hoego cli`를 통해 터미널 pane 하나만 열어두면 오늘 데일리 마크다운에 바로 기록할 수 있는 기능을 단계별로 구현하고 추적한다.

**시작일**: 2025-11-18
**상태**: Phase 1 완료 (2025-11-18)

---

## 📊 전체 진행 요약

```yaml
총 작업: 3개 Phase / 16개 세부 작업
완료: 7개 (Phase 1)
진행중: 0개
대기: 9개 (Phase 2, 3)
```

---

## 🧱 Phase 1: Minimal CLI (Daily Log MVP)

> 목표: `hoego cli`로 오늘 파일을 열고, 한 줄 입력 → 바로 append 되는 최소 기능을 만든다.

### ✅ 작업 1: 공통 유틸/히스토리 모듈 재사용 준비

- [x] `HistoryState`, `ensure_daily_file`, `format_time_with_seconds`를 CLI에서 재사용 가능하게 `pub` API 형태로 정리
  - **파일**: `src-tauri/src/history.rs`, `src-tauri/src/utils.rs`
  - **완료**: 2025-11-18 - 기존 모듈이 이미 pub으로 노출되어 있음
- [x] CLI 전용 헬퍼 모듈 생성 (예: `src-tauri/src/cli/daily_log.rs`)
  - 오늘 날짜 기준 파일 경로 계산
  - 파일 오픈/생성 래퍼 함수
  - **완료**: 2025-11-18 - `src-tauri/src/cli/daily_log.rs` 생성

### ✅ 작업 2: CLI 엔트리 추가 (`hoego cli`)

- [x] 신규 바이너리 엔트리 파일 생성
  - **파일**: `src-tauri/src/bin/hoego_cli.rs`
  - **완료**: 2025-11-18
- [x] `main()` 함수에서 CLI 인자 파싱 (초기 버전은 단일 모드: Daily Log)
  - `hoego cli` → Daily Log 모드 진입
  - `hoego cli --session "<제목>"` 옵션 파싱 (세션 제목 전달만 해두고, MVP에서는 단순 헤더 출력)
  - **완료**: 2025-11-18 - `src-tauri/src/cli/mod.rs`에 구현
- [x] `cli::run_daily_log(args: LogCliArgs)` 함수 설계
  - **책임**:
    - 오늘 파일 open/생성 (`HistoryState` + `ensure_daily_file`)
    - 최근 N줄 읽기
    - 입력 루프 실행
  - **완료**: 2025-11-18

### ✅ 작업 3: Daily Log 입력 루프 구현

- [x] 오늘 파일의 최근 N줄(예: 20줄)을 읽어와 화면에 출력
  - 파일이 없다면 생성 후 헤더(`# YYYY년 M월 D일 요일`)만 있는 상태에서 시작
  - **완료**: 2025-11-18 - `print_recent_lines` 함수 구현
- [x] 표준 입력을 통해 한 줄씩 읽어오는 루프 구현
  - 빈 줄 입력 시: 아무 것도 기록하지 않고 다시 대기
  - 평문 입력 시:
    - 현재 KST 시각을 계산 (`format_time_with_seconds`)
    - `- {내용} ({HH:MM:SS})` 포맷으로 파일에 append
    - 마지막 N줄을 다시 읽어와 화면 갱신
  - **완료**: 2025-11-18 - `run_daily_log` 함수에 구현
- [x] 명령 모드 처리 (`:` prefix)
  - `:q` → 프로그램 정상 종료
  - `:help` → 사용 가능한 명령/키 안내 출력
  - (향후 확장을 위해 기본적인 파서 구조만 잡아둠)
  - **완료**: 2025-11-18 - `:q`, `:quit`, `:help`, `:h` 명령 지원
- [x] 에러 처리 및 종료 코드 정의
  - 히스토리 디렉토리 생성 실패, 문서 폴더 접근 실패 등은
    - 한국어 메시지로 이유 + 다음 액션 제안
    - 종료 코드 `1` 반환
  - **완료**: 2025-11-18

### ✅ 작업 4: DX/통합

- [x] 개발용 npm 스크립트 추가
  - **파일**: `package.json`
  - 예: `"hoego:cli": "cargo run --bin hoego-cli -- cli"`
  - **완료**: 2025-11-18 - `hoego:cli` 및 `hoego:cli:session` 스크립트 추가
- [ ] `docs/README.md` 또는 `docs/mvp-roadmap.md`에 `hoego cli` 소개 섹션 추가
  - 예: "tmux/wezterm에서 pane 하나를 `hoego cli`로 고정해두고 사용" 예시
  - **보류**: 실제 사용 테스트 후 작성 예정
- [ ] macOS 기준 tmux/wezterm 레이아웃 예시 캡처 및 설명 (선택)
  - **보류**: 실제 사용 환경에서 테스트 후 작성 예정

---

## 🎛 Phase 2: TUI 개선 + 세션 지원

> 목표: 단순 라인 기반 CLI를, 화면 3분할 TUI와 세션 개념을 갖춘 사용성 좋은 도구로 확장한다.

### 작업 5: TUI 라이브러리 도입 검토

- [ ] `crossterm`, `ratatui` 등 경량 TUI 라이브러리 후보 선정  
  - 장단점, 유지보수성, 의존성 무게 비교
- [ ] PoC 수준으로 헤더/본문/입력창 3분할 레이아웃 렌더링 테스트  
  - **파일**: `src-tauri/src/cli/tui.rs` (예시)

### 작업 6: 화면 3분할 레이아웃 구현

- [ ] 상단: 날짜/파일 경로/세션 정보  
  - 예: `2025-11-18 (화) — ~/Documents/Hoego/history/20251118.md`
- [ ] 중단: 스크롤 가능한 로그 뷰  
  - 오늘 파일 전체 또는 일부를 스크롤로 탐색  
  - 최근 입력한 라인 하이라이트
- [ ] 하단: 입력 창  
  - 현재 모드 표기 (예: `INSERT`, `CMD`)  
  - 입력 중 텍스트 편집 가능

### 작업 7: 세션 지원 (`--session`, 세션 헤더)

- [ ] `LogCliArgs`에 `session_title: Option<String>` 추가  
  - `hoego cli --session "로그인 리팩터링"` 형태 지원
- [ ] 세션 시작 시 파일에 헤더 추가  
  - 예: `## 세션: 로그인 리팩터링 ({HH:MM:SS})`
- [ ] TUI 상단에 현재 세션 정보 표시  
  - 세션 제목, 시작 시각 등

---

## 🏷 Phase 3: 태깅/마킹 + LLM 연동 (후속)

> 목표: CLI에서 남긴 로그를 더 잘 구조화하고, 필요 시 CLI 안에서도 간단한 요약/인사이트를 확인할 수 있도록 확장한다.

### 작업 8: 태그/마킹 명령

- [ ] `:tag <태그>` 명령 설계  
  - 이후에 입력되는 라인에 `#<태그>` 자동 부착  
  - 예: `- 집중해서 코딩함 #집중 (14:32:10)`
- [ ] `:mark <라벨>` 명령 설계  
  - “빌드 실패”, “큰 결정” 등 중요한 이벤트를 표시  
  - UI/회고에서 별도 강조 가능하도록 메타데이터 형태 정의

### 작업 9: LLM 요약 (`:summary`) (선택)

- [ ] `:summary` 명령 설계  
  - 오늘 파일 전체 또는 최근 N분/최근 N라인을 대상으로 요약 요청  
  - 요약 결과를 TUI 중단 영역에 임시로 표시
- [ ] 기존 Hoego AI 파이프라인과의 연동 방식 정의  
  - Tauri를 통해 요약을 요청할지  
  - 별도 CLI용 LLM 호출 경로를 만들지
- [ ] 데이터 최소화/프라이버시 관점에서 전송 범위 정의

---

## 📎 메모

- 이 Task 문서는 **구현 전 설계 단계**로, 실제 구현이 시작되면:
  - 각 작업이 완료될 때마다 체크박스를 업데이트하고
  - 필요 시 세부 작업을 쪼개어 `docs/refactoring-progress.md`나 별도 Progress 문서와 연동할 수 있다.

---

## 📝 세션 노트

### 2025-11-18 - Phase 1 완료 (Minimal CLI MVP)

**구현 완료 항목**:
- ✅ CLI 헬퍼 모듈 (`src-tauri/src/cli/daily_log.rs`)
  - `get_today_file_path()`: 오늘 파일 경로 확보
  - `read_last_n_lines()`: 파일의 마지막 N줄 읽기
  - `append_log_entry()`: 로그 항목 추가 (- 내용 (HH:MM:SS) 형식)
  - `append_session_header()`: 세션 헤더 추가
  - `print_header()`, `print_recent_lines()`, `print_help()`: 화면 출력 헬퍼

- ✅ CLI 메인 모듈 (`src-tauri/src/cli/mod.rs`)
  - `LogCliArgs`: CLI 인자 구조체 (세션 제목 옵션 포함)
  - `run_daily_log()`: Daily Log 입력 루프 구현
    - 오늘 파일 생성/열기
    - 최근 20줄 미리보기
    - 입력 루프: 평문 입력, `:q`, `:help` 명령 처리

- ✅ 바이너리 엔트리 포인트 (`src-tauri/src/bin/hoego_cli.rs`)
  - 트레이싱 초기화
  - CLI 인자 파싱 및 실행
  - 에러 처리 및 종료 코드

- ✅ 통합 작업
  - `src-tauri/src/lib.rs`: CLI 모듈 노출
  - `Cargo.toml`: `hoego-cli` 바이너리 추가
  - `package.json`: `hoego:cli`, `hoego:cli:session` 스크립트 추가

**기술적 구현 사항**:
- 기존 `history.rs`, `utils.rs` 모듈을 재사용하여 코드 중복 최소화
- KST 시간 포맷 유지 (`format_time_with_seconds`)
- Tauri 앱과 동일한 파일 경로 사용 (`~/Documents/Hoego/history/YYYYMMDD.md`)
- 간단한 명령 파서 구조 (`:` prefix로 시작하는 명령)

**사용법**:
```bash
# 기본 Daily Log 모드
npm run hoego:cli
# 또는
cd src-tauri && cargo run --bin hoego-cli -- cli

# 세션 제목과 함께 시작
cd src-tauri && cargo run --bin hoego-cli -- cli --session "리팩터링 작업"
```

**다음 단계 (Phase 2)**:
- TUI 라이브러리 도입 검토 (crossterm, ratatui)
- 화면 3분할 레이아웃 구현
- 세션 관리 기능 강화

---

### 2025-11-18 - Phase 1.5 완료 (UI/UX 개선)

**UI 개선 항목**:
- ✅ ANSI 색상 코드 도입 (Cyan, Yellow, Gray, Dim 등)
- ✅ 깔끔한 헤더 디자인 (Claude Code 스타일)
  - Hoego 브랜드 표시
  - 날짜 포맷팅
  - 파일 경로 (~로 축약)
- ✅ 로그 라인 포맷팅
  - 헤더 (# ): 굵게 표시
  - 세션 헤더 (## ): 노란색
  - 로그 항목 (- ): 내용과 시간 구분
  - 시간 정보: Dim 처리
- ✅ 입력 프롬프트 개선 (› 기호 사용)
- ✅ 화면 클리어 기능 (입력 후 자동 갱신)
- ✅ 에러 메시지 시각화 (✗ 아이콘 + 빨간색)
- ✅ 도움말 포맷 개선

**실행 편의성 개선**:
- ✅ `./hoego` 실행 스크립트 생성
  - 프로젝트 루트에서 바로 실행 가능
  - 인자 없이 실행 시 자동으로 `cli` 모드
- ✅ 전역 설치 가이드 작성 (`docs/hoego-cli-setup.md`)
  - cargo install 방법
  - shell alias 설정
  - tmux/wezterm 레이아웃 예시

**사용법 (개선됨)**:
```bash
# 프로젝트에서 직접 실행
./hoego

# 전역 설치 후 (권장)
cargo install --path src-tauri --bin hoego-cli
alias hoego='hoego-cli cli'

# 어디서든 실행
hoego
```

**UI 스크린샷 예상**:
```
  Hoego
  Daily Log — 2025년 11월 18일 월요일
  ~/Documents/Hoego/history/20251118.md

  - CLI 모듈 생성 완료 (14:25:10)
  - UI 개선 작업 시작 (14:30:22)

  ›
```

