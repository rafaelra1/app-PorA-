import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./hooks/**/*.{js,ts,jsx,tsx}",
        "./contexts/**/*.{js,ts,jsx,tsx}",
        "./services/**/*.{js,ts,jsx,tsx}",
        "./lib/**/*.{js,ts,jsx,tsx}",
        "./constants/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                // Existing colors
                "primary": "#dcdaec",
                "primary-dark": "#b0aed4",
                "secondary": "#ABE2FE",
                "secondary-dark": "#6ac8fa",
                "background-light": "#F8F9FA",
                "background-dark": "#16161c",
                "text-main": "#131316",
                "text-muted": "#706e7c",
                // SmartLearn-inspired tokens
                "sl-bg": "#EDEFF3",
                "sl-primary": "#8479FF",
                "sl-primary-dark": "#6B5FE0",
                "sl-text": "#1F1F1F",
                "sl-pastel-purple": "#E7E2FF",
                "sl-pastel-blue": "#E2F2FF",
                "sl-pastel-yellow": "#FFF8E2",
                "sl-pastel-green": "#E2FFE7",
            },
            fontFamily: {
                "sans": ["Hellix", "Outfit", "Plus Jakarta Sans", "sans-serif"]
            },
            borderRadius: {
                "sm": "4px",
                "DEFAULT": "8px",
                "lg": "10px",
                "xl": "10px",
                "2xl": "12px",
                "3xl": "12px",
                "full": "9999px",
                "sl-card": "12px",
                "sl-sm": "6px",
            },
            boxShadow: {
                "soft": "0 10px 40px -10px rgba(0,0,0,0.08)",
                "glass": "0 8px 32px 0 rgba(31, 38, 135, 0.05)",
                "sl-soft": "0 4px 24px -4px rgba(0,0,0,0.06)",
                "sl-card": "0 8px 30px -8px rgba(0,0,0,0.08)",
            }
        },
    },
    plugins: [
        forms,
        containerQueries,
    ],
}
