# Hoego CLI 설치 및 사용 가이드

## 빠른 시작 (추천)

### 1단계: 설치

```bash
# 프로젝트 루트에서 한 번만 실행
./install.sh
```

이 명령어는:
- 릴리즈 바이너리를 빌드하고 (최초 1-2분 소요)
- `/usr/local/bin/hoego`에 설치합니다

### 2단계: 사용

```bash
# 이제 어디서든 바로 실행
hoego

# 또는 세션과 함께
hoego --session "리팩터링 작업"
```

---

## 개발 환경에서 빠른 테스트

설치 없이 프로젝트 내에서 바로 테스트하려면:

```bash
# 프로젝트 루트에서
npm run hoego:cli
```

---

## 전역 설치 (대안 방법)

### macOS / Linux

**1단계: 바이너리 빌드 및 설치**

```bash
cd src-tauri
cargo install --path . --bin hoego-cli
```

이렇게 하면 `~/.cargo/bin/hoego-cli` 경로에 설치됩니다.

**2단계: alias 설정 (선택사항)**

더 짧은 `hoego` 명령어를 사용하려면 셸 설정 파일에 alias를 추가하세요:

```bash
# ~/.zshrc 또는 ~/.bashrc에 추가
alias hoego='hoego-cli cli'
```

그 다음 셸을 다시 로드:

```bash
source ~/.zshrc  # zsh 사용 시
# 또는
source ~/.bashrc  # bash 사용 시
```

**3단계: 어디서든 실행**

```bash
hoego              # Daily Log 모드
hoego --session "작업명"  # 세션과 함께
```

---

## 사용법

### 기본 명령어

- **평문 입력**: 그냥 타이핑 후 Enter → 자동으로 `- 내용 (HH:MM:SS)` 형식으로 저장
- **`:q` 또는 `:quit`**: 종료
- **`:h` 또는 `:help`**: 도움말 보기

### 예시

```bash
# 기본 실행
hoego

# 세션 제목과 함께 시작
hoego --session "Phase 1 구현"
```

### 화면 구성

```
  Hoego
  Daily Log — 2025년 11월 18일 월요일
  ~/Documents/Hoego/history/20251118.md

  # 2025년 11월 18일 월요일

  ## 세션: Phase 1 구현 (14:23:45)

  - CLI 모듈 생성 완료 (14:25:10)
  - UI 개선 작업 시작 (14:30:22)

  ›
```

---

## tmux / wezterm 레이아웃 예시

### tmux 설정 예시

```bash
# 세로 분할
tmux split-window -h

# 오른쪽 pane에서 hoego 실행
tmux send-keys -t right 'hoego' C-m

# 왼쪽 pane에서 작업
tmux select-pane -t left
```

### wezterm 설정 예시

```lua
-- ~/.config/wezterm/wezterm.lua
local wezterm = require 'wezterm'

-- 키 바인딩 추가
config.keys = {
  -- Ctrl+Shift+H로 hoego 실행
  {
    key = 'H',
    mods = 'CTRL|SHIFT',
    action = wezterm.action.SplitHorizontal {
      args = { 'hoego' },
    },
  },
}
```

---

## 권장 워크플로우

1. **터미널 분할**
   - 왼쪽: 코드 에디터 / 실행 로그
   - 오른쪽: `hoego` 고정

2. **작업하면서 기록**
   - 머릿속에 떠오르는 것들을 즉시 입력
   - 결정 사항, 막힌 부분, 아이디어 등

3. **하루 마무리**
   - Hoego 앱에서 오늘 로그 확인
   - AI 요약/피드백 받기

---

## 트러블슈팅

### 파일 접근 권한 오류

```bash
# Documents 폴더 권한 확인
ls -la ~/Documents/Hoego
```

### 색상이 제대로 표시되지 않음

터미널이 ANSI 색상 코드를 지원하는지 확인:

```bash
echo $TERM
# xterm-256color, screen-256color 등이어야 함
```

### 전역 설치 후 명령어를 찾을 수 없음

`~/.cargo/bin`이 PATH에 포함되어 있는지 확인:

```bash
echo $PATH | grep cargo

# 없다면 셸 설정 파일에 추가:
export PATH="$HOME/.cargo/bin:$PATH"
```

---

## 데이터 위치

모든 로그는 다음 위치에 저장됩니다:

```
~/Documents/Hoego/history/YYYYMMDD.md
```

Tauri 앱과 완전히 동일한 파일을 사용하므로, CLI와 GUI에서 입력한 내용이 실시간으로 동기화됩니다.
