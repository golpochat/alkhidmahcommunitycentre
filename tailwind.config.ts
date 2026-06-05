import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        gold: {
          DEFAULT: "#D4AF37",
          light: "#E5C76B",
          dark: "#B8941F",
        },
        emerald: {
          DEFAULT: "#0F6B4A",
          light: "#14875D",
          dark: "#0A5238",
        },
        mosque: {
          black: "#0A0A0A",
          white: "#FFFFFF",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      spacing: {
        section: "5rem",
        "section-sm": "3rem",
        gutter: "1.5rem",
      },
      boxShadow: {
        card: "0 4px 24px rgba(0, 0, 0, 0.12)",
        "card-hover": "0 8px 32px rgba(212, 175, 55, 0.15)",
        gold: "0 4px 20px rgba(212, 175, 55, 0.25)",
        elevated: "0 12px 40px rgba(0, 0, 0, 0.2)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      typography: {
        display: {
          fontSize: "3.5rem",
          lineHeight: "1.1",
          fontWeight: "700",
        },
        h1: {
          fontSize: "2.5rem",
          lineHeight: "1.2",
          fontWeight: "700",
        },
        h2: {
          fontSize: "2rem",
          lineHeight: "1.25",
          fontWeight: "600",
        },
        h3: {
          fontSize: "1.5rem",
          lineHeight: "1.3",
          fontWeight: "600",
        },
        body: {
          fontSize: "1rem",
          lineHeight: "1.6",
        },
        small: {
          fontSize: "0.875rem",
          lineHeight: "1.5",
        },
      },
      transitionDuration: {
        DEFAULT: "200ms",
        slow: "400ms",
        400: "400ms",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      keyframes: {
        "display-ticker": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
      animation: {
        "display-ticker": "display-ticker 30s linear infinite",
      },
      backgroundImage: {
        "hero-pattern":
          "linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.6))",
        "hero-gold-wash":
          "linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(0, 0, 0, 0.35) 100%)",
        "gold-gradient":
          "linear-gradient(135deg, #D4AF37 0%, #B8941F 100%)",
        "emerald-gradient":
          "linear-gradient(135deg, #0F6B4A 0%, #0A5238 100%)",
        "islamic-pattern":
          "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        "footer-islamic-pattern":
          "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0l5 15h16l-13 9 5 15-13-9-13 9 5-15-13-9h16z' fill='%23D4AF37' fill-opacity='0.07'/%3E%3C/svg%3E\")",
        "islamic-star":
          "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0l5 15h16l-13 9 5 15-13-9-13 9 5-15-13-9h16z' fill='%23D4AF37' fill-opacity='0.06'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};

export default config;
