# Story publication emails

A story's first publication creates a server-owned `publicationEmail` record in
that same MongoDB write. Draft saves, edits, default story seeding, and
republishing do not create a second campaign. Existing published stories are not
backfilled. Legacy `visual`, `metrics`, `takeaway`, and `highlights` fields remain
stored for compatibility but are absent from public story rendering and editing.

Delivery uses the existing Resend sender and `RESEND_API_KEY`, including the
current reply address, plain-text alternative, signed unsubscribe link, and
one-click unsubscribe headers. `JWT_SECRET` signs the unsubscribe token. Eligible readers
have `status != "unsubscribed"` and `preferences.newArticles != false`; this
matches the existing preference defaults. Readers who subscribe after publication
are excluded. Preferences are checked again immediately before delivery.

## Processing and recovery

Publication attempts delivery immediately. The protected `/api/story-emails`
worker drains pending campaigns every five minutes after deployment. Configure
`CRON_SECRET` and ensure the hosting plan supports that cadence; the existing
newsletter schedule is unchanged. MongoDB and the existing verified Resend sender
must also be available. There is no live broadcast or deployment in this change.

Each recipient has a deterministic `_id` in `story_email_deliveries`, using the
built-in unique MongoDB index. Delivery claims have five-minute leases to prevent
concurrent workers from sending the same message. The original email payload is
stored for stable retries. Admin → Stories shows provider acceptance counts,
pending/failed counts, and an authenticated retry action.

Provider acceptance is not confirmation of inbox delivery. If the provider rejects
or times out, publication still succeeds and the delivery remains retryable.
An interrupted claim is recoverable after its lease expires. Ambiguous attempts
older than 23 hours require review in Resend rather than automatic resending:
[Resend idempotency keys expire after 24 hours](https://resend.com/changelog/idempotency-keys).
The shorter window leaves room for clock drift. Accepted recipients are never
included in retries. Opted-out recipients are skipped. Unpublishing pauses any
remaining emails; republishing resumes the original pending campaign without
creating a new one.

## Verification

Tests mock the email provider and MongoDB state; they never email subscribers.
Coverage includes first publication, concurrent saves, historical stories,
preferences, partial failure, retries, payload escaping, legacy content, imported
rich text, preview rendering, and removal of supplementary story panels.
