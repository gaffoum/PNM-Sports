/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          0: "#04101f",
          1: "#06192d",
          2: "#0a2540",
        },
        panel: "#0c2c4a",
        teal: {
          DEFAULT: "#0f3b52",
          mid: "#1a6b8b",
        },
        cyan: {
          DEFAULT: "#1ab8e0",
          bright: "#7ce3ff",
        },
        silver: "#cfe6f2",
        ink: {
          DEFAULT: "#e7f4fa",
          dim: "#8aa9bd",
          muted: "#557388",
        },
        line: {
          DEFAULT: "rgba(124, 227, 255, 0.14)",
          strong: "rgba(124, 227, 255, 0.28)",
        },
      },
      fontFamily: {
        display: ["Sora", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};
