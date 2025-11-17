import { Pencil, Eye, Columns } from 'lucide-react';

export const RETROSPECT_VIEW_OPTIONS: Array<{
  value: 'edit' | 'preview' | 'split';
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    value: 'edit',
    label: '편집',
    description: '텍스트 입력 전용',
    icon: <Pencil className="h-3.5 w-3.5" />,
  },
  // MVP Phase 0: Preview/Split 모드 숨김
  // {
  //   value: 'preview',
  //   label: '미리보기',
  //   description: '렌더된 마크다운만 보기',
  //   icon: <Eye className="h-3.5 w-3.5" />,
  // },
  // {
  //   value: 'split',
  //   label: '듀얼',
  //   description: '편집·미리보기 나란히',
  //   icon: <Columns className="h-3.5 w-3.5" />,
  // },
];
