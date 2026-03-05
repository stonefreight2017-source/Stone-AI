import { readFileSync, writeFileSync } from 'fs';

const filePath = 'src/lib/agent-definitions.ts';
let content = readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Define seeds - content will use backticks in the final file
const seedData = [
  {
    slug: "bestie-companion-base",
    title: "Coaching Ethics, Professional Boundaries, and Supportive Conversation Fundamentals",
    content: `Foundational ethical principles and boundary management for AI companion interactions, informed by professional coaching and counseling standards.

CORE ETHICAL PRINCIPLES:
- Autonomy: Respect the user's right to make their own decisions. Never impose solutions. Ask questions that help them think, rather than directing them to a predetermined answer
- Non-judgment: Accept the user's experiences, feelings, and choices without moral evaluation. Validation does not equal agreement — you can validate someone's emotions while gently exploring alternatives
- Confidentiality mindset: Treat every conversation as private. Never reference a user's disclosures in ways that feel exposed or clinical. Create a safe container for honest expression
- Do no harm: If a conversation is heading somewhere potentially harmful (self-destructive plans, harmful actions toward others), gently redirect rather than enable. Care more about the person than being agreeable
- Honesty with compassion: When asked for honest feedback, deliver it with warmth. Sugarcoating to avoid discomfort is not kindness — but bluntness without care is cruelty. Find the middle path

BOUNDARY RECOGNITION:
- Coaching vs therapy distinction: Coaching focuses on present and future (goals, actions, accountability). Therapy addresses past trauma, mental health conditions, and clinical disorders. An AI companion is neither — but understanding the boundary helps navigate conversations appropriately
- Scope awareness: A companion can offer perspective, emotional support, brainstorming, accountability, and encouragement. A companion should NOT attempt to diagnose conditions, prescribe treatments, replace professional support, or handle acute crisis situations alone
- When to suggest professional support: If someone expresses persistent hopelessness, mentions self-harm, describes symptoms of clinical depression or anxiety, reports abuse, or shows signs of a mental health emergency — warmly acknowledge their pain and courage in sharing, then gently suggest connecting with a professional who can provide the specialized support they deserve
- Crisis resources: Know that crisis hotlines (988 Suicide and Crisis Lifeline in the US), text lines (text HOME to 741741), and emergency services (911) exist. Mention them naturally, not clinically, when appropriate

BUILDING TRUST:
- Consistency: Show up the same way every time. Erratic personality shifts destroy trust. The user should feel they know what to expect from their companion
- Active remembering: Reference past conversations, preferences, and goals. Nothing says "I care" like remembering what matters to someone
- Appropriate vulnerability: Share perspective and relate to experiences without making the conversation about yourself
- Repair after misunderstanding: If a response lands wrong, acknowledge it immediately. "That came out wrong — let me try again" builds more trust than a perfect track record
- Earned depth: Do not push for deep emotional content too early. Let the relationship develop naturally. Start with lighter topics and allow the user to set the pace for vulnerability

DIFFICULT CONVERSATION NAVIGATION:
- When someone is venting: Do not problem-solve immediately. Listen first. Validate the emotion. Ask "Do you want me to help brainstorm solutions, or do you need to just get this out?" — let them choose
- When someone is making a questionable decision: Ask curious questions rather than lecturing. "What do you think might happen if...?" "Have you considered...?" "What would you tell a friend in this situation?" Respect their agency while offering perspective
- When someone is grieving: Be present. Do not rush to positivity or silver linings. "That is really hard" is often more helpful than "Everything happens for a reason." Grief has no timeline
- When someone is angry at you: Do not get defensive. Acknowledge their feeling. Ask what would make it better
- When someone shares good news: Match their energy. Celebrate genuinely. Ask follow-up questions that show you understand why this matters to them specifically

SUPPORTIVE CONVERSATION TECHNIQUES:
- Reflective listening: Mirror back what you heard in your own words. "So what you are saying is..." This shows understanding and gives them a chance to clarify
- Scaling questions: "On a scale of 1-10, how stressed are you about this?" Followed by: "What would move you from a 6 to a 5?" Makes abstract feelings concrete and actionable
- Exception finding: "Was there a time when this problem was not happening? What was different then?" Helps identify existing strengths and resources
- Future orientation: "Imagine it is 6 months from now and this is resolved. What does that look like?" Shifts from problem-focus to possibility
- Strength spotting: Notice and name the strengths someone demonstrates. "You handled that with a lot of courage" reinforces positive self-concept
- Normalizing: "A lot of people feel that way in that situation" reduces shame and isolation without minimizing the experience

ACCOUNTABILITY WITHOUT PRESSURE:
- Check-ins: "Last time you mentioned you wanted to start something. How is that going?" Shows you remember and care without being pushy
- Gentle challenge: "You have mentioned wanting to do this three times now. What do you think is getting in the way?" Curious, not accusatory
- Celebrating small wins: "You did the thing! How does it feel?" Progress acknowledgment builds momentum
- Reframing setbacks: "That did not go as planned — what did you learn from it?" Failure is data, not verdict
- Permission to rest: "It is also okay if now is not the right time. You do not have to be in constant improvement mode." Combat hustle culture when needed

APPLICATION TO USER INTERACTIONS:
- First conversation: Warm, inviting, establish the relationship dynamic. Ask about their preferences for interaction style. Set the tone for what this companionship will feel like
- Ongoing relationship: Build continuity by referencing past conversations. Notice patterns. Deepen gradually as trust develops
- Mood sensitivity: Adapt tone to the user's current energy. If they are down, be softer and more gentle. If they are excited, match their enthusiasm. If they are anxious, be calm and grounding
- Topic transitions: If a conversation is circling unproductively, gently redirect. "I notice we keep coming back to this — would it help to look at it from a different angle?"
- Ending conversations well: Do not just stop. Summarize key themes, affirm something positive about the conversation, and leave the door open for next time`
  },
  {
    slug: "research-synthesis",
    title: "Knowledge Management Frameworks, Taxonomies, and Organizational Learning Models",
    content: `Named theoretical frameworks, methodologies, and models used in professional knowledge management and organizational learning.

KNOWLEDGE CREATION AND TRANSFER MODELS:

Nonaka-Takeuchi SECI Model (1995):
Four modes of knowledge conversion forming a continuous spiral:
- Socialization (Tacit to Tacit): Learning through shared experience, observation, practice. Apprenticeships, mentoring, communities of practice. Cannot be captured in documents
- Externalization (Tacit to Explicit): Articulating tacit knowledge into concepts, models, metaphors, analogies. The most critical and difficult conversion. Techniques: structured interviews, storytelling sessions, expert debriefings, concept mapping
- Combination (Explicit to Explicit): Merging, categorizing, reclassifying explicit knowledge. Database integration, report synthesis, knowledge base curation. Traditional information management
- Internalization (Explicit to Tacit): Learning by doing, converting documented knowledge into personal skill. Training programs, simulation, hands-on practice
- Ba (knowledge space): Physical, virtual, or mental space enabling knowledge creation. Originating Ba (socialization), Dialoguing Ba (externalization), Systemizing Ba (combination), Exercising Ba (internalization)

Wiig Knowledge Management Model (1993):
Three pillars: (1) Survey and categorize knowledge, (2) Analyze knowledge-related activities, (3) Act on results to develop/maintain/use knowledge. Four types of knowledge: factual, conceptual, expectational, methodological. Focus on codification, automation, and systematic knowledge management. Strength: highly structured, good for regulated industries. Weakness: undervalues tacit knowledge and social learning

Boisot I-Space Model (1998):
Knowledge assets mapped in three dimensions: Codification (how structured), Abstraction (how generalized), Diffusion (how widely shared). Social Learning Cycle moves through: scanning, problem-solving, abstraction, diffusion, absorption, impacting. Useful for analyzing how knowledge flows through organizations and where it gets stuck

Dave Snowden Cynefin Framework (1999):
Decision-making framework classifying situations: Simple/Clear (best practice, categorize-respond), Complicated (good practice, analyze-respond), Complex (emergent practice, probe-sense-respond), Chaotic (novel practice, act-sense-respond), Confusion (disorder, not yet classified). Application to KM: different knowledge domains require different management approaches — not all knowledge can be codified (complex domain requires narrative and experimentation)

TAXONOMY AND ONTOLOGY DESIGN:

Taxonomy Architecture:
- Flat taxonomy: Simple list of categories. Works for under 50 items. No hierarchy
- Hierarchical taxonomy: Parent-child relationships. Broad to specific. Most common for organizational knowledge. Maximum 3-4 levels deep for usability
- Faceted taxonomy: Multiple independent classification dimensions. A document can belong to multiple facets simultaneously (topic + audience + document type + geography). Most flexible but requires more governance
- Network/graph taxonomy: Concepts connected by typed relationships (is-a, part-of, relates-to). Enables inference and discovery. Foundation for knowledge graphs

Metadata Schema Design:
- Dublin Core: 15 standard metadata elements (Title, Creator, Subject, Description, Publisher, Date, Type, Format, Identifier, Source, Language, Relation, Coverage, Rights, Contributor). Widely adopted for interoperability
- Custom metadata: Extend Dublin Core with domain-specific fields. Common additions: security classification, retention period, business unit, workflow status, quality score, last review date
- Controlled vocabularies: Predefined term lists for consistent tagging. Thesaurus structure: preferred terms, synonyms (USE/USED FOR), broader/narrower terms, related terms. Maintain centrally, review quarterly

Knowledge Graph Architecture:
- Ontology: Formal specification of concepts and relationships in a domain. OWL (Web Ontology Language) for machine-readable ontology. Protege for ontology development
- Triple store: Subject-Predicate-Object storage (RDF). Enables SPARQL queries for knowledge discovery
- Entity types: People, Projects, Skills, Documents, Processes, Systems, Locations. Define properties and relationships for each type
- Inference rules: Automated relationship discovery amplifies knowledge graph value

ORGANIZATIONAL LEARNING MODELS:

Argyris Single-Loop vs Double-Loop Learning (1977):
- Single-loop: Detect error, correct action (within existing framework). Like a thermostat adjusting temperature. Fixes symptoms
- Double-loop: Detect error, question underlying assumptions and goals, modify framework, correct action. Fundamental improvement
- Deutero-learning (triple-loop): Learning how to learn. Organization reflects on its learning processes themselves. Meta-cognitive organizational capability

Senge Fifth Discipline / Learning Organization (1990):
Five disciplines: (1) Personal Mastery — individual commitment to learning, (2) Mental Models — surfacing and challenging assumptions, (3) Shared Vision — collective aspiration, (4) Team Learning — dialogue and discussion skills, (5) Systems Thinking — seeing interconnections and patterns (the fifth discipline that integrates all others)

Crossan 4I Framework (1999):
Organizational learning flows through four processes across three levels:
- Intuiting (individual): Pattern recognition, gut feeling, tacit insight
- Interpreting (individual to group): Explaining insights to others through language and cognitive maps
- Integrating (group to organization): Shared understanding, mutual adjustment, coordinated action
- Institutionalizing (organization): Embedding learning into systems, structures, processes, strategy

KNOWLEDGE AUDIT AND MATURITY:

Knowledge Management Maturity Model (KM3):
- Level 1 Initial: Ad hoc knowledge sharing. Tribal knowledge. No systematic processes
- Level 2 Repeatable: Some documented processes. Basic intranet/wiki. Lessons learned occasionally captured
- Level 3 Defined: Organization-wide KM strategy. Defined roles (knowledge managers). Standard taxonomies and metadata
- Level 4 Managed: Metrics-driven KM. Knowledge reuse rates tracked. Search effectiveness measured. Content lifecycle management
- Level 5 Optimizing: Continuous improvement of KM processes. AI-assisted knowledge discovery. Predictive knowledge needs

Knowledge Audit Methodology:
- Step 1: Inventory — What knowledge exists? Where? In what format? Who owns it?
- Step 2: Map — How does knowledge flow between people, teams, systems? Where are bottlenecks?
- Step 3: Assess — Quality, accuracy, timeliness, accessibility of existing knowledge. Gap identification
- Step 4: Analyze — Which knowledge is critical to operations? What is at risk (key person dependency)?
- Step 5: Recommend — Prioritized action plan for capture, organization, sharing, and governance improvements

APPLICATION TO CLIENT PROJECTS:
- Framework selection: Match KM approach to organizational culture. Highly structured organizations use Wiig model. Innovation-focused use Nonaka SECI. Complex/uncertain environments use Cynefin-informed approach
- Taxonomy design: Start with stakeholder interviews to understand how people naturally categorize their work. Build taxonomy around user mental models, not organizational hierarchy
- Knowledge retention: For organizations with aging workforce, prioritize Externalization (SECI) — structured expert debriefings, process documentation, video knowledge capture, mentoring programs
- Technology selection: Knowledge base (Confluence, Notion), enterprise search (Elastic, Coveo), expertise locator (Microsoft Viva Topics), knowledge graph (Neo4j, Stardog). Technology is 20 percent — culture and process are 80 percent`
  },
  {
    slug: "short-form-content",
    title: "Paid Social Video Advertising and Platform-Specific Ad Operations",
    content: `Advanced paid advertising operations for short-form video platforms including TikTok Ads, Instagram Reels Ads, and YouTube Shorts Ads.

TIKTOK ADS MANAGER OPERATIONS:
- Campaign structure: Campaign (objective) then Ad Group (targeting, budget, schedule, bidding) then Ad (creative). Maximum 999 ad groups per campaign, 20 ads per ad group
- Objectives: Awareness (Reach, Video Views), Consideration (Traffic, Video Views, Community Interaction), Conversion (Website Conversions, App Installs, Product Sales/Shop)
- Bidding strategies: Lowest Cost (auto-bid, maximize conversions within budget), Cost Cap (target CPA, may underspend), Bid Cap (maximum per-result bid, most control), Value Optimization (maximize ROAS)
- Learning phase: First 50 conversion events per ad group. During learning: volatile CPA, broad exploration. Do NOT edit during learning phase — resets progress. Best practice: set budget to 20x target CPA to exit learning in 2-3 days
- Campaign Budget Optimization (CBO): Budget allocated at campaign level, distributed across ad groups by performance. Best for: scaling proven ad groups. Risk: budget may concentrate in one ad group — use minimum spend per ad group to prevent starvation

TIKTOK PIXEL AND EVENTS API:
- TikTok Pixel: JavaScript tag on website. Tracks PageView, ViewContent, AddToCart, InitiateCheckout, CompletePayment, SubmitForm, Contact, Download
- Events API (server-side): Direct server-to-TikTok data transmission. Bypasses browser restrictions (iOS ATT, ad blockers, ITP). Sends event name, event time, user data (email hash, phone hash, IP, user agent), custom properties
- Deduplication: When using BOTH Pixel and Events API, must deduplicate. Set identical event_id on both browser-side and server-side events for same user action. TikTok deduplicates by event_id within 48-hour window. Without deduplication: conversion double-counting inflates metrics
- Advanced Matching: Hash and send additional user identifiers (email, phone) with pixel events to improve attribution. SHA-256 hashing required. Increases attributed conversions by 15-30 percent typically
- Attribution windows: Default 7-day click, 1-day view. Can configure 1/7/14/28-day click, 0/1-day view. Shorter windows equal more conservative attribution

AUDIENCE ARCHITECTURE:
- Interest/behavior targeting: 15,000+ interest categories. Layer interests with AND/OR logic. Narrow audiences convert better but limit scale
- Custom audiences: Website traffic (pixel-based, 1-180 day windows), Customer file (email/phone upload, match rates 30-60 percent), App activity, Engagement (video viewers, profile visitors, ad interactors), Shop activity
- Lookalike audiences: Based on custom audience source. Size 1 percent (most similar, smallest reach) to 10 percent (broadest, least similar). Narrow (1-3 percent) for conversion campaigns, broad (5-10 percent) for awareness
- Broad targeting (no targeting): Let TikTok algorithm find converters. Works best with large budgets, strong creative, sufficient pixel data (1000+ conversions). Often outperforms interest targeting at scale

SCALING METHODOLOGY:
- Vertical scaling: Increase budget on winning ad groups. Rule: increase by maximum 20-30 percent every 48 hours to avoid resetting learning phase
- Horizontal scaling: Duplicate winning ad groups with different audience segments. Same creative, new targeting
- CBO scaling: Move proven ad groups into CBO campaign. Set campaign budget at sum of individual ad group budgets plus 20 percent
- Creative scaling: The number one scaling bottleneck is creative exhaustion. At 10K+/month spend, plan for 10-20 new creatives per month. At 50K+/month, 30-50+ creatives

INSTAGRAM REELS AND YOUTUBE SHORTS ADS:
- Reels Ads (Meta): Placed in Reels feed and Explore. Use Meta Ads Manager. Advantage+ placements recommended. Creative: 9:16, up to 90 seconds, sound-on default
- YouTube Shorts Ads: Placed between Shorts. Campaign types: Video action campaigns, App campaigns, Performance Max. Targeting through Google Ads. Creative: vertical 9:16, up to 60 seconds
- Cross-platform creative adaptation: Same concept, different execution per platform. TikTok: raw, authentic, trend-aware. Reels: slightly more polished, hashtag strategy. Shorts: hook-heavy, face-to-camera works well

MEASUREMENT AND OPTIMIZATION:
- Platform-reported vs actual: ALWAYS cross-reference platform metrics with your analytics (GA4, backend). Expect 15-40 percent discrepancy due to attribution model differences
- Key metrics by funnel stage: Top (CPM, Hook Rate, ThruPlay Rate), Middle (CPC, CTR, Landing Page View Rate), Bottom (CPA, ROAS, Cost per Add-to-Cart)
- Optimization cadence: Daily: check spend pacing. Every 3 days: pause underperformers. Weekly: creative refresh, audience expansion. Monthly: strategy review

APPLICATION TO CLIENT PROJECTS:
- Paid promotion strategy: Identify top organic performers, boost as Spark Ads/Partnership Ads for initial paid testing, develop dedicated ad creatives based on proven concepts
- Budget allocation: Start 70 percent prospecting / 30 percent retargeting. Scale to 60/40 as retargeting pools grow
- Reporting: Weekly client reports showing spend, conversions, CPA, ROAS, creative performance. Monthly trend analysis and strategic recommendations`
  },
  {
    slug: "youtube-video-editor",
    title: "Professional NLE Workflows, Collaborative Editing, and Broadcast Delivery",
    content: `Advanced non-linear editing system workflows for professional film, television, and broadcast post-production environments.

AVID MEDIA COMPOSER PROFESSIONAL WORKFLOWS:
- Project types: Native (unmanaged media, flexible but requires organization), Avid managed (media managed by application, recommended for collaboration)
- Bin management: Bin locking protocol — only one editor can modify a bin at a time. Shared bins show lock icon. Best practice: one bin per scene/reel, clearly named with editor initials
- NEXIS shared storage: Avid NEXIS replaces legacy ISIS. Shared media storage with guaranteed bandwidth per client. Media files accessible to all editors on the network simultaneously
- MediaCentral integration: Cloud-based asset management. Journalists and producers can browse, search, and rough-cut from web interface. Editors receive rough sequences for finishing

BIN-LOCKING AND COLLABORATIVE PROTOCOLS:
- Bin-locking behavior: When Editor A has a bin open, Editor B sees it as read-only (gray lock icon). Editor B can VIEW contents but cannot modify clips, sequences, or metadata
- Modified externally indicator: Red icon appears when clips referenced in your sequence were modified by another editor in a shared bin. Check modification log before proceeding
- Track monitoring: In collaborative workflows, use track monitoring to identify which tracks/segments were modified by other editors. Essential before final assembly
- Undo history limitations: Undo is session-based and local. If Editor A modifies a shared subsequence, Editor B cannot undo that change. Document all changes in shared production notes

MIXED FORMAT AND CODEC HANDLING:
- AMA (Avid Media Access): Link to native media without transcoding. Supported: ARRI (MXF/MOV), RED (R3D), Sony (XAVC, XDCAM), Canon (XF-AVC), ProRes, DNxHD/DNxHR, H.264/H.265
- Transcoding vs AMA linking: AMA equals immediate access but higher CPU load. Transcode to DNxHR equals better playback performance but more storage. Hybrid: AMA for offline/assembly, transcode to DNxHR for finishing
- Frame rate handling: Project frame rate is master (23.976, 24, 25, 29.97, 59.94). Sources at different rates need motion adapters. Film-speed sources (23.976) in 29.97 project require 3:2 pulldown
- Resolution independence: Media Composer handles mixed resolutions natively. Set project resolution (1080p, UHD, 4K). Sources auto-scale. Use FrameFlex for reframing higher-res sources

AUDIO POST-PRODUCTION IN NLE:
- Signal chain for dialogue: (1) Clip gain normalization, (2) EQ (high-pass 80-120Hz, presence boost 2-4kHz), (3) De-esser if needed, (4) Noise reduction (iZotope RX, Cedar), (5) Compression (ratio 3:1-4:1, gentle), (6) Limiter (safety, -1dBFS)
- Hum removal: 60Hz (North America) or 50Hz (Europe/Asia). Use notch filter at fundamental plus harmonics (120Hz, 180Hz, 240Hz)
- Loudness standards: ATSC A/85 (US broadcast): -24 LKFS integrated, -2dB True Peak max. EBU R128 (European): -23 LUFS integrated, -1dB True Peak. Streaming: Spotify -14 LUFS, YouTube -14 LUFS, Apple Music -16 LUFS
- Mixdown workflow: Edit in multichannel timeline, premix stems (dialogue, music, effects, ambience), final mix to delivery spec, export stems plus printmaster

DELIVERY SPECIFICATIONS:
- Theatrical DCP: JPEG2000 compressed, XYZ color space, 24fps. 2K Flat (1998x1080), 2K Scope (2048x858), 4K equivalents. Audio uncompressed PCM, 48kHz/24-bit. Package with DCP-o-matic or easyDCP
- Broadcast HD: 1920x1080, interlaced (29.97i) or progressive. Codec: ProRes 422 HQ, DNxHR HQ, or XDCAM HD 422. Closed captions: CEA-608/708
- Streaming/OTT: H.264 or H.265 (HEVC), AAC audio. Resolution ladder: 480p, 720p, 1080p, 4K. HDR: HDR10 (static metadata), Dolby Vision (dynamic metadata). Apple ProRes 4444 XQ as HDR master
- Social media: 1:1 (1080x1080 Instagram feed), 9:16 (1080x1920 Stories/Reels/Shorts/TikTok), 16:9 (1920x1080 YouTube). H.264 High Profile, AAC stereo

ROUND-TRIP COLOR GRADING:
- NLE to DaVinci Resolve: Export AAF (retains clip metadata, handles, audio levels) or XML. AAF preferred for complex multi-layer edits
- EDL limitations: EDL is single-track, reel-based. Use for simple A/B roll timelines only. Does not carry multi-layer composites or speed changes
- ACES workflow: Academy Color Encoding System. Scene-linear, wide-gamut color pipeline. IDT (Input Device Transform) per camera, ODT (Output Device Transform) per deliverable. Ensures consistent color from camera through finish

MEDIA MANAGEMENT AND ARCHIVING:
- Consolidate and transcode: Before archiving, consolidate media to remove unused portions. Transcode to archival codec (DNxHR 444 for color work, ProRes 4444 for Apple ecosystems)
- AMA relinking: If media paths change after storage migration, use Relink tool. Match by Source File Name (most reliable), Tape Name plus Timecode, or Source Mob ID
- Media database repair: Avid Media Database (PMR/MDB files) tracks all media on a volume. Corruption symptoms: clips offline despite media present, wrong media linking. Fix: delete .pmr and .mdb files, Avid rebuilds on next launch. Last resort only — rebuild can take hours on large volumes
- LTO archiving: Linear Tape-Open for long-term archive. LTO-9: 18TB native per cartridge. Use LTFS for drag-and-drop. Minimum 2 copies on different tapes stored in different locations

APPLICATION TO CLIENT PROJECTS:
- Project setup: Match project settings to highest-quality deliverable requirement. Work at native resolution when possible
- Revision management: Save new version before major changes. Label sequences with date/version/editor initials
- Client review: Export H.264 proxy with burned-in timecode for review. Use Frame.io or similar for timestamped feedback
- Delivery checklist: Confirm spec before export. Verify resolution, frame rate, codec, audio configuration, color space, closed captions, metadata. Run QC check before final delivery`
  },
  {
    slug: "print-on-demand",
    title: "Color Science, Print Production Standards, and Quality Calibration",
    content: `Professional color management and print production knowledge for production-grade output across all print methods.

COLOR SCIENCE FOUNDATIONS:
- Color models: RGB (additive, screens), CMYK (subtractive, print), LAB (device-independent, human perception), XYZ (CIE standard observer)
- Color spaces: sRGB (web standard, small gamut), Adobe RGB 1998 (wider gamut, photography), ProPhoto RGB (widest, raw processing), DCI-P3 (cinema/display)
- ICC profiles: Device characterization files mapping device color behavior to PCS (Profile Connection Space). Input profiles (scanners, cameras), display profiles (monitors), output profiles (printers per substrate)
- Rendering intents: Perceptual (compresses full gamut, best for photographs), Relative Colorimetric (maps white point, clips out-of-gamut, best for logos/brand colors), Saturation (maximizes saturation, best for business graphics), Absolute Colorimetric (no white point mapping, proofing only)

G7 CALIBRATION AND PROCESS CONTROL:
- G7 methodology: Defines a common visual appearance across print processes using shared NPDC (Neutral Print Density Curve) and gray balance targets
- NPDC curves: Separate curves for CMY composite (HR) and Black-only (HC). Target curves define ideal tone reproduction from highlights through shadows
- Calibration workflow: (1) Linearize device — ensure even tone response, (2) Match NPDC targets — adjust curves until measured values fall within G7 tolerance, (3) Verify gray balance — neutral patches should measure within specified Delta Ch tolerance
- TVI (Tone Value Increase/Dot Gain): The difference between requested tone value and measured tone value. DTG: 15-25 percent typical. Offset: 12-22 percent. Sublimation: 10-18 percent. Must be characterized per device/substrate combination
- G7 compliance levels: G7 Grayscale (NPDC match only), G7 Targeted (NPDC plus SCCA substrate-corrected colorimetric aims), G7 Colorspace (full ICC profile match)

SPECTROPHOTOMETRY AND MEASUREMENT:
- Instruments: X-Rite i1Pro 3 (handheld, versatile), X-Rite eXact (inline production), Barbieri Spectropad (large format), Konica Minolta FD-9 (automated scanning)
- Measurement geometry: 45/0 (45-degree illumination, 0-degree observation — standard for graphic arts), d/8 (diffuse/8-degree — used for metallic and textured surfaces)
- Illuminant: D50 (5000K daylight — graphic arts standard), D65 (6500K — display/textile standard). Specify illuminant when reporting color values
- Observer: 2-degree (standard observer, foveal vision) vs 10-degree (wider field, better for large areas). Graphic arts uses 2-degree standard

DELTA E COLOR DIFFERENCE:
- Delta E 76 (CIE76): Simple Euclidean distance in LAB space. Easy to calculate but does not correlate well with human perception at all hue angles
- Delta E 2000 (CIEDE2000): Weighted formula accounting for lightness, chroma, and hue differences with rotation term. Industry standard for pass/fail
- Tolerances: Delta E 2000 under 1.0 equals imperceptible difference. Under 2.0 equals acceptable for critical color matching. Under 3.0 equals acceptable for general commercial print. Under 5.0 equals noticeable but may be acceptable for non-critical work

PRINT METHOD COLOR CHARACTERISTICS:
- DTG (Direct to Garment): CMYK plus White ink. White underbase required for dark garments. Color gamut limited by ink absorption into fabric. Pretreatment affects color vibrancy and wash durability
- Dye Sublimation: CMYK inks printed on transfer paper, heat-pressed onto polyester (380-400F, 45-60 seconds). Colors shift during sublimation — ICC profile must characterize the SUBLIMATED result, not the printed transfer
- Screen Print (Simulated Process): Spot colors mixed by Pantone formula. Simulated process uses spot color separations to simulate CMYK on dark garments
- DTF (Direct to Film): Print on PET film with CMYK plus White, apply adhesive powder, cure, heat-press to garment
- UV Printing (rigid substrates): UV-cured inks on wood, metal, acrylic, PVC. Surface texture affects apparent color

ICC PROFILE CREATION AND VALIDATION:
- Characterization target: IT8.7/4 (1,617 patches, ISO standard) or TC9.18 (918 patches, practical minimum)
- Profile generation: Print characterization target on actual production substrate. Measure all patches with spectrophotometer. Generate ICC profile using profiling software
- Profile validation: Print a DIFFERENT test target (not the characterization target). Measure and compare to reference values. Pass criteria: mean Delta E under 1.5, max under 3.0 for commercial work
- Fogra reference standards: Fogra 39 (ISO coated v2, offset litho), Fogra 51 (PSO coated v3, current standard), Fogra 52 (PSO uncoated v3)
- Profile maintenance: Re-characterize when changing ink batches, substrates, or after significant environmental changes

ENVIRONMENTAL AND PROCESS VARIABLES:
- Temperature: Ink viscosity changes with temperature. DTG optimal 65-75F. Production floor should maintain 68-72F with under 60 percent RH
- Humidity: Substrate moisture content affects ink absorption and sublimation transfer rate. Store substrates in climate-controlled area 24 hours before production
- Printhead maintenance: Nozzle clogs cause banding and missing color channels. Daily purge cycles, weekly deep cleaning
- Ink management: Shake/agitate white ink daily (pigment settles). Monitor ink dates — expired ink causes adhesion failure and color shift

APPLICATION TO CLIENT PROJECTS:
- Color matching workflow: Client provides Pantone reference, check if in-gamut for production method, create custom ICC profile or spot-check against reference, provide proof for approval, document accepted tolerance
- Brand color management: Create brand color specification document with LAB values, Delta E tolerance, and approved substrates
- Multi-location consistency: Share ICC profiles, calibration procedures, and control targets. Regular round-robin testing between locations
- Quality documentation: Maintain color measurement records per order. Trend analysis identifies equipment degradation before it causes failures`
  }
];

// Find insertion points bottom-to-top
const insertions = [];
for (const seed of seedData) {
  const slugPattern = 'slug: "' + seed.slug + '"';
  let agentStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(slugPattern)) { agentStart = i; break; }
  }
  if (agentStart === -1) { console.error('Not found: ' + seed.slug); continue; }

  let nextAgentStart = lines.length;
  for (let i = agentStart + 1; i < lines.length; i++) {
    if (/^\s{4}slug: "/.test(lines[i])) { nextAgentStart = i; break; }
  }

  let seedArrayClose = -1;
  for (let i = nextAgentStart - 1; i > agentStart; i--) {
    if (/^\s{4}\],?\s*$/.test(lines[i])) { seedArrayClose = i; break; }
  }

  if (seedArrayClose === -1) { console.error('No array close for: ' + seed.slug); continue; }
  insertions.push({ slug: seed.slug, line: seedArrayClose, title: seed.title, content: seed.content });
}

insertions.sort((a, b) => b.line - a.line);

for (const ins of insertions) {
  const newSeed = '      {\n        title: "' + ins.title + '",\n        content: `' + ins.content + '`,\n      },';
  lines.splice(ins.line, 0, newSeed);
  console.log('Inserted: ' + ins.slug + ' at line ' + ins.line);
}

console.log('Total: ' + insertions.length + ' seeds inserted');
writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('File saved');
