/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // TRD brand palette — full dark theme (navy base, yellow accent)
        primary:   "#1a1a2e",   // dark navy (headings, buttons)
        accent:    "#fccc04",   // yellow highlight
        "accent-hover": "#f0bc00",
        secondary: "#818cf8",   // indigo-400 (readable on dark)
        surface:   "#0d0d1c",   // very dark navy — page bg
        card:      "#16152b",   // dark card bg
        "card-hover": "#1e1d38",
        muted:     "#8b8bb8",   // muted text on dark bg
        success:   "#4ade80",   // green-400 (visible on dark)
        danger:    "#f87171",   // red-400
        "price-red": "#f87171",
        "badge-green": "#14532d",
        "badge-text": "#86efac",
        // Dark override for Tailwind's gray scale
        gray: {
          50:  "#1a1929",
          100: "#1e1d30",
          200: "#2d2c4a",
          300: "#3d3c5a",
          400: "#6366a0",
          500: "#8080b0",
          600: "#a0a0c8",
          700: "#c0c0e0",
          800: "#d8d8f0",
          900: "#f0f0ff",
        },
      },
      fontFamily: {
        sans: ["Inter", "Hind Siliguri", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        card: "0 2px 8px rgba(0,0,0,0.08)",
        "card-hover": "0 4px 16px rgba(0,0,0,0.12)",
      },
    },
  },
  plugins: [],
};
