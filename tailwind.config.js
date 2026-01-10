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
            },
            gap: {
                "page-sections": "var(--gap-page-sections)",
                "card-content": "var(--gap-card-content)",
                "inline-items": "var(--gap-inline-items)",
                "form-fields": "var(--gap-form-fields)",
            },
            padding: {
                "page": "var(--padding-page)",
                "card": "var(--padding-card)",
                "section": "var(--padding-section)",
            },
            keyframes: {
                "fade-in": {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                "slide-up": {
                    "0%": { opacity: "0", transform: "translateY(10px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                "slide-in-right": {
                    "0%": { opacity: "0", transform: "translateX(-20px)" },
                    "100%": { opacity: "1", transform: "translateX(0)" },
                },
                "scale-in": {
                    "0%": { opacity: "0", transform: "scale(0.95)" },
                    "100%": { opacity: "1", transform: "scale(1)" },
                },
                "pulse-subtle": {
                    "0%, 100%": { transform: "scale(1)", opacity: "1" },
                    "50%": { transform: "scale(1.02)", opacity: "0.9" },
                },
            },
            animation: {
                "fade-in": "fade-in 0.5s ease-out forwards",
                "slide-up": "slide-up 0.5s ease-out forwards",
                "slide-in-right": "slide-in-right 0.5s ease-out forwards",
                "scale-in": "scale-in 0.3s ease-out forwards",
                "pulse-subtle": "pulse-subtle 2s infinite ease-in-out",
            },
        },
    },
    plugins: [
        forms,
        containerQueries,
    ],
}
