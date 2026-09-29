<claude-mem-context>
# Memory Context

# [Football Blog Platform MVP] recent context, 2026-05-14 8:41pm GMT+5:30

No previous sessions found.
</claude-mem-context>

## Blog-to-Substack workflow

Whenever the `blog` or `blog-write` skill produces a publishable article, also use the project skill at `.agents/skills/blog-substack/SKILL.md` after the canonical website article passes its delivery contract. Apply it to `blog-rewrite` only when the rewrite is intended for publication. Do not apply it to outlines, briefs, audits, analysis, strategy, calendars, fact-checks, schema, or SEO-only checks. Skip the companion when the user explicitly opts out.
