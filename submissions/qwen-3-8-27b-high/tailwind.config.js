/** @type {import('tailwindcss').Config} */
export default {
   content: ["./index.html", "./src/**/*.{ts,tsx}"],
   theme: {
      extend: {
         fontFamily: {
            display: ['"Press Start 2P"', "monospace"],
            sans: ['Inter', "system-ui", "sans-serif"],
         },
      },
    },
   plugins: [],
};
