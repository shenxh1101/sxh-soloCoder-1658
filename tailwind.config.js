/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        deep: {
          50: "#E8EEF7",
          100: "#D1DCEE",
          200: "#A3B9DD",
          300: "#7597CC",
          400: "#4774BB",
          500: "#1F4F99",
          600: "#0F2540",
          700: "#0A1929",
          800: "#07121E",
          900: "#040B13",
        },
        orange: {
          50: "#FFF2EC",
          100: "#FFE0CF",
          200: "#FFC19E",
          300: "#FFA26E",
          400: "#FF833D",
          500: "#FF6B35",
          600: "#E5541C",
          700: "#B34116",
          800: "#802E10",
          900: "#4D1C0A",
        },
        fuel: {
          50: "#E9FBF1",
          100: "#D3F7E2",
          200: "#A7EFC5",
          300: "#7BE7A8",
          400: "#4FDF8B",
          500: "#2ECC71",
          600: "#25A25A",
          700: "#1C7943",
          800: "#13512D",
          900: "#0A2816",
        },
        repair: {
          50: "#F4ECFA",
          100: "#E9D9F5",
          200: "#D3B3EB",
          300: "#BD8DE1",
          400: "#A767D7",
          500: "#9B59B6",
          600: "#7D4792",
          700: "#5E356D",
          800: "#3F2449",
          900: "#1F1224",
        },
        alert: {
          red: "#E74C3C",
          yellow: "#F1C40F",
        },
        bg: {
          main: "#F5F7FA",
          card: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: ["'Noto Sans SC'", "'PingFang SC'", "'Microsoft YaHei'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Fira Code'", "monospace"],
      },
      boxShadow: {
        card: "0 2px 8px rgba(15, 37, 64, 0.06)",
        hover: "0 8px 24px rgba(15, 37, 64, 0.12)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
