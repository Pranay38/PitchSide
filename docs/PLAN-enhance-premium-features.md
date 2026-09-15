# PLAN: Enhance Premium Features

## Current State Analysis
I reviewed the current architecture of The Touchline Dribble compared to the features we brainstormed from The 1899. Here is what we already have vs. what is missing:

**✅ Already Exists in Our Website (No major additions needed):**
1. **Dark Mode:** We already have a robust `<ThemeToggle />` and `useTheme` hook with `dark:` Tailwind classes implemented across the UI.
2. **Authentication Loop:** We already use Clerk (`@clerk/nextjs`) for user accounts, complete with a `UserButton`, a Briefcase drawer for saved articles, and Fan Club onboarding.
3. **Search Bar:** We already have a `<DesktopCommandPalette />` for global search and a mobile search input.

**❌ Missing (To be added in this enhancement):**
1. **Network Top Bar:** A thin, dark utility bar above the main header (like "CounterPress Network") to link to external projects, "What is The Touchline?", and socials, making it feel like a broader media company.
2. **Audio Player (Text-to-Speech UI):** A premium UI component to "Listen to this article" on post pages. (Note: We will build the UI/UX for this, simulating the audio bridge until a real TTS API like ElevenLabs is connected).
3. **Accessibility Skip Button:** A visually hidden "Skip to main content" button that appears when keyboard users press Tab, improving accessibility for screen readers.

---

## Implementation Strategy

### 1. Add Accessibility Skip Link
- **File:** `app/layout.tsx` (and `app/page.tsx` for the main ID).
- **Change:** Inject a `<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[9999] bg-primary text-primary-foreground px-4 py-2 rounded-md font-bold">Skip to main content</a>` at the very top of the DOM. Add `id="main-content"` to the `<main>` tag.

### 2. Implement the "Touchline Network" Top Bar
- **File:** `src/app/components/Header.tsx`
- **Change:** Add a new `<div>` above the main `<header>` tag. It will be a dark bar (`bg-neutral-900 text-white`) hidden on mobile (`hidden lg:flex`), containing links to "About Us", "Contact", and "Newsletter".

### 3. Build the Audio Broadcast Bridge (UI)
- **File:** `src/app/components/ui/AudioPlayer.tsx` (NEW) and `src/app/pages/PostPage.tsx`.
- **Change:** Create a sleek, sticky or inline audio player component with Play/Pause, progress bar, and speed controls (1x, 1.5x). Inject it below the post title/meta info in the article view.

## User Review Required

> [!IMPORTANT]
> **Audio Generation:** I will build the fully functional *UI* for the Audio Player. Actually generating the audio requires a paid API (like ElevenLabs or OpenAI TTS). For now, it will be a visual UI that looks incredibly premium. Are you okay with that?
