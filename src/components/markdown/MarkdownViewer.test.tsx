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
    await user.click(checkboxes[0]!);

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
    await user.click(checkboxes[2]!);

    expect(onContentChange).toHaveBeenCalledWith(
      [
        '- [ ] 레벨 1',
        '  - [ ] 레벨 2',
        '    - [x] 레벨 3',
        '- [ ] 레벨 1-2',
      ].join('\n')
    );
  });
});
