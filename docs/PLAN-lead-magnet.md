# PLAN: Lead Magnet & Email Capture
**Goal**: Reach 1,000 monthly page views and 100 email subscribers via Twitter, Google, and word-of-mouth.
**Strategy**: Create a highly desirable "Ultimate Tactics Playbook" Lead Magnet and gate it behind an email capture form.

## Phase 1: The Lead Magnet Infrastructure
- **Design the Asset Cover**: Generate a highly premium, magazine-style cover image for "The Ultimate Tactics Playbook" (using a placeholder or standard image for now) to make the free download look valuable.
- **Dedicated Landing Page (`/playbook`)**: Build a high-converting landing page optimized for Twitter traffic. It will feature the playbook cover, bullet points of what they will learn, and a massive email capture form.

## Phase 2: Integrating the Funnel
- **Global `LeadMagnetBanner.tsx`**: Build a new component that replaces or runs alongside the current `SupportBanner`. Instead of asking for money immediately (Razorpay), it asks for an email in exchange for the free playbook.
- **Article Injection**: Place this Lead Magnet banner at the bottom of every blog post and Glossary term.

## Phase 3: The "Thank You" Flow
- **`/thank-you` Page**: After they enter their email, redirect them to a page where they can download the PDF/Access the hidden page.
- **Voluntary Support (Optional)**: Keep the focus entirely on delivering the free value. We can include a very soft, non-intrusive "Buy me a coffee if you loved this" link at the very bottom, but the primary action is just getting their playbook.

## Agent Assignments
- `frontend-specialist`: Build the `/playbook` landing page and `LeadMagnetBanner.tsx`.
- `backend-specialist`: (If needed) Connect the email capture form to a simple database or API route to collect the emails.

## Verification Checklist
- [ ] Landing page `/playbook` is accessible and looks great on mobile (since Twitter traffic is 80% mobile).
- [ ] Entering an email successfully saves the data (or triggers a webhook).
- [ ] The user is redirected to `/thank-you`.
- [ ] The Razorpay upsell is highly visible on the Thank You page.
