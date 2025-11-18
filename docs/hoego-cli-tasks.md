# Hoego CLI (Daily Log 모드) Tasks

> **목적**: `hoego cli`를 통해 터미널 pane 하나만 열어두면 오늘 데일리 마크다운에 바로 기록할 수 있는 기능을 단계별로 구현하고 추적한다.

**시작일**: 2025-11-18  
**상태**: Draft (구현 전 계획 단계)

---

## 📊 전체 진행 요약

```yaml
총 작업: 3개 Phase / 16개 세부 작업
완료: 0개
진행중: 0개
대기: 16개
```

---

## 🧱 Phase 1: Minimal CLI (Daily Log MVP)

> 목표: `hoego cli`로 오늘 파일을 열고, 한 줄 입력 → 바로 append 되는 최소 기능을 만든다.

### 작업 1: 공통 유틸/히스토리 모듈 재사용 준비

- [ ] `HistoryState`, `ensure_daily_file`, `format_time_with_seconds`를 CLI에서 재사용 가능하게 `pub` API 형태로 정리  
  - **파일**: `src-tauri/src/history.rs`, `src-tauri/src/utils.rs`
- [ ] CLI 전용 헬퍼 모듈 생성 (예: `src-tauri/src/cli/daily_log.rs`)  
  - 오늘 날짜 기준 파일 경로 계산  
  - 파일 오픈/생성 래퍼 함수

### 작업 2: CLI 엔트리 추가 (`hoego cli`)

- [ ] 신규 바이너리 엔트리 파일 생성  
  - **파일**: `src-tauri/src/bin/hoego_cli.rs`
- [ ] `main()` 함수에서 CLI 인자 파싱 (초기 버전은 단일 모드: Daily Log)  
  - `hoego cli` → Daily Log 모드 진입  
  - `hoego cli --session "<제목>"` 옵션 파싱 (세션 제목 전달만 해두고, MVP에서는 단순 헤더 출력)
- [ ] `cli::run_daily_log(args: LogCliArgs)` 함수 설계  
  - **책임**:
    - 오늘 파일 open/생성 (`HistoryState` + `ensure_daily_file`)  
    - 최근 N줄 읽기  
    - 입력 루프 실행

### 작업 3: Daily Log 입력 루프 구현

- [ ] 오늘 파일의 최근 N줄(예: 20줄)을 읽어와 화면에 출력  
  - 파일이 없다면 생성 후 헤더(`# YYYY년 M월 D일 요일`)만 있는 상태에서 시작
- [ ] 표준 입력을 통해 한 줄씩 읽어오는 루프 구현  
  - 빈 줄 입력 시: 아무 것도 기록하지 않고 다시 대기  
  - 평문 입력 시:
    - 현재 KST 시각을 계산 (`format_time_with_seconds`)  
    - `- {내용} ({HH:MM:SS})` 포맷으로 파일에 append  
    - 마지막 N줄을 다시 읽어와 화면 갱신
- [ ] 명령 모드 처리 (`:` prefix)  
  - `:q` → 프로그램 정상 종료  
  - `:help` → 사용 가능한 명령/키 안내 출력  
  - (향후 확장을 위해 기본적인 파서 구조만 잡아둠)
- [ ] 에러 처리 및 종료 코드 정의  
  - 히스토리 디렉토리 생성 실패, 문서 폴더 접근 실패 등은  
    - 한국어 메시지로 이유 + 다음 액션 제안  
    - 종료 코드 `1` 반환

### 작업 4: DX/통합

- [ ] 개발용 npm 스크립트 추가  
  - **파일**: `package.json`  
  - 예: `"hoego:cli": "cargo run --bin hoego_cli -- cli"`  
    - (실제 바이너리/인자 구조에 맞게 조정)
- [ ] `docs/README.md` 또는 `docs/mvp-roadmap.md`에 `hoego cli` 소개 섹션 추가  
  - 예: "tmux/wezterm에서 pane 하나를 `hoego cli`로 고정해두고 사용" 예시
- [ ] macOS 기준 tmux/wezterm 레이아웃 예시 캡처 및 설명 (선택)

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

