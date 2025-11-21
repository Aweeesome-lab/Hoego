# Hoego 서비스 분석 보고서

## 1. 핵심 가치 (Core Values)

Hoego는 **"개인 회고의 마찰을 없애고, AI를 통해 의미를 발견하는 것"**을 핵심 가치로 삼고 있습니다.

*   **Zero Friction (무마찰)**: 언제 어디서나 즉시 기록할 수 있는 환경 제공 (CLI, 빠른 앱 실행, 음성 입력).
*   **Privacy First (프라이버시 우선)**: 개인적인 회고 기록을 로컬에 안전하게 저장하며, 로컬 LLM 옵션을 제공하여 데이터 주권을 보장.
*   **AI-Driven Insight (AI 기반 통찰)**: 단순한 기록을 넘어, AI가 내용을 요약하고 피드백을 제공하여 회고의 질을 향상.
*   **Performance (성능)**: Rust와 Tauri 기반의 가볍고 빠른 네이티브 앱 경험.

## 2. 기능 분석 (Feature Analysis)

| 기능 | 설명 | 기술적 특징 |
| :--- | :--- | :--- |
| **Quick Dump** | 생각나는 것을 빠르게 쏟아내는 메모 기능 | 텍스트 및 음성 입력 지원, 마크다운 에디터 |
| **AI Summary & Feedback** | 작성된 회고에 대해 AI가 요약 및 피드백 제공 | Local (llama.cpp) 및 Cloud (OpenAI, Claude, Gemini) LLM 지원 |
| **History & Retrospect** | 과거 기록을 조회하고 주간/월간 회고 진행 | 날짜별 타임라인 뷰, 검색 기능 |
| **CLI Mode** | 개발자 친화적인 터미널 기반 기록 도구 | `hoego` 명령어로 터미널에서 즉시 로그 남기기 지원 |
| **Settings** | 사용자 맞춤 설정 | LLM 모델 선택, 프롬프트 설정, 테마 변경 |

## 3. 기술 구조 (Technical Architecture)

Hoego는 **Tauri** 프레임워크를 사용하여 **Rust** 백엔드와 **React** 프론트엔드가 결합된 하이브리드 아키텍처를 가집니다.

```mermaid
graph TD
    subgraph "Frontend (Webview)"
        UI[React + TypeScript]
        State[Zustand Store]
        Router[React Router]
        
        UI --> State
        UI --> Router
        State --> Bridge[Tauri Bridge (IPC)]
    end

    subgraph "Backend (Rust/Tauri)"
        Bridge --> CommandHandler[Command Handlers]
        
        CommandHandler --> AIService[AI Service]
        CommandHandler --> HistoryService[History Service]
        CommandHandler --> SettingsService[Settings Service]
        
        AIService --> LocalLLM[Local LLM (llama.cpp)]
        AIService --> CloudLLM[Cloud APIs (OpenAI/Claude)]
        
        HistoryService --> FileSystem[File System (JSON)]
        SettingsService --> FileSystem
    end

    subgraph "External"
        CLI[Hoego CLI] --> FileSystem
    end

    style UI fill:#61dafb,stroke:#333,stroke-width:2px
    style Bridge fill:#ffca28,stroke:#333,stroke-width:2px
    style CommandHandler fill:#dea584,stroke:#333,stroke-width:2px
    style FileSystem fill:#98c379,stroke:#333,stroke-width:2px
```

## 4. 프로젝트 구조도 (Project Structure)

프로젝트는 크게 프론트엔드(`src`)와 백엔드(`src-tauri`)로 나뉩니다.

```mermaid
graph LR
    Root[Hoego Project]
    
    subgraph "Frontend (src)"
        Apps[apps/] --> Main[main (Dashboard)]
        Apps --> History[history (Review)]
        Apps --> Settings[settings (Config)]
        
        Components[components/] --> UI[Common UI]
        Components --> Markdown[Markdown Editor]
        
        Store[store/] --> Zustand[State Logic]
        Services[services/] --> APICalls[API Wrappers]
    end
    
    subgraph "Backend (src-tauri)"
        Src[src/] --> MainRS[main.rs (Entry)]
        Src --> Commands[commands/ (IPC)]
        Src --> BackServices[services/]
        
        BackServices --> AISvc[ai_service.rs]
        BackServices --> StorageSvc[storage_service.rs]
        BackServices --> HistorySvc[history_service.rs]
        
        Bin[bin/] --> CLI_RS[hoego_cli.rs]
    end

    Root --> Frontend
    Root --> Backend
    
    style Root fill:#f9f9f9,stroke:#333,stroke-width:4px
    style Apps fill:#e1f5fe,stroke:#01579b
    style BackServices fill:#fff3e0,stroke:#e65100
```
