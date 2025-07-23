/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'tier-s': '#ff6b6b',
        'tier-a': '#4ecdc4',
        'tier-b': '#45b7d1',
        'tier-c': '#96ceb4',
        'tier-d': '#ffeaa7',
        'tier-f': '#ddd6fe'
      }
    },
  },
  plugins: [],
}
