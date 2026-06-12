import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211d",
        "la-green": "#0f7b55",
        "la-green-dark": "#07533b",
        "la-blue": "#2563eb",
        "la-amber": "#d97706",
        "la-line": "#dbe4df",
        "la-surface": "#f7faf8"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(23, 33, 29, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;

