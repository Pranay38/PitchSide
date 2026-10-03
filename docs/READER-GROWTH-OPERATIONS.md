# Reader growth: implementation and weekly practice

Approved direction: `.agents/product-marketing-context.md`. This guide makes the September strategy operational; it does not claim that campaigns have been published or that traffic has improved.

## Weekly practice — 220 minutes, excluding writing

| Practice | Minutes | Deliverable |
| --- | ---: | --- |
| Research five genuine reader questions from discussions/Search Console | 30 | Source links, exact questions, one chosen question; do not invent observations |
| Write three hooks; prepare three weekly X posts | 40 | Argument, evidence, explanation; clear rationale for the selected opening |
| Read and contribute to relevant X discussions | 60 | Four 15-minute sessions; useful replies without repetitive promotional links |
| Participate in two selected communities | 40 | One substantive contribution total where welcome; review rules first |
| Assemble The Weekly Whistle | 20 | Opinion, useful lesson, a question, one main article CTA |
| Review results and research a relevant small publisher | 30 | Scorecard plus one specific collaboration idea; draft up to two proposals over six weeks |

One opinion plus one explainer weekly. The monthly story may replace an explainer. Use the distribution skill to reuse approved work across channels. The Substack companion remains required for eligible blog-skill deliveries. No Instagram or paid acquisition in this phase.

## Tracking contract

`POST /api/growth-events` accepts `event`, `readerState` (`guest`, `signed_in`, `subscriber`), optional `postId`, `placement`, and optional `campaign`. Old callers with `postId` and no placement retain `article_end`. New events without an article must include a placement. Unknown fields are discarded; event names are allowlisted. Slugs are 1–160 letters/numbers/underscores/hyphens. No emails, full URLs, user IDs, submitted text, IPs or referrers are stored in these events.

| Event | When | Interpretation |
| --- | --- | --- |
| `cta_view` | At least 50% visible continuously for one second in a visible tab | Once per placement/article per page visit; no observer means no inferred exposure |
| `cta_subscribe` | Successful new-subscription response | New subscriber only; API subscription remains the source of truth |
| `cta_already_subscribed` | Successful existing-subscriber response | Preference update/returning subscriber; never a new conversion |
| `cta_subscribe_failed` | Rejected request, network failure or invalid response | Excludes form validation that prevents submission |
| `cta_support_click` | Existing support link clicked | Intent, not a payment |

All public subscriber POST forms use the shared request path. The admin import/send tools are intentionally excluded. Views are measured on the visible form or CTA. The existing support CTA remains available; its view is not necessarily an opportunity for a new subscription. Aggregate signup/view ratios are observed ratios, not person-level conversion rates.

Campaign fields: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`. Retain the last tagged landing for the current browser tab across internal navigation; a newly tagged landing replaces it. Untagged visits with no captured campaign remain unattributed. Discard arbitrary query parameters and email-shaped values. Declining the existing cookie preference clears campaign storage and suppresses these growth events. Storage or analytics failures must not block signup. This does not retrofit consent behavior across every pre-existing analytics vendor.

Placements: `homepage`, `subscribe_page`, `article_end`, `article_inline`, `footer`, `newsletter_inline`, `mobile_newsletter`, `newsletter_modal`, `voting_gateway`, `profile`, `alerts`, `weekly_digest`, `weekly_roundup`, `glossary`, `comparison`.

The admin analytics view groups new, existing and failed submissions by placement and campaign source. Article breakdowns exclude non-article events. Stored subscriber `signupCampaign` records the tagged acquisition context; an existing signup does not overwrite it. Newsletter form input is never forwarded to GA/growth events.

## Baseline and scorecard

Use a reliable previous 28 days if available; otherwise collect 14 days after deployment. Record the deployment date: old CTA views fired on mount and older subscription events could count existing readers. Do not compare those directly with the new baseline. No historical numbers have been fabricated or migrated.

| Metric | Definition / source | Weekly decision |
| --- | --- | --- |
| Discovery | Sessions by source in existing GA/PostHog, with campaign links | Which channels bring readers? |
| Second-article reading | Sessions containing views of at least two distinct article IDs in PostHog `article_viewed` | Which topics lead to another read? Related-link clicks are a diagnostic, not proof of reading. |
| New subscriptions | Subscriber creation plus `cta_subscribe`, separated from `cta_already_subscribed` | Which article/placement/source earns subscriptions? |
| Seven-day return | Readers in a first-visit cohort who return on a later day within seven days; use the same vendor identity throughout | Are discovered readers coming back? Allow cohorts to mature before comparing. |
| First participation | First successful contribution in the selected existing feature, not a CTA click | Does the welcome invitation help people participate? Use successful feature records; do not infer from pageviews. |
| Email delivery health | Provider acceptance and provider delivery/bounce records; welcome cron failures | Are subscriptions followed by useful, deliverable email? |

The repository does not provide authenticated analytics exports. Baseline values and external dashboards remain operational checks. Provider acceptance is not proof of inbox delivery. Start with the existing dashboard/providers; avoid adding another analytics vendor. On week six, retain themes/channels that produce repeated reading or subscriptions, adjust those producing only impressions, and review again through week twelve. Choose numeric growth targets after a valid baseline exists.

## Welcome journey and sample

- Immediate: welcome and one current editorial opinion. Day one: one useful explainer. Day three: the existing debates page. Each message has one main CTA plus the template's standard footer/unsubscribe links.
- Select real, published, ungated reading; prefer editorial picks and the opinion's linked background explainer. Fall back to `/archive` or `/learn` if no suitable article exists. Never use guessed post URLs or claim these are the most popular posts.
- The subscribe-page sample uses the same published selection and is explicitly labeled as a sample, not a sent edition. Existing subscribers see a next-reading link.
- New records start at welcome state 0. Advance after provider acceptance; failed welcome sends remain retryable. The cron advances a subscriber at most once per run, allows at least 24 hours between stages, skips unsubscribed readers, and uses a stable provider idempotency key per subscriber/stage.
- Cron GET requires `Authorization: Bearer <CRON_SECRET>`; manual POST requires admin authentication and same-origin validation. Do not invoke either as a test against production.
- Legacy records already at state 1 retain their state: historic delivery cannot be reconstructed. Provider idempotency retention is finite; a send accepted by the provider followed by a database write failure still needs operational review.

## Release and verification

1. Run type-check and the reader-growth, subscriber, growth-event, analytics, welcome-sequence and mailer tests.
2. In a local/staging browser with API calls mocked, check guest, signed-in and existing-subscriber forms; test 375px mobile and desktop layouts, keyboard labels, loading/failure feedback, and campaign landing → internal navigation → signup.
3. Confirm 49% visibility does not count, 50% for 999ms does not count, and one continuous second counts once. Scroll away, hide the tab and navigate to another article to check reset/cleanup.
4. Verify newsletter email HTML has one primary destination, campaign links and a working unsubscribe/preferences path. Use provider mocks for rejection/retry checks.
5. After deployment, check `CRON_SECRET` configuration, a user-authorized test recipient's inbox and provider delivery logs, plus the admin cron/error view. No production emails are authorized merely by generating drafts or this guide.
6. Inspect public HTTP responses and rendered pages for actual content, canonical links, robots directives and sitemap consistency. Search Console URL Inspection is needed to verify Google's indexed/rendered view; text extraction alone is insufficient.

Deployment, sending campaigns, ongoing weekly participation, future cohort measurement and real inbox verification are not completed by a local code change.

## Verification recorded during implementation

- Public homepage HTTP response: 200, canonical `https://www.thetouchlinedribble.in`, robots `index, follow`; no `X-Robots-Tag` restriction observed. Public robots file allows `/` and advertises the sitemap; sitemap contained 231 URLs when checked.
- A browser rendered the live homepage's lead story, article links, reading sections and newsletter state. The fetched initial HTML had no ordinary `/post/` anchor elements and exposed the generic noscript heading; content appears after client rendering. This is a rendering dependency to investigate with Search Console URL Inspection, not evidence that Google has failed to index the site. No blanket SEO/schema rewrite was made.
- Found and connected the existing email preferences page/API under the active root App Router. Subscriber status now respects an unsubscribe even when an older signed-in preference says opted in. Header newsletter navigation points directly to `/subscribe`.
- Automated tests use mocked databases/providers. No real subscriber records were created, no campaign was posted, and no email was sent as part of verification.
- Verification: final full Vitest suite passed: 120 tests across 25 files, including preference/unsubscribe behavior. TypeScript passed with `--noEmit --incremental false`. The new skill passed its frontmatter/structure validator.
- Local `/subscribe` compiled and returned HTTP 200 with production database/email access disabled. Full browser interaction/mobile verification remains unverified: the existing CSP blocks Next.js development mode's eval-based refresh scripts. The production CSP was not loosened to bypass this limitation. Verify the built preview before deployment.
