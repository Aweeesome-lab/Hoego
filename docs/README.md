# Hoego Documentation

> Hoego 프로젝트의 모든 문서를 한곳에서 찾을 수 있습니다.

## 📖 목차

### 🎓 Guides (가이드)

개발을 시작하고 프로젝트를 이해하는데 필요한 문서들입니다.

- **[Development Guide](./guides/development.md)** - 개발 환경 설정 및 워크플로우
  - 빠른 시작 방법
  - 개발 스크립트 사용법
  - 테스트 및 디버깅
  - 코드 품질 관리

### 🔧 Implementation (구현 상세)

특정 기능의 구현 세부사항과 기술 문서입니다.

- **[Cloud LLM Integration](./implementation/cloud-llm.md)** - 클라우드 LLM 통합 가이드
  - OpenAI/Claude/Gemini 통합
  - API 키 관리 및 보안
  - 사용 예시 및 패턴

- **[Implementation Status](./implementation/status.md)** - 현재 구현 상태
  - 완료된 기능 목록
  - 사용 가능한 API
  - 다음 단계

### 🏗️ Architecture (아키텍처)

시스템 설계 및 아키텍처 문서입니다.

- *(향후 추가 예정)*
  - 시스템 아키텍처 다이어그램
  - 모듈 구조 및 의존성
  - 데이터 플로우

---

## 🔍 빠른 참조

### 새로운 기여자

1. **[Development Guide](./guides/development.md)** 먼저 읽기
2. 루트의 `.claude/CLAUDE.md` 확인 (코딩 규칙)
3. 관심 있는 기능의 구현 문서 참조

### 기능 구현

1. 관련 **Implementation** 문서 확인
2. 기존 패턴 및 아키텍처 이해
3. 테스트 작성 후 구현

### 문제 해결

1. **[Development Guide](./guides/development.md)** → Troubleshooting 섹션
2. 관련 **Implementation** 문서의 FAQ
3. GitHub Issues 검색

---

## 📝 문서 작성 가이드

### 새 문서 추가하기

1. 적절한 카테고리 선택:
   - `guides/` - 사용자 및 개발자 가이드
   - `implementation/` - 기술 구현 상세
   - `architecture/` - 시스템 설계 문서

2. 파일명 규칙:
   - 소문자 사용
   - 하이픈으로 단어 구분 (kebab-case)
   - 예: `feature-name.md`

3. 문서 구조:
   ```markdown
   # 제목

   > 한 줄 설명

   ## 개요
   ## 상세 내용
   ## 예시
   ## FAQ
   ```

4. 이 README에 링크 추가

### 문서 업데이트

- 기능 변경 시 관련 문서도 함께 업데이트
- 날짜 및 버전 정보 명시
- 예시 코드는 실제 동작하는 코드로 유지

---

## 🔗 외부 리소스

- [Tauri Documentation](https://tauri.app/v1/guides/)
- [React Documentation](https://react.dev/)
- [Rust Book](https://doc.rust-lang.org/book/)

---

**Last Updated**: 2024-11-15
