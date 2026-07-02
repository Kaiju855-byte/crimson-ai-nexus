export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'omw-bg': '#121212',
        'omw-gold': '#D4AF37',
        'omw-gold-dark': '#B8960C',
        'omw-error': '#7f1d1d',
        'omw-card': '#1a1a1a',
        'omw-border': '#2a2a2a',
        'omw-text': '#e5e5e5',
        'omw-text-muted': '#a0a0a0',
      },
      fontFamily: {
        'serif': ['Georgia', 'Cambria', 'serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
}
