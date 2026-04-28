# Transfer Radar, Audio, and Wrapped Roadmap

Grounded in `graphify-out/graph.json`, `graphify-out/GRAPH_REPORT.md`, and the current `Football Blog Platform MVP` codebase.

## Why These Three

These features compound existing strengths instead of starting new product pillars:

- `Transfer Radar Pro` extends the biggest domain cluster in the graph and already has dossiers, transfer watch, alerts, and user preferences to build on.
- `Audio Commute Mode` turns existing audio players into a daily habit loop.
- `Wrapped 2.0` becomes more compelling once transfer and audio behavior produce richer user data.

Recommended build order:

1. Transfer Radar Pro
2. Audio Commute Mode
3. Wrapped 2.0

---

## 1. Transfer Radar Pro

### Product Goal

Turn the transfer section from a static read surface into a monitored product with return triggers.

### Existing Assets

- Transfer data and dossier helpers in `src/app/lib/transferDossiers.ts`
- Transfer pages in `src/app/pages/TransferReliabilityPage.tsx` and `TransferDossierPage.tsx`
- Follow state in `src/app/hooks/useUserPreferences.tsx`
- Alert builder in `src/app/lib/alertCenter.ts`
- Notification entry points in `src/app/components/NotificationBell.tsx` and `server/endpoints/notifications.ts`

### MVP Scope

- Watchlist for:
  - player
  - club
  - exact rumor pair (`player -> club`)
- Dossier timeline showing:
  - reliability score changes
  - status changes
  - fee changes
  - editor note updates
- Confidence-change alerts:
  - in Alerts page
  - notification bell feed
  - optional email digest section
- Tactical fit card on each dossier:
  - likely role
  - squad need
  - fit score
  - risk note
  - expected minutes path

### Data Model Changes

Add transfer event history instead of only current-state entries.

Suggested collections:

- `transfer_watch_events`
  - `entryId`
  - `player`
  - `club`
  - `status`
  - `reliabilityScore`
  - `feeMode`
  - `feeMillions`
  - `rationale`
  - `punchyLine`
  - `changedFields`
  - `createdAt`
- `user_transfer_watchlists`
  - can likely stay folded into `user_prefs` for MVP
  - add optional metadata later if needed
- `transfer_fit_cards`
  - `entryId`
  - `role`
  - `fitScore`
  - `squadNeed`
  - `tacticalReason`
  - `risk`
  - `minutesPath`
  - `updatedAt`

### Backend Work

- Extend transfer update flows to append history snapshots whenever an entry materially changes.
- Add endpoint support for dossier history retrieval.
- Add alert generation rules for:
  - score delta threshold
  - status changed
  - fee appeared or changed
  - move confirmed
- Add digest formatter for top transfer movements since last email send.

### Frontend Work

- Add `Watch` controls on transfer cards and dossier pages.
- Add a dossier timeline component with score-change chips.
- Add a tactical fit module under the dossier summary.
- Add a personalized `Radar` section on profile or alerts pages.

### Success Metrics

- watched transfers per active user
- repeat visits to `/transfers` and `/transfers/[slug]`
- alert open rate for transfer-related notifications
- dossier revisit rate after updates

### Fast Follow

- “similar targets” recommendations
- club-specific transfer radar pages
- source leaderboard by historical hit rate

---

## 2. Audio Commute Mode

### Product Goal

Make the platform useful when fans cannot read, especially during commute, gym, and matchday routines.

### Existing Assets

- `src/app/components/ArticleAudioPlayer.tsx`
- `src/app/components/TouchlineAudioPlayer.tsx`
- Profile history and saved state in `src/app/pages/ProfilePage.tsx`
- PWA-related surfaces like `PWAInstallPrompt.tsx` and `OfflineIndicator.tsx`

### MVP Scope

- `Listen later` queue for articles and audio posts
- playback resume across sessions
- daily 5-minute briefing assembled from:
  - followed clubs
  - watched transfers
  - latest major story
- commute rail on home and profile pages
- queue progress tracking for consumed minutes

### Data Model Changes

Suggested additions to `user_prefs` or a dedicated collection:

- `audioQueue`
  - ordered array of post ids
- `audioProgress`
  - post id
  - current time
  - duration
  - completed flag
- `audioMinutesListened`
  - aggregate counter for Wrapped 2.0

Suggested new collection if the daily briefing is persisted:

- `audio_briefings`
  - `userId`
  - `date`
  - `items`
  - `script`
  - `audioUrl` or browser-generated metadata

### Backend Work

- Add endpoints for queue CRUD and progress sync.
- Add briefing assembly endpoint using followed clubs, followed transfers, and top editorial items.
- Reuse existing article metadata and excerpt logic for narration scripts.

### Frontend Work

- Add `Listen later` action beside save/share on article surfaces.
- Add a persistent mini-player for active sessions.
- Add a home rail:
  - `Your commute briefing`
  - `Resume listening`
  - `Queued for later`
- Add profile audio stats for minutes listened and completed pieces.

### Success Metrics

- queued items per active user
- weekly audio starts
- completion rate by queue item
- daily briefing adoption rate

### Fast Follow

- offline download for queued items
- club-specific audio feeds
- narrated transfer roundup

---

## 3. Wrapped 2.0

### Product Goal

Turn usage data into a seasonal sharing loop and identity layer for the brand.

### Existing Assets

- `server/endpoints/wrapped.ts`
- wrapped banner logic already hinted in `ProfilePage.tsx`
- user behavior signals in:
  - saved posts
  - reading history
  - followed clubs
  - newsletter opt-in
  - AI history
  - predictions

### MVP Scope

- In-app wrapped page linked from profile
- shareable OG/social cards
- monthly and seasonal recap variants
- recap stats:
  - articles saved
  - clubs followed
  - debates voted
  - prediction score and accuracy
  - minutes listened
  - transfer alerts watched
  - favorite club and football philosophy

### Data Model Changes

No major new schema required for MVP if the first two features land.

May need one aggregation layer:

- `wrapped_snapshots`
  - `userId`
  - `period`
  - computed metrics payload
  - generatedAt

### Backend Work

- Replace current query-string-only wrapped generation with aggregated user metrics.
- Add endpoint to compute recap stats from:
  - `user_prefs`
  - predictions
  - AI history
  - audio progress
  - debate and alert interactions if available
- Keep current SVG card output path, but expand templates.

### Frontend Work

- Add full-screen recap flow from profile
- include swipeable cards:
  - season identity
  - top club
  - transfer obsession
  - predictor performance
  - commute/listening behavior
- add “share your season” CTA and generated image export

### Success Metrics

- wrapped opens
- share clicks
- social referral traffic
- returning users after wrapped launch

### Fast Follow

- club-specific wrapped themes
- rivalry mode comparison card
- “you vs last month” mini wrapped

---

## Delivery Plan

### Phase A: Transfer Retention Loop

- add transfer history persistence
- add dossier timeline UI
- add confidence-change alerts
- add tactical fit card

### Phase B: Audio Habit Loop

- add queue model and queue UI
- add progress persistence
- add daily briefing rail
- add profile audio stats

### Phase C: Share Loop

- add wrapped aggregation endpoint
- add profile recap surface
- add richer SVG or OG templates
- add social share entry points

---

## Suggested First Tickets

1. Persist transfer watch history snapshots on every meaningful admin update.
2. Build dossier timeline component from `transfer_watch_events`.
3. Add `Watch transfer` actions and surface them in alerts.
4. Add `Listen later` to article pages and profile.
5. Add synced audio progress model.
6. Expand wrapped metrics contract to include predictions, transfers, and audio.

---

## Stitch MCP Fit

If Stitch MCP is enabled later, use it for:

- rapid exploration of dossier page redesigns
- audio mini-player concepts
- wrapped recap card variations

It should support design iteration, not block backend and product work for these phases.
