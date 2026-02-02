import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  safelist: [
    // StatCard progress colors - ensure these are always generated
    "text-emerald-400",
    "border-emerald-400/30",
    "bg-emerald-400/10",
    "text-rose-400",
    "border-rose-400/30",
    "bg-rose-400/10",
    "text-amber-400",
    "border-amber-400/30",
    "bg-amber-400/10",
    "text-primary",
    "border-primary/20",
    "bg-primary/10",
    // Fixed background and text colors (important modifiers)
    "!bg-white",
    "!text-[hsl(222,47%,11%)]",
    "!text-[hsl(215,16%,47%)]",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        "icon-green": {
          bg: "hsl(var(--icon-green-bg))",
          DEFAULT: "hsl(var(--icon-green))",
        },
        "icon-blue": {
          bg: "hsl(var(--icon-blue-bg))",
          DEFAULT: "hsl(var(--icon-blue))",
        },
        "icon-purple": {
          bg: "hsl(var(--icon-purple-bg))",
          DEFAULT: "hsl(var(--icon-purple))",
        },
        "status-pink": {
          bg: "hsl(var(--status-pink-bg))",
          DEFAULT: "hsl(var(--status-pink))",
        },
        "dark-navy": "hsl(var(--dark-navy))",
        "dark-navy-light": "hsl(var(--dark-navy-light))",
        emerald: "hsl(var(--emerald))",
        "emerald-light": "hsl(var(--emerald-light))",
        "light-gray": "hsl(var(--light-gray))",
        "soft-blue": "hsl(var(--soft-blue))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "bounce-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "bounce-slow": "bounce-slow 2s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
