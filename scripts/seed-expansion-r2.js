/**
 * Seed Expansion Round 2 — Insert additional RAG knowledge chunks
 * for the 10 agents with least coverage (excluding R1 agents).
 *
 * Source: seed-expansion-r2
 */

const { Client } = require('pg');
const crypto = require('crypto');

const client = new Client({
  connectionString: 'postgresql://stoneai:stoneai_dev_2026@localhost:5432/stoneai'
});

// Agent slug -> agentId mapping (from DB query)
const AGENT_IDS = {
  'writing-editing': 'cmmluejd000aw349j8dbdn3of',
  'video-content-strategist': 'cmmlueje800bk349jkvk3cmzk',
  'general-coding-assistant': 'cmmluejcv00at349jthep6tdn',
  'research-synthesis': 'cmmluej22003q349ja1fnsgx9',
  'digital-marketing-strategist': 'cmmluejdv00bc349j3uchasc0',
  'lead-generation': 'cmmlueiye001i349jqqi7ip7q',
  'brand-building': 'cmmlueixx0018349jfw6o6gu1',
  'enterprise-implementation': 'cmmluejbv00a6349jflv6xe4t',
  'dropshipping': 'cmmlueiwt000n349jxz7coduw',
  'compliance-agent': 'cmmluejax009k349j76nde26y',
};

const CHUNKS = {
  'writing-editing': [
    {
      title: 'Email Writing Framework — Professional & Persuasive',
      content: `EMAIL WRITING FRAMEWORK (2025-2026):

STRUCTURE — THE 4-PART EMAIL:
1. SUBJECT LINE: 6-10 words. Specific > clever. "Q3 Budget Proposal — Review by Friday" beats "Quick question!"
2. OPENING LINE: State the purpose in sentence one. "I'm writing to request approval for..." or "Following up on our Tuesday call about..." Never open with "I hope this finds you well" in professional contexts — it wastes the reader's time.
3. BODY: One idea per paragraph. Bullet points for lists of 3+ items. Bold key actions or deadlines. Keep paragraphs to 2-3 sentences max on screen.
4. CLOSE: Clear CTA with deadline. "Please reply by EOD Thursday with your approval" not "Let me know your thoughts when you get a chance."

TONE CALIBRATION:
- Executive audience: Lead with the bottom line. Numbers first, context second. Remove qualifiers (maybe, possibly, I think).
- Peer audience: Conversational but structured. Include context they need to act.
- Client audience: Professional warmth. Mirror their formality level. Always close with next steps.
- Cold outreach: Value proposition in first 2 sentences. Personalize the opening. Keep under 100 words.

COMMON MISTAKES:
- Wall of text with no formatting (use line breaks, bullets, bold)
- Burying the ask in paragraph 3 (move it to line 1)
- CC'ing people who don't need to be there (increases noise, decreases action)
- Passive voice hiding accountability ("mistakes were made" vs "I made a mistake")
- Reply-all culture: only reply-all when everyone genuinely needs to see your response`
    },
    {
      title: 'Editing Levels — When to Use Each Type',
      content: `EDITING LEVELS EXPLAINED — CHOOSING THE RIGHT EDIT:

LEVEL 1 — DEVELOPMENTAL EDITING (Big Picture):
Focus: Structure, argument flow, narrative arc, audience fit, content gaps.
When: Early drafts, major rewrites, new writers building structure skills.
Questions: Does the piece achieve its purpose? Is the structure logical? Are there gaps in the argument? Is the opening strong enough to hook the reader? Does the ending land?
NOT about: Grammar, word choice, punctuation. Those come later.

LEVEL 2 — LINE EDITING (Sentence Level):
Focus: Clarity, rhythm, word choice, voice consistency, sentence variety.
When: After structure is solid. The piece says the right things but doesn't say them well yet.
Techniques: Read aloud to catch awkward phrasing. Vary sentence length (short sentences punch; longer ones flow and build rhythm). Cut 20% of words on first pass — most drafts are 20% too long. Replace weak verbs (is, was, has, make, do) with precise ones (construct, accelerate, eliminate).

LEVEL 3 — COPY EDITING (Rules & Consistency):
Focus: Grammar, punctuation, spelling, style guide compliance, factual accuracy, internal consistency.
When: After line editing. The piece reads well but needs polishing.
Checklist: Subject-verb agreement, comma splices, dangling modifiers, consistent tense, consistent formatting (serial comma or not, date formats, number style), proper nouns spelled correctly, quotes accurately attributed.

LEVEL 4 — PROOFREADING (Final Pass):
Focus: Typos, formatting errors, missing words, doubled words, layout issues.
When: The absolute last step before publication. Never combine with other editing levels.
Technique: Read backwards (sentence by sentence) to break the brain's auto-correction. Change the font/size to see the text fresh. Print it out if possible — screen reading misses more errors.

COST GUIDE (freelance rates 2025):
- Developmental: $0.07-0.12/word
- Line editing: $0.05-0.10/word
- Copy editing: $0.03-0.06/word
- Proofreading: $0.02-0.04/word`
    },
    {
      title: 'Persuasive Writing Techniques — From Headlines to CTAs',
      content: `PERSUASIVE WRITING TECHNIQUES:

THE AIDA FRAMEWORK:
Attention: Open with a bold claim, shocking stat, or vivid scenario. "73% of startups fail because of one fixable mistake."
Interest: Build curiosity with specifics. Show you understand the reader's problem better than they do.
Desire: Paint the after-state. Use sensory language. Make the reader feel what success looks like.
Action: Clear, specific CTA. One action, not three. "Download the checklist now" not "Learn more, subscribe, and share."

HEADLINE FORMULAS THAT WORK:
- Number + Adjective + Noun + Promise: "7 Proven Strategies to Double Your Email Open Rate"
- How to + Desired Outcome: "How to Write a Cover Letter That Gets Interviews"
- Question that implies a gap: "Are You Making These 5 Resume Mistakes?"
- Negative framing (loss aversion): "Stop Losing Clients With These Email Mistakes"

POWER WORDS BY CATEGORY:
- Urgency: now, today, immediately, deadline, limited, expires, last chance
- Exclusivity: secret, insider, members-only, invitation, private, VIP
- Trust: proven, guaranteed, certified, research-backed, tested, verified
- Emotion: breakthrough, transform, unleash, discover, master, conquer

READABILITY RULES:
- Flesch Reading Ease: target 60-70 for general audience (8th grade level)
- Average sentence length: 15-20 words. Mix short (5-8) with medium (15-20). Rarely exceed 25.
- Paragraph length: 1-3 sentences for web. 3-5 for print.
- Use transition words to connect ideas: however, therefore, meanwhile, specifically, in contrast
- White space is your friend — dense text walls kill engagement on every platform`
    },
    {
      title: 'Creative Writing Toolkit — Fiction and Narrative Techniques',
      content: `CREATIVE WRITING TOOLKIT:

SHOW DON'T TELL — The Core Principle:
Telling: "She was angry." Showing: "She slammed the folder on the desk, scattering papers across the floor. Her jaw clenched as she stared at the screen." Showing uses sensory details, actions, and dialogue to let the reader experience emotion rather than being told about it. Use telling for transitions and low-stakes moments. Use showing for emotional beats and key scenes.

DIALOGUE RULES:
- Every line of dialogue should either reveal character or advance plot (ideally both)
- Cut small talk unless it serves characterization: "Hi, how are you?" "Fine" is dead weight
- Use dialogue tags sparingly. "Said" is invisible to readers — let it do the work. Avoid "exclaimed," "queried," "opined" — they call attention to themselves
- Action beats replace tags: Instead of "I'm done," she said angrily → She shoved back from the table. "I'm done."
- Each character should have a distinct voice: vocabulary, sentence length, verbal tics, topics they return to

STORY STRUCTURE OPTIONS:
- Three-Act: Setup (25%) → Confrontation (50%) → Resolution (25%). Classic and reliable.
- Hero's Journey: Ordinary World → Call → Refusal → Mentor → Threshold → Tests → Ordeal → Reward → Return. Best for transformation arcs.
- Save the Cat: 15-beat structure (Opening Image, Theme Stated, Setup, Catalyst, Debate, Break Into Two, B Story, Midpoint, Bad Guys Close In, All Is Lost, Dark Night of the Soul, Break Into Three, Finale, Final Image). Excellent for screenwriting and novels.
- In Medias Res: Start in the middle of action. Fill in backstory later through dialogue and flashback. Creates immediate engagement.

POINT OF VIEW:
- First person ("I"): Intimate, limited, unreliable narrator potential. Best for character-driven stories.
- Third limited ("She thought"): Most versatile. Can shift between characters by scene/chapter.
- Third omniscient ("The narrator knew"): God-view. Hard to do well. Risk of head-hopping.
- Second person ("You walk in"): Experimental. Works in short fiction, choose-your-own-adventure, and some literary fiction.`
    },
  ],

  'video-content-strategist': [
    {
      title: 'Short-Form Video Optimization — TikTok, Reels, Shorts',
      content: `SHORT-FORM VIDEO OPTIMIZATION (2025-2026):

TIKTOK ALGORITHM SIGNALS:
- Watch time is king. A 15-second video watched twice (30s total) beats a 60-second video watched once.
- Loop completion: Videos that seamlessly loop get rewarded. End your video where it began.
- Shares > Comments > Likes > Views in terms of signal strength.
- Hashtags: Use 3-5 relevant hashtags. Mix broad (#marketing, 50B+ views) with niche (#b2bsaasstrategy, <100M views).
- First 1-3 seconds determine if someone stays. The hook IS the video.

INSTAGRAM REELS DIFFERENCES:
- Reels favor accounts that use all Instagram features (Stories, Posts, Lives, Reels). Pure Reels accounts get less reach.
- Audio matters more on Reels — trending sounds get a distribution boost.
- Reels shows content to non-followers more aggressively than Feed posts. Reels = growth, Stories = retention.
- Optimal length: 15-30 seconds for virality, 60-90 seconds for depth and follower conversion.

YOUTUBE SHORTS SIGNALS:
- Shorts feed is swipe-based, different from main YouTube algorithm.
- Shorts can drive subscribers who then watch long-form. Best bridge: end Short with "full breakdown on my channel."
- Shorts thumbnails are auto-generated (first frame) — make frame 1 visually striking.
- Music library is limited vs TikTok — original audio or voiceover performs best.

HOOK FRAMEWORKS (First 3 Seconds):
1. Pattern Interrupt: Unexpected visual or statement. "I got fired for doing this."
2. Curiosity Gap: "The one thing every successful YouTuber does that nobody talks about."
3. Direct Challenge: "You're editing your videos wrong. Here's proof."
4. Visual Hook: Start with the most visually interesting moment. Text overlay reinforces.
5. Result First: Show the end result, then "here's how I did it."

POSTING CADENCE:
- TikTok: 1-3x daily for growth phase, 4-7x/week for maintenance.
- Reels: 4-7x/week. More than daily can feel spammy on Instagram.
- Shorts: 3-5x/week. YouTube doesn't reward daily Shorts the way TikTok rewards daily posts.`
    },
    {
      title: 'Video Monetization Strategies Beyond AdSense',
      content: `VIDEO MONETIZATION BEYOND ADSENSE (2025-2026):

ADSENSE REALITY CHECK:
- YouTube RPM (Revenue Per Mille): $2-8 for most niches. Finance/business: $15-30. Entertainment: $2-5.
- 1M views/month at $5 RPM = $5,000/month. Decent but not life-changing.
- AdSense should be 20-30% of total revenue for a healthy video business. If it's 80%+, you're leaving money on the table.

SPONSORSHIP DEALS:
- Rate formula: $20-50 per 1,000 subscribers (dedicated video), $10-25 per 1,000 subs (integrated mention).
- 100K subs channel: $2,000-5,000 per sponsored video.
- Negotiate based on engagement rate, not just subscriber count. A 50K channel with 10% engagement beats a 500K channel with 1%.
- Sponsorship platforms: Grin, AspireIQ, Influence.co, or direct outreach.
- Create a media kit: channel stats, audience demographics, past sponsor results, pricing tiers.

DIGITAL PRODUCTS:
- Courses ($47-497): Teach what your content demonstrates. "I showed you free tips; here's the complete system."
- Templates/Presets ($19-99): Editing presets, thumbnail templates, script templates.
- Community/Membership ($9-49/month): Discord, Circle, or YouTube Memberships. Exclusive content + community access.
- E-books/Guides ($9-29): Compile your best content into structured guides.

AFFILIATE MARKETING:
- Recommend tools you actually use in your videos. Link in description.
- Amazon Associates: 1-10% commission. High volume, low per-sale earnings.
- Software affiliates (hosting, tools, courses): 20-50% commission, often recurring. Much more lucrative.
- Always disclose affiliate relationships — FTC requires it and audiences respect transparency.

CHANNEL VALUATION:
- Channels sell for 24-48x monthly revenue on platforms like Flippa, Empire Flippers.
- A channel making $3,000/month = $72K-144K sale price.
- Faceless channels sell at lower multiples (20-30x) because buyer risk is lower.
- Key valuation factors: revenue diversity, growth trajectory, content evergreen-ness, niche defensibility.`
    },
    {
      title: 'Faceless YouTube Channel Systems',
      content: `FACELESS YOUTUBE CHANNEL BLUEPRINT (2025-2026):

WHAT WORKS FACELESS:
- Top-list/compilation channels (top 10, most expensive, craziest)
- Educational/explainer (history, science, business case studies)
- Meditation/ambient/sleep content (minimal editing, high watch time)
- News commentary/analysis (text-based, stock footage)
- Motivation/quotes (text overlay, music)
- Finance/investing education (screen recordings, charts, AI voiceover)
- Tech reviews/comparisons (screen recordings, B-roll)

PRODUCTION PIPELINE:
1. Research (1-2 hrs): Find trending topics via VidIQ, TubeBuddy, Google Trends. Validate search volume.
2. Script (2-3 hrs): Write 1,500-2,500 words for a 10-15 min video. Use the hook-story-payoff structure.
3. Voiceover (30 min): ElevenLabs ($22-99/mo), Play.ht, or Murf.ai for AI voice. Or hire a VO artist on Fiverr ($15-50 per script).
4. Visuals (2-4 hrs): Stock footage (Pexels, Pixabay free; Storyblocks $30/mo for unlimited), screen recordings, simple animations (Canva, After Effects).
5. Editing (3-5 hrs): Premiere Pro, DaVinci Resolve (free), CapCut (free for short-form). Retention editing: zoom cuts every 3-5 seconds, text overlays on key points, B-roll transitions.
6. Thumbnail (30 min): Canva or Photoshop. High contrast, 3 elements max, readable text at mobile size.
7. Upload & Optimize (30 min): Title (60 chars max, keyword-front-loaded), description (2-3 paragraphs + timestamps), tags (10-15), end screen, cards.

TOTAL: 10-15 hrs per video. At 2 videos/week = 20-30 hrs/week (full-time operation).

OUTSOURCING (scale to 4+ videos/week):
- Scriptwriter: $30-80 per script (Upwork, OnlineJobs.ph)
- VO artist: $15-50 per script
- Video editor: $50-150 per video
- Thumbnail designer: $10-25 per thumbnail
- Total cost per video: $105-305. Break even at ~$300/video in ad revenue (60K-150K views at $5 RPM).`
    },
  ],

  'general-coding-assistant': [
    {
      title: 'Git Workflow and Version Control Best Practices',
      content: `GIT WORKFLOW BEST PRACTICES:

BRANCHING STRATEGIES:
- Trunk-Based Development: All developers commit to main (or short-lived feature branches <2 days). Best for CI/CD, small teams, fast iteration. Used by Google, Meta.
- Git Flow: main + develop + feature/* + release/* + hotfix/*. Best for versioned releases (mobile apps, SDKs). More ceremony, slower merges.
- GitHub Flow: main + feature branches + pull requests. Simple, effective for web apps. Feature branch → PR → review → merge to main → deploy.

COMMIT MESSAGES (Conventional Commits):
- Format: type(scope): description
- Types: feat (new feature), fix (bug fix), docs, style, refactor, test, chore, perf, ci
- Examples: "feat(auth): add OAuth2 Google provider", "fix(cart): prevent negative quantity on update"
- Why: Enables automated changelogs, semantic versioning, and clear history.

PR BEST PRACTICES:
- Keep PRs small (<400 lines changed). Large PRs get rubber-stamped, not reviewed.
- One logical change per PR. Don't mix refactoring with features.
- Write a description: What changed, why, how to test, screenshots for UI changes.
- Self-review before requesting review. Read your own diff first.

DANGEROUS COMMANDS TO KNOW (and when to use them):
- git reset --hard HEAD~1: Undo last commit, lose changes. Use when you committed to wrong branch.
- git rebase -i HEAD~N: Squash/reorder last N commits. Use to clean up before merging.
- git reflog: Your safety net. Shows every HEAD position. Recover from almost any mistake.
- git stash: Temporarily shelve changes. "git stash pop" to restore. Use when switching branches mid-work.
- git cherry-pick <hash>: Apply a specific commit to current branch. Use for hotfixes.

.GITIGNORE ESSENTIALS:
node_modules/, .env, .env.local, .DS_Store, *.log, dist/, build/, .next/, coverage/, *.pyc, __pycache__/, .venv/, .idea/, .vscode/settings.json`
    },
    {
      title: 'API Design Patterns — REST, GraphQL, and Webhooks',
      content: `API DESIGN PATTERNS (2025-2026):

REST API DESIGN:
- Resource naming: plural nouns (/users, /orders), not verbs (/getUsers). Verbs come from HTTP methods.
- HTTP methods: GET (read), POST (create), PUT (full replace), PATCH (partial update), DELETE (remove).
- Status codes: 200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable Entity, 429 Too Many Requests, 500 Internal Server Error.
- Pagination: cursor-based (performant, no skip issues) > offset-based (simpler, breaks on inserts). Include total count, next cursor, has_more.
- Filtering: GET /users?role=admin&status=active. Complex filters: use query parameter objects or POST with filter body.
- Versioning: URL path (/v1/users) is simplest. Header-based (Accept: application/vnd.api+json;version=2) is more RESTful but harder to test.

GRAPHQL WHEN TO USE:
- Multiple clients needing different data shapes (mobile vs web vs admin).
- Deeply nested/related data (avoid N+1 REST calls).
- Rapid frontend iteration without backend changes.
- NOT good for: simple CRUD APIs, file uploads, real-time (use WebSockets), public APIs with unknown consumers.

WEBHOOK DESIGN:
- POST to subscriber URL with JSON payload. Include event type, timestamp, payload, and signature.
- HMAC-SHA256 signature for verification: hash(secret + payload) in X-Signature header.
- Implement retry with exponential backoff: 1min, 5min, 30min, 2hr, 24hr. Max 5 retries.
- Idempotency: include unique event_id. Consumers should deduplicate by event_id.
- Timeout: 10-30 second response timeout. If subscriber is slow, queue and retry.

RATE LIMITING:
- Token bucket or sliding window algorithms.
- Headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset.
- Tiers: unauthenticated (60/hr), authenticated (5,000/hr), premium (50,000/hr).
- Return 429 Too Many Requests with Retry-After header.`
    },
    {
      title: 'Debugging Methodology — Systematic Root Cause Analysis',
      content: `DEBUGGING METHODOLOGY — SYSTEMATIC APPROACH:

THE DEBUGGING FLOWCHART:
1. REPRODUCE: Can you trigger the bug consistently? If not, add logging and wait for it to happen again. Intermittent bugs need more data before fixing.
2. ISOLATE: What's the smallest code path that reproduces the bug? Comment out code, use binary search. Remove components until you find the minimal reproduction.
3. UNDERSTAND: Read the error message. Really read it. 80% of bugs are explained by the error message + stack trace. Look at the line number. Look at the function name. Look at the values.
4. HYPOTHESIZE: Form a theory. "I think the bug is because X is null when Y expects it to be defined."
5. TEST: Verify your hypothesis with a targeted experiment. Add a console.log/print before the suspected line. Check the value. Was your hypothesis right?
6. FIX: Apply the minimum change that fixes the root cause, not the symptom.
7. VERIFY: Does the fix work? Did it break anything else? Run the test suite.

COMMON BUG CATEGORIES:
- Off-by-one errors: Array indices, loop boundaries, date calculations. Check: is it < or <=?
- Null/undefined: The #1 runtime error in JavaScript. Use optional chaining (?.), nullish coalescing (??), and strict null checks.
- Race conditions: Two async operations compete. Fix with locks, queues, or atomic operations. Symptoms: works sometimes, fails under load.
- State mutations: Shared mutable state modified in unexpected order. Fix with immutability or clear ownership.
- Type coercion: JavaScript's == vs ===, Python's truthy/falsy, implicit type conversions. Always use strict equality.

DEBUGGING TOOLS BY LANGUAGE:
- JavaScript: Chrome DevTools (breakpoints, network tab, console), VS Code debugger, console.log with JSON.stringify for objects.
- Python: pdb (breakpoint()), print with f-strings, VS Code debugger, ipdb for enhanced REPL.
- Java: IntelliJ debugger, jstack for thread dumps, VisualVM for memory.
- General: git bisect to find the commit that introduced the bug. Binary search through commit history.

RUBBER DUCK DEBUGGING: Explain the problem out loud, line by line, to anyone or anything. The act of articulating forces you to notice assumptions you skipped over mentally. This works because bugs live in the gap between what you think the code does and what it actually does.`
    },
    {
      title: 'Database Fundamentals — SQL, NoSQL, and When to Use Each',
      content: `DATABASE SELECTION GUIDE:

RELATIONAL (SQL) — PostgreSQL, MySQL, SQLite:
Best for: Structured data with relationships, transactions (ACID), complex queries, reporting.
Use when: You need JOINs, strong consistency, complex WHERE clauses, financial data, user accounts.
PostgreSQL advantages: JSON/JSONB support (best of both worlds), full-text search, extensions (pgvector for embeddings, PostGIS for geo), CTEs, window functions, LISTEN/NOTIFY for real-time.
Key patterns: Normalize to 3NF for write-heavy, denormalize for read-heavy. Use indexes on frequently queried columns. EXPLAIN ANALYZE before optimizing.

DOCUMENT (NoSQL) — MongoDB, Firestore:
Best for: Flexible schemas, nested/hierarchical data, rapid prototyping, content management.
Use when: Schema changes frequently, data is naturally document-shaped, you don't need complex joins.
Anti-patterns: Don't use for financial transactions, don't embed data that changes independently, don't store relational data in documents.

KEY-VALUE — Redis, DynamoDB:
Best for: Caching, sessions, real-time leaderboards, rate limiting, pub/sub.
Redis patterns: Cache-aside (check cache → miss → query DB → store in cache → return), session storage, job queues (Bull/BullMQ), rate limiting with INCR + EXPIRE.
DynamoDB: Serverless, scales infinitely, pay-per-request. Design around access patterns, not entities.

INDEXING ESSENTIALS:
- B-tree index (default): Great for equality and range queries. Most common.
- Hash index: Equality only, faster than B-tree for exact matches.
- GIN index: Full-text search, JSONB queries, array containment.
- Composite index: (col_a, col_b) — order matters. Leftmost prefix rule.
- Partial index: WHERE clause on index. Index only active users, not all 10M rows.
- Rule of thumb: Index columns in WHERE, JOIN, ORDER BY. Don't index columns with low cardinality (boolean) or tables with <1000 rows.

QUERY OPTIMIZATION:
- SELECT only columns you need, never SELECT *.
- Use LIMIT for pagination, not fetching all rows.
- Avoid N+1 queries: use JOIN or batch loading (DataLoader pattern).
- Use connection pooling (PgBouncer, Prisma connection pool) in production.
- Monitor slow queries: pg_stat_statements (Postgres), slow_query_log (MySQL).`
    },
  ],

  'research-synthesis': [
    {
      title: 'Systematic Review Methodology — PRISMA 2020 Protocol',
      content: `SYSTEMATIC REVIEW METHODOLOGY — PRISMA 2020:

PRISMA (Preferred Reporting Items for Systematic Reviews and Meta-Analyses) is the gold standard protocol for conducting and reporting systematic reviews. Updated in 2020 from the original 2009 guidelines.

STEP 1 — RESEARCH QUESTION (PICO Framework):
P (Population): Who are you studying?
I (Intervention): What treatment/exposure?
C (Comparison): What's the alternative?
O (Outcome): What are you measuring?
Example: "In adults with type 2 diabetes (P), does intermittent fasting (I) compared to caloric restriction (C) improve HbA1c levels (O)?"

STEP 2 — SEARCH STRATEGY:
- Search minimum 2 databases (PubMed + one other relevant database).
- Document exact search strings with Boolean operators: ("intermittent fasting" OR "time-restricted eating") AND ("type 2 diabetes" OR "T2DM") AND ("HbA1c" OR "glycemic control").
- Apply date filters, language filters, study type filters. Document all filters.
- Hand-search reference lists of included studies (backward citation chaining).
- Search grey literature: ClinicalTrials.gov, WHO ICTRP, conference proceedings, dissertations.

STEP 3 — SCREENING:
- Title/abstract screening: Two independent reviewers. Inter-rater reliability (Cohen's kappa > 0.7).
- Full-text screening: Apply inclusion/exclusion criteria. Document reasons for exclusion.
- PRISMA flow diagram: Records identified → duplicates removed → screened → excluded → assessed for eligibility → included.

STEP 4 — DATA EXTRACTION:
- Standardized extraction form: author, year, study design, sample size, population characteristics, intervention details, comparison, outcomes, follow-up period, funding source.
- Risk of bias assessment: Cochrane RoB 2 (for RCTs), ROBINS-I (for non-randomized studies), Newcastle-Ottawa Scale (for observational studies).

STEP 5 — SYNTHESIS:
- Narrative synthesis: Summarize findings thematically when studies are too heterogeneous for meta-analysis.
- Meta-analysis: Pool effect sizes using random-effects model (DerSimonian-Laird). Report: forest plot, I² heterogeneity statistic (>75% = high heterogeneity), funnel plot for publication bias.
- GRADE certainty: Rate evidence as High, Moderate, Low, or Very Low based on risk of bias, inconsistency, indirectness, imprecision, and publication bias.`
    },
    {
      title: 'Evidence Quality Assessment — Hierarchy and Bias Detection',
      content: `EVIDENCE QUALITY ASSESSMENT FRAMEWORK:

EVIDENCE HIERARCHY (strongest to weakest):
1. Systematic Reviews & Meta-Analyses of RCTs: Pooled data from multiple well-designed trials. Gold standard.
2. Randomized Controlled Trials (RCTs): Random assignment, control group, blinding. Strongest single-study design.
3. Cohort Studies (prospective): Follow a group over time, observe outcomes. Strong for long-term effects. No randomization.
4. Case-Control Studies: Compare cases (have outcome) vs controls (don't). Good for rare outcomes. Prone to recall bias.
5. Cross-Sectional Studies: Snapshot in time. Shows correlation, not causation. Quick and cheap.
6. Case Series/Case Reports: Individual patient descriptions. Hypothesis-generating only.
7. Expert Opinion/Editorial: Lowest evidence. Useful for emerging topics with no data.
8. Anecdotal/Testimonial: Not evidence. Useful for hypothesis generation only.

BIAS DETECTION CHECKLIST:
- Selection bias: Were groups comparable at baseline? Was randomization adequate?
- Performance bias: Were participants and personnel blinded? Could expectations influence outcomes?
- Detection bias: Were outcome assessors blinded? Could knowledge of group assignment influence measurement?
- Attrition bias: Was follow-up complete? Were dropouts >20%? Were reasons for dropout reported?
- Reporting bias: Were all pre-specified outcomes reported? Check trial registration (ClinicalTrials.gov) vs published results.
- Funding bias: Industry-funded studies report positive results more often (Lundh et al., 2017, Cochrane). Always check funding source and author conflicts of interest.
- Publication bias: Positive results are published more than negative/null results. Look for funnel plot asymmetry. Check for unpublished trials in trial registries.

CRITICAL APPRAISAL QUESTIONS:
- Sample size: Was it powered to detect a meaningful effect? Underpowered studies can miss real effects.
- Effect size vs statistical significance: A p-value of 0.001 with an effect size of 0.05 is statistically significant but practically meaningless.
- Confidence intervals: Narrow = precise estimate. Wide = uncertain. If the CI crosses zero (or the null value), the result is not statistically significant regardless of p-value.
- Generalizability: Does the study population match the population you care about? University students ≠ general population.
- Replication: Has this been replicated independently? If not, treat with caution regardless of the original study's quality.`
    },
    {
      title: 'Research-to-Practice Translation — Making Evidence Actionable',
      content: `RESEARCH-TO-PRACTICE TRANSLATION FRAMEWORK:

THE TRANSLATION GAP:
Average time from research finding to clinical practice: 17 years (Balas & Boren, 2000; Morris et al., 2011). In business: similar delays. Most published research never reaches practitioners. Your job is to bridge this gap.

TRANSLATION STEPS:
1. FIND THE SIGNAL: Not all research is worth translating. Look for: large effect sizes, consistent findings across studies, practical interventions, relevant populations.
2. ASSESS READINESS: Is the evidence strong enough to act on? Use the GRADE framework. "High" and "Moderate" certainty = act. "Low" = consider with caveats. "Very Low" = interesting but not actionable yet.
3. CONTEXTUALIZE: How does this apply to the user's specific situation? Adjust for their industry, scale, resources, and constraints.
4. OPERATIONALIZE: Convert findings into specific, measurable actions. Not "exercise improves cognition" but "25 minutes of moderate-intensity walking, 3x/week, improves working memory by 15% within 6 weeks."
5. IMPLEMENT: Create checklists, protocols, or decision frameworks. Make the evidence easy to follow without needing to read the paper.
6. MEASURE: Define success metrics. How will you know the evidence-based change worked?

OUTPUT FORMATS FOR TRANSLATION:
- Evidence Brief: 1-page summary. Finding, strength of evidence, practical implication, action steps. For executives and decision-makers.
- Practice Protocol: Step-by-step procedure derived from evidence. For practitioners and operators.
- Decision Matrix: When evidence supports multiple options, create a matrix comparing options by effectiveness, cost, feasibility, and risk.
- Evidence Map: Visual landscape of what's known, what's uncertain, and where gaps exist in a topic area.

COMMON TRANSLATION MISTAKES:
- Oversimplifying: "This study says X works" when the study had 47 caveats and specific conditions.
- Cherry-picking: Selecting one favorable study while ignoring contradictory evidence.
- Confusing correlation with causation: "Countries that eat more chocolate win more Nobel Prizes" ≠ "Eat chocolate to get smarter."
- Ignoring context: A study in Japanese adults over 65 may not apply to American teenagers.
- Treating preliminary findings as settled science: One preprint is a hypothesis, not a conclusion.`
    },
  ],

  'digital-marketing-strategist': [
    {
      title: 'Paid Advertising Campaign Architecture — Meta, Google, TikTok',
      content: `PAID ADVERTISING CAMPAIGN ARCHITECTURE (2025-2026):

META (FACEBOOK/INSTAGRAM) ADS:
Campaign structure: Campaign (objective) → Ad Set (audience, budget, placement) → Ad (creative).
Objectives by funnel stage:
- TOFU (awareness): Brand Awareness, Reach
- MOFU (consideration): Traffic, Engagement, Video Views, Lead Generation
- BOFU (conversion): Conversions, Catalog Sales, Store Visits
Best practice: Start with Advantage+ Shopping Campaigns (ASC) for e-commerce. Let Meta's AI optimize audience and placement. Manual targeting for B2B or niche audiences.

Budget allocation:
- Testing: $20-50/day per ad set. Test 3-5 creatives per ad set. Kill below-average performers after 1,000 impressions or $50 spent (whichever comes first).
- Scaling: Increase budget by 20% every 3 days on winning ad sets. Going from $50 to $500 overnight kills performance.
- Retargeting: 20-30% of total budget. Website visitors (7, 14, 30 day windows), video viewers (50%, 75%, 95%), engagement audiences.

GOOGLE ADS:
- Search: High intent, expensive. Target bottom-of-funnel keywords. Use exact match and phrase match. Broad match only with Smart Bidding.
- Performance Max (PMax): AI-driven, all placements (Search, Display, YouTube, Discover, Maps, Gmail). Feed it conversion data + creative assets.
- YouTube: $0.03-0.10 per view. Pre-roll (skippable after 5s) for awareness. In-feed for consideration. Hook in first 5 seconds or lose them.

TIKTOK ADS:
- Creative IS the targeting on TikTok. The algorithm finds your audience based on who engages with your content.
- Spark Ads: Boost organic posts as ads. 30-50% better performance than traditional ads because they look native.
- Budget: $20-50/day minimum per ad group. TikTok's algorithm needs data to optimize.
- Creative best practices: UGC-style, vertical (9:16), text overlays, trending sounds, first 2 seconds = hook.

UNIVERSAL METRICS:
- CPC (Cost Per Click): Search $1-5, Social $0.50-2.00
- CPM (Cost Per 1,000 Impressions): $5-15 average
- CTR (Click-Through Rate): Search 3-5%, Social 1-2%, Display 0.5-1%
- ROAS (Return on Ad Spend): Target 3x minimum for e-commerce, 5x+ for mature campaigns
- CAC (Customer Acquisition Cost): Must be < Customer Lifetime Value / 3 for sustainability`
    },
    {
      title: 'Content Marketing Systems — Pillar Strategy and Repurposing',
      content: `CONTENT MARKETING SYSTEMS (2025-2026):

CONTENT PILLAR STRATEGY:
Define 3-5 content pillars that align with your expertise, audience pain points, and business goals. Every piece of content maps to a pillar. This prevents random content and builds topical authority.

Example for a B2B SaaS:
- Pillar 1: Product education (how-to, tutorials, feature demos)
- Pillar 2: Industry insights (trends, data, predictions)
- Pillar 3: Customer success (case studies, testimonials, results)
- Pillar 4: Thought leadership (founder POV, contrarian takes, vision)
- Pillar 5: Culture/hiring (team, values, behind-the-scenes)

Ratio: 40% education, 25% insights, 20% customer proof, 10% thought leadership, 5% culture.

CONTENT REPURPOSING FRAMEWORK (1 → 10):
Start with ONE long-form piece (blog post, podcast episode, or video). Extract:
1. Blog post / article (1,500-3,000 words)
2. LinkedIn article or carousel (key insights, 8-12 slides)
3. Twitter/X thread (8-12 tweets, each a standalone insight)
4. Instagram carousel (5-10 slides, visual + text)
5. TikTok/Reels (30-60 second key takeaway, talking head or text-overlay)
6. YouTube Short (same content, different hook)
7. Email newsletter section (250-word summary + link)
8. Podcast talking point (discuss the topic on your next episode)
9. Quote graphics (3-5 pull quotes for Stories/feed)
10. Community post (share in Discord/Slack/forum with discussion prompt)

EDITORIAL CALENDAR:
- Plan 4 weeks ahead. Batch content creation days (writing Tuesday, filming Wednesday).
- Map content to business goals: launching a feature → education content, raising a round → thought leadership, hiring → culture content.
- Seasonal and event hooks: plan around industry events, holidays, trending topics.
- Tools: Notion, Airtable, or Google Sheets. Track: topic, pillar, format, platform, publish date, status, performance.

SEO CONTENT STRATEGY:
- Target keywords with 100-10,000 monthly searches and low-medium competition (Keyword Difficulty <40 in Ahrefs/Semrush).
- Hub-and-spoke model: 1 pillar page (2,500+ words, broad topic) → 5-10 cluster pages (1,000-1,500 words, specific subtopics) → internal links between them.
- Update existing content quarterly. Google rewards freshness. Adding 200-500 words + updated stats can boost rankings.`
    },
    {
      title: 'Marketing Analytics and Attribution Modeling',
      content: `MARKETING ANALYTICS & ATTRIBUTION (2025-2026):

KEY METRICS BY CHANNEL:
Email: Open rate (target: 20-30%), CTR (2-5%), conversion rate (1-3%), unsubscribe rate (<0.5%), revenue per email.
Social organic: Engagement rate (3-6% good, >6% excellent), follower growth rate (2-5%/month), saves/shares (highest-value engagement), link clicks.
Paid ads: ROAS, CPA/CAC, CTR, conversion rate, frequency (>3 = ad fatigue).
SEO: Organic traffic growth, keyword rankings, click-through rate from SERPs, time on page, pages per session.
Overall: Customer Lifetime Value (LTV), Customer Acquisition Cost (CAC), LTV:CAC ratio (target 3:1+), payback period (months to recoup CAC).

ATTRIBUTION MODELS:
- Last-click (default in most tools): 100% credit to last touchpoint before conversion. Simple but ignores the journey.
- First-click: 100% credit to first touchpoint. Good for understanding top-of-funnel effectiveness.
- Linear: Equal credit to all touchpoints. Fair but unsophisticated.
- Time-decay: More credit to touchpoints closer to conversion. Reasonable for long sales cycles.
- Position-based (U-shaped): 40% to first touch, 40% to last touch, 20% distributed across middle. Good balance.
- Data-driven (Google Analytics 4): Machine learning assigns credit based on actual conversion patterns. Best model but needs sufficient conversion data (300+ conversions/month).

POST-IOS14/PRIVACY ERA:
- Cookie-based tracking is declining. First-party data is essential.
- Server-side tracking: Implement Conversions API (Meta CAPI), Google Enhanced Conversions. Send conversion data server-to-server, bypassing browser restrictions.
- UTM discipline: Every link gets UTM parameters. utm_source, utm_medium, utm_campaign, utm_content. Non-negotiable.
- Media mix modeling (MMM): Statistical model that correlates marketing spend with outcomes without individual user tracking. Requires 12+ months of data.
- Incrementality testing: Run geo-holdout tests. Show ads in region A, not in region B. Compare conversion rates. The difference = true incremental impact.

REPORTING CADENCE:
- Daily: Ad spend, ROAS, CPA (for active campaigns)
- Weekly: Channel performance summary, top/bottom content, budget pacing
- Monthly: Full funnel report, LTV:CAC, channel comparison, strategic recommendations
- Quarterly: Business impact report, attribution analysis, strategic pivots`
    },
  ],

  'lead-generation': [
    {
      title: 'ICP Development and Lead Scoring Framework',
      content: `ICP (IDEAL CUSTOMER PROFILE) & LEAD SCORING:

ICP DEVELOPMENT PROCESS:
1. Analyze your best 10-20 existing customers. What do they have in common?
2. Document firmographic criteria: industry, company size (employees/revenue), geography, tech stack, growth stage.
3. Document psychographic criteria: pain points, buying triggers, decision-making process, budget authority.
4. Create an ICP statement: "Our ideal customer is a [size] [industry] company in [geography] with [specific characteristic] that is experiencing [pain point] and has [budget/authority indicator]."

LEAD SCORING MODEL (Point-Based):
Demographic score (who they are, max 50 points):
- Job title matches buyer persona: +20
- Company size matches ICP: +15
- Industry matches ICP: +10
- Geographic fit: +5

Behavioral score (what they do, max 50 points):
- Visited pricing page: +15
- Downloaded lead magnet: +10
- Attended webinar: +10
- Opened 3+ emails: +5
- Replied to outreach: +20
- Visited careers page (not buying signal): -10
- Unsubscribed from emails: -20

Score thresholds:
- 0-30: Cold lead → nurture sequence
- 31-60: Warm lead → targeted content + soft CTA
- 61-80: Hot lead → sales outreach within 24 hours
- 81-100: Burning → immediate call, same-day follow-up

LEAD QUALIFICATION FRAMEWORKS:
BANT: Budget, Authority, Need, Timeline. Classic but rigid.
MEDDIC: Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion. Best for enterprise.
CHAMP: Challenges, Authority, Money, Prioritization. Leads with pain (more modern than BANT).

DATA ENRICHMENT TOOLS:
- Apollo.io ($49-99/mo): Contact data + engagement platform. Best all-in-one.
- ZoomInfo ($15K+/year): Enterprise-grade B2B data. Most comprehensive but expensive.
- Clearbit (now part of HubSpot): Real-time enrichment, company data, intent signals.
- LinkedIn Sales Navigator ($99/mo): People data, InMail credits, account alerts.
- Hunter.io ($49/mo): Email finding and verification. Lightweight and affordable.`
    },
    {
      title: 'Multi-Channel Outreach Sequences — Templates and Timing',
      content: `MULTI-CHANNEL OUTREACH SEQUENCES:

THE 14-DAY SEQUENCE (Cold → Warm):
Day 1: Email 1 — Personalized cold email. Reference something specific about their company/role. One sentence about your value prop. Soft CTA (reply or 15-min call).
Day 2: LinkedIn connection request — Personalized note (under 300 chars). Reference the email or a mutual connection.
Day 4: Email 2 — Follow up on email 1. Add a case study or social proof. "Companies like [similar company] saw [specific result]."
Day 6: LinkedIn engagement — Like/comment on their recent post. Genuine comment, not salesy.
Day 8: Email 3 — Different angle. Share a relevant article, insight, or data point. Position yourself as a resource, not a seller.
Day 10: LinkedIn DM — Short, direct. "Hey [Name], I sent you a couple of emails about [topic]. Worth a quick chat? [Calendly link]"
Day 12: Email 4 — Break-up email. "I don't want to clog your inbox. If [pain point] isn't a priority right now, I'll stop reaching out. But if it is, here's my calendar: [link]"
Day 14: Final LinkedIn touch — Voice note or video message (30 seconds). Personal, human, stands out.

COLD EMAIL TEMPLATES:

Template 1 — Pain-Agitate-Solve:
Subject: [Specific pain point] at [Company]?
Body: "Hi [Name], I noticed [Company] recently [trigger event — new hire, product launch, funding round]. Most [role]s at this stage struggle with [pain point]. We helped [similar company] solve this by [solution], resulting in [specific metric]. Worth a 15-minute chat this week? [Your name]"

Template 2 — Referral Approach:
Subject: [Mutual connection] suggested I reach out
Body: "Hi [Name], [Connection name] mentioned you might be interested in [topic]. We worked with [their company] on [project] and [result]. I'd love to share how we could do something similar at [Company]. Quick call this week? [Your name]"

Template 3 — Insight-Led:
Subject: Quick data point for [Company]
Body: "Hi [Name], I was researching [industry] and found that [surprising statistic or insight]. At [Your company], we've been working on [related solution] with companies like [social proof]. Thought this might be relevant as [Company] scales [specific area]. Open to a 15-min chat? [Your name]"

KEY METRICS TO TRACK:
- Email open rate: 40-60% (cold email, subject line dependent)
- Email reply rate: 5-15% (good), 15-25% (excellent)
- LinkedIn connection acceptance: 30-50%
- Meeting booked rate: 2-5% of total outreach (good for cold)
- Show-up rate: 70-85% (use reminders + pre-call content)
- Conversion to customer: 20-40% of meetings (qualified pipeline)`
    },
    {
      title: 'CRM Pipeline Management and Automation',
      content: `CRM PIPELINE MANAGEMENT & AUTOMATION:

PIPELINE STAGES (Standard B2B):
1. Lead (unqualified) → 2. Marketing Qualified Lead (MQL) → 3. Sales Qualified Lead (SQL) → 4. Discovery Call → 5. Proposal Sent → 6. Negotiation → 7. Closed-Won / Closed-Lost

PIPELINE METRICS:
- Pipeline velocity: (# deals × avg deal size × win rate) / avg sales cycle length
- Stage conversion rates: Track drop-off between each stage. If Discovery → Proposal is 80% but Proposal → Close is 20%, your proposals need work.
- Average deal size: Track over time. Should increase as you improve qualification.
- Sales cycle length: Measure in days. Target: reduce by 10% per quarter through better qualification and content.
- Pipeline coverage ratio: Pipeline value / quota = coverage. Target 3-4x quota in early pipeline.

CRM AUTOMATION RECIPES:
1. New lead → auto-assign to rep based on territory/round-robin → trigger welcome email → create task (follow up in 24 hrs).
2. Email opened 3x → auto-move to "engaged" → trigger Slack notification to rep → add to retargeting audience.
3. No activity 14 days → auto-send re-engagement email → if no response in 7 days → move to nurture sequence.
4. Deal stage changed to "Proposal" → auto-generate proposal template → assign task to manager for review → trigger reminder if no response in 5 days.
5. Closed-Won → trigger onboarding workflow → send NPS survey at 30/60/90 days → add to referral request sequence at 90 days.
6. Closed-Lost → trigger loss reason survey → add to win-back sequence (6-month delay) → update ICP scoring based on loss patterns.

CRM TOOL COMPARISON (2025):
- HubSpot Free CRM: Best free option. Contact management, deal tracking, email integration. Paid tiers ($45-1,200/mo) for automation.
- Salesforce: Enterprise standard. Highly customizable. Expensive ($25-300/user/mo). Overkill for <50 people.
- Pipedrive ($14-99/user/mo): Visual pipeline, sales-focused, easy to use. Best for small sales teams.
- Close CRM ($49-139/user/mo): Built-in calling and email. Best for high-volume outbound teams.
- GoHighLevel ($97-497/mo): All-in-one for agencies. CRM + funnel builder + email + SMS + automation. Best for lead gen agencies serving clients.

DATA HYGIENE:
- Deduplicate monthly. Merge records, not delete.
- Enrich contacts quarterly with fresh data (job changes, company growth).
- Archive inactive leads (no engagement 12+ months) to keep pipeline clean.
- Standardize fields: dropdowns not free text for company size, industry, source.`
    },
  ],

  'brand-building': [
    {
      title: 'Brand Voice Development — From Values to Copy',
      content: `BRAND VOICE DEVELOPMENT FRAMEWORK:

STEP 1 — DEFINE BRAND PERSONALITY (Pick 3-5 Adjectives):
Your brand personality should feel like a person you'd want to talk to. Pick adjectives from different dimensions:
- Tone: professional, casual, playful, authoritative, warm, edgy, sophisticated
- Energy: bold, calm, energetic, grounded, provocative, understated
- Attitude: confident, humble, rebellious, nurturing, aspirational, relatable

Example brand personalities:
- Nike: Bold, Inspiring, Direct, Competitive
- Mailchimp: Playful, Helpful, Clear, Witty
- Patagonia: Authentic, Purposeful, Adventurous, Grounded

STEP 2 — CREATE VOICE GUIDELINES ("We are / We are not"):
We ARE: Confident but not arrogant. Helpful but not condescending. Witty but not sarcastic.
We ARE NOT: Corporate, stiff, jargon-heavy, passive, vague.

STEP 3 — VOCABULARY RULES:
- Words we use: partner (not vendor), build (not implement), people (not resources), invest (not spend)
- Words we avoid: synergy, leverage, disruption, thought leader, guru, rockstar
- Sentence style: Short sentences. Active voice. Contractions are fine (we're, you'll). No semicolons in marketing copy.

STEP 4 — TONE CALIBRATION BY CONTEXT:
Social media: 80% personality, 20% information. Casual, conversational, emoji OK.
Website homepage: 70% aspiration, 30% proof. Clear value proposition, social proof, CTA.
Customer support: 90% helpful, 10% personality. Empathetic, solution-focused, human.
Legal/terms: 100% clear, 0% personality. Plain language. No ambiguity.
Error messages: Helpful, not cute. "We couldn't process your payment. Please try again or use a different card." NOT "Oopsie! Something went wrong."

STEP 5 — DOCUMENT AND DISTRIBUTE:
Create a 2-page voice guide: brand personality, voice attributes (with examples), do/don't list, tone calibration chart. Share with every person who writes for the brand. Review quarterly.

TESTING YOUR VOICE:
- Cover test: Remove your logo from a piece of content. Could someone identify it as yours? If yes, your voice is strong.
- Competitor swap: Could a competitor use this exact copy? If yes, it's too generic. Your voice should be uniquely yours.
- Read aloud test: Does it sound like a real person talking? If it sounds like a committee wrote it, rewrite.`
    },
    {
      title: 'Visual Identity System — Color, Typography, Logo Guidelines',
      content: `VISUAL IDENTITY SYSTEM:

COLOR PSYCHOLOGY IN BRANDING:
- Blue: Trust, stability, professionalism. Finance, tech, healthcare. (Chase, IBM, Pfizer)
- Red: Energy, urgency, passion. Food, entertainment, retail. (Coca-Cola, Netflix, Target)
- Green: Growth, health, sustainability. Wellness, finance, eco. (Whole Foods, Robinhood, Spotify)
- Yellow: Optimism, warmth, attention. Caution, youth. (McDonald's, Snapchat, Bumble)
- Purple: Luxury, creativity, wisdom. Premium, beauty, tech. (Cadbury, Twitch, Hallmark)
- Orange: Enthusiasm, confidence, affordable luxury. (Hermès, Fanta, SoundCloud)
- Black: Sophistication, power, luxury. Fashion, tech, premium. (Chanel, Apple, Nike)
- White: Simplicity, cleanliness, minimalism. Tech, healthcare. (Apple, Tesla)

COLOR SYSTEM STRUCTURE:
- Primary color: 1 main brand color (60% of visual usage)
- Secondary color: 1 complementary color (30% of visual usage)
- Accent color: 1 high-contrast color for CTAs, highlights (10% of visual usage)
- Neutrals: Black, white, grays for text and backgrounds
- Semantic colors: Green (success), red (error), yellow (warning), blue (info)
- Accessibility: All text must meet WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)

TYPOGRAPHY:
- Heading font: Choose one with personality (serif for authority/tradition, sans-serif for modern/clean, display for creative/bold)
- Body font: Prioritize readability. Sans-serif works for most digital applications. 16px minimum for body text on web.
- Font pairing rules: Contrast (serif heading + sans-serif body), don't use more than 2-3 fonts total, ensure both fonts have the weights you need (regular, bold, italic minimum).
- Popular pairings: Playfair Display + Source Sans Pro, Montserrat + Merriweather, Inter + Lora

LOGO GUIDELINES:
- Minimum clear space: Height of the logo "x" on all sides
- Minimum size: Define the smallest acceptable reproduction (usually 24px height for digital, 0.5" for print)
- Color variations: Full color, single color (black), reversed (white on dark), grayscale
- Don'ts: Never stretch, rotate, change colors, add effects, place on clashing backgrounds, crop
- File formats: SVG (web, scalable), PNG (digital, transparent background), EPS/AI (print), favicon (ICO, 32x32 and 16x16)

BRAND ASSET TOOLKIT:
Minimum viable brand kit: Logo (all variations), color palette (hex, RGB, CMYK values), typography (font files + usage rules), icon style, photography/illustration style guide, business card template, social media templates, email signature template.`
    },
    {
      title: 'Brand Storytelling — Narrative Frameworks for Business',
      content: `BRAND STORYTELLING FRAMEWORKS:

WHY STORIES WORK:
Stories activate 7x more brain regions than facts alone (Zak, 2015, Harvard Business Review). Customers remember stories 22x better than facts (Stanford research). Brands with strong narratives command 20-30% price premiums over feature-equivalent competitors.

THE BRAND ORIGIN STORY (3 Acts):
Act 1 — The Problem: What frustration or injustice did the founder experience? Be specific and emotional. "I spent 3 months trying to find a reliable [service] and got burned by 4 different providers."
Act 2 — The Moment: What was the turning point? "I realized that if I was struggling with this, thousands of others were too."
Act 3 — The Mission: What did you decide to do about it? "So I built [Brand] to ensure nobody has to go through what I did."

Rules: Be vulnerable (share real failures). Be specific (dates, numbers, names). Be brief (60-90 seconds spoken, 200-300 words written).

THE CUSTOMER HERO STORY:
Your customer is the hero. Your brand is the guide (Storybrand framework by Donald Miller).
1. Hero (customer) has a problem
2. They meet a guide (your brand) who understands their pain
3. The guide gives them a plan
4. The guide calls them to action
5. The hero avoids failure
6. The hero achieves success

Example: "[Customer name] was losing $5K/month to inefficient [process]. They started using [Brand] and within 60 days, they'd recovered the losses and grown revenue by 30%."

CONTENT STORYTELLING FORMATS:
- Before/After/Bridge: Show the before state, show the after state, explain the bridge (your product/service).
- Problem/Agitate/Solve: Name the problem, agitate the pain (what happens if they don't fix it), present your solution.
- Contrast: "Most brands do X. We do Y. Here's why that matters."
- Behind-the-scenes: Show the messy reality of building something. Audiences connect with authenticity more than perfection.
- Milestone stories: "We just hit [milestone]. Here's what we learned along the way." Transparent, relatable, builds trust.

STORYTELLING MISTAKES:
- Making your brand the hero (your customer is the hero, you're the guide)
- Starting with features instead of feelings
- Being too polished (authenticity > perfection)
- No conflict (conflict creates tension, tension creates engagement)
- No specifics (vague stories are forgettable stories)`
    },
  ],

  'enterprise-implementation': [
    {
      title: 'Enterprise Change Management — Driving AI Adoption',
      content: `ENTERPRISE CHANGE MANAGEMENT FOR AI ADOPTION:

WHY AI IMPLEMENTATIONS FAIL:
- 70% of digital transformation initiatives fail (McKinsey, 2023). The #1 reason: people, not technology.
- Employees resist AI because of fear (job replacement), confusion (unclear benefits), or friction (harder than current workflow).
- Success requires managing the human side as rigorously as the technical side.

ADKAR MODEL (Prosci):
A — Awareness: Why is this change happening? Communicate the business case. "We're implementing AI agents to eliminate repetitive tasks so you can focus on high-value work."
D — Desire: What's in it for me? Personal benefits, not just organizational ones. "You'll spend 40% less time on data entry and more time on strategy."
K — Knowledge: How do I use it? Role-specific training, not generic demos. Show each person exactly how AI fits their daily workflow.
A — Ability: Can I actually do it? Hands-on practice with real tasks. Buddy system with early adopters. Dedicated support during transition.
R — Reinforcement: Is it worth continuing? Celebrate early wins publicly. Measure and share results. Remove the option to revert to old processes once adoption is proven.

IMPLEMENTATION TIMELINE (Enterprise, 100+ Users):
Weeks 1-2: Executive alignment + stakeholder interviews + technology audit
Weeks 3-4: Architecture design + pilot user selection + training material development
Weeks 5-8: Pilot deployment (5-10% of users) + daily feedback loops + rapid iteration
Weeks 9-16: Phased rollout (department by department, 2 weeks per department)
Weeks 17-20: Full deployment + optimization + advanced workflow training
Ongoing: Monthly reviews, quarterly optimization, continuous training for new hires

RESISTANCE MANAGEMENT:
- Vocal resistors: Engage directly. Understand their concern. Give them a role in shaping the implementation (advisory board).
- Silent resistors: Monitor usage data. Low adoption ≠ agreement. Reach out proactively.
- Champions: Identify early adopters. Give them visibility, recognition, and resources. They sell the change peer-to-peer better than any executive memo.

ADOPTION METRICS:
- Daily Active Usage Rate: Target 70%+ by month 3
- Feature utilization depth: Are users using basic or advanced features?
- Time-to-value: How quickly do new users complete their first meaningful task?
- NPS (Net Promoter Score): Survey users monthly. Target >30 by month 3.
- Productivity impact: Before/after metrics on specific workflows (tickets resolved, reports generated, emails drafted).`
    },
    {
      title: 'Enterprise Security and Compliance Requirements',
      content: `ENTERPRISE SECURITY & COMPLIANCE FOR AI PLATFORMS:

ENTERPRISE BUYER SECURITY CHECKLIST (What CISOs Ask):
1. Data residency: Where is data stored? Can we keep it in our region (US, EU, APAC)?
2. Data encryption: At rest (AES-256) and in transit (TLS 1.3). Key management (customer-managed keys preferred).
3. Access controls: SSO (SAML 2.0 / OIDC), RBAC (role-based access control), MFA enforcement, IP allowlisting.
4. Audit logging: Who accessed what, when, from where. Immutable logs. Retention period (1+ year).
5. Data processing agreement (DPA): GDPR Article 28 compliant. Sub-processor list. Data deletion on termination.
6. Penetration test report: Annual third-party pentest. Share results or summary.
7. SOC 2 Type II: The minimum bar for enterprise SaaS. Covers security, availability, processing integrity, confidentiality, privacy.
8. Business continuity: RTO (Recovery Time Objective) and RPO (Recovery Point Objective). What happens during an outage?
9. Incident response: Documented procedure. Notification timeline (72 hours for GDPR, varies by regulation).
10. AI-specific: Model training data handling, prompt injection protections, output filtering, no customer data used for model training.

SSO INTEGRATION REQUIREMENTS:
- SAML 2.0: Standard for enterprise. Support IdPs: Okta, Azure AD, OneLogin, Ping Identity.
- OIDC (OpenID Connect): Modern alternative. Easier to implement. Google Workspace, Auth0, Keycloak.
- SCIM (System for Cross-domain Identity Management): Automated user provisioning/deprovisioning. Required for large orgs (auto-create accounts when someone joins, auto-disable when they leave).
- JIT (Just-In-Time) provisioning: Create accounts on first login. Lower maintenance than manual provisioning.

COMPLIANCE FRAMEWORKS BY INDUSTRY:
- Healthcare: HIPAA (BAA required), HITRUST CSF (certification takes 6-12 months).
- Finance: SOX (public companies), PCI-DSS (payment data), AML/KYC (anti-money laundering).
- Government: FedRAMP (US federal), ITAR (defense), StateRAMP (state/local).
- Education: FERPA (student data), COPPA (children under 13).
- General: GDPR (EU data), CCPA/CPRA (California), SOC 2 (universal SaaS standard).

PRICING FOR ENTERPRISE:
- Enterprise tier: Typically 2-5x the highest self-serve tier.
- Seat-based: $50-200/user/month for AI platforms.
- Include: SSO, RBAC, dedicated support, custom SLAs, implementation support, training.
- Annual contracts preferred (discounted 10-20% vs monthly).
- Custom pricing for 500+ seats.`
    },
    {
      title: 'Multi-Department AI Workflow Design',
      content: `MULTI-DEPARTMENT AI WORKFLOW DESIGN:

DEPARTMENT-SPECIFIC AI AGENT MAPPING:
Assign specific AI agents to each department based on their core workflows. This prevents overwhelm and ensures relevant adoption.

MARKETING DEPARTMENT:
- Primary agents: Digital Marketing Strategist, Writing & Editing Coach, Video Content Strategist
- Key workflows: Content calendar generation, ad copy creation, campaign analysis, competitor monitoring
- Quick win: Automated weekly content briefs → saves 3-5 hrs/week per marketer

SALES DEPARTMENT:
- Primary agents: Lead Generation Agency, General Coding Assistant (for CRM automation)
- Key workflows: Email sequence generation, prospect research, proposal drafting, objection handling scripts
- Quick win: AI-generated personalized outreach emails → doubles reply rates in week 1

ENGINEERING DEPARTMENT:
- Primary agents: General Coding Assistant, Research Synthesis Engine
- Key workflows: Code review assistance, documentation generation, bug triage, architecture research
- Quick win: Automated code documentation → saves 5+ hrs/week per engineer

OPERATIONS/HR:
- Primary agents: HR & People Operations Coach, Compliance Agent, Project Management Coach
- Key workflows: Policy drafting, job description generation, onboarding checklists, compliance audits
- Quick win: AI-generated job descriptions from brief inputs → cuts posting time from 2 hours to 15 minutes

FINANCE:
- Primary agents: Personal Finance Advisor (adapted for business), Compliance Agent
- Key workflows: Report summarization, variance analysis narratives, policy compliance checks
- Quick win: Automated expense report narratives → saves 2-3 hrs/week per analyst

CROSS-DEPARTMENT WORKFLOWS:
1. Product Launch: Marketing (content) + Sales (enablement) + Engineering (docs) working with coordinated AI agents
2. Quarterly Business Review: Finance (data summaries) + Marketing (campaign results) + Sales (pipeline analysis)
3. New Hire Onboarding: HR (paperwork) + IT (access setup) + Manager (training plan)

WORKFLOW OPTIMIZATION CHECKLIST:
- Map current workflow step by step (manual process)
- Identify steps that are repetitive, text-heavy, or template-based (AI candidates)
- Estimate time saved per step
- Design AI-assisted workflow (which agent, which prompt, what input, what output)
- Create prompt templates for each workflow step
- Train users on the specific workflow (not generic AI training)
- Measure: time saved, quality change, user satisfaction
- Iterate monthly based on usage data and feedback`
    },
  ],

  'dropshipping': [
    {
      title: 'Winning Product Research Framework — Validation Checklist',
      content: `WINNING PRODUCT RESEARCH FRAMEWORK (2025-2026):

PRODUCT VALIDATION CHECKLIST (Score Each 1-5, Need 30+ to Proceed):
1. Problem/Desire Score: Does it solve a clear problem or fulfill a strong desire? (Impulse buy potential)
2. Wow Factor: Would someone stop scrolling to look at this? (Visual appeal for ads)
3. Perceived Value: Can you sell it for 3-5x what it costs? (Margin potential)
4. Not in Local Stores: Hard to find at Walmart/Target/Amazon? (Avoids price comparison)
5. Lightweight & Small: Shipping under $5? (Keeps costs down, reduces damage claims)
6. Not Seasonal: Sells year-round? (Consistent revenue)
7. Broad Appeal: Large addressable market? (Scalability)
8. Ad Creatable: Can you make compelling video ads for it? (Marketing feasibility)

RESEARCH TOOLS:
- TikTok Creative Center: Search "TikTok Made Me Buy It" — see what's trending.
- AliExpress Dropshipping Center: Filter by orders, growth rate, 4+ star rating.
- Amazon Best Sellers / Movers & Shakers: Trending products with demand validation.
- Google Trends: Validate that interest is growing, not declining.
- Minea ($49/mo): Spy on competitors' ads across Facebook, TikTok, Pinterest. See which products are being scaled.
- AutoDS ($27/mo): Product research + price monitoring + auto-importing.
- EcomHunt ($29/mo): Curated winning products with profit calculations.

COMPETITION ANALYSIS:
- Search the product on Facebook Ad Library. If 10+ stores are running ads for it, it's validated but competitive.
- Search on AliExpress by orders. Top products have 10,000+ orders — the supply chain is proven.
- Check Amazon reviews: Read 1-star reviews to find pain points you can address in your marketing.
- Google the product: If page 1 is all dropshipping stores, the market is saturated. If it's mostly big brands, there's room to compete.

CATEGORY ANALYSIS (Profit Margins by Category):
- Pet products: 40-60% margins, passionate buyers, repeat purchases. Low returns.
- Beauty/skincare: 50-70% margins but higher return rates. Regulatory considerations.
- Home/kitchen gadgets: 40-55% margins, impulse buys, seasonal spikes.
- Phone accessories: 30-50% margins, huge volume, low brand loyalty. Very competitive.
- Baby products: 45-60% margins, safety concerns (liability risk), but parents spend freely.
- Fitness/wellness: 40-55% margins, strong desire-based selling, influencer-friendly.`
    },
    {
      title: 'Shopify Store Optimization — High-Converting Product Pages',
      content: `SHOPIFY STORE OPTIMIZATION (2025-2026):

PRODUCT PAGE CONVERSION FRAMEWORK:
The product page is where 70%+ of buying decisions happen. Optimize every element.

ABOVE THE FOLD (First screen, no scrolling):
1. Product images: 5-8 images minimum. Hero shot (product on white/clean background), lifestyle shot (product in use), scale shot (product next to common object), detail shot (close-up of quality), packaging shot.
2. Product title: Include the benefit, not just the name. "Ergonomic Laptop Stand — Reduce Neck Pain & Boost Productivity" not "Aluminum Laptop Stand."
3. Price: Show original price crossed out + sale price. Anchoring effect. "Was $59.99 → Now $29.99" triggers loss aversion.
4. Add to cart button: Large, high-contrast color (green, orange, or your accent color). "Add to Cart" or "Buy Now" — test both.
5. Trust badges: Secure checkout, money-back guarantee, free shipping threshold.

BELOW THE FOLD:
6. Video: Product demo or UGC testimonial. 30-60 seconds. Autoplay muted on mobile.
7. Benefits section: 3-5 benefits with icons. Focus on outcomes, not features. "Sleep better tonight" not "Memory foam mattress."
8. Social proof: Reviews (judge.me, Loox, or Stamped — import initial reviews from AliExpress). UGC photos. "12,847 happy customers."
9. FAQ section: Address the top 5 objections. Shipping time, return policy, sizing, materials, compatibility.
10. Urgency elements: "Only 7 left in stock," "Sale ends Sunday," countdown timer (use sparingly — overuse kills trust).

CHECKOUT OPTIMIZATION:
- One-page checkout (Shopify's default): Don't add unnecessary steps.
- Express checkout: Shop Pay, Apple Pay, Google Pay. Reduces friction by 40%.
- Cart upsell: "Customers also bought..." or "Add [accessory] for $9.99." AOV (Average Order Value) boost of 15-25%.
- Abandon cart recovery: 3-email sequence. Email 1 (1 hour): "You forgot something!" Email 2 (24 hours): Add social proof + urgency. Email 3 (48 hours): Offer 10% discount. Recovery rate: 5-15% of abandoned carts.

MOBILE OPTIMIZATION (75%+ of traffic is mobile):
- Test every page on a phone before launching.
- Thumb-friendly buttons (44px minimum height).
- Image loading speed: Compress to <200KB each. Use WebP format.
- Sticky add-to-cart button on mobile (follows as user scrolls).
- Page load speed: Under 3 seconds. Use PageSpeed Insights. Every extra second costs 7% in conversions.`
    },
    {
      title: 'Facebook and TikTok Ad Strategy for Dropshipping',
      content: `FACEBOOK & TIKTOK AD STRATEGY FOR DROPSHIPPING (2025-2026):

FACEBOOK/META ADS — TESTING PHASE:
Campaign structure: 1 CBO (Campaign Budget Optimization) campaign → 3-5 ad sets (different audiences) → 3-5 creatives per ad set.

Audience testing:
- Interest targeting: 3-5 ad sets with different interest stacks. Each ad set = 2-3 related interests. Total audience size: 5-20M per ad set.
- Lookalike audiences (after 50+ purchases): 1% LAL of purchasers = best performing. 2-5% for scale.
- Broad targeting (Advantage+): No interests, no demographics. Let Meta's algorithm find buyers. Works best with strong creative and 100+ conversions in the account.

Budget: $20-30/day per ad set for testing. Run for 3-5 days before making decisions. Need 1,000+ impressions per creative minimum.

Kill criteria: If CPA > selling price × 0.33 after $50 spent, kill the ad set. If CTR < 1%, the creative isn't working. If CPM > $30, the audience is too competitive.

CREATIVE FRAMEWORK:
- Hook (0-3 seconds): Text overlay with pain point + attention-grabbing visual. "This changed how I sleep forever."
- Demo (3-15 seconds): Show the product in action. Close-up + wide shot.
- Social proof (15-20 seconds): Customer testimonial, review screenshot, or before/after.
- CTA (20-25 seconds): "Get yours today — link in bio" or "50% off — limited time."
- Format: 9:16 vertical for all placements. Reels + Stories + Feed in one ad set (Advantage+ placements).

TIKTOK ADS — NATIVE-FIRST APPROACH:
- TikTok ads that look like ads fail. Ads that look like organic TikToks win.
- Use Spark Ads: Post organically first, then boost top performers as ads.
- Creator partnerships: Send product to 10-20 micro-creators ($50-200 per video). Use their content as ads.
- Sound: Use trending sounds when possible. Original voiceover for explanation-style content.

SCALING PLAYBOOK:
Phase 1 ($50-100/day): Test products and creatives. Find 1-2 winning products.
Phase 2 ($100-500/day): Scale winning ad sets by 20% every 3 days. Add lookalike audiences.
Phase 3 ($500-2,000/day): Diversify platforms (Facebook + TikTok + Google Shopping). Retargeting at 20-30% of budget. Start testing email/SMS for repeat purchases.
Phase 4 ($2,000+/day): Consider transitioning to branded/private label. Negotiate better supplier pricing at volume. Build a real brand, not just a product store.`
    },
  ],

  'compliance-agent': [
    {
      title: 'SOC 2 Type II Compliance — Implementation Roadmap',
      content: `SOC 2 TYPE II COMPLIANCE ROADMAP:

WHAT IS SOC 2:
SOC 2 (Service Organization Control 2) is an auditing standard developed by AICPA for service providers storing customer data in the cloud. Type I = controls at a point in time. Type II = controls over a period (3-12 months). Enterprise customers increasingly require SOC 2 Type II.

TRUST SERVICE CRITERIA (TSC):
1. Security (Common Criteria, CC): Required. Firewall, access controls, intrusion detection, incident response.
2. Availability: System uptime commitments, disaster recovery, monitoring. Required if you have SLA commitments.
3. Processing Integrity: Data processing is complete, valid, accurate, timely. Required for data-processing services.
4. Confidentiality: Data classified as confidential is protected. Required if you handle trade secrets, financial data, IP.
5. Privacy: PII handling aligns with the entity's privacy notice. Required if you collect personal data.

Most startups start with Security + Availability.

IMPLEMENTATION TIMELINE (6-12 Months):
Month 1-2: Gap assessment. Compare current controls vs SOC 2 requirements. Identify gaps.
Month 2-3: Policy development. Write/update: Information Security Policy, Access Control Policy, Change Management Policy, Incident Response Plan, Business Continuity Plan, Vendor Management Policy, Data Classification Policy, Acceptable Use Policy.
Month 3-4: Implement controls. Deploy: SSO + MFA, endpoint management (MDM), vulnerability scanning, log aggregation (SIEM), background checks, security awareness training.
Month 4-5: Evidence collection setup. Automate evidence gathering where possible. Tools: Vanta ($10K+/year), Drata ($10K+/year), Secureframe ($8K+/year), or manual (spreadsheets + screenshots — cheaper but painful).
Month 5-8: Observation period (Type II requires minimum 3 months, typically 6).
Month 8-9: Readiness assessment. Internal audit or pre-audit with your audit firm.
Month 9-10: Formal audit by CPA firm. Auditor reviews evidence, interviews staff, tests controls.
Month 10: Report issued. Share with customers under NDA.

COST ESTIMATES:
- Audit firm: $15K-50K (varies by company size and scope)
- Compliance automation platform: $8K-25K/year
- Internal effort: 200-500 hours (equivalent of 1 FTE for 3-6 months)
- Remediation costs: $10K-50K (depends on gap size — may need new tools, training, etc.)
- Total first-year cost: $50K-150K for a startup. $150K-500K for mid-market.
- Annual renewal: 60-70% of first-year cost (evidence collection + annual audit).`
    },
    {
      title: 'GDPR Compliance Checklist — Practical Implementation',
      content: `GDPR PRACTICAL IMPLEMENTATION CHECKLIST:

DATA MAPPING (Article 30 — Records of Processing Activities):
Step 1: Inventory every system that processes personal data.
Step 2: For each system, document: what data, whose data, why collected (lawful basis), who has access, where stored, how long retained, how protected.
Step 3: Map data flows between systems (CRM → email tool → analytics → backup).
Step 4: Identify third-party processors (sub-processors). Document each with a Data Processing Agreement.
Output: A living document (spreadsheet or compliance tool) updated quarterly.

LAWFUL BASIS (Article 6 — Pick ONE per Processing Activity):
1. Consent: Freely given, specific, informed, unambiguous. Must be as easy to withdraw as to give. NOT pre-ticked checkboxes.
2. Contract: Processing necessary to fulfill a contract with the individual (e.g., shipping an order needs their address).
3. Legal obligation: Required by law (tax records, employment law).
4. Vital interests: Life-or-death situations. Rarely applicable for businesses.
5. Public task: Public authorities only.
6. Legitimate interest: You have a business reason, balanced against the individual's rights. Requires a Legitimate Interest Assessment (LIA). Common for B2B marketing, fraud prevention, analytics.

INDIVIDUAL RIGHTS (Must Respond Within 30 Days):
- Right to access (SAR): Provide all data you hold on them. Free of charge.
- Right to rectification: Correct inaccurate data.
- Right to erasure ("right to be forgotten"): Delete their data unless you have a legal obligation to keep it.
- Right to restrict processing: Stop using data but don't delete it (during a dispute).
- Right to data portability: Provide data in machine-readable format (JSON/CSV).
- Right to object: Must stop processing for direct marketing immediately. Other purposes: balance against legitimate interests.

CONSENT MANAGEMENT:
- Cookie consent: Banner with accept/reject (not just "OK"). Granular categories (necessary, analytics, marketing, functional). No cookies set before consent except strictly necessary.
- Email marketing consent: Separate checkbox (not bundled with T&C acceptance). Record when, where, and what they consented to.
- Consent records: Store timestamp, IP address, version of privacy policy agreed to, specific consent text shown.

BREACH NOTIFICATION (Articles 33-34):
- Notify supervisory authority within 72 hours of becoming aware of a breach.
- Notify affected individuals "without undue delay" if high risk to their rights.
- Document: nature of breach, categories of data, approximate number affected, likely consequences, measures taken.
- Maintain a breach register even for breaches you decide don't require notification.`
    },
    {
      title: 'Risk Assessment Framework — Identifying and Mitigating Business Risks',
      content: `RISK ASSESSMENT FRAMEWORK:

RISK IDENTIFICATION METHODOLOGY:
1. Asset inventory: List all valuable assets (data, systems, intellectual property, people, processes).
2. Threat identification: For each asset, identify threats (external attacks, internal errors, natural disasters, regulatory changes, vendor failures).
3. Vulnerability assessment: For each threat, identify vulnerabilities that could be exploited.
4. Risk calculation: Risk = Likelihood (1-5) × Impact (1-5). Score 1-25.

RISK SCORING MATRIX:
Impact levels:
1 — Negligible: Minor inconvenience, no financial loss, no regulatory impact
2 — Minor: <$10K loss, minor operational disruption, informal regulatory inquiry
3 — Moderate: $10K-100K loss, significant operational disruption, formal regulatory investigation
4 — Major: $100K-1M loss, extended outage, regulatory action/fine, reputation damage
5 — Critical: >$1M loss, business-threatening, regulatory shutdown, significant legal liability

Likelihood levels:
1 — Rare: Once in 10+ years
2 — Unlikely: Once in 5-10 years
3 — Possible: Once in 1-5 years
4 — Likely: Once a year
5 — Almost certain: Multiple times per year

Risk rating:
1-5: Low (accept) → Monitor annually
6-12: Medium (mitigate) → Implement controls within 6 months
13-19: High (mitigate urgently) → Implement controls within 30 days
20-25: Critical (treat immediately) → Immediate action, escalate to executive team

RISK TREATMENT OPTIONS:
1. Avoid: Eliminate the activity that creates the risk (stop collecting certain data, exit a market).
2. Mitigate: Implement controls to reduce likelihood or impact (encryption, access controls, backups, training).
3. Transfer: Shift risk to a third party (insurance, contractual indemnification, outsourcing to a specialized provider).
4. Accept: Acknowledge and monitor the risk without additional controls. Document the rationale. Only acceptable for low-rated risks.

TOP 10 BUSINESS RISKS (2025-2026):
1. Data breach / cyber attack (ransomware, phishing)
2. Regulatory non-compliance (GDPR, CCPA, AI regulations)
3. Third-party/vendor failure (SaaS outage, supply chain disruption)
4. AI model risk (bias, hallucination, misuse, liability)
5. Intellectual property infringement
6. Key person dependency (bus factor)
7. Financial fraud (internal or external)
8. Business continuity (natural disaster, pandemic, infrastructure failure)
9. Reputational damage (social media crisis, negative press)
10. Contractual liability (SLA breaches, service failures)

CONTINUOUS MONITORING:
- Review risk register quarterly.
- Update after any incident, near-miss, or significant change.
- Report top risks to leadership monthly.
- Conduct tabletop exercises for critical risks annually (simulate the scenario and test response).`
    },
  ],
};

async function main() {
  await client.connect();
  console.log('Connected to database.\n');

  let totalInserted = 0;
  const report = [];

  for (const [slug, chunks] of Object.entries(CHUNKS)) {
    const agentId = AGENT_IDS[slug];
    if (!agentId) {
      console.error(`No agent ID for slug: ${slug}`);
      continue;
    }

    let inserted = 0;
    for (const chunk of chunks) {
      const id = crypto.randomUUID();
      try {
        await client.query(
          `INSERT INTO "AgentKnowledgeChunk" (id, "agentId", title, content, source, "createdAt")
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [id, agentId, chunk.title, chunk.content, 'seed-expansion-r2']
        );
        inserted++;
      } catch (err) {
        console.error(`Error inserting chunk for ${slug}: ${err.message}`);
      }
    }

    totalInserted += inserted;
    report.push({ agent: slug, chunks: inserted });
    console.log(`${slug}: ${inserted} chunks inserted`);
  }

  console.log(`\n=== SEED EXPANSION R2 COMPLETE ===`);
  console.log(`Total chunks inserted: ${totalInserted}`);
  console.log(`\nReport:`);
  report.forEach(r => console.log(`  ${r.agent}: ${r.chunks} chunks`));

  // Verify new counts
  const verify = await client.query(`
    SELECT a.name, a.slug, COUNT(ak.id)::int as cnt
    FROM "Agent" a
    LEFT JOIN "AgentKnowledgeChunk" ak ON ak."agentId" = a.id
    WHERE a.slug IN (${Object.keys(AGENT_IDS).map((_, i) => `$${i + 1}`).join(', ')})
    GROUP BY a.id, a.name, a.slug
    ORDER BY cnt ASC
  `, Object.keys(AGENT_IDS));

  console.log('\nUpdated counts:');
  verify.rows.forEach(r => console.log(`  ${r.name} (${r.slug}): ${r.cnt} chunks`));

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
