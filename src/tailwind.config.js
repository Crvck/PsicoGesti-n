// tailwind.config.js

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/styles/**/*.css",
  ],
  theme: {
    extend: {
      colors: {
        cesunAzul: {
          900: "#1a2b4b",
          700: "#34496b",
          500: "#007bff",
          100: "#e6f0fa",
        },
      },
    },
  },
  plugins: [],
};
