import forms from "@tailwindcss/forms";
import containerQueries from "@tailwindcss/container-queries";

/** Written by AI Factory: the theme comes from the approved wireframes. */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [forms, containerQueries],
};
