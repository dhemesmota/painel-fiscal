import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink:          '#16232C',
        'ink-2':      '#1F2E38',
        paper:        '#F4EEE0',
        'paper-edge': '#DED0AE',
        gold:         '#C79A4B',
        'gold-ink':   '#8B652A',
        green:        '#3F7457',
        rust:         '#B1492E',
        tx:           '#1E2B33',
        'tx-muted':   '#66747B',
        cream:        '#EDE6D6',
        'cream-muted':'#9FAEB6',
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        mono:  ['"Space Mono"', 'monospace'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
