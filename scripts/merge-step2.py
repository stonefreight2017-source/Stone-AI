"""
Step 2: Add merged agents + enterprise sales seed to agent-definitions.ts.
Uses Python to avoid JS template literal nesting issues.
"""

FILE = "src/lib/agent-definitions.ts"

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

original_lines = content.count("\n")

# ═══════════════════════════════════════════
# PART 1: Two merged agents (insert before ];)
# ═══════════════════════════════════════════

DIGITAL_MARKETING = r'''  // ═══════════════════════════════════════════
  // MERGED AGENTS
  // ═══════════════════════════════════════════
  {
    slug: "digital-marketing-strategist",
    name: "Digital Marketing Strategist",
    description: "Full-spectrum digital marketing: agency building, organic social media, paid advertising (Meta, Google, TikTok, LinkedIn), client acquisition, analytics, and growth strategy.",
    category: "MARKETING",
    icon: "megaphone",
    requiredTier: "SMART",
    sortOrder: 42,
    systemPrompt: `You are an elite Digital Marketing Strategist — a comprehensive marketing operator who combines social media marketing agency expertise, organic social growth, and paid advertising mastery into one unified strategic mind.

CORE IDENTITY:
- You have deep expertise across the ENTIRE digital marketing spectrum: agency operations, organic social, paid media, content systems, and growth strategy
- You think in terms of full-funnel ROI: traffic sources → engagement → conversion → retention → referral
- You can build marketing agencies AND execute marketing for individual businesses
- You understand platform-specific mechanics for Meta/Instagram, TikTok, LinkedIn, X, Google, YouTube, and Pinterest

CAPABILITIES:
1. AGENCY BUILDING: Service packaging, pricing tiers ($1.5K-15K/mo retainers), contract templates, onboarding SOPs, tool stack selection, team hiring, client capacity planning
2. CLIENT ACQUISITION: Outreach sequences, case study development, sales call frameworks, objection handling, proposal templates, niche specialization strategy
3. ORGANIC SOCIAL: Content calendars, platform-specific strategy (Instagram, TikTok, LinkedIn, X), engagement systems, community management, algorithm optimization, growth tactics
4. PAID ADVERTISING: Campaign architecture across Meta, Google, TikTok, LinkedIn, YouTube. Budget allocation, audience targeting, creative frameworks, A/B testing, ROAS optimization
5. CONTENT SYSTEMS: Content pillars, batch production workflows, repurposing frameworks, UGC strategies, influencer collaboration
6. ANALYTICS & REPORTING: KPI dashboards, attribution modeling, client reporting templates, monthly/quarterly business reviews
7. PRICING & POSITIONING: Value-based pricing, performance-based models, retainer vs project scoping, upsell paths

BEHAVIORAL RULES:
- Always ask about the user's context: running an agency vs marketing their own business vs in-house marketer
- Provide platform-specific advice — what works on TikTok doesn't work on LinkedIn
- Include specific metrics, benchmarks, and KPIs for every recommendation
- For agency builders: focus on systems, SOPs, and scalability
- For business owners: focus on ROI, budget efficiency, and practical execution
- Remember the user's business, niche, platforms, and goals from past conversations
- When recommending paid ads: always start with budget-appropriate strategies

RESPONSE STYLE:
- Strategic and data-driven with specific benchmarks
- Include exact scripts, templates, and frameworks
- Platform-specific tactical advice with tool recommendations
- Step-by-step implementation guides

${CROSS_REFERRAL_BLOCK}

${ETHICS_GUARD_BLOCK}`,
    knowledgeSeed: [
      {
        title: "SMMA Agency Building Framework",
        content: `SMMA (SOCIAL MEDIA MARKETING AGENCY) BUILDING FRAMEWORK:

SERVICE PACKAGING:
- Starter Package ($1,500-2,500/mo): Content creation (12-20 posts), basic community management, monthly report
- Growth Package ($3,000-5,000/mo): Content + paid ads management ($1-5K ad spend), weekly reporting, strategy calls
- Premium Package ($5,000-10,000/mo): Full-service (organic + paid + email), dedicated strategist, bi-weekly calls, advanced analytics
- Enterprise ($10,000-25,000+/mo): Multi-platform, custom creative, influencer management, revenue attribution

CLIENT ACQUISITION SYSTEMS:
- Cold email: 200-400 sends/week, 3-5 email sequence, personalized first line, case study proof
- LinkedIn outreach: 50-100 connections/week, warm DM after 48hrs, value-first messaging
- Niche down: Industry-specific expertise commands 30-50% premium over generalist agencies
- Case studies: Before/after metrics, specific ROI numbers, client testimonials with face/name
- Referral system: 10-15% commission or month free for successful referrals

DELIVERY SYSTEMS:
- Content production: Batch creation (1 day = 1 month of content), approval workflow, scheduling tools
- Reporting: Automated dashboards (Google Data Studio, AgencyAnalytics), monthly strategy calls
- SOPs: Document every process. If you can't hand it to a VA with the SOP and get 80% quality, the SOP isn't done
- QBRs: Quarterly business reviews with clients — strategic alignment, upsell opportunities, retention driver

AGENCY ECONOMICS:
- Target margins: 40-60% gross margin on retainers
- Client:employee ratio: 5-8 clients per account manager
- Churn target: <5% monthly (below 5% = sustainable growth)
- Break-even: typically 3-5 clients at mid-tier pricing
- Scale path: Solo -> VA ($500-800/mo) -> Junior AM ($3-4K/mo) -> Full team`
      },
      {
        title: "Organic Social Media Strategy by Platform (2025-2026)",
        content: `ORGANIC SOCIAL MEDIA STRATEGY BY PLATFORM (2025-2026):

INSTAGRAM:
- Algorithm priority: Reels > Carousels > Stories > Static posts
- Posting frequency: 4-7 Reels/week, 2-3 Carousels, daily Stories
- Growth tactics: Collab posts (2x reach), engagement pods (use carefully), hashtag strategy (3-5 niche, 3-5 broad), Reels trending audio
- Content pillars: Educational (40%), Entertaining (30%), Promotional (20%), Personal/BTS (10%)
- Key metrics: Reach rate (>20% good), saves (>2% great), shares (>1% viral signal)

TIKTOK:
- Algorithm: Watch time is king. First 3 seconds determine everything. Completion rate > likes
- Posting frequency: 1-3x daily for growth phase, 5-7x/week maintenance
- Growth tactics: Trend-jacking (within 48hrs), duets/stitches with larger creators, series format, controversial hooks
- Content structure: Hook (0-3s) -> Context (3-10s) -> Value (10-45s) -> CTA (last 3s)
- Key metrics: Average watch time, completion rate, share rate (>2% = viral potential)

LINKEDIN:
- Algorithm: Native content > links. Comments in first 90 min determine reach. Dwell time matters
- Posting frequency: 3-5x/week. Best times: Tue-Thu 7-9am, 12pm, 5-6pm
- Growth tactics: Personal stories outperform corporate content 3-5x. Document posts get 3x engagement. Thoughtful comments on bigger accounts
- Content structure: Hook line (pattern interrupt) -> Story/insight -> Takeaway/framework -> Engagement question
- Key metrics: Impressions, profile views, connection request rate

X (TWITTER):
- Algorithm: Engagement velocity in first 30 min. Replies > retweets > likes
- Posting frequency: 3-10x daily. Threads 2-3x/week
- Growth tactics: Quote tweet with value-add, reply to large accounts with genuine insight, threads with actionable frameworks

CROSS-PLATFORM REPURPOSING:
- One long-form piece -> 8-12 short-form pieces across platforms
- YouTube video -> TikTok clips -> Instagram Reels -> LinkedIn carousel -> X thread -> Newsletter
- Batch create: one production day = 2-4 weeks of content`
      },
      {
        title: "Paid Advertising Strategy by Platform (2025-2026)",
        content: `PAID ADVERTISING STRATEGY BY PLATFORM (2025-2026):

META (FACEBOOK/INSTAGRAM) ADS:
- Campaign structure: CBO (Campaign Budget Optimization) with 3-5 ad sets, 3-5 creatives each
- Targeting: Broad targeting works best in 2025+ (Meta's AI is excellent). Lookalikes from purchasers (1-3%). Interest stacking for cold
- Creative: UGC outperforms polished ads 2-3x. Video ads outperform static 1.5-2x. Carousel for e-commerce
- Budget: Start $20-50/day per campaign. Scale at 20-30% every 3-4 days when ROAS is positive
- Key metrics: CTR >1.5%, CPC <$2 (varies by niche), ROAS >3x for e-commerce, CPL varies by industry

GOOGLE ADS:
- Search: Match types (broad match + smart bidding is the 2025 meta), negative keywords critical, ad extensions (sitelinks, callouts, structured snippets)
- Shopping: Product feed optimization, custom labels for segmentation, Performance Max campaigns
- YouTube: Skippable in-stream for awareness, Video Action campaigns for conversion, custom audiences
- Display: Use for retargeting only (cold display has very low conversion)
- Budget: $500-2K/mo minimum for meaningful data. Scale based on impression share and CPA targets

TIKTOK ADS:
- Creative is everything. Ads that look like organic content perform 2-5x better
- Spark Ads: Boost organic posts that are already performing. Best ROAS on the platform
- Targeting: Broad + interest stacking. TikTok's algorithm learns fast
- Budget: $50-100/day minimum per ad group. Creative fatigue happens fast (refresh every 7-14 days)

LINKEDIN ADS:
- Most expensive platform ($8-15 CPC average). Use ONLY for high-ticket B2B ($5K+ deal size)
- Best formats: Single image, document ads, video ads. Sponsored InMail for ABM
- Targeting: Job title + company size + industry. Matched Audiences for retargeting

UNIVERSAL PAID MEDIA PRINCIPLES:
- Always test 3-5 creatives per ad set. Creative is the #1 lever
- Retargeting audiences convert 3-5x better than cold. Always run retargeting
- Attribution: UTM parameters on everything. Multi-touch attribution for >$100 products
- Scaling: Horizontal (new audiences/creatives) > Vertical (more budget same audience)`
      },
      {
        title: "Marketing Analytics, KPIs, and Client Reporting",
        content: `MARKETING ANALYTICS, KPIs, AND CLIENT REPORTING:

KPI FRAMEWORK BY FUNNEL STAGE:
- Awareness: Impressions, reach, brand search volume, share of voice
- Interest: Click-through rate, engagement rate, time on site, pages per session
- Consideration: Lead form fills, email signups, content downloads, webinar registrations
- Conversion: Conversion rate, cost per acquisition (CPA), average order value (AOV), revenue
- Retention: Customer lifetime value (CLV), repeat purchase rate, churn rate, NPS

REPORTING TEMPLATES:
- Weekly: Campaign performance snapshot, spend vs budget, top/bottom creatives, anomaly flags
- Monthly: Full funnel metrics, MoM trends, channel comparison, optimization recommendations, next month plan
- Quarterly: Strategic review, competitive analysis, annual forecast adjustment, test roadmap

ATTRIBUTION MODELS:
- Last-click: Simple but misleading. Overcredits bottom-funnel channels
- First-click: Good for understanding discovery channels
- Linear: Equal credit to all touchpoints. Fair but not insightful
- Time-decay: More credit to recent touchpoints. Best for most businesses
- Data-driven: Let Google/Meta ML figure it out. Requires 300+ conversions/month
- For most SMBs: Use time-decay as default. Compare against last-click for sanity check

BENCHMARKS BY INDUSTRY (2025):
- E-commerce: 1.5-3% conversion rate, $15-45 CPA, 3-5x ROAS target
- SaaS: 2-5% landing page conversion, $50-200 CPL, 12-18 month payback period
- Local service: 5-15% landing page conversion, $20-80 CPL, 60-70% close rate from qualified leads
- B2B enterprise: 1-3% landing page conversion, $100-500 CPL, 6-18 month sales cycle

CLIENT COMMUNICATION:
- When results are bad: lead with what you're testing/changing, then show the data. Always have an action plan
- When results are good: celebrate, but also explain WHY so the client understands the value you add`
      },
      {
        title: "EXPERT SOURCING — Finding the Best Minds in Digital Marketing",
        content: `EXPERT SOURCING METHODOLOGY — Finding the Best Minds in Digital Marketing:
TECHNIQUE 1: CONFERENCE KEYNOTE MAPPING — Track speakers at top marketing conferences (Traffic & Conversion Summit, Social Media Marketing World, MozCon, INBOUND, Ad World). Keynote speakers represent proven practitioners with measurable results.
TECHNIQUE 2: AGENCY AWARD TRACKING — Monitor winners from Webby Awards, Shorty Awards, Effie Awards, and platform-specific awards (Meta Business Partner, Google Premier Partner). Award winners demonstrate measurable campaign excellence.
TECHNIQUE 3: CASE STUDY REVERSE ENGINEERING — Study published case studies from top agencies (VaynerMedia, Disruptive Advertising, KlientBoost, Single Grain). Extract frameworks, budgets, and ROI data from their public work.
TECHNIQUE 4: PLATFORM CERTIFICATION TRACKING — Meta Blueprint, Google Ads certification, TikTok Academy graduates, HubSpot Academy certified professionals. Certification + proven results = reliable expertise.
TECHNIQUE 5: PODCAST/NEWSLETTER CREATOR ANALYSIS — Marketing podcast hosts and newsletter writers (Marketing Over Coffee, Everyone Hates Marketers, Marketing Brew) consistently produce actionable insights validated by their audience size.
CROSS-REFERENCE: Combine with Content Strategist for content marketing, Copywriter for ad copy, Lead Generation Strategist for outbound, and High-Ticket Funnel Architect for conversion optimization.`
      },
    ],
  },'''

VIDEO_CONTENT = r'''  {
    slug: "video-content-strategist",
    name: "Video Content Strategist",
    description: "Comprehensive video production: YouTube channel strategy, video editing, short-form content (TikTok, Reels, Shorts), scriptwriting, thumbnails, monetization, and faceless channel systems.",
    category: "CONTENT",
    icon: "video",
    requiredTier: "SMART",
    sortOrder: 43,
    systemPrompt: `You are an elite Video Content Strategist — a comprehensive video production expert who combines YouTube channel strategy, professional video editing, and short-form content mastery into one unified creative mind.

CORE IDENTITY:
- You have deep expertise across the ENTIRE video content spectrum: YouTube long-form, TikTok/Reels/Shorts, editing, scripting, and monetization
- You understand both faced and faceless channel models and can optimize either
- You think in terms of viewer retention curves, click-through rates, and audience satisfaction signals
- You can build video businesses from scratch AND optimize existing channels for growth

CAPABILITIES:
1. YOUTUBE STRATEGY: Channel positioning, niche selection, upload schedules, playlist strategy, community tab, membership/Super Chat optimization
2. ALGORITHM MASTERY: Ranking signals for YouTube, TikTok, Instagram Reels, and Shorts. How each algorithm surfaces content differently
3. VIDEO EDITING: Retention editing techniques, pacing, transitions, sound design, color grading, motion graphics, thumbnail creation
4. SHORT-FORM CONTENT: Platform-specific optimization for TikTok, Instagram Reels, YouTube Shorts. Viral mechanics and trend-jacking
5. SCRIPTWRITING: Hook frameworks, story structures, pattern interrupts, CTAs, educational vs entertainment formats
6. MONETIZATION: AdSense optimization, sponsorship negotiations, affiliate integration, digital products, channel valuation
7. FACELESS CHANNELS: AI voiceover, stock footage workflows, automation systems, outsourcing, scaling to multi-channel networks

BEHAVIORAL RULES:
- Always ask about the user's content niche, target audience, and monetization goals
- Provide platform-specific advice — what works on YouTube doesn't work on TikTok
- Include specific metrics, benchmarks, and retention targets for every recommendation
- When reviewing content: be honest but constructive. Point out specific timestamps and improvements
- Remember the user's channel, niche, style, and growth stage from past conversations

RESPONSE STYLE:
- Creative and energetic with specific tactical advice
- Include exact templates, scripts, and frameworks
- Reference specific tools and software with workflows
- Step-by-step guides with visual descriptions

${CROSS_REFERRAL_BLOCK}

${ETHICS_GUARD_BLOCK}`,
    knowledgeSeed: [
      {
        title: "YouTube Algorithm and Ranking Signals (2025-2026)",
        content: `YOUTUBE ALGORITHM & RANKING SIGNALS (2025-2026):

PRIMARY RANKING SIGNALS:
1. Click-Through Rate (CTR): Target 8-12% for established channels, 4-8% for new. Thumbnail + title = 80% of CTR
2. Average View Duration (AVD): The #1 metric. YouTube wants viewers watching longer. Target >50% retention
3. Average Percentage Viewed (APV): Completion rate. Short videos need >70%. Long videos need >40%
4. Engagement: Likes, comments, shares, saves. Shares are the strongest signal in 2025
5. Session time: Does your video lead to more YouTube watching? Playlist strategy matters here

SECONDARY SIGNALS:
- Upload consistency: Same day/time each week. YouTube rewards predictable creators
- Audience satisfaction surveys: YouTube now directly asks viewers if they enjoyed content
- Returning viewers: High % of returning viewers = strong channel loyalty signal
- Click-through from browse/suggested: Higher weight than search CTR

TITLE & THUMBNAIL OPTIMIZATION:
- Thumbnail: High contrast, readable at mobile size (120x90px test), face with emotion, 3 elements max
- Title: Front-load the value proposition. 50-60 chars optimal. Curiosity gap + specificity
- A/B testing: Use YouTube's built-in thumbnail test feature. Run for 14 days minimum
- Pattern: [Number] + [Compelling promise] + [Timeframe/qualifier]. Example: "I Made $10K in 30 Days With This Simple System"

CONTENT STRATEGY:
- 70/20/10 rule: 70% proven topics (your hits), 20% related expansion, 10% experimental
- Evergreen vs trending: Build a base of evergreen content (80%) that compounds, plus trend-jacking (20%) for spikes
- Series format: 3-5 video series on one topic. YouTube promotes the whole series when one performs well
- Subscriber gain per video: Track this — it signals satisfaction to the algorithm`
      },
      {
        title: "Faceless YouTube Channel Systems",
        content: `FACELESS YOUTUBE CHANNEL SYSTEMS:

PROVEN FACELESS NICHES (2025-2026):
- Finance/investing explainers ($15-30 RPM)
- Tech reviews and comparisons ($12-25 RPM)
- History/science documentaries ($8-15 RPM)
- Luxury/motivation compilations ($5-12 RPM)
- Gaming highlights/compilations ($3-8 RPM)
- Top 10/list channels ($4-10 RPM)
- Meditation/ambient/study music ($2-5 RPM but massive volume)

PRODUCTION WORKFLOW:
1. Research: Use vidIQ/TubeBuddy for topic validation. Check search volume + competition score
2. Script: AI-assisted first draft (ChatGPT/Claude) -> Human editing for personality/accuracy -> 1,500-2,500 words for 10-min video
3. Voiceover: ElevenLabs ($22/mo) or Play.ht for AI voice. Record samples, clone for consistency. Alternatively: Fiverr VO artists ($15-40 per video)
4. Visuals: Stock footage (Storyblocks $30/mo unlimited), screen recordings, motion graphics (Canva Pro, After Effects templates)
5. Editing: Cut every 3-5 seconds. B-roll over voiceover. Text overlays for key points. Background music at 15-20% volume
6. Thumbnail: Canva or Photoshop. High contrast, 3 elements, readable at tiny size. Test 3 variants
7. SEO: Title, description (500+ words), tags, chapters, end screens, cards to related videos

SCALING TO MULTIPLE CHANNELS:
- Phase 1 (Month 1-3): One channel, one video/week, learn the process
- Phase 2 (Month 4-6): Systematize. Hire editor ($200-500/video). You focus on scripts + strategy
- Phase 3 (Month 7-12): Launch channel 2 in adjacent niche. Hire scriptwriter ($50-150/script)
- Phase 4 (Year 2): 3-5 channels, full team, you're the creative director not the creator

MONETIZATION BEYOND ADSENSE:
- Sponsorships: Start pitching at 10K subscribers. Rate = $20-50 per 1,000 views. Negotiate based on engagement, not just views
- Affiliate: Amazon Associates (4-8%), digital product affiliates (20-50%), course affiliates
- Digital products: Templates, presets, courses related to your niche. Highest margin revenue stream
- Channel licensing: Some compilations channels license viral clips. Pay per clip, monetize the compilation
- Channel sale: Channels sell for 24-48x monthly revenue. Example: 100K subscriber finance channel = $3K AdSense + $2K sponsors + $1K affiliate = $6K/mo = $144K-288K sale value`
      },
      {
        title: "Video Editing — Retention, Pacing, and Technical Standards",
        content: `VIDEO EDITING — RETENTION, PACING, AND TECHNICAL STANDARDS:

RETENTION EDITING PRINCIPLES:
- The 3-second rule: Something visual must change every 3 seconds or viewers drop off
- Pattern interrupts: Zoom cuts, angle changes, B-roll inserts, text popups, sound effects
- The first 30 seconds: Most critical. Hook -> context -> promise. No long intros, no "hey guys," no logos
- Engagement dips: Watch your retention graph. Every dip = a boring section. Cut or replace with B-roll
- Pacing curve: Start fast (hook) -> Slow slightly (context) -> Build (value delivery) -> Peak (payoff) -> Quick end (CTA)

CUT TYPES AND WHEN TO USE:
- Jump cut: Remove pauses and filler words. Standard for talking head. Keep 0.1s gap between cuts
- J-cut: Audio starts before video. Great for transitions between scenes
- L-cut: Video continues while new audio starts. Professional documentary feel
- Match cut: Visual similarity between two shots. High-effort but impressive
- Smash cut: Abrupt transition for comedic or dramatic effect

SOUND DESIGN:
- Background music: 15-20% volume. Match energy to content. Fade in/out at transitions
- Sound effects: Whooshes for transitions, pops for text reveals, subtle risers for tension
- Voice: -14 to -10 LUFS for YouTube. Compress to even out volume. De-noise if needed
- Key principle: Good audio > good video. Viewers tolerate bad video, not bad audio

EXPORT SETTINGS (2025):
- YouTube long-form: 1080p minimum (4K preferred), H.264/H.265, 16-24 Mbps bitrate, 23.976 or 30fps
- YouTube Shorts: 1080x1920 (9:16), same codec, 30 or 60fps
- TikTok: 1080x1920, 30fps, <287MB for direct upload, keep under 3 minutes for best distribution
- Instagram Reels: 1080x1920, 30fps, under 90 seconds for maximum reach
- Audio: AAC 320kbps stereo`
      },
      {
        title: "Short-Form Content Strategy — TikTok, Reels, Shorts",
        content: `SHORT-FORM CONTENT STRATEGY — TIKTOK, REELS, SHORTS:

PLATFORM-SPECIFIC OPTIMIZATION:

TIKTOK (2025-2026):
- Optimal length: 30-90 seconds (sweet spot: 45-60s). Under 15s for trend-jacking
- Algorithm: For You Page driven by watch time + completion rate + shares. Follower count doesn't matter for distribution
- Trends: Jump on trends within 24-48 hours. Use trending sounds. Add your unique angle — don't copy exactly
- Posting: 1-3x daily during growth phase. Best times: 7-9am, 12-3pm, 7-11pm (varies by audience)
- SEO: TikTok is now a search engine. Use keywords in captions, on-screen text, and spoken words

INSTAGRAM REELS:
- Optimal length: 15-30 seconds for maximum reach. Up to 90s for in-depth content
- Algorithm: Values saves > shares > comments > likes. Create "save-worthy" educational content
- Strategy: Remix trending Reels with your spin. Use Instagram's music library for trending audio
- Posting: 4-7 Reels/week. Stories to promote Reels. Cross-post from TikTok but remove watermark

YOUTUBE SHORTS:
- Optimal length: 30-58 seconds. YouTube pushes Shorts that keep viewers on the platform
- Algorithm: Swipe-away rate is critical. First 2 seconds must hook. Loop endings boost completion
- Strategy: Clip long-form videos into Shorts. Use Shorts to drive subscribers to main channel
- Monetization: YouTube Shorts Fund. Lower RPM than long-form but massive volume potential

VIRAL CONTENT FRAMEWORKS:
1. The Pattern Interrupt: Start with something unexpected. "Stop scrolling if you..." or a visual shock
2. The Tutorial Hook: "Here's how to [desirable outcome] in [short timeframe]"
3. The Story Arc: Mini story with setup, conflict, resolution in 30-60 seconds
4. The Controversy Starter: Bold opinion + evidence. Drives comments and shares
5. The POV Format: "POV: You just discovered [relatable situation]"

REPURPOSING SYSTEM:
- One 10-min YouTube video = 5-8 short-form clips
- One podcast episode = 10-15 short-form clips
- One blog post = 3-5 short-form scripts
- Benchmarks for viral: 80%+ completion, 2%+ share rate, 3%+ save rate`
      },
      {
        title: "Scriptwriting, Thumbnails, and Content Production",
        content: `SCRIPTWRITING, THUMBNAILS, AND CONTENT PRODUCTION:

SCRIPT STRUCTURE (10-MINUTE YOUTUBE VIDEO):
1. HOOK (0-30s): Pattern interrupt + promise. "Most people do X wrong. Here's why that costs you $Y"
2. CONTEXT (30s-1:30): Why this matters. Quick story or statistic. Establish credibility
3. CONTENT BODY (1:30-8:00): 3-5 main points with examples. Each point follows: claim -> evidence -> application
4. PAYOFF (8:00-9:00): Summarize key takeaways. "If you remember nothing else, remember this..."
5. CTA (9:00-10:00): Subscribe + next video recommendation. "If you liked this, you'll love [specific video]"

HOOK FORMULAS THAT WORK:
- The Mistake: "I wasted $50K on ads before learning this one thing..."
- The Contrast: "Everyone says X, but the data shows Y"
- The Proof: "This strategy generated $127,493 in 90 days. Here's exactly how"
- The Question: "What would you do with an extra $5K per month?"
- The Warning: "Stop doing X immediately — here's why"

THUMBNAIL DESIGN PRINCIPLES:
- 3-element rule: Face/subject + text + background. Never more than 3 focal points
- Text: 3-5 words maximum. 80pt+ font. High contrast against background. Don't repeat the title
- Faces: Close-up, exaggerated emotion (surprise, excitement, concern). Eyes looking at camera or at text
- Colors: Bright, saturated. Red/yellow/orange for energy. Blue/green for trust. Avoid YouTube-red backgrounds
- Composition: Rule of thirds. Subject on left or right third, text on opposite side
- Testing: Create 3 thumbnail variations. Use YouTube A/B test. Run 14 days minimum

CONTENT CALENDAR SYSTEM:
- Monthly themes: Each month has an overarching topic. 4 videos explore different angles
- Content types: Tutorial (40%), Commentary (25%), Case study (20%), Community/Q&A (15%)
- Batch filming: Film 4-8 videos in one day. Same setup, different outfits. Edit over the following weeks
- Publish: Consistent schedule (same day/time each week). YouTube rewards consistency`
      },
      {
        title: "EXPERT SOURCING — Finding the Best Minds in Video Content Production",
        content: `EXPERT SOURCING METHODOLOGY — Finding the Best Minds in Video Content Production:
TECHNIQUE 1: CREATOR ECONOMY TRACKING — Monitor top YouTube educators (Ali Abdaal, Paddy Galloway, Film Booth, Think Media). Their strategies are battle-tested on their own channels and taught to thousands.
TECHNIQUE 2: PLATFORM INSIDER ANALYSIS — Follow YouTube liaison creators (Todd Beaupre, Renee Ritchie) who share official algorithm insights. TikTok Creator Portal and Instagram @creators for official guidance.
TECHNIQUE 3: EDITING COMMUNITY LEADERS — Track top editors and their tutorials (Peter McKinnon, Daniel Schiffer for cinematic, Jake Fellman for viral). Their techniques define current editing standards.
TECHNIQUE 4: DATA-DRIVEN CREATOR ANALYSIS — Use Social Blade, vidIQ, and TubeBuddy to identify fastest-growing channels in any niche. Reverse-engineer their title/thumbnail/content patterns.
TECHNIQUE 5: PRODUCTION HOUSE METHODOLOGY — Study content from premium production houses (Yes Theory, Jubilee, MKBHD) for production quality benchmarks and storytelling frameworks.
CROSS-REFERENCE: Combine with Content Strategist for content planning, Copywriter for script copy, Brand Strategist for channel branding, and Digital Marketing Strategist for paid promotion of video content.`
      },
    ],
  },'''

# ═══════════════════════════════════════════
# PART 2: Enterprise sales seed for Sales Agent
# ═══════════════════════════════════════════

ENTERPRISE_SEED = r'''      {
        title: "Enterprise Sales Strategy — Procurement, ROI Analysis, and Multi-Stakeholder Deals",
        content: `ENTERPRISE SALES STRATEGY — CLOSING $50K-$500K+ DEALS:

ENTERPRISE VS SMB SALES — KEY DIFFERENCES:
- Sales cycle: 3-12 months (vs 1-30 days SMB). Patience is a weapon
- Decision makers: 5-15 people involved (vs 1-2 SMB). You need a champion, an economic buyer, and technical validators
- Procurement: Enterprise has formal procurement. Learn their process or you'll lose to someone who did
- Legal/Security: MSAs, SOWs, security questionnaires, compliance requirements. Budget 2-4 weeks for legal review
- Budget cycles: Annual budgets approved Q4 for next year. If you miss the cycle, you wait 12 months

THE MEDDIC FRAMEWORK FOR ENTERPRISE:
- Metrics: What measurable outcomes does the buyer care about? Quantify everything in their language
- Economic Buyer: Who actually signs the check? Often 2-3 levels above your champion. You MUST get access
- Decision Criteria: What will they evaluate you on? Shape criteria in your favor
- Decision Process: What are the steps from today to signed contract? Map every approval
- Identify Pain: Is there a compelling event driving urgency? No urgency = no deal
- Champion: Who will sell for you internally? Arm them with ROI data and executive summaries

MULTI-STAKEHOLDER NAVIGATION:
- Map the org chart. Identify: Champion, Economic Buyer, Technical Buyer, Coach, Blocker
- Different messaging per stakeholder: CFO cares about ROI, CTO cares about integration, VP cares about team impact
- Multi-thread: Never rely on one contact. If your champion leaves, the deal dies. Always have 3+ relationships
- Executive alignment: Get a meeting between your exec and their exec. Peer-level conversations accelerate deals

PROCUREMENT NAVIGATION:
- RFP/RFI: If you didn't help write the RFP, you're probably column fodder. Influence the requirements before the RFP drops
- Security questionnaire: Have pre-filled answers ready. SOC 2, GDPR, HIPAA compliance docs prepared
- Legal redlines: Know your non-negotiable terms. Have approved fallback language ready for common redlines
- Payment terms: Enterprise often demands Net 60-90. Factor this into cash flow planning

ENTERPRISE ROI FRAMEWORK:
- Hard ROI: Revenue increase, cost reduction, time savings. Quantify in dollars per year
- Soft ROI: Risk reduction, compliance, employee satisfaction, competitive advantage. Harder to quantify but important
- TCO analysis: Total cost of ownership vs alternatives including switching costs, training, integration
- Payback period: How quickly does the investment pay for itself? Target <12 months for easier approval
- Build a custom ROI calculator for each prospect. Let THEM input their numbers

ENTERPRISE PRICING STRATEGY:
- Never lead with price. Lead with value, then price becomes context
- Annual contracts with upfront payment: offer 10-15% discount for annual prepay
- Land and expand: Start with one department, prove ROI, expand to enterprise-wide
- Procurement will ALWAYS ask for discount. Build 15-20% padding into initial pricing
- Volume tiers: Show a pricing table that incentivizes larger commitments

CHAMPION ENABLEMENT:
- Create internal sell materials: 1-page executive summary, ROI calculator, competitive comparison
- Coach your champion on how to present to their leadership. Role-play the internal meeting
- Provide a "business case template" they can customize with their specific data
- Champion: Who will sell for you internally? Arm them with ROI data and executive summaries`
      },'''

# ═══════════════════════════════════════════
# Execute modifications
# ═══════════════════════════════════════════

# 1. Insert merged agents before ];
closing = content.rfind("];")
if closing == -1:
    print("ERROR: Could not find closing ];")
    exit(1)

content = content[:closing] + DIGITAL_MARKETING + "\n" + VIDEO_CONTENT + "\n" + content[closing:]
print("Added Digital Marketing Strategist and Video Content Strategist.")

# 2. Insert enterprise seed into Sales Agent's knowledgeSeed
# Find the sales-agent slug, then find the closing of its knowledgeSeed array
sales_idx = content.find('slug: "sales-agent"')
if sales_idx == -1:
    print("WARNING: sales-agent not found, skipping enterprise seed")
else:
    # Find the knowledgeSeed closing "],\n  }," after the sales agent slug
    # Look for the pattern "    ],\n  }," which closes the knowledgeSeed and the agent
    search_region = content[sales_idx:sales_idx + 5000]
    ks_close = search_region.rfind("    ],\n  },")
    if ks_close == -1:
        # Try with different line ending
        ks_close = search_region.rfind("    ],\r\n  },")
    if ks_close == -1:
        print("WARNING: Could not find knowledgeSeed closing for sales-agent")
    else:
        insert_pos = sales_idx + ks_close
        content = content[:insert_pos] + ENTERPRISE_SEED + "\n" + content[insert_pos:]
        print("Enhanced Sales Agent with enterprise sales knowledge seed.")

# 3. Write the file
with open(FILE, "w", encoding="utf-8") as f:
    f.write(content)

new_lines = content.count("\n")
print(f"\nOriginal: {original_lines} lines")
print(f"New: {new_lines} lines")
print(f"Added: {new_lines - original_lines} lines")
