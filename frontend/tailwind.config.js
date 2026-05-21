/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        saas: {
          bg: "#fafafa",
          bgalt: "#f8f9fc",
          card: "#ffffff",
          border: "#e2e8f0",
          text: "#0f172a",
          muted: "#64748b",
          
          // Accent shades
          blue: "#2563eb",
          indigo: "#4f46e5",
          violet: "#8b5cf6",
          emerald: "#10b981",
          amber: "#f59e0b",
          rose: "#f43f5e",
          
          // Slate tones for modern design
          slate50: "#f8fafc",
          slate100: "#f1f5f9",
          slate200: "#e2e8f0",
          slate300: "#cbd5e1",
          slate700: "#334155",
          slate800: "#1e293b",
          slate900: "#0f172a",
        },
        // Premium Dark mode theme
        dark: {
          bg: "#09090b",
          card: "#18181b",
          border: "#27272a",
          text: "#fafafa",
          muted: "#a1a1aa",
        }
      },
      boxShadow: {
        'premium': '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -2px rgba(0, 0, 0, 0.02), 0 0 0 1px rgba(0, 0, 0, 0.04)',
        'premium-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.03), 0 4px 6px -4px rgba(0, 0, 0, 0.03), 0 0 0 1px rgba(0, 0, 0, 0.04)',
        'premium-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.04), 0 8px 10px -6px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.05)',
        
        'dark-premium': '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.04)',
        'dark-premium-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.04)',
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      }
    },
  },
  plugins: [],
}
