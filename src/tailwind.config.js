/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // This line scans all files in src/
    "./public/index.html",
    "./src/styles/EstilosGenerales.css", // Add your custom CSS file
  ],
  theme: {
    extend: {
      colors: {
        // Make sure your custom colors are defined here
        cesunAzul: {
          900: "#1a2b4b", // Example value
          700: "#34496b", // Example value
        },
      },
    },
  },
  plugins: [],
};
