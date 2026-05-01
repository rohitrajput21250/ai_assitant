import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      boxShadow: {
        glow: '0 0 30px rgba(72, 209, 255, 0.28), 0 0 80px rgba(159, 87, 255, 0.22)',
        glass: '0 18px 80px rgba(0, 0, 0, 0.35)'
      },
      colors: {
        void: '#050713',
        cyanGlow: '#56ddff',
        violetGlow: '#9d63ff',
        signalPink: '#ff4fd8',
        plasmaGreen: '#8fffca'
      }
    }
  },
  plugins: []
} satisfies Config;
