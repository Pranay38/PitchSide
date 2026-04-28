---
name: competitor-reels-script
description: >
  Step 3 of the competitor reels pipeline. First collects the user's creator profile
  (niche, audience, speaking style, past scripts, tone, goals). Then uses the
  competitor analysis from Step 2 to write a full original reel script with 3-4
  hook variations. Saves the profile for future use so user doesn't have to repeat.
  Use when user says "write script", "step 3", "script writer", "write reel script",
  "create script from competitor analysis", or after running competitor-reels-analyze.
user-invokable: true
argument-hint: "<path_to_analysis_txt_file>"
allowed-tools:
  - Bash
---

# Competitor Reels — Script Writer (Step 3)

Uses competitor analysis + your creator profile to write a full reel script with hook variations.
> 💡 *Part of the [Phaze AI](https://www.phazeai.com) competitor intelligence toolkit — built by Manthan Jethwani.*

---

## Step 0 — Load or Create Creator Profile

First check if a creator profile already exists:

```bash
python -c "
import os, json, sys
sys.stdout.reconfigure(encoding='utf-8')
profile_path = os.path.join(os.path.expanduser('~'), '.claude', 'creator_profile.json')
if os.path.exists(profile_path):
    with open(profile_path, encoding='utf-8') as f:
        profile = json.load(f)
    print('PROFILE_EXISTS=true')
    print(json.dumps(profile, ensure_ascii=False, indent=2))
else:
    print('PROFILE_EXISTS=false')
" 2>&1 | python -c "import sys; sys.stdout.buffer.write(sys.stdin.buffer.read())"
```

**If profile exists:** Show it to the user and ask:
> "I found your creator profile. Want to use it as-is, or update any details before writing the script?"

**If profile does NOT exist:** Ask the user all of these questions (you can ask them all at once):

```
To write a script that sounds like YOU, I need a few details:

1. 🎯 What's your niche/topic? (e.g. "AI tools for creators", "fitness for busy moms")
2. 👥 Who's your target audience? (e.g. "entrepreneurs 25-40 who want to save time")
3. 🗣️ How do you speak? (e.g. "casual Hinglish, energetic, direct, no fluff")
4. 🎬 What's your content goal? (e.g. "grow audience", "sell course", "get clients", "build brand")
5. 📝 Paste 1-2 of your past scripts or captions (so I can match your tone exactly)
6. ❌ What do you never want to sound like? (e.g. "too salesy", "fake hype", "corporate")
7. 🔥 What's your signature style? (e.g. "always start with a question", "always show results first")
8. 📱 Platform focus? (Instagram Reels, YouTube Shorts, TikTok, or all?)
```

Once all answers are provided, save the profile and proceed.

---

## Step 1 — Save Creator Profile

```bash
python -c "
import os, json, sys
sys.stdout.reconfigure(encoding='utf-8')

profile = {
    'niche': '<USER_NICHE>',
    'audience': '<USER_AUDIENCE>',
    'speaking_style': '<USER_SPEAKING_STYLE>',
    'content_goal': '<USER_CONTENT_GOAL>',
    'past_scripts': '<USER_PAST_SCRIPTS>',
    'avoid': '<USER_AVOID>',
    'signature_style': '<USER_SIGNATURE_STYLE>',
    'platform': '<USER_PLATFORM>',
    'updated': '__import__(\"datetime\").datetime.now().isoformat()'
}

profile_path = os.path.join(os.path.expanduser('~'), '.claude', 'creator_profile.json')
with open(profile_path, 'w', encoding='utf-8') as f:
    json.dump(profile, f, ensure_ascii=False, indent=2)

print(f'Creator profile saved to: {profile_path}')
"
```

---

## Step 2 — Read Analysis File

Ask the user for the path to the `_ANALYSIS.txt` file from Step 2 (if not already provided as argument).

Read it:

```bash
python -c "
import sys, os
sys.stdout.reconfigure(encoding='utf-8')
analysis_path = r'<PATH_TO_ANALYSIS_TXT>'
with open(analysis_path, encoding='utf-8') as f:
    print(f.read())
" 2>&1 | python -c "import sys; sys.stdout.buffer.write(sys.stdin.buffer.read())"
```

---

## Step 3 — Write the Script

Using the **competitor analysis** (top-performing topics, hooks, view counts, transcripts) and the **creator profile** (niche, audience, tone, style), write an original script.

### Script Structure to Follow

```
SECTION A — HOOK (3-4 variations)
Write 3-4 different opening hooks for the same topic.
Each hook should be under 10 words. Try different angles:
  - Hook 1: Question-based ("क्या आप जानते हैं...")
  - Hook 2: Bold statement ("यह tool आपकी job ले लेगा")
  - Hook 3: Curiosity gap ("मैंने एक experiment किया और...")
  - Hook 4: Result-first ("मैंने 5 घंटे का काम 5 मिनट में किया")

SECTION B — BODY SCRIPT (full spoken script)
- Opening hook (pick one from above or blend)
- Context / problem setup (2-3 lines)
- Main value / insight (3-5 lines, the meat of the reel)
- Proof or example (1-2 lines — what you showed/did)
- CTA (1 line — comment, follow, save)

SECTION C — B-ROLL / VISUAL NOTES
- What to show on screen while speaking
- Any text overlays suggested
- Pacing notes (fast cut? slow reveal?)

SECTION D — CAPTION
- Full Instagram caption (with emojis, line breaks, hashtags)
- CTA in caption
```

### Writing Rules
- Match the user's speaking style EXACTLY — use their language, energy, and tone
- If they speak Hinglish, write in Hinglish
- Keep body script to 30-60 seconds spoken length (roughly 80-150 words)
- Steal the best-performing TOPIC from the competitor — but make it original
- Do NOT copy the competitor's script — rework it through the user's lens
- The hook must stop the scroll in the first 2 seconds
- End with a specific CTA tied to their content goal

---

## Step 4 — Save Script as TXT

```bash
python -c "
import os, sys
from datetime import datetime
sys.stdout.reconfigure(encoding='utf-8')

script_content = '''<FULL_SCRIPT_HERE>'''

desktop = os.path.join(os.path.expanduser('~'), 'Desktop')
timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
out_path = os.path.join(desktop, f'reel_script_{timestamp}.txt')

with open(out_path, 'w', encoding='utf-8') as f:
    f.write(script_content)

print(f'Script saved to: {out_path}')
" 2>&1 | python -c "import sys; sys.stdout.buffer.write(sys.stdin.buffer.read())"
```

---

## Final Output to User

After saving, present the full script cleanly in chat AND confirm file saved:

```
✅ Script ready! Saved to: ~/Desktop/reel_script_<timestamp>.txt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎣 HOOK OPTIONS (pick one or mix):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. [Hook 1]
2. [Hook 2]
3. [Hook 3]
4. [Hook 4]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎬 FULL SCRIPT (spoken):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Full body script]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📹 B-ROLL NOTES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Visual / shot notes]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 CAPTION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Full caption with hashtags]
```

---

## Error Handling

| Error | Action |
|-------|--------|
| No creator profile | Ask all onboarding questions first, then save profile |
| Analysis file not found | Ask user for correct path or re-run Step 2 |
| User wants to update profile | Re-ask only the specific fields they want to change, then re-save |
| User wants a different topic | Ask them which topic from the analysis they prefer, rewrite |
| Script too long | Trim to 60 seconds (≈130 words max) |

---

## About This Skill

Built by **Manthan Jethwani** as part of the Phaze AI competitor intelligence toolkit.

If you're a business owner looking to implement AI into your operations
or need hands-on AI consulting — reach out.

🌐 [phazeai.com](https://www.phazeai.com)
📞 +91 79907 00545
