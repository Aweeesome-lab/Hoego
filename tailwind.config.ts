import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    'index.html',
    'src/**/*.{ts,tsx,html}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Pretendard Variable',
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Roboto',
          'Helvetica Neue',
          'Segoe UI',
          'Apple SD Gothic Neo',
          'Noto Sans KR',
          'Malgun Gothic',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      fontSize: {
        // Display
        'display-lg': ['3rem', { lineHeight: '3.5rem', fontWeight: '700', letterSpacing: '-0.02em' }],
        'display': ['2.25rem', { lineHeight: '2.75rem', fontWeight: '700', letterSpacing: '-0.02em' }],

        // Headings
        'h1': ['2rem', { lineHeight: '2.5rem', fontWeight: '600', letterSpacing: '-0.01em' }],
        'h2': ['1.5rem', { lineHeight: '2rem', fontWeight: '600', letterSpacing: '-0.01em' }],
        'h3': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'h4': ['1.125rem', { lineHeight: '1.5rem', fontWeight: '600' }],

        // Body
        'body-lg': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '400' }],
        'body': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],

        // Caption
        'caption': ['0.75rem', { lineHeight: '1rem', fontWeight: '400' }],
        'caption-sm': ['0.6875rem', { lineHeight: '0.875rem', fontWeight: '400' }],
      },
      colors: {
        matcha: {
          DEFAULT: 'var(--matcha)',
          light: 'var(--matcha-light)',
          dark: 'var(--matcha-dark)',
          50: 'var(--matcha-50)',
          100: 'var(--matcha-100)',
          200: 'var(--matcha-200)',
          300: 'var(--matcha-300)',
          400: 'var(--matcha-400)',
          500: 'var(--matcha-500)',
          600: 'var(--matcha-600)',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))'
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'inherit',
            // Task list styling - remove bullet points from checkboxes
            'ul.contains-task-list': {
              listStyle: 'none',
              paddingLeft: '0',
            },
            'ul.contains-task-list > li': {
              listStyle: 'none',
              paddingLeft: '0',
            },
            'ul.contains-task-list > li::before': {
              content: 'none',
            },
            'li.task-list-item': {
              listStyle: 'none',
              paddingLeft: '0',
            },
            'li.task-list-item::before': {
              content: 'none',
            },
            'input[type="checkbox"]': {
              marginRight: '0.5rem',
              cursor: 'pointer',
            },
          },
        },
      },
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
  ]
};

export default config;
