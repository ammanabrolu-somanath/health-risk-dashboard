/** @type {import('tailwindcss').Config} */

/**
 * v3 token layer.
 *
 * The four palettes below REPLACE Tailwind's stock slate/indigo/emerald/amber/rose
 * ramps rather than sitting beside them. Every component already speaks in those
 * class names, so retuning the ramp retunes the whole app without a class sweep —
 * and there is no way for a stale `slate-500` to survive somewhere and drift.
 *
 * The ramps are hue-consistent: one neutral (cool, slightly blue), one action
 * blue, and three band hues chosen to read as clinical rather than consumer.
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Neutral. Ground #F6F7F9, hairline #E3E7EC, ink #16202B.
        slate: {
          50: '#F6F7F9',
          100: '#EDEFF3',
          200: '#E3E7EC',
          300: '#CBD2DB',
          400: '#8D98A7',
          500: '#5A6675',
          600: '#44505E',
          700: '#333E4B',
          800: '#232D39',
          900: '#16202B',
        },
        // Action. Deep clinical blue — the only colour that means "you can act".
        indigo: {
          50: '#EEF2FA',
          100: '#DCE4F3',
          200: '#BFCDE8',
          300: '#93A9D6',
          400: '#5A7BB8',
          500: '#3A5F9E',
          600: '#2B4C8C',
          700: '#23406F',
          800: '#1B3358',
          900: '#152945',
        },
        // Band: Low.
        emerald: {
          50: '#E8F5F0',
          100: '#CFEAE0',
          200: '#A7D8C7',
          300: '#6FBFA3',
          400: '#2E9E7B',
          500: '#12805C',
          600: '#0F6F50',
          700: '#0C5B42',
          800: '#0A4A36',
          900: '#083B2C',
        },
        // Band: Moderate.
        amber: {
          50: '#FDF3E4',
          100: '#FAE6C6',
          200: '#F2D19A',
          300: '#E5B268',
          400: '#D5943A',
          500: '#C77A16',
          600: '#AE6A11',
          700: '#8F560E',
          800: '#73450C',
          900: '#5E390A',
        },
        // Band: High.
        rose: {
          50: '#FCEEF0',
          100: '#F8DADF',
          200: '#EFB5BF',
          300: '#E2899A',
          400: '#D45C75',
          500: '#C6304A',
          600: '#AE2941',
          700: '#8F2135',
          800: '#741B2C',
          900: '#5F1725',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      /**
       * Four steps that actually differ. The old build had two that mattered —
       * the 48px score and "everything else at 14px" — so nothing on the page
       * announced itself. `section` is the one doing the work: it is what makes
       * a heading read as a heading.
       */
      fontSize: {
        display: ['2.75rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
        section: ['1.1875rem', { lineHeight: '1.3', letterSpacing: '-0.011em' }],
        subsection: ['0.9375rem', { lineHeight: '1.4', letterSpacing: '-0.006em' }],
        body: ['0.875rem', { lineHeight: '1.55' }],
        meta: ['0.75rem', { lineHeight: '1.45' }],
      },
      /** Three tiers of depth. Nothing else is allowed a shadow. */
      boxShadow: {
        raised: '0 1px 2px rgb(22 32 43 / 0.06), 0 8px 24px -12px rgb(22 32 43 / 0.18)',
        sm: '0 1px 2px rgb(22 32 43 / 0.05)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: 0, transform: 'translateY(6px)' }, '100%': { opacity: 1, transform: 'none' } },
        'pop-in': { '0%': { opacity: 0, transform: 'scale(.85)' }, '100%': { opacity: 1, transform: 'none' } },
      },
      animation: {
        'fade-up': 'fade-up .35s cubic-bezier(.2,.7,.3,1) both',
        'pop-in': 'pop-in .3s cubic-bezier(.2,1.4,.4,1) both',
      },
    },
  },
  plugins: [],
};

