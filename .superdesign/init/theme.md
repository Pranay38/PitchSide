# Theme Definitions

## File: src/styles/theme.css
Contains Tailwind v4 inline theme and CSS tokens.
```css
@custom-variant dark (&:is(.dark *));

:root {
  --font-size: 16px;
  --background: #F8FAFC;
  --foreground: #0F172A;
  --card: #ffffff;
  --card-foreground: #0F172A;
  --popover: #ffffff;
  --popover-foreground: #0F172A;
  --primary: #16A34A;
  --primary-foreground: #ffffff;
  --secondary: #F1F5F9;
  --secondary-foreground: #0F172A;
  --muted: #F1F5F9;
  --muted-foreground: #64748B;
  --accent: #E2E8F0;
  --accent-foreground: #0F172A;
  --destructive: #d4183d;
  --destructive-foreground: #ffffff;
  --border: rgba(0, 0, 0, 0.08);
  --input: transparent;
  --input-background: #f3f3f5;
  --radius: 0.625rem;
  --font-inter: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-outfit: 'Outfit', 'Inter', ui-sans-serif, system-ui, sans-serif;
}

.dark {
  --background: #0B1120;
  --foreground: #E2E8F0;
  --card: #1E293B;
  --card-foreground: #E2E8F0;
  --popover: #1E293B;
  --popover-foreground: #E2E8F0;
  --primary: #16A34A;
  --primary-foreground: #ffffff;
  --secondary: #1E293B;
  --secondary-foreground: #E2E8F0;
  --muted: #1E293B;
  --muted-foreground: #94A3B8;
  --accent: #334155;
  --accent-foreground: #E2E8F0;
  --destructive: oklch(0.396 0.141 25.723);
  --destructive-foreground: oklch(0.637 0.237 25.331);
  --border: rgba(255, 255, 255, 0.08);
  --input: #334155;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --font-inter: var(--font-inter);
  --font-outfit: var(--font-outfit);
}

/* Glassmorphism Classes */
.glass {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.25);
}
.dark .glass {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```
