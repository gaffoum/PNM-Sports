/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          0: "#001C25",
          1: "#032a35",
          2: "#063d4a",
        },
        panel: "#053343",
        teal: {
          DEFAULT: "#008279",
          mid: "#009E90",
        },
        cyan: {
          DEFAULT: "#00CBB9",
          bright: "#5EEBDB",
          deep: "#008279",
        },
        silver: "#d4f5f0",
        ink: {
          DEFAULT: "#eafffb",
          dim: "#8ac4bc",
          muted: "#4f8a82",
        },
        line: {
          DEFAULT: "rgba(0, 203, 185, 0.14)",
          strong: "rgba(0, 203, 185, 0.28)",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "system-ui", "sans-serif"],
        body: ["Manrope", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};
