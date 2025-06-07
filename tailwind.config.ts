
import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem', // Default padding for smaller screens
        sm: '1.5rem',    // Padding for sm screens and up
        lg: '2rem',      // Padding for lg screens and up
      },
      screens: {
        '2xl': '1440px', // Max container width
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      borderRadius: {
        xl: `calc(var(--radius) + 4px)`, // e.g., 0.75rem + 4px = 1rem
        lg: `var(--radius)`, // e.g., 0.75rem
        md: `calc(var(--radius) - 2px)`, // e.g., 0.75rem - 2px
        sm: `calc(var(--radius) - 4px)`, // e.g., 0.75rem - 4px
        '2xl': `calc(var(--radius) + 8px)`, // For larger, more pronounced rounding
        '3xl': `calc(var(--radius) + 16px)`,
      },
      fontFamily: {
        body: ['Inter', 'sans-serif'],
        headline: ['Inter', 'sans-serif'], // Can be different if desired
        code: ['monospace'],
      },
      keyframes: {
        'accordion-down': {
          from: {height: '0'},
          to: {height: 'var(--radix-accordion-content-height)'},
        },
        'accordion-up': {
          from: {height: 'var(--radix-accordion-content-height)'},
          to: {height: '0'},
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
      },
      boxShadow: {
        subtle: '0 2px 4px 0 hsl(var(--foreground-hsl) / 0.03)',
        DEFAULT: '0 1px 3px 0 hsl(var(--foreground-hsl) / 0.07), 0 1px 2px -1px hsl(var(--foreground-hsl) / 0.07)',
        md: '0 4px 6px -1px hsl(var(--foreground-hsl) / 0.07), 0 2px 4px -2px hsl(var(--foreground-hsl) / 0.07)',
        lg: '0 10px 15px -3px hsl(var(--foreground-hsl) / 0.07), 0 4px 6px -4px hsl(var(--foreground-hsl) / 0.07)',
        xl: '0 20px 25px -5px hsl(var(--foreground-hsl) / 0.07), 0 8px 10px -6px hsl(var(--foreground-hsl) / 0.07)',
        '2xl': '0 25px 50px -12px hsl(var(--foreground-hsl) / 0.15)',
        inner: 'inset 0 2px 4px 0 hsl(var(--foreground-hsl) / 0.04)',
        'md-strong': '0 6px 12px -2px hsl(var(--foreground-hsl) / 0.1), 0 3px 7px -3px hsl(var(--foreground-hsl) / 0.1)',
        'lg-strong': '0 12px 24px -4px hsl(var(--foreground-hsl) / 0.1), 0 7px 14px -6px hsl(var(--foreground-hsl) / 0.1)',
        'inner-lg': 'inset 0 3px 6px 0 hsl(var(--foreground-hsl) / 0.05)',
      },
      transitionTimingFunction: {
        'expo-in-out': 'cubic-bezier(0.87, 0, 0.13, 1)',
      }
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
