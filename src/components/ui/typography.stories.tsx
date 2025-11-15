import type { Meta, StoryObj } from '@storybook/react';
import {
  DisplayLarge,
  Display,
  H1,
  H2,
  H3,
  H4,
  BodyLarge,
  Body,
  BodySmall,
  Caption,
  CaptionSmall,
  Code,
  Lead,
  Muted,
  Blockquote,
} from './typography';

const meta: Meta = {
  title: 'Design System/Typography',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj;

/**
 * 전체 타이포그래피 시스템 개요
 */
export const Overview: Story = {
  render: () => (
    <div className="space-y-8 max-w-3xl">
      <div>
        <Caption className="mb-2">Display Large (3rem / 48px)</Caption>
        <DisplayLarge>The quick brown fox jumps</DisplayLarge>
        <DisplayLarge className="mt-2">빠른 갈색 여우가 뛰어넘다</DisplayLarge>
      </div>

      <div>
        <Caption className="mb-2">Display (2.25rem / 36px)</Caption>
        <Display>The quick brown fox jumps</Display>
        <Display className="mt-2">빠른 갈색 여우가 뛰어넘다</Display>
      </div>

      <div>
        <Caption className="mb-2">H1 (2rem / 32px)</Caption>
        <H1>The quick brown fox jumps</H1>
        <H1 className="mt-2">빠른 갈색 여우가 뛰어넘다</H1>
      </div>

      <div>
        <Caption className="mb-2">H2 (1.5rem / 24px)</Caption>
        <H2>The quick brown fox jumps over the lazy dog</H2>
        <H2 className="mt-2">빠른 갈색 여우가 게으른 개를 뛰어넘다</H2>
      </div>

      <div>
        <Caption className="mb-2">H3 (1.25rem / 20px)</Caption>
        <H3>The quick brown fox jumps over the lazy dog</H3>
        <H3 className="mt-2">빠른 갈색 여우가 게으른 개를 뛰어넘다</H3>
      </div>

      <div>
        <Caption className="mb-2">H4 (1.125rem / 18px)</Caption>
        <H4>The quick brown fox jumps over the lazy dog</H4>
        <H4 className="mt-2">빠른 갈색 여우가 게으른 개를 뛰어넘다</H4>
      </div>

      <div>
        <Caption className="mb-2">Body Large (1.125rem / 18px)</Caption>
        <BodyLarge>
          The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
        </BodyLarge>
        <BodyLarge className="mt-2">
          빠른 갈색 여우가 게으른 개를 뛰어넘습니다. 키스의 고유조건은 입술끼리 만나야 하고 특별한 기술은 필요치 않다.
        </BodyLarge>
      </div>

      <div>
        <Caption className="mb-2">Body (1rem / 16px)</Caption>
        <Body>
          The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
        </Body>
        <Body className="mt-2">
          빠른 갈색 여우가 게으른 개를 뛰어넘습니다. 키스의 고유조건은 입술끼리 만나야 하고 특별한 기술은 필요치 않다.
        </Body>
      </div>

      <div>
        <Caption className="mb-2">Body Small (0.875rem / 14px)</Caption>
        <BodySmall>
          The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
        </BodySmall>
        <BodySmall className="mt-2">
          빠른 갈색 여우가 게으른 개를 뛰어넘습니다. 키스의 고유조건은 입술끼리 만나야 하고 특별한 기술은 필요치 않다.
        </BodySmall>
      </div>

      <div>
        <Caption className="mb-2">Caption (0.75rem / 12px)</Caption>
        <Caption>The quick brown fox jumps over the lazy dog</Caption>
        <Caption className="block mt-1">빠른 갈색 여우가 게으른 개를 뛰어넘습니다</Caption>
      </div>

      <div>
        <Caption className="mb-2">Caption Small (0.6875rem / 11px)</Caption>
        <CaptionSmall>The quick brown fox jumps over the lazy dog</CaptionSmall>
        <CaptionSmall className="block mt-1">빠른 갈색 여우가 게으른 개를 뛰어넘습니다</CaptionSmall>
      </div>

      <div>
        <Caption className="mb-2">Code (Monospace)</Caption>
        <div className="space-y-2">
          <div>
            <Code>const greeting = 'Hello, World!';</Code>
          </div>
          <div>
            <Code>function add(a: number, b: number) {'{ return a + b; }'}</Code>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * 제목 계층 구조
 */
export const Headings: Story = {
  render: () => (
    <div className="space-y-6">
      <DisplayLarge>Display Large - 최상위 제목</DisplayLarge>
      <Display>Display - 큰 제목</Display>
      <H1>H1 - 페이지 제목</H1>
      <H2>H2 - 주요 섹션</H2>
      <H3>H3 - 서브 섹션</H3>
      <H4>H4 - 작은 제목</H4>
    </div>
  ),
};

/**
 * 본문 텍스트 크기
 */
export const BodyText: Story = {
  render: () => (
    <div className="space-y-6 max-w-2xl">
      <div>
        <H3 className="mb-2">Body Large</H3>
        <BodyLarge>
          타임 트래킹 앱 Hoego는 사용자의 시간을 효율적으로 관리할 수 있도록 돕는 도구입니다.
          직관적인 인터페이스와 강력한 기능을 통해 생산성을 극대화할 수 있습니다.
        </BodyLarge>
      </div>

      <div>
        <H3 className="mb-2">Body</H3>
        <Body>
          타임 트래킹 앱 Hoego는 사용자의 시간을 효율적으로 관리할 수 있도록 돕는 도구입니다.
          직관적인 인터페이스와 강력한 기능을 통해 생산성을 극대화할 수 있습니다.
        </Body>
      </div>

      <div>
        <H3 className="mb-2">Body Small</H3>
        <BodySmall>
          타임 트래킹 앱 Hoego는 사용자의 시간을 효율적으로 관리할 수 있도록 돕는 도구입니다.
          직관적인 인터페이스와 강력한 기능을 통해 생산성을 극대화할 수 있습니다.
        </BodySmall>
      </div>
    </div>
  ),
};

/**
 * 특수 텍스트 스타일
 */
export const SpecialStyles: Story = {
  render: () => (
    <div className="space-y-6 max-w-2xl">
      <div>
        <H3 className="mb-2">Lead Text</H3>
        <Lead>
          This is a lead paragraph that introduces the content. It's slightly larger and muted to
          stand out from regular body text.
        </Lead>
      </div>

      <div>
        <H3 className="mb-2">Muted Text</H3>
        <Muted>
          This is muted text, used for less important information or secondary content.
        </Muted>
      </div>

      <div>
        <H3 className="mb-2">Inline Code</H3>
        <Body>
          Use the <Code>useState</Code> hook to manage component state in React.
        </Body>
      </div>

      <div>
        <H3 className="mb-2">Blockquote</H3>
        <Blockquote>
          "The best way to predict the future is to invent it." - Alan Kay
        </Blockquote>
      </div>

      <div>
        <H3 className="mb-2">Caption & Small Caption</H3>
        <Caption>Last updated: 2024-11-15</Caption>
        <br />
        <CaptionSmall>© 2024 Hoego. All rights reserved.</CaptionSmall>
      </div>
    </div>
  ),
};

/**
 * 실제 사용 예시 - 카드 레이아웃
 */
export const RealWorldExample: Story = {
  render: () => (
    <div className="max-w-2xl space-y-6">
      <div className="border rounded-lg p-6 bg-card">
        <H2 className="mb-2">오늘의 활동</H2>
        <Caption className="block mb-4">2024년 11월 15일</Caption>

        <div className="space-y-4">
          <div>
            <H3 className="mb-1">프로젝트 작업</H3>
            <Body className="mb-2">
              Storybook UI 컴포넌트 시스템 구축 작업을 진행했습니다. Typography 컴포넌트와
              스토리를 완성했습니다.
            </Body>
            <Caption>3시간 25분</Caption>
          </div>

          <div>
            <H3 className="mb-1">코드 리뷰</H3>
            <BodySmall className="mb-2">
              팀원의 PR을 리뷰하고 피드백을 제공했습니다.
            </BodySmall>
            <Caption>45분</Caption>
          </div>

          <div className="pt-4 border-t">
            <Lead>총 작업 시간: 4시간 10분</Lead>
            <Muted>목표 대비 83% 달성</Muted>
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-6 bg-card">
        <H2 className="mb-2">설정</H2>
        <Body className="mb-4">
          앱의 동작을 커스터마이징할 수 있습니다.
        </Body>

        <div className="space-y-3">
          <div>
            <H4 className="mb-1">테마</H4>
            <BodySmall>밝음/어두움 테마를 선택하세요.</BodySmall>
          </div>

          <div>
            <H4 className="mb-1">단축키</H4>
            <BodySmall className="mb-2">
              빠른 작업을 위한 키보드 단축키를 설정하세요.
            </BodySmall>
            <Code>Cmd + K</Code> <Caption>- 명령 팔레트 열기</Caption>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * 폰트 웨이트 테스트
 */
export const FontWeights: Story = {
  render: () => (
    <div className="space-y-4">
      <H2>Pretendard Variable Font Weights</H2>
      <div className="space-y-2">
        <Body className="font-light">Light (300) - The quick brown fox</Body>
        <Body className="font-normal">Regular (400) - The quick brown fox</Body>
        <Body className="font-medium">Medium (500) - The quick brown fox</Body>
        <Body className="font-semibold">Semibold (600) - The quick brown fox</Body>
        <Body className="font-bold">Bold (700) - The quick brown fox</Body>
      </div>

      <H2 className="mt-8">JetBrains Mono (Code Font)</H2>
      <div className="space-y-2 font-mono">
        <div className="font-normal">Regular (400) - const x = 10;</div>
        <div className="font-medium">Medium (500) - const x = 10;</div>
        <div className="font-semibold">Semibold (600) - const x = 10;</div>
        <div className="font-bold">Bold (700) - const x = 10;</div>
      </div>
    </div>
  ),
};
