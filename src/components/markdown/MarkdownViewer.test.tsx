import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MarkdownViewer } from './MarkdownViewer';

describe('MarkdownViewer - task checkboxes', () => {
  it('토글 시 onContentChange에 업데이트된 마크다운을 전달한다', async () => {
    const onContentChange = vi.fn();
    const initialContent = ['- [ ] 첫 번째 작업', '- [x] 두 번째 작업'].join(
      '\n'
    );
    const user = userEvent.setup();

    render(
      <MarkdownViewer
        content={initialContent}
        onContentChange={onContentChange}
      />
    );

    const checkboxes = await screen.findAllByRole('checkbox');
    expect(checkboxes[0]).toBeDefined();
    if (checkboxes[0]) {
      await user.click(checkboxes[0]);
    }

    expect(onContentChange).toHaveBeenCalledWith(
      ['- [x] 첫 번째 작업', '- [x] 두 번째 작업'].join('\n')
    );
  });

  it('코드 블록 안의 체크박스 표기는 건너뛰고 실제 태스크만 토글한다', async () => {
    const onContentChange = vi.fn();
    const initialContent = [
      '```',
      '- [ ] code block checkbox',
      '```',
      '',
      '- [ ] 실제 체크박스',
    ].join('\n');
    const user = userEvent.setup();

    render(
      <MarkdownViewer
        content={initialContent}
        onContentChange={onContentChange}
      />
    );

    const checkbox = await screen.findByRole('checkbox');
    await user.click(checkbox);

    expect(onContentChange).toHaveBeenCalledWith(
      [
        '```',
        '- [ ] code block checkbox',
        '```',
        '',
        '- [x] 실제 체크박스',
      ].join('\n')
    );
  });

  it('중첩된 리스트의 체크박스도 올바르게 토글한다', async () => {
    const onContentChange = vi.fn();
    const initialContent = [
      '- [ ] 레벨 1',
      '  - [ ] 레벨 2',
      '    - [ ] 레벨 3',
      '- [ ] 레벨 1-2',
    ].join('\n');
    const user = userEvent.setup();

    render(
      <MarkdownViewer
        content={initialContent}
        onContentChange={onContentChange}
      />
    );

    const checkboxes = await screen.findAllByRole('checkbox');

    // 레벨 3 (인덱스 2) 클릭
    expect(checkboxes[2]).toBeDefined();
    if (checkboxes[2]) {
      await user.click(checkboxes[2]);
    }

    expect(onContentChange).toHaveBeenCalledWith(
      [
        '- [ ] 레벨 1',
        '  - [ ] 레벨 2',
        '    - [x] 레벨 3',
        '- [ ] 레벨 1-2',
      ].join('\n')
    );
  });

  it('중첩된 리스트가 있는 경우 올바른 레이아웃 클래스를 적용한다', () => {
    const content = ['- [ ] 상위 항목', '  - [ ] 하위 항목'].join('\n');

    render(<MarkdownViewer content={content} />);

    // 상위 항목 li 찾기
    const listItems = screen.getAllByRole('listitem');
    // 첫 번째 li가 상위 항목 (순서상 먼저 렌더링됨)
    const parentItem = listItems[0];

    expect(parentItem).toHaveClass('flex-wrap');
    expect(parentItem).toHaveClass('[&>ul]:w-full');
    expect(parentItem).toHaveClass('[&>ul]:ml-6');
  });
});
