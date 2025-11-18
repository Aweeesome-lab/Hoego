# Hoego

> AI-powered retrospective and reflection tool built with Tauri + React

Hoego는 일상의 경험을 기록하고, AI의 도움으로 의미 있는 인사이트를 얻을 수 있는 개인 회고 도구입니다.

## ✨ Features

- 📝 **Quick Dump** - 빠른 생각과 경험 기록
- 🤖 **AI Summary** - 로컬 또는 클라우드 LLM을 활용한 인사이트 생성
- 🎯 **Voice Input** - 음성으로 빠르게 기록
- 📊 **History** - 과거 회고 기록 관리 및 검색
- 🔒 **Privacy-First** - 로컬 우선, 선택적 클라우드 연동
- ⚡ **Fast & Lightweight** - Tauri 기반 네이티브 앱
- 💻 **CLI Mode** - 터미널에서 초저마찰 로그 입력

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Rust 1.70+
- npm or pnpm

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/hoego.git
cd hoego

# Install dependencies
npm install

# Run development server
npm run dev
```

### CLI Mode (Daily Log)

터미널 pane 하나에 `hoego` CLI를 띄워두고 코딩하면서 바로 기록하세요.

```bash
# 1. 설치 (한 번만 실행)
./install.sh

# 2. 이제 어디서든 바로 사용
hoego
```

**사용법**:
- 평문 입력 → Enter: 로그에 자동 기록 (`- 내용 (HH:MM:SS)` 형식)
- `:q` 또는 `:quit`: 종료
- `:h` 또는 `:help`: 도움말

**세션과 함께 시작**:
```bash
hoego --session "Phase 1 구현"
```

자세한 내용은 [CLI 설치 가이드](docs/hoego-cli-setup.md)를 참고하세요.

### Build

```bash
# Build production bundle
npm run build
```

## 🏗️ Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Rust + Tauri
- **State Management**: Zustand
- **Testing**: Vitest
- **LLM**:
  - Local: llama.cpp
  - Cloud: OpenAI, Claude, Gemini (선택)

## 📚 Documentation

모든 문서는 [`docs/`](./docs/) 디렉토리에서 확인할 수 있습니다.

- **[Development Guide](./docs/guides/development.md)** - 개발 환경 설정 및 워크플로우
- **[Cloud LLM Integration](./docs/implementation/cloud-llm.md)** - 클라우드 LLM 통합 가이드
- **[Implementation Status](./docs/implementation/status.md)** - 현재 구현 상태

전체 문서 목록은 [docs/README.md](./docs/README.md)에서 확인하세요.

## 🤝 Contributing

기여를 환영합니다! 기여하기 전에:

1. [Development Guide](./docs/guides/development.md) 읽기
2. `.claude/CLAUDE.md`의 코딩 규칙 확인
3. 테스트 작성 및 실행
4. PR 제출

## 📝 License

[MIT License](LICENSE)

## 🙏 Acknowledgments

- Built with [Tauri](https://tauri.app/)
- AI powered by [llama.cpp](https://github.com/ggerganov/llama.cpp)

---

**Status**: 🚧 Active Development
