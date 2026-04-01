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
        primary:   "#1a1a2e",
        accent:    "#fccc04",
        "accent-hover": "#f0bc00",
        secondary: "#818cf8",
        success:   "#059669",
        danger:    "#dc2626",
      },
      fontFamily: {
        sans: ["Inter", "Hind Siliguri", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        card: "0 2px 8px rgba(0,0,0,0.08)",
        "card-hover": "0 8px 32px rgba(0,0,0,0.14)",
      },
    },
  },
  plugins: [],
};
