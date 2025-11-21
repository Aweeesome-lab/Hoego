# Hoego Documentation

**Last Updated**: 2025-11-21

---

## 📚 Documentation Index

### 🚀 Getting Started

- **[Project README](../README.md)** - 프로젝트 개요 및 시작 가이드
- **[AGENTS.md](../AGENTS.md)** - LLM Agent를 위한 코딩 가이드라인

---

## 🔧 Refactoring (Active)

현재 진행 중인 리팩토링 문서들

### Master Plan
- **[00-overview.md](./refactoring/00-overview.md)** - 전체 리팩토링 계획 및 진행 상황

### Phase Documentation
- **[01-phase-1-foundation.md](./refactoring/01-phase-1-foundation.md)** - ✅ Active Document 패턴 기반 구축
- **[02-phase-2-save-operations.md](./refactoring/02-phase-2-save-operations.md)** - ✅ 데이터 손실 버그 수정
- **[03-phase-3-view-switching.md](./refactoring/03-phase-3-view-switching.md)** - ✅ 뷰 전환 로직 중앙화
- **[04-phase-4-cleanup.md](./refactoring/04-phase-4-cleanup.md)** - 🔜 레거시 코드 정리

### Progress Tracking
- **[progress.md](./refactoring/progress.md)** - 상세 진행 상황 및 체크리스트
- **[next-session.md](./refactoring/next-session.md)** - 다음 세션 시작 가이드

**Current Status**: 75% Complete (Phase 1-3 Done)

---

## 🎯 MVP Planning

MVP 관련 기획 및 분석 문서

- **[roadmap.md](./mvp/roadmap.md)** - MVP 로드맵 및 Phase 0 계획
- **[analysis.md](./mvp/analysis.md)** - 프로젝트 분석 및 아키텍처

---

## 📖 Guides

개발 가이드 및 튜토리얼

- **[guides/](./guides/)** - 개발 가이드 모음

---

## 🗄️ Archive

더 이상 사용하지 않는 문서들 (참고용)

### CLI (Deprecated)
- **[archive/cli/plan.md](./archive/cli/plan.md)**
- **[archive/cli/setup.md](./archive/cli/setup.md)**
- **[archive/cli/tasks.md](./archive/cli/tasks.md)**

### Storybook (Deprecated)
- **[archive/storybook/plan.md](./archive/storybook/plan.md)**
- **[archive/storybook/setup-roadmap.md](./archive/storybook/setup-roadmap.md)**

### Implementation Notes (Deprecated)
- **[archive/implementation/](./archive/implementation/)** - 구현 노트 (cloud-llm, status)

### Phase 0 Reports
- **[archive/phase0-validation-report.md](./archive/phase0-validation-report.md)**

---

## 🔍 Quick Navigation

### By Topic

**Refactoring**
```
refactoring/00-overview.md → 전체 계획
refactoring/progress.md → 진행 상황
refactoring/next-session.md → 다음 작업
```

**MVP**
```
mvp/roadmap.md → 로드맵
mvp/analysis.md → 분석
```

**Guides**
```
guides/ → 개발 가이드
```

### By Status

**✅ Completed**
- Phase 1: Foundation
- Phase 2: Save Operations
- Phase 3: View Switching

**🔜 In Progress**
- Phase 4: Cleanup

**📅 Planned**
- MVP Phase 0-3

---

## 📝 Document Naming Convention

**Refactoring Phases**: `NN-phase-N-description.md`
- Numbered prefix for easy sorting
- Kebab-case naming
- Clear, descriptive names

**MVP Documents**: `descriptive-name.md`
- No prefix needed
- Kebab-case naming

**Archive**: Original names preserved

---

## 🤝 Contributing

When adding new documentation:

1. **Choose the right directory**
   - Active work → `refactoring/` or `mvp/`
   - Guides → `guides/`
   - Deprecated → `archive/`

2. **Follow naming conventions**
   - Use kebab-case
   - Add number prefix for sequences
   - Use descriptive names

3. **Update this README**
   - Add link to appropriate section
   - Update status if applicable

---

## 📞 Questions?

- Check **[AGENTS.md](../AGENTS.md)** for coding guidelines
- Check **[refactoring/00-overview.md](./refactoring/00-overview.md)** for refactoring context
- Check **[mvp/roadmap.md](./mvp/roadmap.md)** for MVP planning

---

**Last Updated**: 2025-11-21
**Documentation Status**: 📚 Well-organized and up-to-date
