/**
 * Step 2: Add merged agents, enhance Sales Agent, add deep seeds to 8 new agents.
 *
 * Adds:
 * - Digital Marketing Strategist (merge of SMMA + Social Media + Paid Ads)
 * - Video Content Strategist (merge of YouTube Automation + Video Editor + Short-Form)
 *
 * Enhances:
 * - Sales Agent: add enterprise sales knowledge
 * - All 8 new agents: add 3-5 additional knowledge seeds each
 */
import { readFileSync, writeFileSync } from "fs";

const FILE = "src/lib/agent-definitions.ts";
let content = readFileSync(FILE, "utf-8");

// ═══════════════════════════════════════════
// PART 1: Add 2 merged agents before the closing ];
// ═══════════════════════════════════════════

const closingIdx = content.lastIndexOf("];");

const MERGED_AGENTS = `
  // ═══════════════════════════════════════════
  // MERGED AGENTS
  // ═══════════════════════════════════════════
  {
    slug: "digital-marketing-strategist",
    name: "Digital Marketing Strategist",
    description: "Full-spectrum digital marketing: agency building, organic social media, paid advertising (Meta, Google, TikTok, LinkedIn), client acquisition, and growth strategy.",
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

\${CROSS_REFERRAL_BLOCK}

\${ETHICS_GUARD_BLOCK}`,
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
- Scale path: Solo → VA ($500-800/mo) → Junior AM ($3-4K/mo) → Full team`
      },
      {
        title: "Organic Social Media Strategy by Platform",
        content: `ORGANIC SOCIAL MEDIA STRATEGY BY PLATFORM (2025-2026):

INSTAGRAM:
- Algorithm priority: Shares/Sends > Saves > Comments > Likes (in that order)
- Content mix: 40% Reels, 30% Carousels, 20% Stories, 10% Static posts
- Posting frequency: 4-7 Reels/week, 2-3 Carousels/week, daily Stories
- Growth tactics: Collaboration posts, hashtag strategy (5-10 per post), engagement pods (careful), DM automation for comments
- Key metric: Shares per reach (viral coefficient). Target >2% share rate
- Carousel strategy: Educational carousels get 3x saves vs single images. Hook slide → value slides → CTA slide

TIKTOK:
- Algorithm: FYP distribution based on completion rate, replay rate, shares, and comment velocity
- Content style: Raw > polished. Authenticity wins. Trending sounds boost reach 2-5x
- Posting frequency: 1-3x daily for growth phase, 3-5x/week for maintenance
- Growth tactics: Stitch/Duet popular creators, ride trending sounds within 48hrs, use TikTok-native features
- Key metric: Average watch time / video length. Target >80% completion for videos under 30 seconds

LINKEDIN:
- Algorithm: Dwell time is king. Long-form posts (1,000-1,500 characters) with line breaks outperform
- Content mix: Personal stories (highest engagement), industry insights, hot takes, carousels (PDFs get 2-3x reach)
- Posting frequency: 3-5x/week. Tuesday-Thursday 7-9am or 12-1pm best performing
- Growth tactics: Comment on other posts FIRST (30 min before posting), LinkedIn newsletters, employee advocacy
- Key metric: Profile views → connection requests → DMs (the LinkedIn funnel)

X (TWITTER):
- Algorithm: Engagement velocity in first 30 minutes determines distribution
- Content mix: Threads (5-15 tweets for reach), single tweets (hot takes), quote tweets, polls
- Posting frequency: 3-5x daily for growth. Consistency > quality for X
- Growth tactics: Quote tweet larger accounts, reply to trending topics within your niche, build in public
- Key metric: Profile clicks → followers. Optimize bio as landing page

UNIVERSAL PRINCIPLES:
- First 3 seconds / first line determines everything — hook or scroll
- Engagement begets engagement — reply to every comment for first hour
- Consistency > perfection. Show up daily, quality follows
- Platform native content > cross-posted content (3-5x better performance)
- Batch create: one production day = 2-4 weeks of content`
      },
      {
        title: "Paid Advertising Strategy — Meta, Google, TikTok, LinkedIn",
        content: `PAID ADVERTISING STRATEGY BY PLATFORM (2025-2026):

META ADS (Facebook + Instagram):
- Campaign structure: Campaign → Ad Set → Ad. Use Campaign Budget Optimization (CBO) for scaling
- Audience strategy: Broad targeting (let Meta's AI optimize) > hyper-specific for most advertisers. Lookalike audiences from purchasers for e-commerce
- Creative framework: Hook in first 3 seconds. UGC-style outperforms polished by 30-50%. Test 3-5 creatives per ad set
- Budget: Start $20-50/day per ad set. Scale winning ad sets by 20% every 48hrs. Kill losers after 2-3x CPA threshold
- Key metrics: CPM ($5-15 avg), CTR (1-3% good), CPA (varies by industry), ROAS (target 3x+ for e-commerce)
- iOS tracking: Use Conversions API + pixel for maximum signal. UTMs for cross-platform attribution

GOOGLE ADS:
- Search: Keyword research → ad groups by theme → match types (broad modified, phrase, exact) → negative keywords
- Performance Max: Black-box campaign type. Feed it good creative assets and conversion data. Best for e-commerce
- Display/YouTube: Awareness and retargeting. Lower CPA expectations but wider reach
- Budget: Search $10-50/day per campaign to start. Min 2-4 weeks before optimization judgments
- Key metrics: Quality Score (7+ target), CPC (varies wildly by industry), Conversion Rate (2-5% search), ROAS

TIKTOK ADS:
- Campaign types: In-Feed (main), Spark Ads (boost organic posts — highest performance), TopView (premium)
- Audience: Broad targeting works well. Interest + behavior targeting for niche products
- Creative: Must feel native to TikTok. Organic-looking UGC outperforms polished ads by 3-5x
- Budget: $20-50/day minimum. TikTok needs volume — budget too low = poor optimization
- Key metrics: CPM ($3-8 avg, cheaper than Meta), CTR (1-2%), CVR, Cost per result

LINKEDIN ADS:
- Best for: B2B, high-ticket ($5K+ deal size), SaaS, professional services, recruiting
- Campaign types: Sponsored Content (feed ads), Message Ads (InMail), Lead Gen Forms (pre-filled = high conversion)
- Targeting: Job title, company size, industry, seniority — most precise B2B targeting available
- Budget: Expensive ($8-15 CPC, $30-80 CPM). Minimum $50/day recommended. Only viable for high-ticket
- Key metrics: CTR (0.4-1% for feed ads), Cost per lead ($50-200 for B2B), Lead quality score

CROSS-PLATFORM PRINCIPLES:
- Start with ONE platform. Master it. Then expand
- Creative fatigue: Refresh creatives every 2-4 weeks
- Attribution: Use UTMs + GA4 + platform pixels. No single source of truth — triangulate
- Retargeting: 180-day website visitors, email list custom audiences, video viewers
- Scaling: Horizontal (new audiences/creatives) > Vertical (more budget same audience)`
      },
      {
        title: "Marketing Analytics, KPIs, and Client Reporting",
        content: `MARKETING ANALYTICS, KPIs, AND CLIENT REPORTING:

ESSENTIAL MARKETING KPIs BY CHANNEL:
- Organic Social: Follower growth rate, engagement rate (by platform), reach, shares, profile visits, website clicks
- Paid Ads: ROAS, CPA, CTR, CPM, frequency, conversion rate, click-to-purchase rate
- Email: Open rate (30-40% good), CTR (2-5% good), conversion rate, list growth rate, unsubscribe rate
- SEO: Organic traffic, keyword rankings, domain authority, backlink growth, organic conversion rate
- Overall: Customer acquisition cost (CAC), customer lifetime value (LTV), LTV:CAC ratio (3:1 target)

REPORTING FRAMEWORKS:
- Weekly pulse: Top metrics dashboard, quick wins, red flags (5-min read)
- Monthly report: Full channel analysis, spend vs results, content performance, next month priorities
- Quarterly business review (QBR): Strategic alignment, competitive landscape, testing roadmap, growth projection

TOOLS:
- Dashboards: Google Data Studio (free), AgencyAnalytics ($12-18/client), Databox ($25-50/mo)
- Attribution: GA4 (free), Triple Whale ($100-300/mo for e-commerce), Northbeam ($500+/mo)
- Social analytics: Sprout Social ($249/mo), Later ($25/mo), native platform insights
- Ad management: Meta Ads Manager, Google Ads, TikTok Ads Manager (all free with spend)

CLIENT COMMUNICATION:
- Set expectations upfront: Month 1 = learning, Month 2 = optimization, Month 3 = scaling
- Report on metrics THEY care about (revenue, leads) not vanity metrics (impressions, reach)
- When results are poor: diagnose, explain, present action plan. Never hide bad numbers
- When results are great: celebrate, but also explain WHY so the client understands the value you add`
      },
      {
        title: "EXPERT SOURCING METHODOLOGY — Finding the Best Minds in Digital Marketing",
        content: `EXPERT SOURCING METHODOLOGY — Finding the Best Minds in Digital Marketing:
TECHNIQUE 1: CONFERENCE KEYNOTE MAPPING — Track speakers at Social Media Marketing World, Traffic & Conversion Summit, MozCon, SMX, and AdWorld. Keynote speakers demonstrate field leadership validated by peer selection.
TECHNIQUE 2: PLATFORM CERTIFICATION LEADERS — Meta Blueprint certified experts, Google Ads certified partners, and TikTok Academy graduates with proven campaign results demonstrate platform-specific expertise.
TECHNIQUE 3: AGENCY CASE STUDY ANALYSIS — Top agencies (VaynerMedia, Hawke Media, Disruptive Advertising, Common Thread Collective) publish detailed case studies. Cross-reference their strategies across multiple clients.
TECHNIQUE 4: INDUSTRY PUBLICATION BYLINES — Regular contributors to Social Media Examiner, Search Engine Journal, HubSpot Blog, and AdEspresso demonstrate consistent expertise validated by editorial standards.
TECHNIQUE 5: CREATOR/OPERATOR ANALYSIS — Marketers who build their own audience (not just client work) understand both theory and execution. Cross-reference follower growth with content quality.
APPLICATION: When advising on digital marketing strategy, reference frameworks and benchmarks from proven operators and platform-specific data.
CROSS-REFERENCE: Combine with Content Strategist for content marketing, Copywriter for ad copy, Lead Generation Strategist for outbound, and High-Ticket Funnel Architect for conversion optimization.`
      },
    ],
  },
  {
    slug: "video-content-strategist",
    name: "Video Content Strategist",
    description: "Complete video mastery: YouTube channel strategy, video editing and production, short-form content (TikTok/Reels/Shorts), monetization, and audience growth.",
    category: "CONTENT",
    icon: "video",
    requiredTier: "SMART",
    sortOrder: 43,
    systemPrompt: `You are an elite Video Content Strategist — a comprehensive video production expert who combines YouTube channel strategy, professional video editing, and short-form content mastery into one unified creative mind.

CORE IDENTITY:
- You have deep expertise across the ENTIRE video content spectrum: YouTube long-form, short-form (TikTok/Reels/Shorts), video editing, and content monetization
- You understand that video is won in the first 3 seconds — hook or scroll applies to both long and short form
- You can build automated YouTube channels AND optimize individual creator content AND produce viral short-form
- You think in content systems: one production session → multiple formats → multiple platforms → maximum ROI

CAPABILITIES:
1. YOUTUBE STRATEGY: Niche selection, content pillars, upload strategy, algorithm mechanics, CTR/AVD optimization, monetization (AdSense, sponsors, affiliates, products)
2. VIDEO EDITING: Retention editing, pacing, J/L cuts, motion graphics, audio mixing, color grading, software guidance (Premiere, DaVinci, CapCut, Final Cut)
3. SHORT-FORM: TikTok/Reels/Shorts strategy, hook writing, trending audio, caption optimization, viral mechanics, platform-specific culture
4. SCRIPTWRITING: Hook frameworks, retention techniques, story structures, CTA placement, script-to-edit workflow
5. THUMBNAIL & TITLE: CTR optimization, curiosity gaps, thumbnail composition, A/B testing, title formulas
6. CONTENT REPURPOSING: Long-form → Shorts pipeline, podcast → video, blog → video, cross-platform adaptation
7. PRODUCTION: Equipment recommendations by budget, recording techniques, lighting, audio, remote recording
8. MONETIZATION: AdSense, sponsorships, affiliate marketing, digital products, membership, channel licensing
9. AUTOMATION: Faceless channels, team building (writers, editors, thumbnail designers, VAs), SOPs, quality control

BEHAVIORAL RULES:
- Always ask about the user's goal: personal brand vs faceless channel vs business channel vs short-form only
- Provide platform-specific advice — YouTube algorithm ≠ TikTok algorithm ≠ Instagram algorithm
- Include specific title/thumbnail/hook concepts, not generic advice
- For beginners: focus on getting started with minimal gear. Ship content > perfect content
- For scaling: focus on systems, team building, and content velocity
- Remember the user's channel, niche, equipment, and goals from past conversations
- When discussing editing: include software-specific tips and shortcuts

RESPONSE STYLE:
- Specific and tactical with real examples
- Include actual title/thumbnail/hook concepts for recommendations
- Script structures with timestamps for video planning
- Equipment recommendations at multiple budget tiers
- Platform algorithm mechanics explained naturally

\${CROSS_REFERRAL_BLOCK}

\${ETHICS_GUARD_BLOCK}`,
    knowledgeSeed: [
      {
        title: "YouTube Algorithm & Ranking Signals (2025-2026)",
        content: `YOUTUBE ALGORITHM & RANKING SIGNALS (2025-2026):
PRIMARY RANKING FACTORS:
1. Click-Through Rate (CTR): % of impressions that become views. Target 5-10% for established channels, 2-5% for new
2. Average View Duration (AVD): How long viewers watch. Target 50%+ of video length
3. Watch Time: Total minutes watched. Longer videos earn more IF retention holds
4. Session Time: Does your video keep people on YouTube? Videos that start long sessions get boosted
5. Satisfaction Signals: Likes, shares, comments, subscribes, "not interested" signals

2025-2026 ALGORITHM SHIFTS:
- Shorts and long-form fully decoupled — Shorts subscribers don't see long-form by default
- "New Viewer" signals gaining weight — the algorithm tests your video with non-subscribers first
- Multi-format creators rewarded — channels using long-form + Shorts + Community + Live get distribution boost
- Watch time per impression becoming more important than raw watch time

ALGORITHM OPTIMIZATION CHECKLIST:
- First 30 seconds: Hook → promise → proof (retention graph should be flat or rising here)
- Retention valleys: Place pattern interrupts (graphics, B-roll, music change) at natural drop-off points
- End screen CTR: Optimize end card placement. Last 20 seconds should tease next video
- Comments/Likes: Ask specific questions to drive comments. Pin a conversation-starter comment
- Subscriber gain per video: Track this — it signals satisfaction to the algorithm`
      },
      {
        title: "Faceless Channel Systems & Monetization",
        content: `FACELESS YOUTUBE CHANNEL SYSTEMS:
WHAT MAKES FACELESS CHANNELS WORK:
- Removes creator bottleneck — content production doesn't depend on one person's availability
- Channels become assets that can be sold (typically 24-48x monthly revenue)
- Lower barrier to entry — no on-camera skills needed

TOP FACELESS FORMATS:
- Animated Explainers: $1,000-3,000/video production cost, $15-30 RPM, high retention
- Compilation/Listicle: $100-300/video, $3-8 RPM, high volume strategy
- Documentary-Style: $500-2,000/video, $8-20 RPM, authority building
- AI-Generated Educational: $50-200/video, $4-12 RPM, highest volume potential
- Relaxation/Ambient: $50-150/video, $2-5 RPM, massive passive library play

PRODUCTION SYSTEM:
- Phase 1: Research & Script (2-4 hrs) — Topic validation, scriptwriting, source verification
- Phase 2: Voiceover (1-2 hrs) — AI voice or human VO ($5-25 per script on Fiverr)
- Phase 3: Visual Assembly (3-8 hrs) — Stock footage, AI images, screen recordings, animations
- Phase 4: Thumbnail & Title (1 hr) — 3 options each, test highest CTR concept
- Phase 5: Upload & Optimize (30 min) — SEO description, tags, cards, end screens, scheduled publish

TOTAL COST PER VIDEO: $100-500 for mid-quality, $500-2,000 for premium
OUTSOURCING: Fiverr, Upwork, OnlineJobs.ph for Filipino VAs ($400-800/mo full-time)

MONETIZATION STACKING:
- Tier 1: AdSense (passive, scales with views)
- Tier 2: Sponsorships ($50-200 per 1K views for integrated)
- Tier 3: Affiliate marketing (Amazon, niche programs)
- Tier 4: Digital products (courses, templates from channel topic)
- Tier 5: Channel sale (24-48x monthly revenue at scale)
- Example: 100K subscriber finance channel = $3K AdSense + $2K sponsors + $1K affiliate = $6K/mo = $144K-288K sale value`
      },
      {
        title: "Video Editing: Retention, Pacing, and Technical Standards",
        content: `VIDEO EDITING — RETENTION, PACING, AND TECHNICAL STANDARDS:

THE 3-SECOND RULE:
- Something visually or audibly must CHANGE every 3 seconds maximum. The human brain habituates to static stimuli
- Changes include: cut, zoom, graphic, sound effect, music change, B-roll, text overlay, camera angle shift

HOOK EDITING (First 30 Seconds):
- 0:00-0:03: Cold open — most compelling moment or bold claim. NO intros, logos, or "hey guys"
- 0:03-0:05: Visual pattern interrupt — quick zoom, graphics burst, or scene change
- 0:05-0:15: Deliver on the hook promise. Show proof, preview, or context
- 0:15-0:25: Establish credibility and set expectations for the video
- 0:25-0:30: Micro-hook — tease what's coming. "But first..." or "The third one changed everything"

PACING BY CONTENT TYPE:
- Educational: 1 cut every 4-6 seconds. B-roll on key points. Graphics for data
- Entertainment: 1 cut every 2-3 seconds. Fast music. Frequent SFX
- Storytelling: Match cuts to emotional beats. Slower = tension. Faster = excitement
- Tutorial: Cut on actions, not time. Show the step, not the waiting

AUDIO MIXING TARGETS:
- Voice: -12 to -6 dB peak, -16 LUFS average
- Background music: -24 to -18 dB (60-70% quieter than voice)
- Sound effects: -18 to -12 dB (match the energy, don't overpower)
- Overall loudness: -14 LUFS for YouTube delivery
- High-pass filter on voice at 80-100Hz to remove rumble

EDITING SOFTWARE COMPARISON:
- DaVinci Resolve: Free + Studio $295. Best color grading, fusion for VFX. Steepest learning curve
- Adobe Premiere Pro: $23-55/mo. Industry standard for collaboration. Best plugin ecosystem
- CapCut: Free + $10/mo. Best for short-form. Auto-captions. Direct TikTok export
- Final Cut Pro: $300 one-time. Mac only. Fastest rendering. Magnetic timeline

EXPORT SETTINGS:
- Resolution: 3840x2160 (4K) when possible. YouTube processes 4K with VP9/AV1 codec (better quality)
- Codec: H.264 for compatibility, H.265 for smaller files
- Bitrate: 35-68 Mbps for 4K, 16-24 Mbps for 1080p
- Frame rate: 24fps narrative, 30fps standard, 60fps action/gaming
- Audio: AAC 320kbps stereo`
      },
      {
        title: "Short-Form Content: TikTok, Reels, Shorts Strategy",
        content: `SHORT-FORM CONTENT STRATEGY — TIKTOK, REELS, SHORTS:

PLATFORM ALGORITHM DIFFERENCES:
- TIKTOK: Completion rate king. FYP distribution = testing batches (200→1K→10K→100K). Trending sounds boost 2-5x. Raw/authentic culture
- INSTAGRAM REELS: Shares/Sends per reach is top signal. More polished aesthetic. Visual excellence expected. Carousel Reels emerging
- YOUTUBE SHORTS: Evergreen advantage (Shorts have longer shelf life). Value-dense culture. Fully decoupled from long-form (late 2025). Swipe-away rate critical

HOOK FORMULAS (first 1-1.5 seconds):
- Curiosity: "Nobody talks about this hack for..." / "I wish I knew this before..."
- Authority: "As a [credential] for 10 years..." / "After working with 200+ clients..."
- Controversy: "Unpopular opinion: [bold claim]" / "Stop doing [common practice]"
- Story: "This $50 decision turned into $50,000..." / "The worst mistake I ever made was..."
- Visual: Object transformation, before/after reveal, something unexpected in frame

CONTENT REPURPOSING SYSTEM:
- 1 long-form video (10-20 min) → 5-15 short-form clips
- Tools: Opus Clip ($19-29/mo, AI detection), Descript ($24/mo), CapCut (free)
- Workflow: Record long-form → AI clip detection → Manual review → Platform-specific polish → Schedule
- Posting order: TikTok first (most forgiving of reposts) → Reels → Shorts

POSTING SCHEDULE:
- TikTok: 1-3x daily for growth, 5x/week maintenance. Best times: 7-9am, 12-3pm, 7-11pm
- Reels: 4-7x/week. Best times: 9am, 12pm, 3pm, 6pm (local time)
- Shorts: 1-2x daily. Best times: 2-4pm, 6-9pm (viewer time zone)

VIRAL MECHANICS:
- Completion rate × Share rate × Comment rate / Time = viral score
- Shares are most powerful signal on ALL platforms
- Saves indicate value content (educational, reference)
- Comments: Ask specific questions, plant intentional "debate bait"
- Benchmarks for viral: 80%+ completion, 2%+ share rate, 3%+ save rate`
      },
      {
        title: "Scriptwriting, Thumbnails, and Content Production Systems",
        content: `SCRIPTWRITING, THUMBNAILS, AND CONTENT PRODUCTION:

SCRIPTWRITING — THE HOOK-STORY-PAYOFF FRAMEWORK:
- HOOK (0:00-0:30): Curiosity gap or bold claim → proof/preview → credibility → tease structure
- BODY (0:30-end-2:00): Deliver value in clear segments. Each segment has its own mini-hook. Re-engage every 2-3 minutes
- PAYOFF (last 2:00): Deliver the promise. Summarize key insights. Strong CTA → end screen tease

RETENTION TECHNIQUES:
- Re-Hook at 30% mark: "Now here's where it gets interesting..." (prevents mid-video drop-off)
- Bucket brigades: "But here's the thing..." / "It gets worse..." / "What happened next shocked everyone"
- Pattern interrupts: Change music, show graphic, shift camera angle at natural dip points
- Numbered lists: "5 ways to..." gives viewers a completion goal. They stay to see all 5
- Open loops: Tease point #4 at the beginning. Viewers stay to see it

SCRIPT LENGTH GUIDELINES:
- 8-min video: 1,200-1,400 words (150-175 wpm speaking pace)
- 10-min video: 1,500-1,800 words
- 15-min video: 2,200-2,700 words
- 20-min video: 3,000-3,500 words

THUMBNAIL DESIGN:
- 3-element rule: Face/subject + text (2-4 words) + emotion/action. That's it. Don't overcrowd
- Colors: High contrast, complementary colors. Yellow/blue, red/white, green/purple
- Faces: Close-up, strong emotion (surprise, excitement, shock). Eyes visible
- Text: 2-4 words maximum. Bold sans-serif font. Readable at mobile size (thumbnail appears tiny on phones)
- A/B test: Create 3 variants per video. Swap at 48 hours if CTR is below channel average

CONTENT PRODUCTION WORKFLOW:
- Day 1: Research + script (batch 2-4 scripts)
- Day 2: Record (batch all recording in one session)
- Day 3-4: Edit (or outsource — editors $150-400/video)
- Day 5: Thumbnails, titles, descriptions, scheduling
- Publish: Consistent schedule (same day/time each week). YouTube rewards consistency`
      },
      {
        title: "EXPERT SOURCING METHODOLOGY — Finding the Best Minds in Video Content",
        content: `EXPERT SOURCING METHODOLOGY — Finding the Best Minds in Video Content Production:
TECHNIQUE 1: CONFERENCE KEYNOTE MAPPING — Track speakers at VidCon, VidSummit, Podcast Movement (video podcasting), and Adobe MAX. These events feature creators and producers with proven audience-building track records.
TECHNIQUE 2: PLATFORM SUCCESS ANALYSIS — Study channels that grew from 0 to 100K+ subscribers in under 12 months. Reverse-engineer their content strategy, upload frequency, thumbnail evolution, and niche selection.
TECHNIQUE 3: PRODUCTION COMPANY METHODOLOGY — Top YouTube production companies (Colin and Samir's operation, MrBeast's production team, Corridor Digital) have refined production workflows. Study their behind-the-scenes content for operational insights.
TECHNIQUE 4: EDITING COMMUNITY LEADERS — Active contributors in DaVinci Resolve forums, Adobe community, r/VideoEditing, and r/YouTubers demonstrate practical expertise validated by peer recognition.
TECHNIQUE 5: CREATOR ECONOMY ANALYSIS — Track creator economy reports from SignalFire, Goldman Sachs, and platform earnings reports. Understand revenue benchmarks and monetization trends.
APPLICATION: When advising on video content strategy, reference proven frameworks from successful creators and production methodologies rather than theoretical approaches.
CROSS-REFERENCE: Combine with Content Strategist for content planning, Copywriter for script copy, Brand Strategist for channel branding, and Digital Marketing Strategist for paid promotion of video content.`
      },
    ],
  },
`;

content = content.substring(0, closingIdx) + MERGED_AGENTS + "];\n";

// ═══════════════════════════════════════════
// PART 2: Enhance Sales Agent with enterprise knowledge
// ═══════════════════════════════════════════

// Add enterprise knowledge seed to Sales Agent's knowledgeSeed array
const salesSeedMarker = content.indexOf('slug: "sales-agent"');
if (salesSeedMarker !== -1) {
  // Find the closing `],` of the sales agent's knowledgeSeed array
  // Search forward from the slug for the pattern `    ],` that closes knowledgeSeed
  let searchFrom = salesSeedMarker;
  // Find the knowledgeSeed array
  const ksSeedStart = content.indexOf('knowledgeSeed:', searchFrom);
  if (ksSeedStart !== -1) {
    // Find the closing of the knowledgeSeed array - look for `    ],` followed by `  },`
    const agentEnd = content.indexOf('  },', ksSeedStart);
    const ksEnd = content.lastIndexOf('    ],', agentEnd);
    if (ksEnd !== -1) {
      const enterpriseSeed = `
      {
        title: "Enterprise Sales Strategy — Procurement, ROI Analysis, and Multi-Stakeholder Deals",
        content: `ENTERPRISE SALES STRATEGY — CLOSING $50K-$500K+ DEALS:

ENTERPRISE vs SMB SALES:
- SMB: 1-2 decision makers, 2-4 week cycle, feature-driven, price-sensitive
- Enterprise: 6-10 stakeholders, 3-12 month cycle, value/ROI-driven, budget available but process heavy
- Key difference: In enterprise, you're selling to a COMMITTEE, not a person. Map every stakeholder

MULTI-STAKEHOLDER MAPPING:
- Champion: Your internal advocate. Sells for you when you're not in the room. Find and arm them
- Economic Buyer: Controls budget. Cares about ROI, total cost of ownership, risk mitigation
- Technical Buyer: Evaluates capabilities. Cares about integration, security, compliance, scalability
- End Users: Will use daily. Cares about ease of use, training, support
- Blocker: Opposes the deal. Could be competitor advocate, budget competitor, or risk-averse. Identify early

ENTERPRISE PROCUREMENT NAVIGATION:
- RFP/RFI Response: Answer every question directly. Include case studies for similar-sized deployments
- Security Review: SOC 2, GDPR, HIPAA compliance documentation ready before they ask
- Legal Review: Redline-ready contracts. Know your non-negotiables vs. flexible terms
- Pilot/POC: Offer 30-60 day proof of concept with clear success metrics defined upfront
- Procurement timeline: Add 30-60 days to whatever they say. Budget for longer cycles

ROI FRAMEWORK FOR ENTERPRISE DEALS:
- Hard ROI: Direct cost savings, revenue increase, headcount reduction (quantify in dollars)
- Soft ROI: Time savings, error reduction, employee satisfaction, competitive advantage
- Template: "For a company your size, customers typically see [X]% improvement in [metric] within [timeframe], resulting in approximately $[amount] in annual value"
- Always calculate: Implementation cost + annual cost vs. annual value delivered = payback period

ENTERPRISE PRICING STRATEGY:
- Value-based, not cost-plus. Price against the problem size, not your costs
- Annual contracts with upfront payment = better cash flow + lower churn
- Tiered by seats/usage: Creates natural expansion revenue as they grow
- Professional services: Implementation, training, custom integration = 15-30% of contract value
- Typical enterprise SaaS: $500-$2,000/user/year or $50K-$500K annual contracts

ENTERPRISE DEAL QUALIFICATION (MEDDIC):
- Metrics: What business outcomes do they measure? Connect your solution to their KPIs
- Economic Buyer: Who controls the budget? Get in front of them, not just the champion
- Decision Criteria: What will they evaluate you on? Shape criteria in your favor
- Decision Process: What are the steps from today to signed contract? Map every approval
- Identify Pain: Is there a compelling event driving urgency? No urgency = no deal
- Champion: Who will sell for you internally? Arm them with ROI data and executive summaries`
      },
`;
      content = content.substring(0, ksEnd) + enterpriseSeed + content.substring(ksEnd);
      console.log("Enhanced Sales Agent with enterprise knowledge seed.");
    }
  }
}

// ═══════════════════════════════════════════
// PART 3: Add deep seeds to 8 new agents
// ═══════════════════════════════════════════

function addSeedsToAgent(slug, newSeeds) {
  const slugIdx = content.indexOf(`slug: "\${slug}"`);
  if (slugIdx === -1) {
    console.log(`  WARNING: \${slug} not found`);
    return;
  }
  // Find the knowledgeSeed closing for this agent
  const nextAgentSlug = content.indexOf('slug: "', slugIdx + slug.length + 10);
  const searchEnd = nextAgentSlug !== -1 ? nextAgentSlug : content.length;

  // Find the last `    ],` before the next agent (closes knowledgeSeed)
  const region = content.substring(slugIdx, searchEnd);
  const ksCloseIdx = region.lastIndexOf('    ],');
  if (ksCloseIdx === -1) {
    console.log(`  WARNING: Could not find knowledgeSeed close for \${slug}`);
    return;
  }

  const insertAt = slugIdx + ksCloseIdx;
  content = content.substring(0, insertAt) + newSeeds + content.substring(insertAt);
  console.log(`  Added seeds to \${slug}`);
}

// General Coding Assistant — add 3 more seeds
addSeedsToAgent("general-coding-assistant", `
      {
        title: "Debugging Framework and Root Cause Analysis",
        content: `SYSTEMATIC DEBUGGING FRAMEWORK:

THE SCIENTIFIC METHOD FOR BUGS:
1. REPRODUCE: Can you trigger the bug consistently? If not, gather more data (logs, user reports, environment details)
2. ISOLATE: Narrow the scope. Binary search: comment out half the code. Which half has the bug?
3. HYPOTHESIZE: Based on symptoms, what COULD be wrong? List 2-3 possibilities ranked by likelihood
4. TEST: Test each hypothesis with the MINIMUM change. One variable at a time
5. FIX: Apply the fix. Verify the bug is gone AND nothing else broke
6. PREVENT: Add a test that catches this bug. Consider: can this class of bug happen elsewhere?

COMMON BUG CATEGORIES:
- Off-by-one errors: Loop boundaries, array indexing, string slicing. Check start/end/length
- Null/undefined: The billion-dollar mistake. Check all optional chains, default values, guard clauses
- Race conditions: Async operations completing in unexpected order. Look for shared mutable state
- Type coercion: JavaScript's == vs ===, Python's truthy/falsy, implicit conversions
- State management: Stale closures (React), circular updates, missing dependency arrays
- Environment: Works locally, fails in production. Check: env vars, versions, OS differences, permissions

DEBUGGING TOOLS BY LANGUAGE:
- JavaScript/Node: Chrome DevTools, console.log (still king), debugger statement, VS Code breakpoints
- Python: pdb/ipdb, print(), PyCharm debugger, logging module
- Java: IntelliJ debugger, jstack for thread dumps, JVisualVM for memory
- General: Git bisect (find which commit introduced the bug), rubber duck debugging, explain the code to someone`
      },
      {
        title: "API Design and Database Patterns",
        content: `API DESIGN AND DATABASE PATTERNS:

REST API DESIGN:
- Resources are nouns: /users, /orders, /products (not /getUsers, /createOrder)
- HTTP methods: GET (read), POST (create), PUT (full update), PATCH (partial), DELETE (remove)
- Status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Server Error
- Pagination: cursor-based (scalable) or offset-based (simple). Always paginate list endpoints
- Filtering: ?status=active&sort=-createdAt&limit=20. Consistent patterns across all endpoints
- Versioning: URL prefix (/v1/users) or header (Accept: application/vnd.api.v1+json)
- Error format: { error: { code: "VALIDATION_ERROR", message: "Email is required", details: [...] } }

DATABASE PATTERNS:
- Indexing: Add indexes on columns you filter/sort/join on. Composite indexes: leftmost prefix rule
- N+1 queries: Loading a list then querying each item individually. Use JOINs, includes, or DataLoader
- Connection pooling: Don't open a new connection per request. Use pool (pg-pool, HikariCP, SQLAlchemy pool)
- Migrations: Schema changes via versioned migration files. Never edit production DB manually
- Soft deletes: Add deletedAt instead of DELETE. Preserves data, simplifies recovery. Filter in queries
- Transactions: Group related writes. If any fails, all roll back. Use for financial operations, multi-table updates

COMMON DATABASE MISTAKES:
- No indexes on foreign keys (every FK should be indexed)
- Storing money as float (use integer cents or DECIMAL/NUMERIC)
- No created_at/updated_at timestamps (always add these)
- SELECT * in production (select only needed columns)
- No connection limits (a traffic spike opens 1000 connections and crashes the DB)`
      },
      {
        title: "Frontend and DevOps Essentials",
        content: `FRONTEND AND DEVOPS ESSENTIALS:

MODERN FRONTEND PATTERNS:
- Component architecture: Small, focused, reusable. Props in, events out. Single responsibility
- State management: Local state first. Lift state up only when needed. Global state (Redux/Zustand/Context) only for truly global concerns
- Performance: Lazy load routes and heavy components. Virtualize long lists. Debounce search inputs. Memoize expensive computations
- Accessibility: Semantic HTML first. ARIA labels for custom components. Keyboard navigation. Color contrast. Alt text
- Responsive: Mobile-first CSS. Flexbox/Grid > float/position. Test on real devices, not just browser resize
- Forms: Controlled components, validation on blur + submit, clear error messages, loading states on submit

DEVOPS FUNDAMENTALS:
- CI/CD: Automate testing and deployment. Push to main → run tests → deploy if green. GitHub Actions, GitLab CI, or Vercel
- Environment variables: Never hardcode secrets. Use .env files locally, platform secrets in production
- Docker basics: Dockerfile = build recipe, docker-compose = multi-service orchestration. Reproducible environments
- Monitoring: Application performance (response times, error rates), infrastructure (CPU, memory, disk), business metrics
- Logging: Structured logs (JSON). Levels: debug, info, warn, error. Include request ID for tracing
- Backups: Automated daily database backups. Test restore process. Point-in-time recovery for production DBs

DEPLOYMENT STRATEGIES:
- Vercel/Netlify: Best for frontend + serverless. Zero-config for Next.js, Nuxt, SvelteKit
- Railway/Render: Good for full-stack with databases. Docker-based, auto-scaling
- AWS/GCP/Azure: Maximum control, maximum complexity. Use when you need specific services or scale requirements
- Database hosting: Neon (serverless Postgres), PlanetScale (MySQL), Supabase (Postgres + auth + realtime)`
      },
`);

// Writing & Editing — add 3 more seeds
addSeedsToAgent("writing-editing", `
      {
        title: "Business and Professional Writing Templates",
        content: `BUSINESS AND PROFESSIONAL WRITING TEMPLATES:

EMAIL FRAMEWORKS:
- Cold outreach: [1 personalized line] → [Problem you solve] → [Social proof] → [Low-friction CTA]
- Follow-up: [Reference previous email] → [Add new value/insight] → [Restate CTA]
- Bad news: [Acknowledge] → [Explain decision] → [Offer alternative] → [Express continued commitment]
- Request: [Context in 1 sentence] → [Specific ask] → [Why it matters] → [Deadline if any] → [Thanks]

PROPOSAL STRUCTURE:
1. Executive Summary (1 page max — busy people read only this)
2. Problem Statement (their words, not yours — shows you listened)
3. Proposed Solution (what you'll do, not how — save methodology for appendix)
4. Expected Outcomes (quantified: revenue increase, time saved, risk reduced)
5. Investment (price last, after they understand value)
6. Timeline and Next Steps (make it easy to say yes)

REPORT WRITING:
- Lead with conclusions and recommendations (busy readers may only read page 1)
- Support with data, not opinions. Every claim needs evidence
- Use headings aggressively — readers scan, they don't read linearly
- Executive summary: 1 page. Full report: as long as needed, no longer
- Appendices for supporting data, methodology, raw numbers

MEETING NOTES:
- Date, attendees, purpose (top)
- Decisions made (bold and prominent)
- Action items with owner + deadline (most important section)
- Key discussion points (brief, not transcript)
- Next meeting date/agenda (bottom)`
      },
      {
        title: "Creative Writing Techniques",
        content: `CREATIVE WRITING TECHNIQUES:

FICTION CRAFT:
- Show, don't tell: "Her hands trembled as she opened the letter" > "She was nervous"
- Dialogue: Each character should sound different. Read aloud. Cut "he said/she said" where clear from context
- Conflict on every page: External (obstacles), internal (doubts), interpersonal (disagreements)
- Start late, end early: Enter scenes at the latest possible moment, leave at the earliest
- Specific > general: "A 1987 Toyota Corolla with a cracked windshield" > "An old car"
- Kill your darlings: If a beautiful sentence doesn't serve the story, cut it

STORY STRUCTURE:
- Three-act: Setup (25%) → Confrontation (50%) → Resolution (25%)
- Hero's journey: Ordinary world → Call → Threshold → Trials → Ordeal → Reward → Return
- Save the Cat: 15 beats from Opening Image to Final Image (Blake Snyder framework)
- For short stories: In late, one central conflict, ambiguity is OK in ending

CHARACTER DEVELOPMENT:
- Give them a want (external goal) AND a need (internal growth)
- Flaws make characters relatable. Perfect characters are boring
- Backstory informs behavior but should be revealed gradually, not dumped
- Dialogue reveals character: word choice, sentence length, what they avoid saying
- Characters should change by the end. If they don't, why tell the story?

POETRY BASICS:
- Sound matters as much as meaning. Read aloud. Listen for rhythm, rhyme, assonance
- Line breaks are decisions — they control pacing and emphasis
- Concrete images > abstract concepts. "The smell of coffee at 6am" > "Morning comfort"
- Every word earns its place. If you can cut it without losing meaning, cut it`
      },
      {
        title: "Editing Checklists by Document Type",
        content: `EDITING CHECKLISTS BY DOCUMENT TYPE:

BLOG POST / ARTICLE:
- [ ] Headline: specific, compelling, under 60 characters for SEO?
- [ ] Hook: Does the first sentence make you want to read the second?
- [ ] Subheadings: Could a reader skim subheadings and get the main points?
- [ ] Paragraphs: Max 3-4 sentences each? One idea per paragraph?
- [ ] Links: Internal links to related content? External links to sources?
- [ ] CTA: Clear next action for the reader at the end?
- [ ] SEO: Primary keyword in title, H1, first 100 words, meta description?

ACADEMIC PAPER:
- [ ] Thesis: Clearly stated, arguable, and specific?
- [ ] Evidence: Every claim supported with citation or data?
- [ ] Counterarguments: Addressed and rebutted (strengthens your argument)?
- [ ] Citations: Consistent format throughout (APA, MLA, Chicago)?
- [ ] Abstract: Summarizes purpose, method, findings, conclusion in 150-300 words?
- [ ] Transitions: Each paragraph connects logically to the next?

EMAIL:
- [ ] Subject line: Specific and action-oriented?
- [ ] Length: Could this be shorter? (Almost always yes)
- [ ] Ask: Is the request clear and specific?
- [ ] Tone: Appropriate for the relationship and context?
- [ ] Reply-ability: Is it easy for the recipient to respond?

UNIVERSAL CHECKS:
- [ ] Read aloud: Does it sound natural? Any tongue-twisters?
- [ ] Cut 10%: Can you remove 10% of words without losing meaning? Try it
- [ ] Jargon: Would your target reader understand every term?
- [ ] Passive voice: Less than 10% of sentences? (Check with Hemingway app)
- [ ] Consistency: Same terminology, formatting, capitalization throughout?`
      },
`);

// Health & Wellness — add 3 more seeds
addSeedsToAgent("health-wellness-coach", `
      {
        title: "Fitness Programming Concepts (General Education)",
        content: `FITNESS PROGRAMMING CONCEPTS — GENERAL EDUCATION:

DISCLAIMER: These are general fitness concepts from widely accepted exercise science. Individual needs vary significantly. Always consult a qualified fitness professional or healthcare provider before starting a new exercise program.

PROGRESSIVE OVERLOAD PRINCIPLE:
- The body adapts to stress. To continue improving, gradually increase the demand
- Ways to progress: more weight, more reps, more sets, less rest, better form, more range of motion
- General guideline: increase total volume by approximately 5-10% per week when comfortable
- Deload: Every 4-6 weeks, reduce volume by 40-50% to allow recovery and prevent overtraining

EXERCISE CATEGORIES:
- Compound movements: Work multiple joints/muscle groups (squats, deadlifts, bench press, rows, overhead press). Most efficient for overall strength
- Isolation movements: Target single muscle groups (bicep curls, leg extensions). Good for addressing weaknesses
- Cardiovascular: Aerobic (steady-state running, cycling, swimming) and anaerobic (intervals, sprints)
- Flexibility/mobility: Stretching, yoga, foam rolling. Important for injury prevention and movement quality

GENERAL WORKOUT STRUCTURE:
- Warm-up (5-10 min): Light cardio + dynamic stretching relevant to the workout
- Main work (30-45 min): Compound movements first (when freshest), then isolation/accessories
- Cool-down (5-10 min): Light cardio + static stretching
- Frequency: Major muscle groups generally benefit from 2x/week stimulus (per most exercise science guidelines)

RECOVERY FUNDAMENTALS:
- Sleep: Most important recovery tool. Growth hormone peaks during deep sleep
- Nutrition: Protein intake supports muscle repair. Adequate calories fuel recovery
- Rest days: Active recovery (walking, light stretching) can be more beneficial than complete inactivity
- Hydration: Dehydration impairs performance before you feel thirsty. Stay ahead of thirst
- Soreness: DOMS (Delayed Onset Muscle Soreness) is normal for new exercises. Not an indicator of workout quality
- Signs of overtraining: Persistent fatigue, decreased performance, increased illness, mood changes, poor sleep`
      },
      {
        title: "Nutrition Education Frameworks (General Information)",
        content: `NUTRITION EDUCATION FRAMEWORKS — GENERAL INFORMATION:

DISCLAIMER: These are general nutrition concepts. Individual nutritional needs vary based on age, activity level, health conditions, and medications. Consult a registered dietitian for personalized nutrition guidance.

MACRONUTRIENT BASICS:
- Protein: Building blocks for muscle, immune function, enzymes. Sources: meat, fish, eggs, legumes, dairy, tofu
- Carbohydrates: Primary energy source, especially for brain and intense exercise. Sources: grains, fruits, vegetables, legumes
- Fat: Essential for hormones, cell membranes, vitamin absorption. Sources: nuts, seeds, avocado, olive oil, fatty fish
- Each macronutrient serves important functions. Extreme restriction of any one category may have consequences

GENERAL BALANCED EATING PRINCIPLES:
- Plate method (simple framework): 1/2 plate vegetables/fruits, 1/4 plate protein, 1/4 plate whole grains/starch
- Eat mostly whole foods. Minimize ultra-processed foods when practical
- Hydration: Water is ideal. Approximately 8 cups daily as a starting point, more with exercise and heat
- Meal timing: Consistency matters more than perfect timing. Regular meals help maintain energy
- Fiber: Important for digestive health and satiety. Fruits, vegetables, whole grains, legumes

COMMON NUTRITION APPROACHES (educational overview, not recommendations):
- Calorie awareness: Understanding energy balance can be informative. Apps like MyFitnessPal provide data
- Mediterranean diet: Emphasized by many health organizations. Focus on whole grains, fish, olive oil, vegetables
- Intermittent fasting: Time-restricted eating patterns. Research is mixed. May work for some, not others
- Plant-based: Can meet all nutritional needs with planning. B12 supplementation commonly recommended

IMPORTANT CAUTIONS:
- Extreme calorie restriction can be harmful. If considering significant changes, consult a professional
- Supplements are not replacements for balanced eating. Most people get adequate nutrients from food
- "Detox" diets have no scientific backing. Your liver and kidneys handle detoxification
- Weight is influenced by many factors beyond calories: genetics, hormones, sleep, stress, medications`
      },
      {
        title: "Sleep Science and Stress Management Education",
        content: `SLEEP SCIENCE AND STRESS MANAGEMENT — GENERAL EDUCATION:

SLEEP SCIENCE BASICS:
- Sleep architecture: Cycles of NREM (light → deep) and REM (dreaming). Each cycle approximately 90 minutes
- Deep sleep: Physical recovery, immune function, growth hormone release. Mostly in first half of night
- REM sleep: Memory consolidation, emotional processing, creativity. Mostly in second half of night
- Chronotype: Some people are naturally early birds, others night owls. Working with your chronotype improves sleep quality

SLEEP HYGIENE PRINCIPLES (widely recommended practices):
- Consistency: Same bedtime and wake time, even weekends. Most important single factor
- Environment: Cool (around 65-68F/18-20C), dark (blackout curtains or eye mask), quiet (earplugs or white noise)
- Wind-down routine: 30-60 minutes of low-stimulation activity before bed (reading, stretching, meditation)
- Screen consideration: Blue light may affect melatonin production. Many experts recommend limiting screens 1-2 hours before bed
- Caffeine awareness: Half-life is 5-6 hours. Afternoon coffee may affect some people's sleep
- Alcohol note: May help falling asleep but disrupts sleep quality, especially REM sleep

STRESS MANAGEMENT TECHNIQUES (evidence-supported):
- Deep breathing: 4-7-8 technique (inhale 4 counts, hold 7, exhale 8) activates parasympathetic nervous system
- Box breathing: 4-4-4-4 (inhale, hold, exhale, hold — each 4 counts). Used by Navy SEALs for acute stress
- Progressive muscle relaxation: Tense then release each muscle group from toes to head. Reduces physical tension
- Journaling: Writing about stressors can reduce their emotional intensity. Even 10 minutes has measured effects
- Nature exposure: Research suggests time in nature reduces cortisol levels. Even 20 minutes in a park shows benefits
- Social connection: Strong social ties are consistently associated with better stress management and overall health

WHEN TO SEEK PROFESSIONAL HELP:
- Persistent sleep issues beyond 2-3 weeks despite good sleep hygiene
- Stress/anxiety interfering with daily functioning, work, or relationships
- Physical symptoms without clear medical cause (chronic headaches, digestive issues, chest tightness)
- Feelings of hopelessness, persistent sadness, or loss of interest lasting more than 2 weeks
"Please talk to a healthcare provider. These could be signs that professional support would be really valuable."`
      },
`);

// Academic Tutor — add 3 more seeds
addSeedsToAgent("academic-tutor", `
      {
        title: "Math Problem-Solving Frameworks",
        content: `MATH PROBLEM-SOLVING FRAMEWORKS:

POLYA'S 4-STEP METHOD (works for any math problem):
1. UNDERSTAND: What is given? What is asked? Can you draw a picture? Can you restate in your own words?
2. PLAN: Have you seen a similar problem? What strategy might work? (List below)
3. EXECUTE: Carry out the plan carefully. Show every step. Check each step as you go
4. REVIEW: Does the answer make sense? Can you verify it? Can you solve it a different way?

PROBLEM-SOLVING STRATEGIES:
- Draw a picture/diagram (geometry, word problems, rates)
- Make a table or organized list (combinatorics, patterns)
- Look for a pattern (sequences, series, number theory)
- Work backwards (when you know the answer but not the starting point)
- Guess and check (when other methods aren't obvious — refine guesses systematically)
- Break into smaller problems (complex multi-step problems)
- Use variables (translate words into algebra)
- Consider extreme/special cases (what happens when x=0? When x is very large?)

COMMON MATH MISTAKES AND HOW TO AVOID THEM:
- Sign errors: Write each step. Don't do algebra in your head. Double-check negatives
- Distribution errors: a(b+c) = ab + ac, NOT ab + c. Distribute to EVERY term
- Fraction errors: a/(b+c) ≠ a/b + a/c. Can't split a denominator
- Exponent rules: x^a × x^b = x^(a+b), NOT x^(a×b). (x^a)^b = x^(a×b). x^0 = 1
- Order of operations: PEMDAS/BODMAS. Exponents before multiplication. Multiplication before addition
- Unit conversion: Always write units. Cancel them like fractions. If units don't work out, the formula is wrong

SUBJECT-SPECIFIC TIPS:
- Algebra: Isolate the variable. Whatever you do to one side, do to the other. Check by substituting back
- Geometry: Draw it. Label everything. Look for similar triangles, parallel lines, right angles
- Calculus: Derivatives = instantaneous rate of change. Integrals = accumulated total. They're inverses
- Statistics: Always check: what does this number MEAN in context? A p-value of 0.03 means there's a 3% probability of seeing this result if the null hypothesis is true
- Word problems: Translate one phrase at a time. "3 more than twice x" = 2x + 3, NOT 3 + 2 + x`
      },
      {
        title: "Science Learning Methodology",
        content: `SCIENCE LEARNING METHODOLOGY:

HOW TO LEARN SCIENCE EFFECTIVELY:
- Science is not memorization — it's understanding WHY things happen
- Learn concepts before formulas. If you understand the concept, the formula makes sense
- Draw diagrams, flowcharts, and concept maps. Visual representation aids scientific thinking
- Connect to real life: "Why does ice float? Because water expands when it freezes (hydrogen bonding)"
- Lab work: The purpose isn't the result — it's understanding the METHOD and WHY you did each step

SCIENTIFIC METHOD (the foundation of all science):
1. Observation: Notice something interesting or puzzling
2. Question: Turn observation into a specific, testable question
3. Hypothesis: Propose an explanation. Must be FALSIFIABLE (you could prove it wrong)
4. Experiment: Design a test. Control variables (change ONE thing). Have a control group
5. Analyze: Look at the data objectively. Does it support or refute the hypothesis?
6. Conclude: What did you learn? What new questions arose? Science is iterative

SUBJECT-SPECIFIC APPROACHES:
- Biology: Think in systems (cell → tissue → organ → organism → ecosystem). Function follows structure
- Chemistry: Atoms are building blocks. Understand electron behavior and everything else follows
- Physics: Start with the concept (energy, force, motion). Then apply the math. Units always guide you
- Earth Science: Think in timescales and cycles (rock cycle, water cycle, carbon cycle). Processes are slow but powerful
- Computer Science: Logic and problem decomposition. Every complex program is simple steps chained together

READING SCIENTIFIC TEXTS:
- Read the abstract/summary first to understand the main point
- Look at figures and tables — they often tell the story faster than text
- Don't skip over words you don't understand — look them up. Scientific vocabulary is precise
- After each section, pause and summarize in your own words. If you can't, re-read

LAB REPORT STRUCTURE:
- Title: Specific and descriptive
- Introduction: Background + hypothesis + why this matters
- Methods: What you did (detailed enough that someone could repeat it)
- Results: What happened (data, tables, graphs — no interpretation yet)
- Discussion: What it means, errors, improvements, connection to hypothesis
- Conclusion: 2-3 sentences summarizing key finding`
      },
      {
        title: "Essay Writing and Research Skills",
        content: `ESSAY WRITING AND RESEARCH SKILLS:

ESSAY STRUCTURE:
- Thesis statement: 1 sentence that states your ARGUMENT (not topic). "X is true because A, B, and C"
- Introduction: Hook → context → thesis. The thesis is the LAST sentence of the intro
- Body paragraphs: Topic sentence → evidence → analysis → transition. EACH paragraph proves ONE point
- Conclusion: Restate thesis (different words) → summarize key points → broader significance. NO new information
- Length: Follow the assignment. If no guideline, quality > quantity. Say what you need to say, then stop

THE EVIDENCE SANDWICH:
1. Claim: State your point (topic sentence)
2. Evidence: Quote, data, or specific example that supports the claim
3. Analysis: Explain HOW the evidence supports your claim. This is the most important part — don't just drop quotes

RESEARCH SKILLS:
- Start broad (Wikipedia for overview), then go specific (academic databases for evidence)
- Databases: Google Scholar (free), JSTOR, PubMed (science), your school library portal
- Evaluate sources: Who wrote it? When? Where published? What evidence do they provide? Do other sources agree?
- Primary vs secondary: Primary = original source (experiment, speech, document). Secondary = someone analyzing a primary source
- Citation management: Use Zotero (free), EasyBib, or your school's tool. Don't manually format citations

COMMON ESSAY MISTAKES:
- Too broad thesis: "Technology is changing the world" (too vague) vs "Social media has increased political polarization among 18-24 year olds by creating ideological echo chambers" (specific, arguable)
- Summary instead of analysis: Don't retell what happened. Explain WHY it matters and HOW it proves your point
- Dropped quotes: Never plop a quote in with no context. Introduce it, then explain it
- Weak transitions: "Another point is..." → "Building on this evidence, the economic impact reveals..."
- No counterargument: Addressing opposing views and rebutting them STRENGTHENS your essay
- Conclusion repeats intro word-for-word: Synthesize, don't copy-paste`
      },
`);

// E-Commerce Store Builder — add 3 more seeds
addSeedsToAgent("ecommerce-store-builder", `
      {
        title: "E-Commerce Email Marketing Flows",
        content: `E-COMMERCE EMAIL MARKETING FLOWS:

ESSENTIAL AUTOMATED FLOWS (set up before spending on ads):
1. Welcome Series (3-5 emails over 7 days):
   - Email 1 (immediate): Welcome + brand story + discount code (10-15% off first order)
   - Email 2 (Day 2): Best sellers + social proof (reviews, UGC photos)
   - Email 3 (Day 4): Brand values/mission + behind the scenes
   - Email 4 (Day 6): Reminder of discount expiring + urgency

2. Abandoned Cart (3 emails over 48 hours):
   - Email 1 (1 hour): "You left something behind" + product image + link back to cart
   - Email 2 (24 hours): Social proof + FAQ/objection handling
   - Email 3 (48 hours): Discount (5-10%) or free shipping + FINAL reminder urgency
   - Expected recovery rate: 5-15% of abandoned carts

3. Post-Purchase (4 emails over 30 days):
   - Email 1 (immediate): Order confirmation + shipping timeline + "what to expect"
   - Email 2 (delivery day): Shipping confirmation + usage tips
   - Email 3 (7 days after delivery): Review request + UGC photo request
   - Email 4 (30 days): Replenishment reminder OR cross-sell related products

4. Win-Back (3 emails for 60-90 day inactive customers):
   - Email 1: "We miss you" + what's new + incentive
   - Email 2: Bigger incentive + social proof of what they're missing
   - Email 3: Last chance + "Should we remove you from our list?" (reactivation or clean list)

EMAIL PLATFORM COMPARISON:
- Klaviyo ($20-150+/mo): Best for e-commerce. Deep Shopify integration. Advanced segmentation. Industry standard
- Mailchimp ($13-350/mo): Good for beginners. Easy drag-and-drop. Less e-commerce-specific
- Omnisend ($16-150+/mo): Strong e-commerce features. SMS included. Good value

TARGET: Email should drive 20-30% of total store revenue for healthy e-commerce businesses`
      },
      {
        title: "E-Commerce SEO and Product Photography",
        content: `E-COMMERCE SEO AND PRODUCT PHOTOGRAPHY:

E-COMMERCE SEO:
- Collection pages > product pages for SEO (target "mens running shoes" on collection, not individual shoe)
- URL structure: /collections/mens-running-shoes, /products/nike-air-max-90-black (clean, keyword-rich)
- Title tags: Primary Keyword - Secondary Detail | Brand Name (under 60 characters)
- Meta descriptions: Include a benefit and CTA (under 155 characters). "Shop premium running shoes with free returns"
- Image alt text: Descriptive, includes keyword naturally. "Black Nike Air Max 90 running shoe side view"
- Internal linking: Link related products. Link collection pages from blog content
- Blog content: Target informational keywords ("best running shoes for flat feet") → link to product collections
- Technical: Fast page load (<3 seconds), mobile-optimized, structured data (Product schema for rich snippets)
- Reviews: User-generated content with keywords naturally helps SEO + conversion

PRODUCT PHOTOGRAPHY:
- Minimum 5 images per product: Hero (white background), lifestyle (in use), detail/texture close-up, scale reference, packaging
- White background: The e-commerce standard. Clean, professional, focuses attention on product
- Lifestyle shots: Show the product in real use. Creates emotional connection. Highest engagement on social
- Consistency: Same lighting, background, and style across all products. Brand cohesion
- Mobile-first: 70%+ of e-commerce traffic is mobile. Images must look great at small sizes

DIY PRODUCT PHOTOGRAPHY (budget):
- Lightbox ($30-50): Amazon portable photo studio. White background built in
- Phone camera: Modern phones (iPhone 13+, Samsung S21+) are adequate for most products
- Natural light: Shoot near a large window, diffused light. No direct sunlight (harsh shadows)
- Editing: Snapseed (free), Lightroom Mobile ($10/mo), Canva (free tier)
- Consistency tool: Mark your shooting position and lighting setup. Recreate exactly for every product

PROFESSIONAL PHOTOGRAPHY:
- Cost: $25-75 per product for white background, $50-200 per product for lifestyle
- When to invest: Once you have proven sellers. Don't photograph 100 products before validating demand
- Platforms: Soona ($39/photo), local photographers, Fiverr (variable quality)`
      },
      {
        title: "Customer Retention and Lifetime Value Optimization",
        content: `CUSTOMER RETENTION AND LIFETIME VALUE OPTIMIZATION:

WHY RETENTION > ACQUISITION:
- Acquiring a new customer costs 5-7x more than retaining an existing one
- A 5% increase in retention can increase profits by 25-95% (Harvard Business Review)
- Repeat customers spend 67% more than new customers on average
- Your best marketing channel is your existing customer base

RETENTION STRATEGIES:
- Loyalty program: Points per purchase, tiered rewards, early access to new products. Tools: Smile.io, Yotpo, LoyaltyLion
- Subscription model: Convert one-time purchases to recurring. Works for consumables, curated boxes, access/membership
- Post-purchase experience: Unboxing experience, handwritten thank-you notes (for early stage), surprise gifts for repeat buyers
- Community: Facebook group, Discord, or branded community. Turns customers into advocates
- Personalization: Product recommendations based on purchase history. Email segments by behavior

CUSTOMER LIFETIME VALUE (LTV) CALCULATION:
- Simple LTV = Average Order Value × Purchase Frequency × Average Customer Lifespan
- Example: $50 AOV × 3 purchases/year × 2 years = $300 LTV
- Healthy LTV:CAC ratio is 3:1 or higher (customer is worth 3x what you paid to acquire them)
- If LTV:CAC < 1:1, you lose money on every customer. Fix retention or reduce acquisition cost

INCREASING AOV:
- Bundle offers: "Complete the look" or "Frequently bought together" (10-30% AOV lift)
- Free shipping threshold: Set 20-30% above current AOV. "Free shipping over $75" when AOV is $55
- Upsells: Offer premium version at checkout. "Upgrade to the Pro for just $20 more"
- Cross-sells: Complementary products on product page and in cart. "Goes great with..."
- Quantity discounts: "Buy 2, get 10% off" or "3 for $99" (from $40 each)

REDUCING CHURN:
- Win-back emails at 60, 90, 120 days of inactivity
- Re-engagement SMS with exclusive offer
- Subscription management: Easy pause/skip (not just cancel). Reduces churn 20-40%
- Exit survey: "Why are you leaving?" data informs retention strategy
- Customer service: Fast, empathetic, empowered to resolve. Great service = repeat business`
      },
`);

// Legal Basics — add 3 more seeds
addSeedsToAgent("legal-basics-reviewer", `
      {
        title: "Employment Law Basics (General Education)",
        content: `EMPLOYMENT LAW BASICS — GENERAL EDUCATION:

DISCLAIMER: This is general legal education, NOT legal advice. Employment laws vary significantly by state/country and change frequently. Consult an employment attorney for specific situations.

EMPLOYEE vs INDEPENDENT CONTRACTOR:
- Key factors (IRS and DOL consider): behavioral control, financial control, relationship type
- Employee: Company controls when/where/how work is done, provides tools, sets schedule, withholds taxes
- Contractor: Controls own schedule/methods, provides own tools, works for multiple clients, invoices for payment
- Misclassification risks: Back taxes, penalties, benefits owed. Major enforcement focus area
- "1099 vs W-2" is shorthand but the SUBSTANCE of the relationship matters, not what you call it

AT-WILL EMPLOYMENT:
- Most US states: Either party can end employment at any time, for any reason (or no reason) — with exceptions
- Exceptions: Cannot fire for discriminatory reasons (race, sex, religion, age, disability, pregnancy)
- Cannot fire for retaliation (reporting safety violations, filing workers' comp, whistleblowing)
- Cannot fire in violation of an employment contract's specific terms
- Written policies (employee handbook) can sometimes create implied contracts

NON-COMPETE AGREEMENTS (general awareness):
- Purpose: Prevent employees from immediately competing after leaving
- Enforceability: Varies DRAMATICALLY by state. California generally won't enforce them. Others require "reasonable" scope
- FTC proposed ban: As of 2024-2025, federal regulation is evolving. Check current status
- Key factors for enforceability: geographic scope, time period, industry scope, consideration provided
- If asked to sign one: "I recommend having an employment attorney review this before signing"

COMMON EMPLOYMENT DOCUMENT TYPES:
- Offer letter: Outlines position, salary, start date, basic terms. Usually not a binding contract
- Employment agreement: More formal, may include non-compete, IP assignment, severance terms
- NDA/Confidentiality: Protects company's proprietary information. Usually reasonable and enforceable
- IP assignment: You agree that work created during employment belongs to the company. Standard in tech
- Severance agreement: Offered at termination. Often includes release of claims. ALWAYS review with a lawyer before signing`
      },
      {
        title: "Business Formation and Intellectual Property Basics",
        content: `BUSINESS FORMATION AND IP BASICS — GENERAL EDUCATION:

DISCLAIMER: This is general educational information, NOT legal or tax advice. Business structure decisions have significant legal and tax implications. Consult a business attorney and tax professional.

BUSINESS STRUCTURES (educational overview):
- Sole Proprietorship: Simplest. No formation needed. YOU are the business. Full personal liability for business debts
- LLC (Limited Liability Company): Separates personal and business liability. Pass-through taxation. Most popular for small businesses
- S-Corp: Tax election (not a structure). Can reduce self-employment tax for profitable businesses. Requires reasonable salary
- C-Corp: Separate legal entity. Required for VC funding. Double taxation (corporate + personal on dividends). Most complex
- Partnership: Two or more owners. General (shared liability) or Limited (limited partners have limited liability)

WHICH TO CHOOSE (very general guidelines):
- Side hustle: Start as sole proprietor. Form LLC when revenue is meaningful or liability risk exists
- Freelancer/consultant: LLC for liability protection. Consider S-Corp election at $50K+ net income (discuss with CPA)
- Startup seeking investors: C-Corp (Delaware incorporation is standard for VC-backed startups)
- Real estate: LLC per property is common approach for liability isolation

INTELLECTUAL PROPERTY TYPES:
- Copyright: Protects original creative works (writing, code, art, music). Automatic upon creation. Registration strengthens enforcement
- Trademark: Protects brand identifiers (names, logos, slogans). Must be used in commerce. Registration provides nationwide protection
- Patent: Protects inventions and processes. Must be novel, non-obvious, useful. Expensive ($5K-15K+). 20-year protection
- Trade Secret: Protects confidential business information. No registration — must maintain secrecy. (e.g., Coca-Cola formula)

IMPORTANT IP CONSIDERATIONS:
- Work-for-hire: Work created by employees generally belongs to the employer
- Contractor work: Ownership depends on the contract. Get IP assignment in writing
- Open source: Using open source code has license obligations. GPL, MIT, Apache have different requirements
- Domain names: Register your business name as a domain early. Consider .com, .net, and common misspellings
- Trademark search: Before naming your business, search USPTO (free) to avoid conflicts`
      },
      {
        title: "Landlord-Tenant and Small Claims Basics",
        content: `LANDLORD-TENANT AND SMALL CLAIMS — GENERAL EDUCATION:

DISCLAIMER: Landlord-tenant law is EXTREMELY state and city specific. These are general concepts that vary widely by jurisdiction. Consult a local attorney or legal aid organization for specific situations.

LEASE REVIEW CHECKLIST (what to look for):
- Rent amount, due date, late fees, grace period
- Lease term: month-to-month vs fixed term. Auto-renewal terms
- Security deposit: Amount, conditions for return, timeline for return after move-out
- Maintenance responsibilities: What does landlord fix? What is tenant's responsibility?
- Subletting/guests: Can you sublet? Have long-term guests? What are the restrictions?
- Early termination: What happens if you need to break the lease? Penalties? Notice requirements?
- Rent increase: How much notice? Any caps? (Rent control cities have specific rules)

TENANT RIGHTS (general concepts — vary by jurisdiction):
- Habitable conditions: Landlord must maintain the property in livable condition (heat, water, structural safety, pest control)
- Privacy: Landlord generally must provide notice before entering (commonly 24-48 hours except emergencies)
- Security deposit: Most states have rules about maximum amount, how it must be held, and timeline for return
- Retaliation protection: In most states, landlord cannot evict or raise rent in retaliation for reporting code violations
- Discrimination: Fair Housing Act prohibits discrimination based on race, color, religion, sex, national origin, disability, familial status

SMALL CLAIMS COURT (general overview):
- Purpose: Resolve disputes for smaller amounts without needing a lawyer
- Limits: Vary by state ($2,500 to $25,000 depending on jurisdiction)
- Process: File claim → serve defendant → hearing → judge decides
- Evidence: Bring documents, photos, receipts, contracts, text messages, emails. Organized and clearly labeled
- No lawyers (in most states): You represent yourself. Judge will guide the process
- Common cases: Security deposit disputes, property damage, unpaid debts, contractor disputes, minor car accidents

WHEN YOU DEFINITELY NEED A LAWYER:
- Being sued for significant amounts
- Eviction proceedings (as tenant or landlord)
- Employment disputes (discrimination, wrongful termination)
- Contract disputes over $10K+
- Criminal matters of any kind
- Real estate transactions
- Business formation with partners or investors
- Estate planning and wills
"I always recommend consulting a licensed attorney for these situations. Many offer free initial consultations."`
      },
`);

// Real Estate Investing — add 3 more seeds
addSeedsToAgent("real-estate-investing", `
      {
        title: "Property Management Education",
        content: `PROPERTY MANAGEMENT — GENERAL EDUCATION:

DISCLAIMER: This is general educational information about property management concepts. Landlord-tenant laws vary dramatically by jurisdiction. Consult a local attorney and/or licensed property manager.

SELF-MANAGE vs PROPERTY MANAGER:
- Self-manage: Save 8-12% of rent (typical PM fee). More control. More time commitment
- Property manager: Handles tenants, maintenance, emergencies. Worth it at 3+ properties or if you value time highly
- Hybrid: Self-manage locally, hire PM for out-of-state properties
- PM fees typically: 8-12% of monthly rent + 50-100% of first month's rent (placement fee)

TENANT SCREENING FRAMEWORK (general practices):
- Credit check: Look for payment history, debt-to-income ratio, collections, bankruptcies
- Background check: Criminal history, eviction history (laws on what you can consider vary by jurisdiction)
- Income verification: Generally look for 2.5-3x monthly rent in gross income. Pay stubs + employment verification
- References: Previous landlord (ask: would you rent to them again?), employer
- Application: Consistent process for all applicants. Fair Housing compliance is critical
- Fair Housing: NEVER discriminate based on race, color, religion, sex, national origin, disability, familial status

MAINTENANCE PLANNING:
- Emergency fund: Budget 1-2% of property value per year for maintenance
- Preventive maintenance: HVAC servicing (2x/year), gutter cleaning, water heater flush, smoke detector batteries
- Capital expenditure reserve: Save for big-ticket items. Roof ($5-15K), HVAC ($3-8K), water heater ($1-2K), appliances
- Vendor network: Build relationships with reliable plumber, electrician, HVAC tech, handyman BEFORE you need them
- Tenant communication: Clear system for maintenance requests. Respond promptly. Document everything

LEASE FUNDAMENTALS (general concepts):
- Fixed-term (12 months typical): Predictable. Tenant and landlord locked in for the term
- Month-to-month: Flexibility for both parties. Generally requires 30-day notice to terminate
- Key clauses: Rent amount/due date, late fees, maintenance responsibilities, pet policy, guest policy, entry notice requirements
- State-specific addendums: Lead paint disclosure (pre-1978), mold disclosure, bed bug policy (varies by state)
- Always use a state-specific lease template reviewed by a local attorney`
      },
      {
        title: "Real Estate Tax Concepts (General Education)",
        content: `REAL ESTATE TAX CONCEPTS — GENERAL EDUCATION:

DISCLAIMER: This is general educational information about real estate tax concepts. Tax laws are complex, change frequently, and vary by jurisdiction. ALWAYS consult a licensed CPA or tax attorney before making tax-related decisions.

DEPRECIATION (general concept):
- The IRS generally allows residential rental property owners to deduct the building's cost over 27.5 years
- Land is not depreciable — only the building (structure) portion
- Example concept: $200,000 building value / 27.5 years = approximately $7,273/year tax deduction
- This is a "paper loss" — you're deducting money you didn't actually spend this year
- Depreciation recapture: When you sell, the IRS generally taxes back the depreciation you claimed at 25%

1031 EXCHANGE (general concept):
- Allows deferring capital gains tax by reinvesting sale proceeds into a "like-kind" property
- Requirements include: Must identify replacement property within 45 days, close within 180 days
- Must use a Qualified Intermediary (QI) to hold funds — you cannot touch the money
- "Like-kind" is broadly defined for real estate — residential can exchange for commercial and vice versa
- Boot: Any cash or non-like-kind property received may be taxable
- This is a DEFERRAL, not elimination. Tax is due eventually unless you die (stepped-up basis)

COST SEGREGATION (general concept):
- An engineering study that reclassifies building components for faster depreciation
- Instead of 27.5 years for everything, some components (carpet, appliances, landscaping) can be depreciated over 5-15 years
- Accelerates tax deductions into earlier years
- Generally worth considering for properties valued at $500K+ (study costs $5-15K)
- Must be performed by qualified engineers/CPAs

GENERAL TAX DEDUCTION CATEGORIES (consult CPA for specifics):
- Mortgage interest, property taxes, insurance, property management fees
- Repairs and maintenance, utilities paid by landlord, advertising
- Travel to/from rental property (mileage or actual expenses)
- Professional fees (accountant, attorney, property manager)
- Home office deduction if managing properties as a business

IMPORTANT: Real estate tax strategy is one of the most complex areas of tax law. A good real estate CPA pays for themselves many times over. This is NOT an area to DIY.`
      },
      {
        title: "Market Analysis and Deal Evaluation Frameworks",
        content: `MARKET ANALYSIS AND DEAL EVALUATION — EDUCATIONAL FRAMEWORKS:

DISCLAIMER: These are educational frameworks for understanding real estate market analysis. They are NOT investment recommendations. All real estate investments carry risk. Consult licensed professionals before making investment decisions.

MARKET ANALYSIS FRAMEWORK:
- Population growth: Growing population = growing demand. Check Census data, local economic development reports
- Job growth: Employment drives housing demand. Diversified employment base is safer than single-employer towns
- Rent-to-price ratio: Monthly rent / property price. Higher = potentially better cash flow. Markets vary widely
- Supply pipeline: How many new units are being built? Oversupply can suppress rents and prices
- Landlord-friendliness: Some states/cities are more landlord-friendly (eviction process, rent control, regulations)
- Appreciation history: Past appreciation doesn't guarantee future, but trends and fundamentals matter

DEAL ANALYSIS WALKTHROUGH (hypothetical example numbers):
Purchase price: $200,000 | Down payment: $50,000 (25%) | Loan: $150,000 at 7% (30yr) | Monthly payment: $998

Income: Gross rent $1,800/mo = $21,600/year
Expenses (general estimates):
- Vacancy (5%): $1,080
- Property management (10%): $2,160
- Maintenance (10%): $2,160
- Property taxes: $2,400 (varies widely by area)
- Insurance: $1,200
- Total expenses: $9,000

Net Operating Income: $21,600 - $9,000 = $12,600
Debt service: $998 × 12 = $11,976
Cash flow: $12,600 - $11,976 = $624/year ($52/month)

Cap rate: $12,600 / $200,000 = 6.3%
Cash-on-cash: $624 / $50,000 = 1.2%

Analysis: Low cash flow with these hypothetical numbers. This example shows why running numbers matters — the deal may or may not meet an investor's criteria depending on their goals (appreciation vs cash flow).

DUE DILIGENCE CHECKLIST (general items):
- Physical inspection: Roof, foundation, HVAC, plumbing, electrical, water heater age, appliance condition
- Financial verification: Actual rent rolls (not pro forma), actual expense history, utility costs, tax records
- Title search: Clean title, no liens, no encumbrances
- Environmental: Flood zone check, lead paint (pre-1978), mold, asbestos
- Zoning: Verify current and planned zoning. Zoning changes can help or hurt value
- Comparable sales: What have similar properties sold for recently? (Within 0.5 mile, last 6 months)
- Rent comparables: What are similar properties renting for? Verify on Zillow, Rentometer, local listings`
      },
`);

// Podcast Production — add 2 more seeds
addSeedsToAgent("podcast-production", `
      {
        title: "Interview Techniques and Guest Strategy",
        content: `PODCAST INTERVIEW TECHNIQUES AND GUEST STRATEGY:

GUEST BOOKING:
- Start with your network: Colleagues, industry peers, people whose work you admire
- Outreach template: [1 line showing you know their work] → [Your show + audience size] → [Why they'd be a great fit] → [What's in it for them] → [Simple booking link]
- Booking tools: Calendly (free tier), SavvyCal ($12/mo), or Google Calendar appointment slots
- Guest prep doc: Send questions in advance (not a script, just topics). Include show format, episode length, audience description
- Pre-interview call: 10-15 minutes to build rapport, align on topics, set expectations. Not mandatory but elevates quality

INTERVIEW TECHNIQUES:
- Preparation: Research guest thoroughly. Read their book/blog/recent interviews. Don't ask questions they've answered 100 times
- Opening: Start with something personal or unexpected. NOT "Tell us about yourself" (boring for listener)
- Active listening: React naturally. Follow up on interesting threads. Don't stick rigidly to your question list
- Follow-up questions: "Tell me more about that" / "Why do you think that is?" / "What happened next?" — these get the gold
- Silence: Comfortable with 3-5 seconds of silence. Guests often fill silence with their most interesting thoughts
- Challenge gently: "Some people might disagree and say..." — makes for better content than constant agreement
- Closing: "What's one thing you want listeners to take away?" + "Where can people find you?"

REMOTE RECORDING BEST PRACTICES:
- Platform: Riverside.fm ($15/mo) or SquadCast ($20/mo) — record locally on each end (no internet quality issues)
- Backup: Record a Zoom backup simultaneously (lower quality but insurance)
- Guest setup: Send checklist: quiet room, headphones required, close to microphone, disable notifications
- Double-ender: Each person records their own audio locally and sends the file. Best quality possible
- Internet: Wired ethernet if possible. 5Mbps upload minimum. Close unnecessary apps`
      },
      {
        title: "Podcast Audience Growth and Monetization Deep Dive",
        content: `PODCAST AUDIENCE GROWTH AND MONETIZATION:

GROWTH STAGES:
- Episodes 1-10: Focus on format, quality, and consistency. Tell EVERYONE you know. Get early reviews (critical for Apple rankings)
- Episodes 10-25: Guest cross-promotion (guests share with their audience). Submit to all directories. Start social clips
- Episodes 25-50: SEO optimization (episode titles, descriptions, transcripts). Newsletter growth. Appear on other podcasts
- Episodes 50-100: Community building (Discord, Facebook group). Live events. Strategic collaborations
- Episodes 100+: Compounding growth. Focus on superfans and word-of-mouth. The flywheel should be spinning

GROWTH TACTICS THAT WORK:
- Audiogram clips: 30-60 second video clips for social media. Tools: Headliner ($25/mo), Opus Clip, Descript
- Newsletter: Build an email list from day 1. Newsletter subscribers are 3-5x more engaged than casual listeners
- Transcripts: Full episode transcripts boost SEO. Google can index and rank your episodes for relevant searches
- Guest selection: Book guests with engaged audiences, not just big names. 50K engaged followers > 1M passive followers
- Cross-promotion: Appear on other podcasts in your niche. This is the #1 growth channel for podcasts
- Trailer strategy: Create a 2-3 minute show trailer. Pin it. Share it. It's your podcast's elevator pitch

MONETIZATION MODELS:
- Sponsorships (CPM model): $15-25 CPM for pre-roll (beginning), $20-50 CPM for mid-roll (middle). Available at 1,000+ downloads/episode
- Dynamic ad insertion: Host-read or programmatic. Platforms: Megaphone, Spotify for Podcasters, Acast
- Affiliate marketing: Promote products you genuinely use. Amazon Associates (4-8%), niche programs (10-50% recurring SaaS)
- Premium content: Bonus episodes, early access, ad-free. Platforms: Apple Podcasts Subscriptions, Patreon ($5-25/mo tiers), Supercast
- Courses/coaching: Your podcast proves expertise. Convert listeners to students/clients
- Live events: Ticketed live recordings, meetups, conferences. Viable at 10K+ downloads/episode
- Merchandise: Works for personality-driven shows with devoted audiences

REVENUE BENCHMARKS:
- 1,000 downloads/episode: $500-1,500/mo (affiliate + small sponsors)
- 5,000 downloads/episode: $2,000-5,000/mo (sponsors + affiliate + premium)
- 25,000 downloads/episode: $10,000-30,000/mo (major sponsors + multiple revenue streams)
- 100,000+ downloads/episode: $50,000+/mo (live events, courses, major brand deals)

HOSTING PLATFORMS:
- Buzzsprout ($12-24/mo): Best for beginners. Clean interface. Good analytics
- Transistor ($19-99/mo): Best for multiple shows. Team features. Private podcasting
- Spotify for Podcasters (free): Free hosting. Limited analytics. Spotify-first distribution
- Libsyn ($5-150/mo): Oldest platform. Reliable. Advanced analytics at higher tiers
- Podbean ($14-99/mo): Good monetization features built in. Crowdfunding, premium content`
      },
`);

console.log("\\nAll enhancements complete.");

writeFileSync(FILE, content, "utf-8");
const finalLines = content.split("\\n").length;
console.log(`Final file: \${finalLines} lines`);
