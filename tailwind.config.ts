import type { Config } from "tailwindcss";

// Signal Laboratory palette v2 — "sassy, colourful, beautiful". Same token
// names as before (bone/paper/carbon/cobalt/lime/vermilion/fog) so no
// component code needed to change — only the hex values moved.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bone: "#FBF1FF",
        paper: "#FFFFFF",
        carbon: "#1B1030",
        ink: "#5A4B85",
        cobalt: "#8B2FE0",
        "cobalt-deep": "#6D1FBD",
        lime: "#16E0A6",
        vermilion: "#FF2E93",
        fog: "#9A87C2",
        "fog-soft": "#E9DCFB",
      },
      fontFamily: {
        display: ["var(--font-display)", "Archivo Black", "sans-serif"],
        body: ["var(--font-body)", "Instrument Sans", "system-ui", "sans-serif"],
        data: ["var(--font-data)", "Recursive Mono", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        wide2: "0.14em",
      },
      borderRadius: {
        none: "0px",
        DEFAULT: "0px",
        sm: "2px",
      },
      transitionTimingFunction: {
        signal: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
