# Subscriber email delivery

Prepared 6 October 2026 on `codex/subscriber-email-delivery`, based on main `5f0b475`.

## Behavior

All welcome, weekly digest, manual newsletter, and article notification emails use:

- From: `Pranay at The Touchline Dribble <noreply@thetouchlinedribble.in>`
- Reply-To: `thetouchlinedribble@gmail.com`
- A readable HTML letter and an explicit plain-text alternative.
- A recipient-specific visible unsubscribe link and `List-Unsubscribe` / `List-Unsubscribe-Post` headers.

Signup confirmation does not imply inbox delivery. Confirmed signups get Gmail category guidance; the first welcome email repeats it and invites a reply. The weekly digest uses the same opinion/explainer selection as the newsletter sample. It skips when there is no recent content or no eligible editorial pick and clearly labels a missing section. It no longer selects five personalized news cards or random subject variants.

Every dispatch query excludes `status: "unsubscribed"`. Digest/manual newsletters also respect `preferences.digest: false`; article notifications respect `preferences.newArticles: false`. Welcome dispatch retains its immediate pre-send opt-out check. Already queued/provider-accepted emails cannot be recalled.

## Unsubscribe interface

`GET /api/unsubscribe?token=...` validates a purpose-bound HMAC token and shows a confirmation form. It never updates the database. Responses are private/no-store, noindex, and no-referrer.

`POST /api/unsubscribe?token=...` accepts form-encoded or multipart `List-Unsubscribe=One-Click`, without login, cookies, or an Origin requirement. Invalid input returns 400. Database/signing configuration errors return 503 for retry. A successful or repeated request returns 200 and sets the reader to unsubscribed with email preferences disabled. Unknown recipients are not created. The link grants only unsubscribe permission.

Tokens use the existing required `JWT_SECRET`, with an unsubscribe-specific signing purpose. There is no insecure fallback and no expiry, so old emails remain usable. Rotating this secret invalidates issued signed links; retain a verification strategy for old keys if rotating later. Legacy `/api/subscribers?action=unsubscribe&email=...` links continue to open the existing preference page.

No data migration, welcome-stage reset, or subscriber enrollment is performed.

The legacy Clerk account-created webhook previously enrolled account holders in a separate Resend audience and sent an additional welcome without checking opt-outs. It now verifies Clerk signatures and only delivers the shared welcome for an existing active subscriber with stage 0, using the same idempotency key and stage transition as signup/cron. It never creates or reactivates contacts. Configure `CLERK_WEBHOOK_SIGNING_SECRET` (or the existing `CLERK_WEBHOOK_SECRET` alias) from the endpoint’s Clerk signing secret before enabling this callback. Missing configuration returns 503; invalid signatures return 400. Account creation itself remains separate from newsletter consent.

## Authentication audit

Public DNS observations on 6 October 2026:

- `send.thetouchlinedribble.in` TXT: `v=spf1 include:dc-fd741b8612._spfm.send.thetouchlinedribble.in ~all`.
- That include resolves to `v=spf1 include:amazonses.com ~all`.
- `send.thetouchlinedribble.in` MX: `10 feedback-smtp.ap-northeast-1.amazonses.com`.
- `resend._domainkey.thetouchlinedribble.in`: a public DKIM key is published.
- `_dmarc.thetouchlinedribble.in`: `v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;`.

No missing record was identified from these public checks. Root-domain SPF is not the same as the sending subdomain’s envelope authentication. Actual delivered alignment and DKIM coverage cannot be established from DNS alone.

The locally configured production Resend credential returned HTTP 401 for the read-only domains API: “This API key is restricted to only send emails.” Resend dashboard verification therefore remains unverified. No credentials are included here; no DNS or provider settings were changed.

## Release checks

Vercel’s production environment-variable listing confirms `JWT_SECRET` is configured, but neither Clerk webhook signing-secret variable is present. Before production rollout, add the actual endpoint signing secret from Clerk as `CLERK_WEBHOOK_SIGNING_SECRET`. Its value was not requested or changed during this work. Also confirm Resend marks this exact domain verified and retain the existing `JWT_SECRET`. Deploy only after separate authorization. Do not trigger a digest or restart the welcome sequence as part of deployment.

After separately authorizing a test email to an agreed inbox:

1. Inspect the original message for the correct From, Reply-To, HTML and text alternatives.
2. Confirm SPF and DKIM pass, DMARC aligns, and the DKIM signature covers both unsubscribe headers as required by RFC 8058.
3. Check the visible unsubscribe confirmation and one-click POST using a test subscriber; confirm subsequent sends exclude that reader.
4. Reply and verify the message arrives at the supplied Gmail inbox.
5. Monitor Resend failures/complaints, article clicks, and reader replies. Gmail Primary placement is not guaranteed and is not a release criterion.

References: [Google sender guidelines](https://support.google.com/mail/answer/81126), [RFC 8058](https://www.rfc-editor.org/rfc/rfc8058), [Resend custom headers](https://resend.com/changelog/custom-email-headers).

## Validation results

- Full Vitest suite: 34 files, 156 tests passed.
- TypeScript: `tsc --noEmit --incremental false` passed.
- `git diff --check` passed.
- Welcome, digest, and article HTML previews rendered at 375px and 960px without horizontal overflow; representative screenshots visually inspected. These are browser previews, not a claim of Gmail/Outlook client verification.
- Production bundle compiled successfully. Full build did not complete: isolated checkout intentionally has no production database configuration, and homepage prerendering failed after missing `MONGODB_URI` produced null content. No production database credentials were used.
- Repository lint command is blocked because ESLint is absent from main’s dependencies. No unrelated lint tooling changes were included.
- No email was sent, no campaign triggered, and nothing deployed. Delivered authentication/header verification remains pending an authorized test send.
