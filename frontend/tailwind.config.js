export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0F19', // Deep dark blue background
        surface: '#151C2C',    // Slightly lighter for cards
        primary: '#3B82F6',    // Vibrant blue
        secondary: '#10B981',  // Emerald green
        accent: '#8B5CF6',     // Purple
        textMain: '#F3F4F6',   // Light gray text
        textMuted: '#9CA3AF',  // Muted text
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
