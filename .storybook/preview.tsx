import type { Preview } from '@storybook/react-vite';
import '../src/styles/index.css'; // Import Tailwind CSS
import './storybook.css'; // Storybook 전용 스타일

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: 'hsl(210 40% 98%)', // --background
        },
        {
          name: 'dark',
          value: 'hsl(222 47% 11%)', // dark mode background
        },
        {
          name: 'white',
          value: '#ffffff',
        },
      ],
    },
    layout: 'padded', // 기본 레이아웃 패딩 적용
  },
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || 'light';

      return (
        <div className={theme}>
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
