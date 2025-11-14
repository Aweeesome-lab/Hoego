export interface RetrospectiveTemplate {
  id: string;
  name: string;
  focus: string;
  description: string;
  example: string;
  markdown: string;
}

export const CUSTOM_RETROSPECTIVE_STORAGE_KEY =
  'hoego.customRetrospectiveTemplates';

export const RETROSPECTIVE_TEMPLATES: RetrospectiveTemplate[] = [
  {
    id: 'kpt',
    name: 'KPT',
    focus: '핵심 유지 · 빠른 개선',
    description:
      'Scrum Alliance와 Agile Alliance에서 가장 널리 인용되는 기본형으로, 유지할 것·문제·새 실험을 동시에 정리해 바로 액션으로 전환하기 좋습니다.',
    example:
      'Keep - 데일리 스탠드업을 09:05에 고정해 지각이 줄었다.\nProblem - 리뷰 카드가 늦게 만들어져 QA가 밀렸다.\nTry - 오전 11시에 리뷰 후보를 채널에 고정 공지하기.',
    markdown: `# KPT 회고
## Keep (계속할 것)
- 

## Problem (문제/아쉬움)
- 

## Try (시도/실험)
- 

## Action Items
- [ ] 항목 | 담당:  | 기한:  | 상태:
`,
  },
  {
    id: 'start-stop-continue',
    name: 'Start · Stop · Continue',
    focus: '행동 합의 · 팀 합착',
    description:
      'Harvard Business Review와 Spotify 스쿼드가 자주 소개한 형식으로, 다음 스프린트에 무엇을 시작·중단·유지할지 명확히 정할 때 효과적입니다.',
    example:
      "Start - QA가 보기 전에 기준 체크리스트를 작성한다.\nStop - 회고 직후에 바로 새 업무를 시작하던 습관.\nContinue - 데일리에서 '막힘'을 1줄로 공유하는 흐름.",
    markdown: `# Start · Stop · Continue
## Start (새로 시작)
- 

## Stop (중단)
- 

## Continue (유지)
- 

## Action Items
- [ ] 항목 | 담당:  | 기한:  | 상태:
`,
  },
  {
    id: '4ls',
    name: '4Ls',
    focus: '학습 회고 · 결핍 파악',
    description:
      'Atlassian Playbook과 ThoughtWorks에서 학습 회고에 즐겨 쓰는 포맷으로, 좋았던 점·배운 점·부족했던 점·바랐던 점을 균형 있게 드러냅니다.',
    example:
      'Liked - 피처 플래닝 전에 페르소나 리마인드한 점.\nLearned - 알림 API의 rate limit이 생각보다 엄격하다는 사실.\nLacked - QA가 필요한 로그 샘플.\nLonged For - 공통 실험 스프레드시트.',
    markdown: `# 4Ls 회고
## Liked (좋았던 점)
- 

## Learned (배운 점)
- 

## Lacked (부족했던 점)
- 

## Longed For (바랐던 점)
- 

## Action Items
- [ ] 항목 | 담당:  | 기한:  | 상태:
`,
  },
  {
    id: 'mad-sad-glad',
    name: 'Mad · Sad · Glad',
    focus: '팀 감정 · 신뢰 확인',
    description:
      'Retromat와 FunRetro에서 꾸준히 추천되는 감정 기반 템플릿으로, 감정 신호를 먼저 꺼내 갈등이나 피드백 톤을 조율할 때 유용합니다.',
    example:
      'Mad - 코드 프리즈 직전에 계획이 바뀌어 야근이 늘었다.\nSad - 신규 멤버 온보딩에 충분히 시간을 쓰지 못했다.\nGlad - QA와 엔지 사이의 일일 싱크가 정착됐다.',
    markdown: `# Mad · Sad · Glad
## Mad (화나거나 답답했던 점)
- 

## Sad (아쉽거나 슬펐던 점)
- 

## Glad (기뻤던 점)
- 

## Action Items
- [ ] 항목 | 담당:  | 기한:  | 상태:
`,
  },
  {
    id: 'starfish',
    name: 'Starfish',
    focus: '강약 조절 · 실험 설계',
    description:
      'Agile Retrospectives 커뮤니티에서 확산된 5축 분석 방식으로, 늘릴 것·줄일 것·새로 시작·멈출 것·유지 항목을 동시에 다룹니다.',
    example:
      "More - 사용성 테스트 클립 공유\nLess - 슬랙 알림에 즉시 반응하려는 강박\nStart - QA 주간 품질 리포트\nStop - 회고 이후 후속 액션을 구두로만 남기는 관행\nKeep - 데일리에서 '가장 큰 리스크 1가지' 공유",
    markdown: `# Starfish
## Start (새로 시작)
- 

## Stop (중단)
- 

## Continue (유지)
- 

## More (더 많이)
- 

## Less (덜 하거나 줄이기)
- 

## Action Items
- [ ] 항목 | 담당:  | 기한:  | 상태:
`,
  },
  {
    id: 'sailboat',
    name: 'Sailboat',
    focus: '목표 · 리스크 탐색',
    description:
      'Management 3.0 워크숍과 Atlassian Summit에서 소개된 시각적 메타포 템플릿으로, 목표(섬)·추진력(바람/돛)·방해물(닻/암초)·기회를 동시에 정리합니다.',
    example:
      '섬 - 5월까지 온보딩 완료율 90%\n돛/바람 - 주 2회 사용자 인터뷰 큐\n닻 - iOS 빌드 파이프라인 지연\n암초 - 접근성 이슈가 외부 리뷰에서 다시 지적될 위험',
    markdown: `# Sailboat
## 목적지(섬) / 목표
- 

## 바람/돛 (추진 요인)
- 

## 닻 (방해 요인)
- 

## 암초/리스크
- 

## 햇살/기회
- 

## Action Items
- [ ] 항목 | 담당:  | 기한:  | 상태:
`,
  },
] as const;

export type RetrospectiveTemplateId =
  (typeof RETROSPECTIVE_TEMPLATES)[number]['id'];
