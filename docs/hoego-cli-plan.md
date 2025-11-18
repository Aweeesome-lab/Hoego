# Hoego CLI (Daily Log 모드) Plan

> **목표**: tmux/wezterm 등 터미널 환경에서 `hoego cli`로 오늘의 데일리 마크다운에 바로 기록할 수 있는 초저마찰 로그 입력 창을 제공한다.

---

## 📌 배경 & 문제 정의

- Hoego의 핵심 가치는 **“저마찰 입력 + AI 기반 정리/해석”**인데,  
  실제로는 **기록하기 위해 컨텍스트를 전환해야 하는 비용**이 크다.
- 요즘 개발자들은 tmux/wezterm, VS Code split terminal 등으로 **여러 pane을 띄운 채 바이브 코딩**을 하고 있다.
- 이 환경에서:
  - 별도 GUI 앱을 열거나
  - 단축키로 오버레이를 띄우고
  - 입력 모드로 전환하는 과정이
  - “그냥 커밋/테스트/로그 확인만 하던 흐름”을 끊는다.

**문제 요약**  
> “이미 열려 있는 터미널 pane 안에서, 키 몇 번으로 바로 오늘 일지에 기록할 수 있으면 좋겠다.”

---

## 🎯 제품 목표

1. **초저마찰 입력**
   - `hoego cli`를 실행한 터미널 pane 하나만 고정해두면,
   - 별도 prefix 없이 **그냥 한 줄 입력 → Enter**로 오늘 일지에 바로 기록된다.

2. **기존 데일리 마크다운과 완전 호환**
   - Tauri 앱이 사용하는 **`~/Documents/Hoego/history/YYYYMMDD.md`**와 완전히 동일한 포맷/경로를 사용한다.
   - GUI에서 보던 “오늘” 화면과 CLI에서 쌓는 로그가 **하나의 파일**로 합쳐진다.

3. **바이브 코딩 흐름 유지**
   - tmux/wezterm 레이아웃:
     - 왼쪽: 코드
     - 오른쪽 위: 앱 실행/테스트 로그
     - 오른쪽 아래: `hoego cli`  
   - 이 상태에서 머리속에 떠오르는 것들을 바로 입력하면 되고,  
     Hoego 앱은 이 로그를 기반으로 나중에 **요약/피드백/회고 질문**을 제공한다.

---

## 👤 대상 사용자 & 주요 시나리오

### 대상 사용자

- 터미널 분할을 적극 활용하는 개발자:
  - tmux/wezterm/iTerm 등에서 여러 pane으로 코딩
  - “기록을 해야 한다”는 의식은 있지만,  
    기록 앱을 따로 띄우거나 전환하는 것이 귀찮은 사람

### 대표 시나리오

1. 사용자가 tmux 세션을 연다.
   - `pane 1`: 에디터
   - `pane 2`: 앱 실행 로그
   - `pane 3`: `hoego cli` 실행
2. 코딩 중에 생각나는 모든 메모를 `pane 3`에 **그냥 한 줄씩 타이핑 → Enter**.
3. Hoego Tauri 앱에서 “오늘” 화면을 열면,
   - CLI로 입력했던 내용이 그대로 **오늘 데일리 마크다운**에 포함되어 있다.
4. 하루 마무리 시,
   - Hoego가 오늘 로그를 기반으로 **AI 요약, 인사이트, To-do, 회고 질문**을 만들어준다.

---

## 🧩 기능 범위 (MVP)

### 1. 커맨드 구조

- 사용자 관점 진입점:
  - `hoego cli`
- 초기 버전 동작:
  - `hoego cli` 실행 시 **바로 Daily Log 모드**로 진입한다.
  - (추후 `hoego ui`, `hoego status` 등으로 확장 가능)

### 2. 오늘 파일 관리

- 위치: `utils::history_directory_path()`가 반환하는 디렉토리  
  (기본: `~/Documents/Hoego/history`)
- 파일 이름: `YYYYMMDD.md` (예: `20251118.md`)
- 새 파일일 경우:
  - `# {format_date_label(오늘 날짜)}` 헤더를 먼저 기록  
    (예: `# 2025년 11월 18일 화요일`)
- 기존 파일일 경우:
  - 내용을 읽어와 **최근 N줄 (예: 20줄)**을 미리보기로 보여준다.

### 3. 입력/출력 UX

- 화면 구성 (텍스트 기반):
  - 상단: 오늘 정보
    - 예: `Hoego Daily Log — 2025-11-18 (~/Documents/Hoego/history/20251118.md)`
  - 중간: 오늘 파일의 **최근 로그 N줄**
  - 하단: 입력 줄
    - 프롬프트 예: `> ` 또는 프롬프트 없이 입력 커서만 표시

- 입력 규칙:
  - 평문 입력:
    - 사용자가 입력한 한 줄 전체를 “작업 내용”으로 취급
    - `- {내용} ({HH:MM:SS})` 형식으로 파일에 append
    - 시간은 **KST 기준 `HH:MM:SS`** (`format_time_with_seconds` 활용)
  - 빈 줄:
    - 아무 것도 기록하지 않고, 다시 입력 대기
  - 명령 모드 (`:`로 시작):
    - `:q` → 프로그램 종료
    - `:help` → 사용 가능한 명령과 키 사용법 출력
    - (향후) `:tag`, `:mark`, `:summary` 등으로 확장 가능

### 4. 옵션 (MVP 수준)

- `hoego cli` 기본:
  - 오늘 기준 Daily Log 모드
- `hoego cli --session "<세션 제목>"` (선택):
  - 세션 시작 시 파일에 한 줄 추가:
    - `## 세션: <세션 제목> ({HH:MM:SS})`
  - 이후 로그는 이 헤더 아래에 계속 append  
    (단, MVP에서는 “세션 개념”은 단순한 시각적 구분 정도로만 사용)

---

## 🏗 기술 설계 개요

### 1. Rust 구조

- 기존 Tauri 호스트:
  - `src-tauri/src/main.rs`
  - `src-tauri/src/history.rs`
  - `src-tauri/src/utils.rs`
- 신규 CLI 엔트리:
  - `src-tauri/src/bin/hoego_cli.rs` (또는 `hoego.rs` + subcommand 구조)
  - `main()`에서 `cli::run_daily_log(args)` 호출

### 2. 재사용 모듈

- `src-tauri/src/utils.rs`
  - `history_directory_path()`
  - `current_local_time()`
  - `format_date_label()`
  - `format_date_key()`
  - `format_time_with_seconds()`
- `src-tauri/src/history.rs`
  - `HistoryState`
  - `ensure_daily_file(state, timestamp)`
  - (필요 시) 파일 오픈/append 로직 일부를 helper로 분리하여 CLI와 공유

### 3. CLI/TUI 구현 방식

- 1단계 (필수, MVP):
  - 표준 출력 + `stdin.read_line` 기반의 **라인 입력형 CLI**
  - 입력마다:
    - 파일에 append
    - 최근 N줄을 다시 읽어서 화면에 재표시 (간단한 clear 또는 구분선)
- 2단계 (선택, 개선 단계):
  - `crossterm` + `ratatui` 등 경량 TUI 라이브러리 도입
  - 상단/중단/하단 3분할 레이아웃
  - 스크롤 가능한 로그 뷰, 입력창 하이라이트 등 UX 개선

### 4. 동시성 및 파일 일관성

- Tauri와 CLI가 동시에 동일 파일을 쓰는 상황:
  - Tauri의 `append_history_entry`는 `OpenOptions::new().append(true)` + `writeln!`를 사용
  - CLI도 동일하게 `append` 모드로 한 줄씩 쓰면,  
    OS 수준에서 line 단위 append는 실질적으로 안전한 수준
  - 순서가 완벽히 정렬되지 않아도 되는 “활동 로그”라는 도메인 특성을 활용
- 전체 덮어쓰기(`save_today_markdown`)는:
  - Tauri UI에서만 사용
  - CLI 세션 중에는 동시 사용이 거의 없다는 전제를 두고,  
    이후 필요 시 파일 잠금/버전 관리로 확장

---

## 🚧 범위 밖 (Out of Scope, 이후 단계)

- 음성 입력 / STT 기반 로그 캡처
- LLM을 바로 CLI에서 호출하는 `:summary`/`:insight` 명령
- Git hook / IDE 플러그인과 직접 연동하는 자동 로그 생성
- 여러 프로젝트/리포지토리를 동시에 다루는 멀티 컨텍스트 뷰

이 항목들은 **“CLI 입력 경험이 충분히 유용하다는 것이 검증된 뒤”**에  
우선순위를 재평가하여 도입한다.

---

## 📆 단계별 롤아웃 계획

### Phase 1: Minimal CLI (Daily Log MVP)

- `hoego cli`로 오늘 파일 열기/생성
- 최근 로그 N줄 미리보기
- 한 줄 입력 → `- 내용 (HH:MM:SS)` append
- `:q`, `:help` 명령 처리
- `package.json`에 개발용 스크립트 추가 (예: `npm run hoego:cli`)

### Phase 2: TUI 개선 + 세션 지원

- TUI 라이브러리 도입 (선택)
- 화면 3분할 레이아웃 (헤더/로그/입력)
- `--session` 옵션 정식 지원
- 세션 헤더/구분선 시각화

### Phase 3: 태그/마킹 + LLM 연동

- `:tag`, `:mark` 명령으로 태그/중요 이벤트 표시
- Tauri/Hoego UI에서 태그/마킹 기반 필터/강조
- (선택) `:summary`로 현재까지 오늘 로그를 요약해주는 LLM 호출  
  (단, AI 기능은 **CLI 필수 경험이 검증된 이후**에 붙이는 것을 원칙으로 한다)

