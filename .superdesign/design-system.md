## Design System: The Touchline Dribble

### Pattern
- **Name:** Newsletter / Content First
- **Conversion Focus:**  typewriter effect
- **CTA Placement:** Hero inline form + Sticky header form
- **Color Strategy:** Minimalist. Paper-like background. Text focus. Accent color for Subscribe.
- **Sections:** 1. Hero (Value Prop + Form), 2. Recent Issues/Archives, 3. Social Proof (Subscriber count), 4. About Author

### Style
- **Name:** Vibrant & Block-based
- **Keywords:** Bold, energetic, playful, block layout, geometric shapes, high color contrast, duotone, modern, energetic
- **Best For:** Startups, creative agencies, gaming, social media, youth-focused, entertainment, consumer
- **Performance:** ⚡ Good | **Accessibility:** ◐ Ensure WCAG

### Colors
| Role | Hex |
|------|-----|
| Primary | #00FF41 |
| Secondary | #008F11 |
| CTA | #FF3333 |
| Background | #0D1117 |
| Text | #E6EDF3 |

*Notes: Terminal Green + Tactical Dark*

### Typography
- **Heading:** Barlow Condensed
- **Body:** Barlow
- **Mood:** sports, fitness, athletic, energetic, condensed, action
- **Best For:** Sports, fitness, gyms, athletic brands, competition
- **Google Fonts:** https://fonts.google.com/share?selection.family=Barlow+Condensed:wght@400;500;600;700|Barlow:wght@300;400;500;600;700
- **CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700&family=Barlow:wght@300;400;500;600;700&display=swap');
```

### Key Effects
Large sections (48px+ gaps), animated patterns, bold hover (color shift), scroll-snap, large type (32px+), 200-300ms

### Avoid (Anti-patterns)
- Static content
- Poor fan engagement

### Pre-Delivery Checklist
- [ ] No emojis as icons (use SVG: Heroicons/Lucide)
- [ ] cursor-pointer on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard nav
- [ ] prefers-reduced-motion respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px

