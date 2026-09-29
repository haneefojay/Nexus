import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#070A09",
        paper: "#E9EEE9",
        signal: "#B9F227",
        amber: "#F5A742",
        danger: "#FF6B57",
        steel: "#8A9690",
      },
      fontFamily: {
        sans: ["Arial", "Helvetica Neue", "sans-serif"],
        mono: ["Consolas", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
