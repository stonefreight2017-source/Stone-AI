/**
 * Seed additional knowledge chunks for the 10 agents with lowest coverage.
 * Inserts directly into local PostgreSQL via pg client.
 * Does NOT generate vector embeddings (requires embedding model).
 * Chunks are inserted with source='seed-expansion' to distinguish from original seeds.
 */
import pg from "pg";
import { randomUUID } from "crypto";

const DATABASE_URL = "postgresql://stoneai:stoneai_dev_2026@localhost:5432/stoneai";

const NEW_SEEDS = {
  "project-management-coach": [
    {
      title: "Waterfall vs Hybrid Methodologies for Traditional Industries",
      content: `WATERFALL AND HYBRID PROJECT MANAGEMENT — When Agile Isn't the Answer:

WATERFALL METHODOLOGY:
- Sequential phases: Requirements → Design → Implementation → Verification → Maintenance
- Best for: Construction, manufacturing, regulatory/compliance projects, government contracts, projects with fixed requirements
- Advantages: Clear milestones, predictable budgets, comprehensive documentation, easy to understand for stakeholders
- Disadvantages: Late feedback, change is expensive, assumes requirements are complete upfront
- Critical path method (CPM): Identify the longest sequence of dependent tasks. Any delay on the critical path delays the entire project
- Gantt charts remain the primary planning tool — MS Project, Smartsheet, or even Excel for smaller projects

HYBRID APPROACHES:
- Water-Scrum-Fall: Waterfall for planning and delivery, Scrum for execution phase. Common in enterprise IT
- Stage-gate with iterations: Traditional gates (concept, feasibility, development, launch) but iterate within each gate
- Best for organizations transitioning from waterfall: introduces agility without abandoning familiar structure
- Key principle: Match methodology to project characteristics, not ideology. A bridge doesn't need sprints. A mobile app doesn't need a 200-page requirements document

WORK BREAKDOWN STRUCTURE (WBS):
- Decompose deliverables hierarchically: Project → Phase → Deliverable → Work Package → Activity
- 100% rule: Every level must capture 100% of the work — no gaps, no overlaps
- 8/80 rule: Work packages should take between 8 hours (1 day) and 80 hours (2 weeks)
- WBS dictionary: Define each element with scope, owner, acceptance criteria, dependencies
- Use as the foundation for scheduling, budgeting, and resource allocation

EARNED VALUE MANAGEMENT (EVM):
- Three key metrics: Planned Value (PV), Earned Value (EV), Actual Cost (AC)
- Schedule Performance Index (SPI) = EV/PV — above 1.0 means ahead of schedule
- Cost Performance Index (CPI) = EV/AC — above 1.0 means under budget
- Estimate at Completion (EAC) = Budget / CPI — forecasts final project cost
- EVM provides objective, data-driven project health assessment vs. subjective status reports`
    },
    {
      title: "Remote and Distributed Team Management",
      content: `MANAGING REMOTE AND DISTRIBUTED PROJECT TEAMS:

COMMUNICATION FRAMEWORK:
- Synchronous (meetings, calls): Reserve for decisions, brainstorming, conflict resolution, team building
- Asynchronous (Slack, email, Loom): Default for status updates, documentation, non-urgent questions
- Rule of thumb: If it needs a decision in <4 hours, synchronous. Otherwise, async
- Time zone management: Identify overlap windows (minimum 2-3 hours). Rotate meeting times to share the burden
- Documentation culture: If it's not written down, it didn't happen. Meeting notes, decision logs, action items — all in writing

TOOLS ECOSYSTEM:
- Project tracking: Jira, Linear, Asana, Monday.com, ClickUp — pick ONE and standardize
- Communication: Slack/Teams for chat, Zoom/Meet for video, Loom for async video updates
- Documentation: Confluence, Notion, or Google Docs — centralize, don't scatter
- Design collaboration: Figma, Miro for whiteboarding and visual collaboration
- Version control: GitHub/GitLab for code, but also useful for document versioning

MEETING HYGIENE:
- Every meeting needs: agenda (shared 24h before), facilitator, note-taker, time limit, action items
- Stand-ups: 15 min max. What I did, what I'm doing, what's blocking me. No problem-solving in stand-ups
- Retrospectives: Every 2 weeks minimum. What went well, what didn't, what to change. Psychological safety is non-negotiable
- One-on-ones: Weekly or biweekly with each team member. Career development, blockers, feedback — not status updates
- Meeting-free days: Protect at least 1-2 days per week for focused work

ACCOUNTABILITY WITHOUT MICROMANAGEMENT:
- Outcome-based tracking: Define what "done" looks like, then trust people to figure out how
- Daily async check-ins: "What did you accomplish? What's your plan? Any blockers?" — text-based, takes 2 minutes
- Velocity/throughput tracking: Use historical data to predict capacity, not gut feeling
- Transparency: Make all work visible (kanban boards, shared dashboards). Visibility replaces surveillance
- Address issues early: If someone misses 2 deadlines in a row, have the conversation. Waiting makes it worse`
    },
    {
      title: "Budget Management and Resource Allocation",
      content: `PROJECT BUDGET MANAGEMENT AND RESOURCE OPTIMIZATION:

BUDGET ESTIMATION METHODS:
- Analogous estimation: Use similar past projects as baseline. Quick but less accurate. Best for early-stage estimates
- Parametric estimation: Use statistical relationships (e.g., cost per line of code, cost per square foot). Requires historical data
- Bottom-up estimation: Estimate each work package individually, sum up. Most accurate, most time-consuming
- Three-point estimation: (Optimistic + 4×Most Likely + Pessimistic) / 6 — accounts for uncertainty
- Always include contingency: 10-15% for known risks, 5-10% management reserve for unknown unknowns

RESOURCE ALLOCATION:
- Resource leveling: Adjust schedule to resolve over-allocation. May extend timeline
- Resource smoothing: Adjust within float/slack. Does not extend timeline
- Skills matrix: Map team members' skills to project needs. Identify gaps early — hiring/training takes time
- Utilization targets: 80% is healthy. 100% means zero slack for unexpected work. >100% guarantees burnout and quality issues
- Shared resources: Negotiate allocation percentages upfront with functional managers. Document agreements

COST CONTROL:
- Baseline budget at project approval. All changes go through change control
- Monthly budget reviews: Compare actual vs. planned. Investigate variances >5%
- Forecast remaining costs monthly — don't wait until you've overspent to discover it
- Common budget killers: scope creep (39% of projects), poor estimation (28%), resource churn (18%), rework (15%)
- Change control process: Request → Impact analysis → Approval (sponsor) → Update baseline → Communicate

VENDOR AND CONTRACTOR MANAGEMENT:
- Fixed-price contracts: Best when scope is clear. Vendor bears cost risk
- Time-and-materials: Best when scope is uncertain. Client bears cost risk
- Cost-plus: Vendor guaranteed profit margin. Use only with trusted partners and audit rights
- Statement of Work (SOW): Scope, deliverables, acceptance criteria, timeline, payment terms, termination clauses
- Manage vendors like team members: regular check-ins, clear expectations, documented acceptance criteria`
    },
    {
      title: "Change Management and Organizational Transformation",
      content: `CHANGE MANAGEMENT IN PROJECT DELIVERY:

WHY PROJECTS FAIL AT CHANGE:
- 70% of change initiatives fail, primarily due to employee resistance and lack of management support
- Technical success ≠ project success. A perfect system nobody uses is a failed project
- Change management is not optional — it's a core project deliverable alongside the technical work

KOTTER'S 8-STEP MODEL (PRACTICAL APPLICATION):
1. Create urgency: Data-driven case for change. "Here's what happens if we don't change" is more powerful than "here's how great the new system will be"
2. Build a guiding coalition: Identify influencers at every level. Get them bought in before the announcement. Peer influence > top-down mandates
3. Form a strategic vision: Clear, simple, memorable. If you can't explain it in 30 seconds, simplify
4. Enlist a volunteer army: Champions and early adopters who model the new behavior
5. Enable action by removing barriers: Training, tools, permissions, process changes — remove everything that makes the old way easier
6. Generate short-term wins: Plan visible, meaningful wins within the first 30-60 days. Momentum matters
7. Sustain acceleration: Don't declare victory too early. The most dangerous phase is when energy drops after initial success
8. Institute change: Embed in culture — processes, KPIs, hiring criteria, performance reviews

RESISTANCE MANAGEMENT:
- Types: Rational (lack of information), Emotional (fear of unknown), Political (loss of power/status)
- For rational resistance: Communicate clearly, frequently, through multiple channels. Answer questions transparently
- For emotional resistance: Empathy first. Acknowledge loss. Provide support, training, and time to adapt
- For political resistance: Involve stakeholders in design. Give them a role in the new order
- The ADKAR model: Awareness → Desire → Knowledge → Ability → Reinforcement

STAKEHOLDER COMMUNICATION DURING CHANGE:
- Identify stakeholders: Map by influence (high/low) and impact (high/low). Focus energy on high-influence, high-impact
- Communication plan: Who needs to know what, when, how, and from whom
- Frequency increases during change: Weekly updates minimum, daily during critical transitions
- Two-way communication: Town halls, Q&A sessions, feedback channels. Broadcast-only communication breeds distrust
- Measure adoption: Usage metrics, feedback surveys, support ticket volumes. Adjust approach based on data`
    },
    {
      title: "Project Recovery and Turnaround Strategies",
      content: `RECOVERING TROUBLED PROJECTS — The PM's Crisis Playbook:

RECOGNIZING A PROJECT IN TROUBLE:
- Red flags: Consistently missed deadlines, budget overruns >15%, stakeholder disengagement, team morale declining, scope creep accelerating, critical defects increasing
- The "watermelon report": Green on the outside (status reports say fine), red on the inside (actual metrics say otherwise). Always validate reported status against data
- If you're asking "is this project in trouble?" — it probably is. Trust your instincts, then verify

IMMEDIATE TRIAGE (FIRST 72 HOURS):
1. Stop the bleeding: Freeze all scope changes. No new features, no nice-to-haves
2. Honest assessment: Audit scope, schedule, budget, quality, and team health. No optimism bias
3. Stakeholder reset: Transparent briefing on actual status. Deliver bad news early — it only gets worse
4. Root cause analysis: Ishikawa/fishbone diagram, 5 Whys, or fault tree analysis. Fix causes, not symptoms
5. Revised plan: Realistic timeline with 20% buffer. Under-promise, over-deliver from here

RECOVERY STRATEGIES:
- Scope reduction: Cut to MVP. What is the minimum that delivers value? Everything else is "Phase 2"
- Fast-tracking: Run parallel activities that were planned sequentially. Increases risk but compresses schedule
- Crashing: Add resources to critical path. Diminishing returns apply — 9 women can't make a baby in 1 month
- De-scoping quality: Risky but sometimes necessary. Reduce testing scope for low-risk features. Document the tech debt
- Team changes: Sometimes the team composition is the problem. Bring in specialists, reassign underperformers, add experienced PM support

COMMUNICATION DURING RECOVERY:
- Daily status: Brief, factual, focused on blockers and progress against recovery plan
- Escalation protocol: Clear thresholds for when to escalate (e.g., any task >2 days late, any budget variance >5%)
- Stakeholder cadence: Weekly briefings with sponsor. Bi-weekly with steering committee. No surprises policy
- Team morale: Acknowledge the difficulty. Celebrate recovery milestones. Shield the team from organizational politics
- Lessons learned: Start capturing them NOW, not at project end. Recovery insights are the most valuable`
    },
  ],

  "translation-localization": [
    {
      title: "Machine Translation Post-Editing (MTPE) Workflows",
      content: `MACHINE TRANSLATION POST-EDITING — Modern Localization Workflows:

MTPE TIERS:
- Light post-editing (LPE): Fix only critical errors — meaning changes, omissions, offensive content. Speed priority. 5,000-8,000 words/hour. Use for: internal docs, knowledge bases, support articles, user-generated content
- Full post-editing (FPE): Ensure fluency, accuracy, style, and cultural appropriateness. Quality priority. 2,000-4,000 words/hour. Use for: marketing content, product UI, legal documents, published content
- Creative adaptation: MT output used as inspiration only. Translator rewrites for emotional impact. Use for: slogans, ad copy, brand messaging. This is essentially transcreation

MT ENGINE SELECTION (2025-2026):
- DeepL: Best for European languages, especially DE/FR/NL/PL. Superior fluency. API from $5.49/month. Custom glossary support
- Google Cloud Translation: Broadest language coverage (130+ languages). Best for Asian languages. AutoML for domain-specific models. $20/million characters
- Microsoft Translator: Best Azure ecosystem integration. Custom Translator for domain adaptation. Good for enterprise workflows
- Amazon Translate: Best AWS integration. Active Custom Translation for real-time domain adaptation
- Open source (NLLB, OPUS-MT): Free, self-hosted, privacy-compliant. Quality varies by language pair. Good for sensitive data

QUALITY METRICS:
- MQM (Multidimensional Quality Metrics): Industry standard. Categories: accuracy, fluency, terminology, style, locale conventions
- Error severity: Critical (meaning change, safety issue), Major (comprehension affected), Minor (style preference)
- BLEU score: Automated metric comparing MT to reference translations. Useful for engine comparison, not for individual segment quality
- TER (Translation Error Rate): Minimum edits needed. Lower = better MT quality
- Human evaluation remains the gold standard. Automated metrics supplement but don't replace human judgment`
    },
    {
      title: "Internationalization (i18n) Best Practices for Developers",
      content: `INTERNATIONALIZATION (I18N) — Technical Implementation Guide:

STRING EXTERNALIZATION:
- Extract ALL user-facing strings to resource files (JSON, XLIFF, .properties, .resx)
- Never hardcode strings in source code. This includes error messages, tooltips, button labels, alt text
- Use key naming conventions: feature.component.element (e.g., checkout.payment.submitButton)
- Support pluralization rules: English has 2 forms (singular/plural). Arabic has 6. Russian has 3. Use ICU MessageFormat or similar
- Handle gender agreement: Some languages require different forms for masculine/feminine/neuter

TEXT HANDLING:
- Unicode everywhere: UTF-8 for storage and transmission. No exceptions in 2025
- Text expansion: German text is 30% longer than English. Finnish can be 60% longer. Japanese is typically shorter. Design UI with expansion room
- Right-to-left (RTL) support: Arabic, Hebrew, Farsi, Urdu. CSS logical properties (inline-start/end vs left/right). Bidirectional text (BiDi) handling for mixed content
- Line breaking: CJK languages don't use spaces between words. Use proper line-breaking algorithms (ICU BreakIterator)
- Text sorting: Locale-aware collation. German ä sorts differently in Germany vs Sweden. Use Intl.Collator in JavaScript

DATE, TIME, AND NUMBER FORMATTING:
- Dates: MM/DD/YYYY (US) vs DD/MM/YYYY (EU) vs YYYY-MM-DD (ISO/East Asia). Use Intl.DateTimeFormat
- Times: 12-hour (US/UK) vs 24-hour (most of world). AM/PM doesn't exist in many languages
- Numbers: 1,234.56 (US/UK) vs 1.234,56 (DE/FR/BR) vs 1 234,56 (FR with spaces). Use Intl.NumberFormat
- Currency: Symbol position varies (€100 in DE, 100€ in FR). Always use locale-aware formatting
- Calendar systems: Gregorian is not universal. Japanese imperial, Islamic Hijri, Thai Buddhist calendars exist. Libraries: Temporal API, Luxon, date-fns

FRAMEWORKS AND LIBRARIES:
- React: react-intl (FormatJS), react-i18next, next-intl for Next.js
- JavaScript: FormatJS (ICU MessageFormat), i18next (most popular), Globalize.js
- Mobile: iOS NSLocalizedString, Android strings.xml with plurals.xml
- File formats: XLIFF 2.0 (industry standard), JSON (developer-friendly), PO/POT (GNU gettext), ARB (Flutter/Dart)
- Translation management: Crowdin, Lokalise, Phrase, Transifex — integrate with CI/CD for continuous localization`
    },
    {
      title: "Legal and Regulatory Translation Requirements",
      content: `LEGAL AND REGULATED CONTENT TRANSLATION:

CERTIFIED TRANSLATION REQUIREMENTS:
- Legal documents: Contracts, patents, immigration documents, court filings require certified translators
- Certified vs. notarized: Certified = translator attests accuracy. Notarized = notary verifies translator's identity. Some jurisdictions require both
- ATA certification (US): American Translators Association certification. The gold standard for legal/medical translation in the US
- Sworn translators (EU): Officially appointed by courts in countries like Germany (beeidigt), France (assermenté), Spain (jurado)
- Certificate of accuracy: Statement by translator that the translation is complete and accurate. Often required for immigration (USCIS), court filings, academic credentials

REGULATED INDUSTRIES:
- Medical/pharma: EU MDR and IVDR require translations of Instructions for Use (IFU) in all languages of countries where device is marketed. FDA requires English for US submissions. ICH guidelines govern clinical trial translation
- Financial services: MiFID II (EU) requires client documents in official language of home member state. SEC filings in English with foreign private issuer accommodations
- Legal: Contract interpretation varies by jurisdiction. In some countries, only the language specified as governing language is legally binding. Others accept parallel language versions
- Government: EU publishes in 24 official languages. Each language version is equally authentic. UN uses 6 official languages

TERMINOLOGY MANAGEMENT:
- Termbases: Centralized glossaries with approved translations, definitions, context, and usage notes
- Consistency is critical: One term = one translation within a product/domain. "Account" might be Konto, Benutzerkonto, or Kundenkonto in German depending on context — decide once and document it
- Prohibited terms: Some terms have legal implications in certain markets. "Guarantee" vs "warranty" has different legal weight in different jurisdictions
- Style guides per language: Formal/informal address (tu vs vous in French, du vs Sie in German), tone, punctuation conventions
- Tools: SDL MultiTerm, MemoQ termbases, Phrase TMS glossaries, Memsource term management

QUALITY ASSURANCE FOR REGULATED CONTENT:
- Back-translation: Translate the target text back to the source language independently. Compare with original. Standard for clinical trials and regulated medical content
- In-country review (ICR): Native speaker in the target market reviews for cultural appropriateness and regulatory compliance
- Linguistic sign-off: Designated reviewer formally approves the translation before publication
- Audit trail: Document who translated, reviewed, and approved each piece. Regulatory inspections require traceability
- Version control: Track which source version was translated. Updated source = updated translation required`
    },
    {
      title: "Translation Memory and CAT Tool Optimization",
      content: `TRANSLATION MEMORY (TM) AND CAT TOOLS — Maximizing ROI:

TRANSLATION MEMORY FUNDAMENTALS:
- TM stores source-target segment pairs from previous translations
- Match types: 100% (exact match), fuzzy (similar, typically 75-99%), no match (new content)
- Context match / ICE (In-Context Exact): 100% match with same surrounding segments. Highest confidence
- Leverage rates: Mature TMs achieve 50-70% reuse. Every reused segment saves time and money
- TM maintenance: Regularly clean outdated entries, fix errors, merge duplicates. A dirty TM propagates errors

CAT TOOL COMPARISON (2025-2026):
- SDL Trados Studio: Industry standard for freelancers and agencies. Powerful TM management, good file format support. Desktop + cloud. From $260/year
- memoQ: Strong project management features. Preferred by many European agencies. Better API integration. From $620/year
- Memsource (Phrase TMS): Cloud-native. Best for enterprise workflows and automation. AI-powered QA. From $27/month
- Smartcat: Freemium model, marketplace integration. Good for smaller teams. AI translation built in
- MateCat: Open source, free cloud version. Backed by Translated.net. Adaptive MT built in
- OmegaT: Free, open source, desktop-based. Good for freelancers on a budget. Java-based

TM ECONOMICS:
- Pricing tiers by match: 100% matches typically billed at 10-30% of full rate. Fuzzy matches (75-99%) at 30-60%. No matches at full rate
- ROI calculation: Track words translated, match rates, and cost over time. A well-maintained TM saves 30-50% on recurring content
- TM ownership: Clarify in contracts — who owns the TM? Client or agency? Best practice: client owns, agency maintains
- TM sharing: Between projects, products, or business units. Increases leverage but requires consistent terminology

QUALITY ASSURANCE (QA) AUTOMATION:
- Built-in QA checks: Terminology consistency, number formatting, tag integrity, glossary compliance, length restrictions
- Verifika, Xbench, QA Distiller: Standalone QA tools for deeper checks across files and TMs
- Custom QA rules: Define project-specific checks (e.g., brand name must never be translated, specific formatting requirements)
- Regex-based checks: Pattern matching for phone numbers, URLs, email addresses, product codes
- QA before delivery is non-negotiable: Every translation project should pass automated QA plus human review`
    },
    {
      title: "Transcreation and Marketing Content Adaptation",
      content: `TRANSCREATION — Beyond Translation for Marketing and Creative Content:

WHAT IS TRANSCREATION:
- Transcreation = translation + creation. Adapting a message's intent, style, tone, and emotional impact for a new culture
- Not word-for-word translation — the output may be completely different text that achieves the same marketing goal
- Used for: taglines, slogans, ad copy, brand messaging, product names, campaign themes, social media content
- Process: Creative brief → cultural analysis → concept development → copywriting → back-translation → review

WHEN TO TRANSCREATE VS TRANSLATE:
- Translate: Technical docs, user manuals, legal text, support articles, product specs — accuracy is king
- Transcreate: Ads, slogans, brand voice content, emotional appeals, humor, cultural references — impact is king
- Localize (middle ground): Product UI, marketing emails, landing pages — accuracy + cultural fit

CULTURAL ADAPTATION ESSENTIALS:
- Colors: White = purity in West, mourning in parts of East Asia. Red = danger in West, luck/prosperity in China
- Numbers: 4 is unlucky in CJK cultures (sounds like "death"). 13 in Western cultures. 7 is lucky almost everywhere
- Humor: Puns, wordplay, and sarcasm rarely translate. What's funny in the US may be offensive in Japan or confusing in Germany
- Imagery: Hand gestures, body language, dress codes, gender representation, age representation — all culturally loaded
- References: Sports metaphors (baseball in US, cricket in India, football/soccer everywhere else), holidays, celebrities, historical events

PRICING AND PROCESS:
- Transcreation rates: 2-5x translation rates. Charged per hour or per project, not per word
- Typical process: Creative brief (5-10 pages) → 2-3 creative options per piece → client review → refinement → final delivery
- Back-translation included: Every transcreated piece comes with a literal back-translation and rationale explaining creative choices
- Team: Transcreators are copywriters who happen to be bilingual, not translators who attempt copywriting
- Turnaround: Longer than translation. A tagline may take 1-2 weeks for thorough cultural adaptation

FAMOUS TRANSCREATION EXAMPLES:
- "Finger lickin' good" (KFC) → Different adaptations worldwide. In China, initially mistranslated as "eat your fingers off"
- Nike "Just Do It" → Adapted to local motivational expressions in each market
- Coca-Cola → Name itself was transcreated: 可口可乐 in Chinese means "delicious happiness"
- Red Bull "gives you wings" → Adapted for markets where the concept of wings has different connotations
- Lesson: Even billion-dollar brands get it wrong when they skip transcreation`
    },
  ],

  "ecommerce-store-builder": [
    {
      title: "Checkout Optimization and Cart Abandonment Reduction",
      content: `CHECKOUT OPTIMIZATION — Reducing Cart Abandonment:

CART ABANDONMENT BENCHMARKS (2025-2026):
- Average cart abandonment rate: 70.19% across all industries
- Mobile abandonment: 85.65% (higher friction on small screens)
- Top reasons: Extra costs too high (48%), forced account creation (26%), complex checkout (22%), couldn't calculate total cost (18%), didn't trust site with payment (17%)

CHECKOUT FLOW OPTIMIZATION:
- Guest checkout: MANDATORY. Forced account creation kills 26% of sales. Offer account creation AFTER purchase completion
- Progress indicator: Show steps clearly (Cart → Shipping → Payment → Confirmation). Users need to know where they are
- Form field reduction: Every field you remove increases conversion. Name, email, address, payment — that's it for most products
- Auto-fill support: Proper HTML autocomplete attributes. Saves users 30+ seconds
- Address validation: Real-time address lookup (Google Places API, SmartyStreets). Reduces shipping errors and returns
- Mobile-first design: Large tap targets (44x44px minimum), single-column layout, numeric keyboard for phone/zip/card fields

PAYMENT OPTIMIZATION:
- Multiple payment methods: Credit/debit cards, PayPal, Apple Pay, Google Pay, Shop Pay, Buy Now Pay Later (Affirm, Klarna, Afterpay)
- BNPL impact: Increases average order value 20-30% and conversion rate 20-30%. Afterpay merchants see 22% increase in repeat purchases
- Express checkout: Apple Pay / Google Pay / Shop Pay bypass entire form. 1-click checkout can increase mobile conversion by 35%
- Security signals: SSL badge, payment processor logos, money-back guarantee, trust badges near payment form
- Saved payment methods: For returning customers. One-click reorder capability

CART RECOVERY:
- Abandoned cart emails: Send within 1 hour (highest recovery rate), then 24 hours, then 72 hours
- Email sequence: First = reminder (no discount), Second = social proof + urgency, Third = discount offer (10-15%)
- SMS recovery: 4.5x higher open rate than email. Send within 30 minutes. Include direct cart link
- Exit-intent popup: Offer incentive when mouse moves toward close/back button. 10-15% of abandoning visitors can be recovered
- Retargeting ads: Facebook/Instagram dynamic product ads showing exact products left in cart. ROAS typically 5-10x`
    },
    {
      title: "Inventory Management and Fulfillment Strategy",
      content: `E-COMMERCE INVENTORY AND FULFILLMENT:

INVENTORY MANAGEMENT FUNDAMENTALS:
- SKU organization: Category-Color-Size-Variant format. Consistent naming prevents chaos at scale
- ABC analysis: A items (top 20% by revenue, 80% of sales) — tight control. B items (next 30%) — moderate. C items (bottom 50%) — minimal oversight
- Reorder point formula: (Average daily sales × Lead time in days) + Safety stock
- Safety stock: Standard deviation of demand × Z-score for desired service level × √Lead time. Higher for volatile demand items
- Dead stock: Items with no sales in 90+ days. Liquidate through flash sales, bundles, or donation (tax deduction). Carrying dead stock costs 20-30% of its value annually

FULFILLMENT MODELS:
- Self-fulfillment: You store, pick, pack, and ship. Best margins but requires space, staff, and systems. Viable up to ~500 orders/day
- 3PL (Third Party Logistics): ShipBob, ShipMonk, Deliverr, Red Stag. Best for 100-10,000+ orders/day. Cost: $3-5 per pick-pack + storage fees
- Amazon FBA: Access to Prime badge and audience. Fees: 15% referral + fulfillment fee ($3-5/unit) + storage ($0.87-2.40/cu ft). Best for products under $50 where Prime badge drives conversion
- Dropshipping: Zero inventory risk. Low margins (15-30%). Challenges: slow shipping, quality control, stockouts. Best as supplement, not primary model
- Hybrid: Own warehouse for bestsellers, 3PL for long tail, dropship for testing new products

SHIPPING STRATEGY:
- Free shipping threshold: Set at 15-20% above average order value. Increases AOV while covering shipping cost
- Flat rate shipping: Simplifies pricing. Absorb the variance. Works when products are similar size/weight
- Real-time carrier rates: Most accurate but can cause sticker shock. Show "cheapest" option first
- Carrier diversification: Don't rely on one carrier. USPS for lightweight (<1lb), UPS/FedEx for heavier, regional carriers for last-mile
- Shipping speed expectations: 73% of consumers expect delivery in 5 days or less. 2-day shipping is table stakes for premium brands

RETURNS MANAGEMENT:
- Free returns policy: Increases conversion 15-35% but increases return rate. Calculate net impact per product category
- Return rate benchmarks: Apparel 20-30%, Electronics 15-20%, Home goods 10-15%, Beauty 5-10%
- Returnless refunds: For items under $10-15, it often costs more to process the return than the item is worth. Refund and let customer keep it
- Return data analysis: Track reasons by SKU. If a product has >25% return rate, fix the product listing (better photos, sizing guide, description)`
    },
    {
      title: "E-Commerce SEO and Organic Traffic Strategy",
      content: `E-COMMERCE SEO — Driving Free Organic Traffic:

PRODUCT PAGE SEO:
- Title tag formula: [Brand] [Product Name] - [Key Feature] | [Store Name]. Keep under 60 characters
- Meta description: Include primary keyword, unique selling point, and call to action. 150-160 characters
- H1: Product name with primary keyword naturally included
- Product descriptions: 300+ words minimum. Unique content (never manufacturer copy). Include use cases, benefits, and specifications
- Image alt text: Descriptive, keyword-rich but natural. "[Brand] [Product] in [Color] - [Feature]"
- Schema markup: Product, Offer, AggregateRating, Review schemas. Shows price, availability, and ratings in search results. Can increase CTR 30%

CATEGORY PAGE SEO:
- Category pages often rank better than product pages for competitive terms
- Unique category descriptions: 200-500 words above or below the product grid
- Faceted navigation: Use canonical tags or robots directives to prevent duplicate content from filters
- Internal linking: Category → subcategory → product. Breadcrumbs for user and crawler navigation
- URL structure: /category/subcategory/product-name — clean, keyword-rich, no IDs or parameters

TECHNICAL SEO FOR E-COMMERCE:
- Site speed: Every 1-second delay reduces conversion by 7%. Target <3s load time. Compress images (WebP format), lazy loading, CDN
- Mobile-first indexing: Google indexes mobile version first. Test with Google's Mobile-Friendly Test tool
- Crawl budget: Large catalogs (10,000+ products) need efficient crawlability. XML sitemaps split by category, proper robots.txt, no infinite crawl traps
- Pagination: rel=next/prev for paginated categories, or load-more/infinite scroll with proper rendering
- Duplicate content: Product variants (colors, sizes) can create duplicate pages. Use canonical tags pointing to the main variant

CONTENT MARKETING FOR E-COMMERCE:
- Buying guides: "Best [Product Category] for [Use Case]" — targets informational queries, links to products
- Comparison posts: "[Product A] vs [Product B]" — captures mid-funnel searchers
- How-to content: "How to [Use/Choose/Style/Install Product]" — builds authority, captures long-tail traffic
- User-generated content: Reviews, photos, Q&A sections add unique content to product pages and improve rankings
- Blog strategy: Target informational keywords your product pages can't rank for. Funnel traffic to products through internal links`
    },
    {
      title: "Customer Retention and Lifetime Value Optimization",
      content: `CUSTOMER RETENTION — Building Repeat Purchase Engines:

RETENTION ECONOMICS:
- Acquiring a new customer costs 5-7x more than retaining an existing one
- Increasing retention by 5% increases profit by 25-95% (Harvard Business Review)
- Repeat customers spend 67% more than new customers on average
- Customer Lifetime Value (CLV) formula: Average Order Value × Purchase Frequency × Customer Lifespan
- Focus ratio: 80% of marketing budget goes to acquisition, but 80% of revenue comes from existing customers. Rebalance

EMAIL MARKETING AUTOMATION:
- Welcome series (3-5 emails over 14 days): Brand story → Best sellers → Social proof → First purchase incentive → Category education
- Post-purchase flow: Order confirmation → Shipping notification → Delivery confirmation → Product care tips (Day 3) → Review request (Day 7) → Cross-sell (Day 14) → Replenishment reminder (based on product lifecycle)
- Win-back campaign: Triggered when customer hasn't purchased in 60-90 days. Sequence: "We miss you" → "What's new" → Discount offer → Final "Is this goodbye?"
- Segmentation: By purchase frequency, AOV, category preference, lifecycle stage. Personalized emails generate 6x higher transaction rates
- Benchmarks: Ecommerce email open rate 15-20%, click rate 2-3%, revenue per email $0.08-0.15

LOYALTY PROGRAMS:
- Points-based: Most common. $1 = X points. Points redeem for discounts. Simple but can feel transactional
- Tiered programs: Bronze/Silver/Gold with increasing benefits. Drives status motivation. Sephora Beauty Insider model
- Paid membership: Amazon Prime model. $X/year for free shipping, early access, exclusive deals. High retention once enrolled
- Referral integration: Existing customers earn rewards for bringing new customers. Reduces CAC while rewarding loyalty
- Program economics: Target 3-5% of revenue allocated to loyalty rewards. Breakage rate (unredeemed points) averages 25-30%

SUBSCRIPTION AND REPLENISHMENT:
- Subscribe-and-save model: 10-15% discount for auto-delivery. Increases predictable revenue, reduces churn
- Best for consumable products: Supplements, pet food, skincare, coffee, cleaning supplies
- Key metric: Subscription churn rate. Target <10% monthly. Offer skip/pause before cancellation
- Surprise-and-delight: Occasional free samples, bonus items, or upgraded shipping keeps subscribers engaged
- Predictive replenishment: Estimate when customer will run out based on purchase history. Send reminder at the right time`
    },
  ],

  "legal-basics-reviewer": [
    {
      title: "Freelancer and Independent Contractor Legal Essentials",
      content: `LEGAL ESSENTIALS FOR FREELANCERS AND INDEPENDENT CONTRACTORS:

DISCLAIMER: This is general legal information, NOT legal advice. Consult a licensed attorney for your specific situation.

INDEPENDENT CONTRACTOR VS EMPLOYEE:
- IRS uses a multi-factor test: Behavioral control, financial control, and type of relationship
- Behavioral: Do you control HOW the work is done? Employees get instructions; contractors control their methods
- Financial: Do you control business aspects? Contractors invest in their own tools, can work for multiple clients, risk profit/loss
- Relationship: Written contract, benefits, permanence. Employees get benefits; contractors typically don't
- Misclassification penalties: Back taxes, penalties, benefits owed. State penalties can be severe (CA, NY, NJ especially strict)
- AB5 (California): Codifies the ABC test. Presumes worker is employee unless: (A) free from control, (B) performs work outside usual business, (C) has independent business in that trade. Impacts gig workers, freelancers

ESSENTIAL FREELANCER CONTRACTS:
- Scope of Work (SOW): Detailed description of deliverables, timelines, revision rounds, and out-of-scope items
- Payment terms: Rate, invoicing schedule, payment deadline (Net 15/30), late payment penalties, kill fee
- Intellectual property: Work-for-hire (client owns) vs. licensing (you retain, client gets usage rights). ALWAYS specify
- Confidentiality/NDA: Protect client information. Mutual NDAs protect both parties
- Termination clause: How either party can end the agreement. Notice period. Payment for work completed
- Limitation of liability: Cap your liability at the contract value. Never accept unlimited liability as a freelancer
- Indemnification: Be cautious of broad indemnification clauses that make you liable for client's actions

TAX OBLIGATIONS:
- Self-employment tax: 15.3% (12.4% Social Security + 2.9% Medicare) on top of income tax
- Quarterly estimated taxes: Due April 15, June 15, September 15, January 15. Underpayment penalties if you owe >$1,000
- Deductions: Home office (simplified: $5/sq ft up to 300 sq ft), equipment, software, professional development, health insurance premiums, mileage, internet/phone (business portion)
- Retirement accounts: SEP IRA (25% of net earnings, up to $69,000 in 2025), Solo 401k (employee + employer contributions)
- Business structure: Sole proprietor (simplest, personal liability) → LLC (liability protection, pass-through taxation) → S-Corp (potential self-employment tax savings above ~$80k net income)`
    },
    {
      title: "Privacy Law Fundamentals — GDPR, CCPA, and Global Compliance",
      content: `PRIVACY LAW ESSENTIALS FOR BUSINESSES:

DISCLAIMER: This is general legal information, NOT legal advice. Consult a licensed attorney for your specific situation.

GDPR (EU GENERAL DATA PROTECTION REGULATION):
- Applies to: Any business processing EU residents' data, regardless of business location
- Lawful bases: Consent, contract, legal obligation, vital interests, public interest, legitimate interest
- Key rights: Access, rectification, erasure ("right to be forgotten"), data portability, restriction of processing, objection
- Consent requirements: Freely given, specific, informed, unambiguous. Pre-checked boxes are NOT valid consent
- Data Protection Officer (DPO): Required for public authorities and organizations doing large-scale systematic monitoring or processing sensitive data
- Breach notification: 72 hours to notify supervisory authority. "Without undue delay" to affected individuals if high risk
- Penalties: Up to 4% of annual global turnover or €20 million, whichever is higher
- Privacy by design: Build privacy into systems from the start, not bolted on after

CCPA/CPRA (CALIFORNIA):
- Applies to: Businesses with CA consumers that meet thresholds (>$25M revenue, >100K consumers' data, >50% revenue from selling data)
- Key rights: Know what data is collected, delete data, opt out of sale/sharing, non-discrimination for exercising rights
- "Do Not Sell or Share My Personal Information" link required on website
- CPRA additions (2023+): Right to correct inaccurate data, limit use of sensitive data, automated decision-making transparency
- Penalties: $2,500/violation (unintentional), $7,500/violation (intentional), private right of action for data breaches

OTHER KEY PRIVACY LAWS:
- PIPEDA (Canada): Similar principles to GDPR. Consent-based, purpose limitation, accountability principle
- LGPD (Brazil): Closely modeled on GDPR. 10 legal bases for processing. National Data Protection Authority (ANPD)
- POPIA (South Africa): 8 conditions for lawful processing. Information regulator enforcement
- State laws (US): Virginia (VCDPA), Colorado (CPA), Connecticut (CTDPA), Utah (UCPA), Texas, Oregon, Montana — growing patchwork

PRACTICAL COMPLIANCE STEPS:
- Data mapping: Know what data you collect, where it's stored, who has access, why you collect it, how long you keep it
- Privacy policy: Clear, plain language. What data, why, how long, who it's shared with, how to exercise rights
- Cookie consent: Banner with accept/reject options. Granular category selection. No cookie walls (GDPR)
- Data Processing Agreements (DPAs): Required with all vendors/processors handling personal data
- Retention schedules: Define how long each data type is kept. Delete when no longer needed
- Incident response plan: Documented process for detecting, containing, assessing, and reporting data breaches`
    },
    {
      title: "Dispute Resolution — Mediation, Arbitration, and Litigation",
      content: `DISPUTE RESOLUTION OPTIONS FOR BUSINESSES:

DISCLAIMER: This is general legal information, NOT legal advice. Consult a licensed attorney for your specific situation.

NEGOTIATION (FIRST STEP):
- Always attempt direct resolution first. Cheapest, fastest, preserves relationships
- Document everything: Follow up verbal agreements with written confirmation
- BATNA: Best Alternative To Negotiated Agreement. Know your walkaway point before negotiating
- Demand letter: Formal written communication outlining the dispute, your position, and desired resolution. Often resolves issues without escalation
- Attorney demand letter: Carries more weight. Typically costs $500-2,000. Shows you're serious

MEDIATION:
- Non-binding: Mediator facilitates agreement but cannot impose a decision
- Cost: $2,000-10,000 per day (mediator fee split between parties). Much cheaper than litigation
- Timeline: Can be scheduled within 2-4 weeks. Typically resolved in 1-3 sessions
- Success rate: 70-80% of cases settle in mediation
- Advantages: Confidential, flexible solutions, preserves relationships, parties control outcome
- Finding mediators: AAA (American Arbitration Association), JAMS, local bar associations, court-annexed programs

ARBITRATION:
- Binding (usually): Arbitrator's decision is final and enforceable in court. Very limited appeal rights
- Mandatory arbitration clauses: Common in consumer contracts, employment agreements, B2B contracts. Courts generally enforce them
- Cost: Filing fee $750-2,500 + arbitrator fees ($1,000-3,000/day). Still cheaper than full litigation
- Timeline: 6-12 months typically. Faster than litigation (which can take 2-5 years)
- AAA vs JAMS vs other providers: AAA most common for commercial disputes, JAMS for high-value/complex cases
- Class action waivers: Arbitration clauses often include class action waivers. Upheld by Supreme Court (AT&T v. Concepcion, Epic Systems v. Lewis)

LITIGATION (LAST RESORT):
- Small claims court: For disputes under $5,000-25,000 (varies by state). No lawyer needed. Filing fee $30-100
- Civil court: For larger disputes. Requires attorney (typically). Complaint → Answer → Discovery → Motions → Trial → Appeal
- Discovery: Document requests, depositions, interrogatories. Most expensive phase. Can cost $50,000-500,000+ in complex cases
- Attorney fees: Hourly ($200-800+/hr depending on market/experience) or contingency (25-40% of recovery, plaintiff side only)
- Timeline: 1-3 years for state court, 2-5 years for federal court. Appeals add 1-2 years
- Summary judgment: Motion to decide case without trial when no genuine dispute of material fact. Can save significant time and cost

CHOOSING THE RIGHT PATH:
- Under $10,000: Small claims court or negotiation. Not worth attorney fees
- $10,000-100,000: Mediation first, then arbitration if contract allows. Litigation as last resort
- Over $100,000: Attorney involved from the start. Mediation before trial almost always ordered by courts anyway
- Relationship preservation matters: Mediation > Arbitration > Litigation
- Speed matters: Mediation (weeks) > Arbitration (months) > Litigation (years)
- Precedent matters: Only litigation creates public legal precedent. Arbitration and mediation are private`
    },
    {
      title: "Small Business Legal Compliance Checklist",
      content: `SMALL BUSINESS LEGAL COMPLIANCE — Essential Framework:

DISCLAIMER: This is general legal information, NOT legal advice. Consult a licensed attorney for your specific situation.

FORMATION AND STRUCTURE:
- Business entity selection: Sole proprietorship (simplest, most risk), LLC (liability protection, flexible taxation), S-Corp (tax savings for higher earners), C-Corp (investment-ready, double taxation)
- EIN (Employer Identification Number): Free from IRS. Required for hiring, business bank accounts, most business activities
- State registration: File with Secretary of State. Annual report/franchise tax requirements vary by state
- Business licenses: City, county, and state. Varies by industry and location. Check local requirements
- DBA (Doing Business As): Required if operating under a name different from your legal entity name
- Operating agreement (LLC) / Bylaws (Corp): Internal governance document. Essential even for single-member LLCs

EMPLOYMENT COMPLIANCE:
- W-4 and I-9 forms: Required for every employee before first day of work
- Workers' compensation: Required in almost every state for businesses with employees
- Unemployment insurance: State and federal (FUTA) tax requirements
- Fair Labor Standards Act (FLSA): Minimum wage ($7.25 federal, many states higher), overtime (1.5x after 40 hours), exempt vs non-exempt classification
- Anti-discrimination: Title VII (15+ employees), ADA (15+ employees), ADEA (20+ employees), state laws may apply at lower thresholds
- Employee handbook: Not legally required but strongly recommended. Sets expectations, demonstrates policies, provides legal protection

INSURANCE ESSENTIALS:
- General liability: Protects against third-party injury and property damage claims. $1M/$2M coverage typical. Cost: $500-3,000/year
- Professional liability (E&O): For service-based businesses. Protects against negligence, errors, and omissions claims
- Product liability: For businesses selling physical products. Protects against injury/damage claims from products
- Cyber liability: Covers data breach costs, notification, credit monitoring, legal defense. Essential for any business handling customer data
- Commercial property: Covers business property, equipment, inventory against loss/damage
- Business interruption: Covers lost income during forced closures (disaster, fire, etc.)
- Umbrella policy: Additional coverage above primary policies. Cost-effective extra protection

WEBSITE AND DIGITAL COMPLIANCE:
- Terms of Service: Contract between you and users. Limitation of liability, dispute resolution, user conduct rules
- Privacy Policy: Required by law if you collect any personal data. Must accurately describe data practices
- Cookie policy: Required in EU/UK. Recommended everywhere. Describes tracking technology use
- ADA compliance: Websites must be accessible to disabled users. WCAG 2.1 AA standard. Lawsuits are increasing rapidly
- CAN-SPAM (email): Include physical address, unsubscribe link, honor opt-outs within 10 business days
- COPPA: If targeting children under 13, parental consent required for data collection
- FTC endorsement guidelines: Disclose material connections with endorsers/influencers. #ad or #sponsored required`
    },
  ],

  "podcast-production": [
    {
      title: "Podcast Interview Techniques and Guest Booking",
      content: `PODCAST INTERVIEW MASTERY AND GUEST ACQUISITION:

GUEST BOOKING STRATEGY:
- Start with your network: Friends, colleagues, clients, industry contacts. First 20 episodes should be people you know
- Tiered outreach: Tier 1 (dream guests, 1% response rate), Tier 2 (established experts, 5-10%), Tier 3 (rising stars, 20-40%)
- Outreach template: Lead with listener value, not your show stats. "My audience of [description] would benefit from your expertise on [specific topic]"
- Where to find guests: PodcastGuests.com, PodMatch, MatchMaker.fm, LinkedIn, conference speaker lists, other podcast guest appearances
- Booking platforms: Calendly/SavvyCal for scheduling, Riverside.fm or SquadCast for remote recording
- Guest prep: Send questions 48h in advance. Include tech requirements, recording tips, and episode context. Professional = more referrals

INTERVIEW TECHNIQUES:
- Preparation: Research guest thoroughly. Listen to 2-3 of their other podcast appearances. Note topics NOT covered elsewhere
- Opening: Don't start with "tell us about yourself." Start with a compelling question or statement that hooks both the guest and listener
- Follow-up questions: The gold is in the follow-up. "Tell me more about that." "What do you mean by that?" "Why do you think that happened?"
- Active listening: Don't just wait for your turn to talk. React naturally. Follow unexpected threads — the best moments are unplanned
- Silence is powerful: After a guest answers, wait 2-3 seconds before responding. They'll often add deeper insights to fill the silence
- Story extraction: Ask for specific examples. "Can you walk me through exactly how that happened?" Stories are 22x more memorable than facts
- Controversial questions: Frame respectfully. "Some people argue [opposing view]. What would you say to that?" Creates engaging content without being adversarial

REMOTE RECORDING BEST PRACTICES:
- Double-ender recording: Record each person locally for best quality. Riverside.fm, SquadCast, Zencastr handle this automatically
- Backup recording: Always record a backup (Zoom recording, local phone recording). Equipment fails
- Internet: Hardwired ethernet > WiFi. Ask guests to use ethernet if possible. Close all other apps and browser tabs
- Audio levels: Test before recording. Ask guest to speak at their normal volume. Adjust gain so peaks hit -12dB to -6dB
- Video: Record video even for audio-only podcasts. Video clips are your best marketing asset. Repurpose for YouTube, TikTok, Instagram Reels
- Headphones required: Both host and guest must wear headphones. Prevents echo and feedback. Non-negotiable`
    },
    {
      title: "Podcast Analytics and Audience Growth Metrics",
      content: `PODCAST ANALYTICS — Understanding and Growing Your Audience:

KEY METRICS TO TRACK:
- Downloads per episode: Primary metric. IAB 2.1 standard ensures consistency across platforms. Download = audio file requested by client
- Unique listeners: More accurate than downloads (one person might download on two devices). Apple Podcasts and Spotify provide this
- Consumption rate: What percentage of the episode is actually listened to. Spotify provides this. Target >70% for full episodes
- Subscriber/follower growth: Track monthly. Healthy growth = 5-15% month over month for established shows
- Episode drop-off points: Where do listeners stop? Identifies boring segments, too-long intros, or poor content structure
- Reviews and ratings: Social proof for new listeners. Ask for reviews in episodes and show notes

BENCHMARK DATA (2025-2026):
- If your episode gets 27+ downloads in first 7 days, you're in the top 50% of all podcasts
- 74+ downloads in 7 days = top 25%
- 232+ downloads in 7 days = top 10%
- 1,031+ downloads in 7 days = top 5%
- 6,263+ downloads in 7 days = top 1%
- Average podcast gets ~141 downloads per episode total (across all time). Median is much lower (~30)
- Most podcasts quit before episode 10. Consistency IS the competitive advantage

GROWTH STRATEGIES:
- Podcast SEO: Keyword-rich titles and descriptions. Apple Podcasts search and Spotify search are discovery engines
- Cross-promotion: Guest on other shows in your niche. Swap promo spots with similar-sized shows
- Audiograms: 30-60 second audio clips with waveform animation for social media. Headliner.app, Descript, or Canva
- YouTube strategy: Upload full episodes to YouTube (even with static image). YouTube is the #1 podcast discovery platform for Gen Z
- Newsletter companion: Weekly email with episode summary, bonus content, and links. Builds owned audience outside platforms
- Community building: Discord, Facebook Group, or Patreon community. Engaged communities drive organic sharing
- Paid promotion: Overcast ads ($0.25-1.00 per subscriber), Podcast Addict, podcast newsletter sponsors

MONETIZATION TIMELINE:
- Episodes 1-25: Focus on quality and consistency. No monetization pressure. Build the habit
- Episodes 25-50: Start building email list and community. Explore affiliate partnerships
- Episodes 50-100: First sponsorship opportunities if downloads are growing. Dynamic ad insertion platforms (Acast, Megaphone)
- Episodes 100+: Mature show. Tiered sponsorship packages, premium content, live events, courses, consulting
- CPM rates: $18-50 CPM for mid-roll ads (per 1,000 downloads). Pre-roll: $15-25 CPM. Host-read > programmatic
- Revenue expectations: 1,000 downloads/episode ≈ $200-500/month in sponsorship. 10,000 downloads ≈ $2,000-5,000/month`
    },
    {
      title: "Podcast Branding, Artwork, and Launch Strategy",
      content: `PODCAST BRANDING AND LAUNCH EXECUTION:

PODCAST ARTWORK:
- Dimensions: 3000x3000px (minimum 1400x1400px), square, RGB, JPG or PNG
- Design principles: Must be readable at 55x55px thumbnail size. Bold text, high contrast, simple imagery
- What works: Clean typography, 1-2 colors max, face photos (if personality-driven), bold graphics (if topic-driven)
- What fails: Too much text, low contrast colors, complex imagery, stock photos, cluttered layouts
- Tools: Canva (free), Adobe Express, or hire on Fiverr/99designs ($50-500)
- A/B test: Create 2-3 options. Show to target audience. The one they remember at thumbnail size wins
- Update artwork annually or when repositioning. Consistent brand evolution keeps show fresh

SHOW NAMING:
- Descriptive > Clever: "The Marketing Over Coffee Show" tells you exactly what it is. "Qwerty" does not
- SEO consideration: Include primary keyword if possible. "The Content Marketing Podcast" ranks for "content marketing podcast"
- Avoid: Already-taken names, overly generic names, hard-to-spell names, names that limit future pivoting
- Check availability: Apple Podcasts, Spotify, Google, social media handles, domain name
- Consider format: "[Topic] with [Host]" works well for interview shows. "[Adjective] [Topic]" for solo shows

LAUNCH STRATEGY (TRAILER + 3 EPISODES):
- Pre-launch (4-6 weeks before):
  - Record trailer (60-90 seconds): Hook, what the show is about, who it's for, why listen, release schedule
  - Record first 3-5 episodes: Batch recording reduces launch stress
  - Submit to directories: Apple Podcasts (2-5 day review), Spotify (instant), Google Podcasts, Amazon Music, Overcast, Pocket Casts
  - Build anticipation: Social media countdown, email list teasers, tell everyone you know

- Launch day:
  - Release all initial episodes at once (3 minimum): Multiple episodes in Apple Podcasts' New & Noteworthy algorithm
  - Activate your network: Ask friends, family, colleagues to subscribe, rate, and review in the first 48 hours
  - Social media blitz: Audiograms, behind-the-scenes, guest quotes, personal stories about why you started
  - Email blast: If you have any existing audience, announce to them

- Post-launch (first 8 weeks):
  - Consistent release schedule: Same day, same time, every week (or whatever cadence you committed to)
  - Engage with early listeners: Respond to every review, every DM, every comment. Early adopters become evangelists
  - Iterate based on data: Check analytics weekly. What episodes perform best? More of that
  - Don't obsess over downloads: Quality and consistency compound. Most successful shows took 12-18 months to gain traction

HOSTING PLATFORMS:
- Buzzsprout: Best for beginners. Free tier (2hrs/month). Clean analytics. Easy distribution. From $12/month
- Transistor: Best for professionals. Unlimited episodes. Multiple shows. Private podcasting. From $19/month
- Libsyn: Industry veteran. Reliable. Plans from $5/month. Extensive distribution
- Anchor (Spotify for Podcasters): Free. Unlimited hosting. Built-in monetization. But Spotify owns your RSS feed
- Podbean: Good all-rounder. Free tier available. Monetization built in. From $9/month
- Recommendation: Start with Buzzsprout or Transistor. Own your RSS feed. Never depend on one platform`
    },
  ],

  "real-estate-investing": [
    {
      title: "Rental Property Cash Flow Analysis Deep Dive",
      content: `RENTAL PROPERTY CASH FLOW — Advanced Analysis Framework:

DISCLAIMER: This is general educational information about real estate investing concepts. NOT financial or investment advice. Consult a licensed real estate professional and financial advisor before making investment decisions.

INCOME CALCULATION:
- Gross potential rent (GPR): Market rent × 12 months × number of units
- Vacancy allowance: Typically 5-8% for well-located properties, 8-12% for less desirable areas
- Effective gross income (EGI): GPR - Vacancy - Credit loss + Other income (laundry, parking, pet fees, storage)
- Rent estimation: Comparable analysis (Rentometer, Zillow Rent Zestimate, local MLS data, Craigslist/Facebook Marketplace research)
- Rental growth: Historical average 3-4% annually. Varies dramatically by market. Research local trends

OPERATING EXPENSES (THE 50% RULE AS STARTING POINT):
- Property taxes: 1-3% of assessed value annually (varies wildly by location). Check actual tax bill, not estimates
- Insurance: $800-3,000/year for single family, more for multifamily. Get actual quotes — don't guess
- Maintenance/repairs: Budget 5-10% of gross rent. Older properties need more (8-12%). Newer properties less (3-6%)
- Capital expenditure reserves (CapEx): Roof ($8,000-15,000/20-25yr), HVAC ($5,000-10,000/15-20yr), Water heater ($1,500-3,000/10-15yr), Appliances ($2,000-5,000/10-15yr). Divide replacement cost by remaining life, set aside monthly
- Property management: 8-12% of gross rent if hired out. Self-management saves money but costs time
- Utilities (if owner-paid): Water/sewer, trash, common area electric. Pass through to tenants when possible
- HOA fees: Fixed monthly cost. Can increase without your control. Review HOA financials carefully before buying
- Landscaping, pest control, snow removal: $100-500/month depending on property and location

KEY METRICS:
- Net Operating Income (NOI): EGI - All operating expenses (before mortgage). The #1 metric for property comparison
- Cash flow: NOI - Debt service (mortgage principal + interest). What actually hits your bank account
- Cash-on-cash return: Annual cash flow / Total cash invested × 100. Target: 8-12%+ in most markets
- Cap rate: NOI / Purchase price × 100. Market-dependent. Class A properties: 4-6%. Class C: 8-12%
- Gross rent multiplier (GRM): Purchase price / Annual gross rent. Quick comparison tool. Lower = potentially better deal
- Debt service coverage ratio (DSCR): NOI / Annual debt service. Lenders typically want >1.25. Higher = more cushion

THE 1% RULE (SCREENING TOOL):
- Monthly rent should be ≥1% of purchase price. Example: $200,000 property should rent for $2,000+/month
- Not a hard rule — a screening filter. Many good deals fail the 1% rule, many 1% deals have hidden issues
- Works better in lower-cost markets. Nearly impossible in HCOL areas (Bay Area, NYC, etc.)
- Use to quickly filter properties before running full analysis on promising ones`
    },
    {
      title: "Real Estate Market Analysis and Location Selection",
      content: `MARKET ANALYSIS FOR REAL ESTATE INVESTMENT:

DISCLAIMER: General educational information. NOT investment or financial advice. Always consult licensed professionals.

MACRO MARKET INDICATORS:
- Population growth: Growing cities = growing demand. Census data, U-Haul migration reports, moving company data
- Job growth: Employment drives housing demand. Bureau of Labor Statistics, local economic development reports
- Employer diversification: One-company towns are risky. Look for diverse industry base
- Income growth: Rising incomes support rent increases. Median household income trends
- Housing supply: New construction permits, months of inventory (under 4 months = seller's market, over 6 = buyer's market)
- Rent-to-price ratio: Higher ratios indicate better cash flow markets. Compare across metros
- Landlord-friendly vs tenant-friendly laws: Research eviction timelines, rent control, security deposit rules

NEIGHBORHOOD ANALYSIS:
- Drive/walk the area: At different times of day and week. Notice vacancy rates, property condition, infrastructure investment
- School ratings: Even for non-family rentals, school quality affects property values. GreatSchools.org
- Crime data: CrimeMapping.com, local police department reports, NeighborhoodScout
- Infrastructure investment: New roads, transit, commercial development = appreciation potential
- Proximity factors: Employment centers, highways, public transit, grocery stores, hospitals, parks
- Gentrification indicators: New coffee shops, breweries, art galleries, co-working spaces in previously undervalued areas
- Flood zones and natural disaster risk: FEMA flood maps, wildfire risk maps. Insurance costs and property damage risk

DEAL SOURCING:
- MLS: Most listings go here. Work with an investor-friendly agent who understands cap rates and NOI
- Off-market: Direct mail to absentee owners, driving for dollars (distressed properties), wholesaler networks
- Auctions: Foreclosure auctions, tax lien sales, estate auctions. Due diligence is critical — often no inspection period
- Wholesalers: Find contracts at discount, assign to you for a fee ($5,000-15,000). Vet the numbers independently
- Networking: Local Real Estate Investor Associations (REIA), BiggerPockets meetups, landlord associations
- Online platforms: Roofstock (turnkey rentals), Auction.com (foreclosures), Crexi (commercial)

PROPERTY CLASSES:
- Class A: Newer construction (built after 2000), best locations, highest rents, lowest cap rates (3-5%), lowest maintenance, lowest vacancy, highest-quality tenants
- Class B: 1980s-2000s construction, good locations, moderate rents, moderate cap rates (5-7%), some deferred maintenance, solid tenants
- Class C: 1960s-1980s, lower-income areas, lower rents, higher cap rates (7-10%+), more maintenance, higher vacancy and turnover, management-intensive
- Class D: Older, significant deferred maintenance, highest cap rates on paper but operational nightmare, high vacancy, collections issues, code violations
- Sweet spot for most investors: Class B and B- properties. Balance of cash flow, appreciation, and manageable operations`
    },
    {
      title: "House Hacking and Creative Real Estate Strategies",
      content: `CREATIVE REAL ESTATE INVESTMENT STRATEGIES:

DISCLAIMER: General educational information. NOT investment or financial advice. Consult licensed professionals.

HOUSE HACKING:
- Concept: Live in a property while renting part of it to offset or eliminate your housing costs
- Duplex/triplex/fourplex: Buy with owner-occupant financing (3.5% FHA down), live in one unit, rent the others
- Single family: Rent spare bedrooms, basement apartment, or ADU (Accessory Dwelling Unit)
- Financing advantage: Owner-occupant loans have better rates and lower down payments than investment loans
- FHA loan: 3.5% down, 580+ credit score. Must live in property 12 months. Then move out and keep as rental
- Conventional 5% down: No FHA mortgage insurance after 20% equity. More flexible than FHA
- Example: Buy a fourplex for $400K with FHA ($14,000 down). Rent 3 units at $1,200 each ($3,600/month). Your unit costs effectively negative

BRRRR METHOD:
- Buy: Distressed property below market value (20-30% discount)
- Rehab: Renovate to increase value and rentability. Budget carefully. Have contractor bids before buying
- Rent: Place tenant at market rent. Season the property for 6-12 months
- Refinance: Cash-out refinance at new appraised value. Pull out most or all of your original investment
- Repeat: Use refinance proceeds to buy the next property
- Key risk: Over-renovation, renovation timeline overruns, appraisal comes in lower than expected, interest rates increase
- Capital requirement: Typically need $50,000-100,000 per deal initially (returned through refinance)

SHORT-TERM RENTALS (STR):
- Revenue potential: 2-3x long-term rental income in the right markets
- Platforms: Airbnb, VRBO, Booking.com, Furnished Finder (medium-term), direct booking website
- Regulation: Check local laws BEFORE buying. Many cities restrict or ban STRs. Permits may be required
- Operating costs: Higher than long-term: furnishing ($5,000-15,000), cleaning ($75-200/turnover), platform fees (3-15%), supplies, higher utilities, property management (20-25% for STR vs 8-12% for LTR)
- Seasonality: Revenue fluctuates. Mountain properties peak in winter and summer. Beach properties peak in summer
- Occupancy target: 60-70% occupancy at competitive nightly rates for profitable STR
- Hybrid approach: Long-term rental as baseline, switch to STR during peak season events

SELLER FINANCING:
- What: Seller acts as the bank. You pay them directly instead of getting a traditional mortgage
- When: Seller owns property free and clear. Buyer can't qualify for traditional financing. Creative deal structures
- Terms: Negotiable — down payment, interest rate, amortization, balloon payment, prepayment penalties
- Benefits: No bank qualification, faster closing, creative terms, lower closing costs
- Risks: Balloon payments, due-on-sale issues if wrapping existing mortgage, seller default risk
- Documentation: Promissory note and deed of trust/mortgage. USE A REAL ESTATE ATTORNEY. Not optional`
    },
  ],

  "academic-tutor": [
    {
      title: "Mathematics Problem-Solving Frameworks by Level",
      content: `MATHEMATICS PROBLEM-SOLVING FRAMEWORKS:

ELEMENTARY (K-5) STRATEGIES:
- Draw it out: Visual representation is the most powerful tool at this level. Bar models, number lines, arrays
- Look for patterns: Number sequences, skip counting, multiplication patterns. Pattern recognition builds mathematical thinking
- Guess and check: Systematic trial and error. Make a guess, check if it works, adjust. Teaches logical reasoning
- Work backwards: Know the answer, find the question. "I have 15 marbles after getting 7 more. How many did I start with?"
- Make a simpler problem: Replace big numbers with small ones, solve the simple version, apply the same method to the hard version
- Key concept: Math anxiety starts here. NEVER say "math is hard." Normalize struggle. "Your brain is growing right now"

MIDDLE SCHOOL (6-8) FRAMEWORKS:
- Algebraic thinking transition: Variables represent unknowns. Start with "what number makes this true?" before formal algebra
- Proportional reasoning: If 3 pizzas feed 12 people, how many for 20? Cross-multiplication, unit rates, scaling
- Geometry: Start with physical manipulation (folding, cutting, measuring). Then transition to formulas. Area and volume make more sense after hands-on experience
- Statistics: Mean, median, mode — but WHY each matters. Mean is sensitive to outliers (salary example: mean vs median income)
- Problem types: Single-step → multi-step → word problems → open-ended problems. Scaffold the complexity

HIGH SCHOOL (9-12) APPROACHES:
- Algebra: Master these skills in order: Simplifying expressions → Solving linear equations → Systems of equations → Quadratics → Functions
- Geometry proofs: Start with two-column proofs (statement-reason). Graduate to paragraph proofs. The logic matters more than the format
- Trigonometry: SOHCAHTOA is a start. Unit circle understanding is the real goal. Connect to real-world applications (architecture, physics, engineering)
- Pre-calculus: Function transformations (shifts, stretches, reflections), limits conceptually before formally
- AP/IB preparation: Past exams are your best resource. Time yourself. Learn the rubric — know what earns partial credit
- Calculus readiness: Strong algebra and trig skills are prerequisites. Most calculus struggles are actually algebra weaknesses

COLLEGE/ADULT LEARNING:
- Linear algebra: Think geometrically. Vectors, matrices, and transformations are visual concepts dressed in notation
- Differential equations: Pattern recognition is key. Identify the type (separable, linear, exact) before solving
- Statistics: Focus on conceptual understanding. What does a p-value MEAN? Why does sample size matter? When to use which test?
- Proof-based courses: Learn proof techniques (direct, contradiction, induction, contrapositive) as tools in a toolkit
- Study approach: Do problems, not just read solutions. Math is learned by doing, like a sport or instrument`
    },
    {
      title: "Science Learning and Critical Thinking Development",
      content: `SCIENCE LEARNING METHODOLOGY AND CRITICAL THINKING:

SCIENTIFIC METHOD AS LEARNING FRAMEWORK:
- Observation → Question → Hypothesis → Experiment → Analysis → Conclusion
- This isn't just for labs — it's a thinking framework for approaching ANY unknown
- Hypothesis vs theory vs law: Hypothesis = testable prediction. Theory = well-supported explanation with extensive evidence. Law = describes what happens (not why). Evolution is a theory AND a fact — the word "theory" doesn't mean "guess"
- Teach the process, not just the facts. Facts change; the process of inquiry is permanent

BIOLOGY:
- Start macro, go micro: Ecosystems → Organisms → Organs → Cells → Molecules → DNA. Each level explains the next
- Evolution: Central organizing principle of biology. Everything makes sense through an evolutionary lens
- Genetics: Punnet squares → DNA structure → Gene expression → Epigenetics. Build complexity gradually
- Ecology: Systems thinking. Everything connects. Food webs, energy flow, nutrient cycles. Great entry point for visual learners
- Study tip: Draw processes. Cell division, DNA replication, protein synthesis — drawing each step cements understanding

CHEMISTRY:
- The periodic table IS the cheat sheet: Element position tells you electron configuration, reactivity, bonding behavior
- Moles are just counting: Like "dozen" means 12, "mole" means 6.022 × 10²³. Practice mole conversions until they're automatic
- Bonding: Ionic (metal + nonmetal, electron transfer) → Covalent (nonmetals, electron sharing) → Metallic. Electronegativity difference determines type
- Stoichiometry: Balance equations first. Then it's just ratio math. Practice with simple reactions before complex ones
- Organic chemistry: Not memorization — pattern recognition. Learn functional groups and their reactivity patterns
- Lab safety: Not optional. Goggles, closed-toe shoes, long hair tied back, know the location of safety shower and eyewash

PHYSICS:
- Start with Newton: F=ma explains most of introductory physics. If you truly understand this equation, you understand mechanics
- Free body diagrams: Draw them for every problem. Every. Single. One. The diagram IS the solution half the time
- Energy conservation: Track where energy goes. It can't be created or destroyed, only transformed. This concept solves many problems
- Electromagnetism: Analogies help. Voltage = water pressure, current = water flow, resistance = pipe diameter
- Units and dimensional analysis: If your units don't work out, your equation is wrong. Check units at every step

CRITICAL THINKING SKILLS:
- Correlation ≠ causation: The most important concept in scientific literacy. Ice cream sales and drowning both increase in summer — ice cream doesn't cause drowning
- Sample size matters: One study is not proof. Look for meta-analyses and systematic reviews
- Source evaluation: Primary sources (original research) > secondary sources (textbooks, reviews) > tertiary sources (Wikipedia, blogs)
- Bias recognition: Confirmation bias (seeking evidence that supports existing beliefs), publication bias (positive results published more), funding bias
- Falsifiability: If a claim can't possibly be proven wrong, it's not scientific. This is what separates science from pseudoscience`
    },
    {
      title: "Writing and Essay Skills Across Academic Levels",
      content: `ACADEMIC WRITING DEVELOPMENT — From First Essay to Graduate Thesis:

ELEMENTARY WRITING (K-5):
- Sentence structure: Subject + Verb + Object. Build from simple to compound to complex sentences
- Paragraph structure: Topic sentence → Supporting details → Concluding sentence (the "hamburger" model works because it's visual)
- Story writing: Beginning → Middle → End. Characters, setting, problem, solution
- Descriptive writing: Use the 5 senses. "The dog was big" → "The golden retriever stood as tall as the kitchen table, its wet nose leaving prints on the glass door"
- Grammar foundations: Capitalization, punctuation, subject-verb agreement. Teach through correction of their own work, not worksheets
- Key principle: At this stage, IDEAS matter more than mechanics. Encourage creative expression first, polish mechanics second

MIDDLE SCHOOL (6-8):
- Five-paragraph essay: Introduction (hook + thesis) → Body 1 → Body 2 → Body 3 → Conclusion. The training wheels of essay writing
- Thesis statements: Make a CLAIM, not a fact. "Dogs are popular pets" (fact, not a thesis). "Dogs make better companions than cats because..." (arguable claim)
- Evidence and analysis: Quote → Explain → Analyze. Don't just drop quotes — tell the reader WHY this evidence matters
- Transitions: Between paragraphs AND within paragraphs. "Furthermore," "However," "In contrast," "As a result"
- Research skills: Evaluate sources (author credentials, publication date, bias). Introduce proper citations
- Common mistakes: Thesis is too broad ("War is bad"), paragraphs are lists of facts without analysis, conclusion just repeats the introduction word-for-word

HIGH SCHOOL (9-12):
- Beyond five paragraphs: Complex arguments need complex structures. Variable body paragraphs, counterarguments, nuanced thesis
- Analytical vs persuasive vs expository: Different purposes require different approaches. Teach the distinctions explicitly
- Close reading: Analyze HOW an author makes their argument, not just what they say. Rhetoric, tone, diction, structure
- AP/IB essay skills: Time management (plan 5 min, write 35 min, revise 5 min), sophisticated vocabulary, complex sentence structures
- Research papers: Primary vs secondary sources, annotated bibliography, proper MLA/APA/Chicago format, avoiding plagiarism
- College application essays: Show, don't tell. Specific anecdotes > vague claims. Be authentic. Answer the actual prompt

COLLEGE AND GRADUATE:
- Academic argument: Literature review → Gap identification → Thesis → Evidence → Analysis → Implications
- Discipline-specific conventions: Sciences use passive voice and methods sections. Humanities use active voice and close textual analysis. Social sciences use data and theory
- Citation mastery: In-text citations, reference lists, understanding when to cite (always cite ideas that aren't yours, even paraphrased)
- Critical synthesis: Not just summarizing sources but analyzing how they relate, conflict, and build on each other
- Academic tone: Formal but not stuffy. Precise vocabulary. Hedging language when appropriate ("suggests" vs "proves")
- Revision process: First draft = get ideas down. Second draft = reorganize and strengthen argument. Third draft = polish language and mechanics. Nobody writes well in one draft`
    },
  ],

  "health-wellness-coach": [
    {
      title: "Exercise Programming and Progressive Overload",
      content: `EXERCISE PROGRAMMING FUNDAMENTALS — General Education:

IMPORTANT DISCLAIMER: This is general fitness information based on widely accepted exercise science. It is NOT a personalized exercise prescription. Consult a qualified fitness professional and your healthcare provider before starting any new exercise program, especially if you have existing health conditions or injuries.

PROGRESSIVE OVERLOAD PRINCIPLES:
- The body adapts to stress. To continue improving, gradually increase the challenge over time
- Methods: Increase weight (most common), increase reps, increase sets, decrease rest time, increase range of motion, slow down tempo
- General guideline: Increase one variable by approximately 5-10% when current level feels manageable
- Periodization: Cycling training intensity over time prevents plateaus and overtraining. Concepts include varying volume and intensity across weeks
- Deload weeks: Reducing training volume/intensity periodically (every 4-8 weeks) can support recovery and long-term progress
- Signs of overtraining: Persistent fatigue, declining performance, mood changes, frequent illness, disrupted sleep. These warrant rest and possibly medical consultation

WORKOUT STRUCTURE CONCEPTS:
- General warm-up: 5-10 minutes light cardio, dynamic stretching, movement preparation. Increases blood flow, body temperature, and joint mobility
- Compound movements: Exercises that work multiple joints and muscle groups simultaneously (e.g., squats, rows, presses). Generally efficient for building strength
- Isolation exercises: Single-joint movements targeting specific muscles. Can complement compound movements
- Training splits: Full body (2-3x/week), Upper/Lower (4x/week), Push/Pull/Legs (3-6x/week). Different approaches suit different schedules and goals
- Cool-down: Light movement and static stretching may help with recovery and flexibility
- Rest between sets: Generally longer for strength-focused training (2-3+ minutes), shorter for endurance/conditioning

CARDIO FRAMEWORKS:
- Zone 2 training: Lower-intensity sustained effort where you can maintain a conversation. Discussed in exercise science as building aerobic base
- High-Intensity Interval Training (HIIT): Alternating high-effort and recovery periods. Time-efficient but more demanding on recovery
- Steady-state cardio: Consistent moderate intensity. Traditional approach, generally lower injury risk
- Concurrent training: Combining resistance training and cardio. Research suggests both can coexist with appropriate programming
- Exercise selection: The best cardio is the one you'll actually do consistently. Walking is a valid and research-supported form of exercise

RECOVERY CONSIDERATIONS:
- Sleep: Widely regarded as the most important recovery factor. Research suggests most adults benefit from 7-9 hours
- Nutrition timing: Research on post-workout nutrition suggests protein and carbohydrates support recovery. Individual needs vary
- Active recovery: Light movement on rest days (walking, gentle stretching, swimming) may help with recovery
- Foam rolling and stretching: May help with perceived recovery and flexibility. Research is mixed on some claimed benefits
- Hydration: Important for exercise performance and recovery. Individual needs vary based on body size, climate, and exercise intensity
- Listen to your body: Persistent pain (different from normal muscle soreness) warrants rest and professional evaluation`
    },
    {
      title: "Nutrition Fundamentals and Meal Planning Concepts",
      content: `NUTRITION EDUCATION — General Principles for Wellness:

IMPORTANT DISCLAIMER: This is general nutrition information. It is NOT medical nutrition therapy or a personalized diet plan. Consult a registered dietitian for personalized nutrition advice, especially if you have dietary restrictions, food allergies, or health conditions.

MACRONUTRIENT EDUCATION:
- Protein: Involved in muscle repair, immune function, enzyme production, and satiety. Found in meat, fish, eggs, dairy, legumes, tofu, and many plant sources
- Carbohydrates: Primary energy source for the brain and body. Found in grains, fruits, vegetables, legumes. Complex carbs (whole grains, vegetables) provide sustained energy and fiber
- Fats: Essential for hormone production, nutrient absorption (vitamins A, D, E, K), and brain function. Sources include nuts, seeds, avocados, olive oil, fatty fish
- Fiber: Important for digestive health, blood sugar regulation, and satiety. Found in fruits, vegetables, whole grains, legumes. General guideline: 25-38g daily for adults
- General balance: Most dietary guidelines suggest a mix of all three macronutrients at each meal. The ideal ratio varies based on individual needs and goals

MEAL PLANNING FRAMEWORKS:
- Plate method (general guideline): Approximately half the plate vegetables/fruits, quarter protein, quarter whole grains/starches. Add a source of healthy fat
- Meal prep approaches: Batch cooking proteins and grains, pre-chopping vegetables, preparing overnight oats or grab-and-go snacks
- Flexibility principle: Rigid meal plans often fail. Having a few go-to meals and adaptable frameworks tends to be more sustainable
- Grocery planning: Shopping with a list and meal plan reduces food waste and impulsive choices
- Budget-friendly nutrition: Frozen vegetables are nutritious and affordable, beans and lentils are inexpensive protein sources, seasonal produce tends to be cheaper

HYDRATION:
- General guideline: Approximately 8 cups (64oz) of water daily as a baseline. Individual needs vary significantly
- Factors affecting needs: Body size, physical activity level, climate, pregnancy/nursing, certain medications
- Signs of dehydration: Thirst, dark urine, fatigue, headache, dry mouth
- Water vs other beverages: Water is the simplest choice. Tea, coffee, and other beverages contribute to hydration. Sugary drinks add calories without nutritional benefit
- During exercise: General practice is to drink before, during, and after physical activity. Electrolyte drinks may be helpful for extended exercise (>60 minutes of vigorous activity)

COMMON NUTRITION MISCONCEPTIONS:
- "Eating fat makes you fat": Dietary fat is essential and doesn't automatically become body fat. Caloric balance matters more
- "Carbs are bad": Carbohydrates are the brain's preferred fuel. Quality and quantity matter — whole grains differ from added sugars
- "Skipping meals speeds up metabolism": Research generally doesn't support this. Consistent eating patterns tend to be more sustainable
- "Supplements can replace whole foods": Most people can get adequate nutrition from food. Supplements may fill specific gaps but aren't a substitute for a varied diet
- "There's one perfect diet": Different dietary patterns can support health. Mediterranean, plant-forward, and other balanced approaches all have research support
- "Detox diets cleanse your body": The liver and kidneys handle detoxification. No juice cleanse or supplement does this better than your own organs. Consult your doctor if you have concerns about toxin exposure`
    },
    {
      title: "Mental Wellness and Stress Reduction Techniques",
      content: `MENTAL WELLNESS — Evidence-Informed Approaches:

IMPORTANT DISCLAIMER: This information covers general wellness strategies. It is NOT therapy, counseling, or mental health treatment. If you are experiencing persistent mental health symptoms, crisis situations, or thoughts of self-harm, please reach out to a qualified mental health professional or call 988 (Suicide and Crisis Lifeline).

STRESS MANAGEMENT TECHNIQUES:
- Box breathing (4-4-4-4): Inhale 4 seconds, hold 4, exhale 4, hold 4. Activates the parasympathetic nervous system. Can be done anywhere, anytime
- Progressive muscle relaxation: Systematically tense and release muscle groups from toes to head. 10-15 minutes. Helps identify where you hold tension
- Grounding (5-4-3-2-1): Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. Brings attention to the present moment
- Journaling: Writing about stressors and emotions has research support for processing experiences. Even 10 minutes can help
- Nature exposure: Time outdoors is associated with reduced stress markers in multiple studies. A 20-minute walk in a natural setting can shift your state
- Social connection: Supportive relationships are consistently identified as a key factor in wellbeing. Quality over quantity

MINDFULNESS BASICS:
- What it is: Paying attention to the present moment without judgment. Not about emptying the mind — it's about noticing
- Starting practice: 5 minutes daily is a valid starting point. Sit comfortably, focus on breath, notice when mind wanders, gently return attention. That noticing-and-returning IS the practice
- Common misconception: "I can't meditate because my mind won't stop thinking." A busy mind is normal. The skill is in noticing thoughts without following them
- Apps for guidance: Headspace, Calm, Insight Timer, and Waking Up offer guided practices for beginners
- Body scan: Systematically moving attention through the body. Builds awareness of physical sensations and areas of tension
- Integration: Mindful moments throughout the day — eating without screens, walking and noticing surroundings, pausing before responding

SLEEP HYGIENE PRACTICES:
- Consistent schedule: Going to bed and waking up at the same time (including weekends) supports circadian rhythm
- Wind-down routine: 30-60 minutes before bed without screens, bright lights, or stimulating activities
- Environment: Cool (60-67°F / 15-19°C is often recommended), dark (blackout curtains or sleep mask), quiet (earplugs or white noise if needed)
- Caffeine awareness: Individual sensitivity varies widely. Some people are affected 8-10 hours after consumption
- Alcohol and sleep: While alcohol may help with falling asleep, it tends to reduce sleep quality, particularly REM sleep
- If you can't sleep: Rather than lying in bed frustrated, sleep researchers often suggest getting up and doing a calm activity until you feel sleepy

BUILDING RESILIENCE:
- Growth mindset: Viewing challenges as opportunities to learn rather than threats. Backed by research on psychological resilience
- Self-compassion: Treating yourself with the same kindness you'd offer a friend. Research by Dr. Kristin Neff links self-compassion to better emotional regulation
- Values identification: Knowing what matters to you provides direction during difficult times. Values act as a compass, not a destination
- Routine and structure: Especially helpful during uncertain times. Small, consistent actions create stability
- Seeking help is strength: Knowing when to ask for professional support is a sign of self-awareness, not weakness
- Recovery takes time: Healing and growth aren't linear. Setbacks are a normal part of any change process`
    },
  ],

  "hr-people-operations": [
    {
      title: "Employee Engagement and Retention Strategies",
      content: `EMPLOYEE ENGAGEMENT AND RETENTION — Building Sticky Organizations:

ENGAGEMENT FRAMEWORK:
- Gallup Q12: 12 questions that predict team performance. Key drivers: clear expectations, daily opportunity to do best work, recognition in last 7 days, someone cares about me as a person, development opportunities
- Engagement survey frequency: Annual surveys are outdated. Quarterly pulse surveys (5-10 questions) provide actionable, timely data
- eNPS (Employee Net Promoter Score): "How likely are you to recommend this company as a place to work?" Score -100 to +100. Above +20 is good, above +50 is excellent
- Action on feedback: Surveying without acting is worse than not surveying at all. Close the loop: "You said X, we're doing Y"

TOP RETENTION DRIVERS (IN ORDER):
1. Manager quality: People leave managers, not companies. Invest in manager training and selection
2. Growth opportunities: Career development, skill building, promotions, lateral moves. If people can't grow, they'll grow elsewhere
3. Compensation fairness: Not necessarily highest pay — but FAIR pay. Transparent bands reduce "grass is greener" syndrome
4. Purpose and meaning: Connection to mission. How does my work matter? Regular communication of impact
5. Work-life flexibility: Remote/hybrid options, flexible hours, PTO that people actually use
6. Recognition: Frequent, specific, timely. "Great job on the Q2 report — your analysis of the competitor data helped us adjust strategy" > "Good work"
7. Belonging: Inclusive culture where people feel safe to be themselves. Psychological safety predicts team performance (Google's Project Aristotle)

STAY INTERVIEW FRAMEWORK:
- Better than exit interviews — find out why people STAY before they decide to leave
- Questions: "What do you look forward to at work?" "What would make your job better?" "What might tempt you to leave?" "What haven't you been able to learn here that you'd like to?"
- Frequency: Quarterly with top performers. Semi-annually with all employees
- Manager-led: Direct managers should conduct these, not HR. The relationship matters

ONBOARDING (CRITICAL RETENTION WINDOW):
- The first 90 days determine whether someone stays or starts looking. 20% of turnover happens in the first 45 days
- Week 1: Welcome, setup, introductions, role clarity, first-day buddy/mentor. Make them feel WANTED, not processed
- Month 1: Clear 30-day goals, regular check-ins (minimum weekly), cultural immersion, stakeholder introductions
- Month 2-3: Increasing responsibility, first small wins, 60/90-day feedback conversations, connection to team goals
- 90-day check-in: Formal conversation. "Is this what you expected? What's working? What's not? What do you need from us?"
- Buddy program: Assign a peer (not their manager) for questions, social connection, and cultural guidance. Different from a mentor

TURNOVER ANALYSIS:
- Calculate regrettable turnover: People you WANTED to keep who left. This is the number that matters
- Cost of turnover: 50-200% of annual salary (recruiting, training, lost productivity, institutional knowledge loss)
- Exit interview data: Track patterns by department, manager, tenure, and role. If one manager's team has 3x turnover, that's a management problem
- Counter-offers: Only effective 50% of the time, and of those retained, 80% leave within 18 months anyway. Fix the root cause instead`
    },
    {
      title: "Workplace Conflict Resolution and Difficult Conversations",
      content: `WORKPLACE CONFLICT RESOLUTION AND DIFFICULT CONVERSATIONS:

CONFLICT RESOLUTION FRAMEWORKS:
- Thomas-Kilmann model: Five conflict styles — Competing, Accommodating, Avoiding, Collaborating, Compromising. No style is always right. Context determines the best approach
- Interest-based approach: Focus on underlying interests, not positions. Position: "I want a private office." Interest: "I need quiet space to concentrate." Interest opens creative solutions; positions create deadlocks
- STAR feedback: Situation (when/where), Task (what was expected), Action (what actually happened), Result (impact). Removes subjectivity from feedback

HAVING DIFFICULT CONVERSATIONS:
- Preparation: Know your key message, have specific examples, anticipate reactions, plan the opening line
- Opening: Lead with intent, not accusation. "I want to talk about something I've noticed because I care about your success here" vs "We need to talk about your performance"
- SBI model (Situation-Behavior-Impact): "In yesterday's meeting (situation), when you interrupted the client (behavior), they became visibly frustrated and asked to reschedule (impact)"
- Listen more than talk: Difficult conversations require understanding the other person's perspective. Ask open questions: "Help me understand your thinking on this"
- Avoid "always" and "never": These trigger defensiveness. Use specific instances instead
- Document: After the conversation, send a follow-up email summarizing what was discussed, what was agreed, and next steps. Creates a record and ensures alignment

COMMON WORKPLACE CONFLICTS:
- Interpersonal: Personality clashes, communication style differences, perceived disrespect. Often resolved through facilitated conversation and setting behavioral expectations
- Role ambiguity: Overlapping responsibilities, unclear ownership. Fix with written role definitions and RACI matrices (Responsible, Accountable, Consulted, Informed)
- Resource competition: Budget, headcount, equipment, attention from leadership. Transparent allocation criteria reduce perceived unfairness
- Values conflicts: Different priorities (speed vs quality, innovation vs stability). Often the most challenging. Requires alignment on organizational values and trade-offs
- Remote/hybrid friction: In-office vs remote employees, time zone challenges, perceived inequity. Clear policies and consistent application are key

INVESTIGATION BASICS:
- When to investigate: Harassment allegations, discrimination claims, policy violations, safety concerns, theft/fraud
- Investigator selection: Neutral party. Often HR, sometimes external (for sensitive cases involving leadership)
- Process: Receive complaint → Assess severity → Plan investigation → Interview complainant → Interview respondent → Interview witnesses → Gather documents → Analyze → Findings → Recommendations → Follow-up
- Documentation: Date, time, location, who was present, what was said (quotes when possible), evidence collected
- Confidentiality: Share information only on a need-to-know basis. "I can't promise complete confidentiality, but I will share information only with those who need to know to resolve this"
- Timeline: Complete investigations promptly. Dragging out investigations increases anxiety and legal risk. Target 2-4 weeks for standard cases
- No retaliation: Monitor for retaliation against complainant. Retaliation claims are separate from the original complaint and can be costly`
    },
    {
      title: "Remote Work Policy Design and Hybrid Team Management",
      content: `REMOTE AND HYBRID WORK — Policy Design and Management:

POLICY FRAMEWORK:
- Eligibility criteria: Define by role, not preference. Some roles require on-site presence (manufacturing, lab work, in-person service). Others are fully remote-capable. Be transparent about why
- Hybrid models: Fixed schedule (e.g., Tuesday-Thursday in office), flexible hybrid (minimum 2 days/week, employee chooses), manager-directed (team decides together)
- Core hours: Define overlap hours for collaboration (e.g., 10am-3pm local time). Outside core hours, flexibility is the default
- Equipment and stipend: Provide laptop, monitor, keyboard/mouse, headset. Monthly stipend for internet/home office costs ($50-100/month is common)
- Expense policy: What's reimbursable? Ergonomic chair, desk, second monitor, office supplies. Set a one-time home office setup budget ($500-1,500)

MANAGING REMOTE TEAMS EFFECTIVELY:
- Output-based performance: Measure results, not hours. Define clear deliverables, timelines, and quality standards
- Communication norms: Which tools for what? Chat for quick questions, email for formal/external, video for discussions, project tools for tracking. Document these norms
- Meeting reduction: Default to async. Before scheduling a meeting, ask: "Could this be an email/Slack message/Loom video?" If yes, don't schedule the meeting
- Documentation culture: Decisions, processes, context — all written down. Remote teams with poor documentation fail. Good documentation is an equalizer between time zones
- Virtual team building: Not forced fun. Budget for occasional in-person gatherings (quarterly or semi-annually). Virtual coffee chats. Interest-based channels (pets, cooking, hobbies). Team challenges

COMMON PITFALLS:
- Proximity bias: Promoting or favoring in-office employees over remote ones. Track promotion rates and performance ratings by work location
- Meeting overload: Remote workers average 2-3 more meetings per day than pre-pandemic. Audit meeting calendars. Cancel recurring meetings that lack clear purpose
- Isolation: Check in on remote employees' wellbeing, not just their work output. Loneliness is the #1 remote work complaint
- Overwork: Without commute as a boundary, remote workers tend to work longer hours. Encourage boundaries. Lead by example — managers should not send emails at midnight
- Security: Home networks are less secure. VPN requirements, device management, data handling policies, and security training are essential

LEGAL CONSIDERATIONS:
- Multi-state employment: Employees working from different states may trigger tax withholding, workers' comp, and employment law obligations in those states
- International remote work: Employment law, tax treaties, and data privacy rules vary by country. Consider Employer of Record (EOR) services for international hires
- Wage and hour: Track hours for non-exempt employees. Remote work doesn't change overtime requirements
- Workers' compensation: Home office injuries may be covered. Policy should address ergonomic requirements and injury reporting
- Employment agreements: Update contracts to reflect remote work arrangements, equipment provisions, and data security expectations`
    },
  ],

  "personal-finance-advisor": [
    {
      title: "Credit Score Optimization and Debt Management",
      content: `CREDIT SCORE AND DEBT MANAGEMENT — General Educational Information:

DISCLAIMER: This is general financial education, NOT personalized financial advice. Consult a licensed financial advisor for advice specific to your situation.

CREDIT SCORE FUNDAMENTALS:
- FICO Score components: Payment history (35%), amounts owed/utilization (30%), length of credit history (15%), credit mix (10%), new credit inquiries (10%)
- Score ranges: 300-579 (Poor), 580-669 (Fair), 670-739 (Good), 740-799 (Very Good), 800-850 (Exceptional)
- Credit utilization: General guideline is to keep overall utilization below 30%, with lower being better. Per-card and overall utilization both matter
- Payment history: Single most impactful factor. Even one 30-day late payment can significantly affect your score
- Hard inquiries: Each inquiry may temporarily reduce score by a few points. Multiple inquiries for the same type of loan within 14-45 days typically count as one (rate shopping)
- Authorized user strategy: Being added as an authorized user on someone's long-standing account with low utilization can potentially help build credit history

DEBT MANAGEMENT STRATEGIES:
- Debt avalanche: Pay minimums on all debts, extra payments to highest interest rate first. Mathematically optimal — saves the most in interest over time
- Debt snowball: Pay minimums on all, extra payments to smallest balance first. Psychologically motivating — quick wins build momentum. Research by behavioral economists suggests this method leads to higher completion rates
- Debt consolidation: Combining multiple debts into one, ideally at a lower interest rate. Options: personal loan, balance transfer credit card (0% intro APR periods), home equity loan
- Balance transfer: Moving high-interest credit card debt to a card with 0% introductory APR (typically 12-21 months). Watch for transfer fees (usually 3-5%)
- Student loan strategies: Income-driven repayment plans cap payments at percentage of discretionary income. Public Service Loan Forgiveness (PSLF) after 120 qualifying payments

EMERGENCY FUND:
- General guideline: 3-6 months of essential expenses in a readily accessible account
- Start small: Even $1,000 provides a buffer against common emergencies (car repair, medical copay, appliance replacement)
- Where to keep it: High-yield savings account (currently offering 4-5% APY). Not invested in stocks — needs to be available without risk of loss
- When to use it: Actual emergencies only. Job loss, medical expenses, essential repairs. Not vacations, shopping, or non-urgent wants
- Rebuild after use: Replenish the fund before resuming other financial goals. The emergency fund is the foundation

WHEN TO SEEK PROFESSIONAL HELP:
- Non-profit credit counseling: Free or low-cost budget help and debt management plans. Look for NFCC (National Foundation for Credit Counseling) members
- Avoid: Debt settlement companies that charge upfront fees, guaranteed credit repair services (no one can guarantee results), payday loans for debt management
- Bankruptcy: Last resort but sometimes the right choice. Chapter 7 (liquidation, discharge most debts) or Chapter 13 (reorganization, 3-5 year payment plan). Consult a bankruptcy attorney for guidance
- Signs you need help: Minimum payments consume more than 40% of income, borrowing to make payments on other debts, avoiding looking at statements, receiving collection calls`
    },
    {
      title: "Retirement Planning and Long-Term Wealth Building",
      content: `RETIREMENT PLANNING FUNDAMENTALS — General Education:

DISCLAIMER: This is general financial education, NOT personalized investment or retirement advice. Consult a licensed financial advisor for advice specific to your situation.

RETIREMENT ACCOUNT TYPES:
- 401(k) / 403(b): Employer-sponsored. 2025 contribution limit: $23,500 ($31,000 if 50+). Employer match is essentially free money — contribute at least enough to get the full match
- Traditional IRA: Tax-deductible contributions (income limits apply if employer plan available). Tax-deferred growth. Taxed on withdrawal
- Roth IRA: After-tax contributions. Tax-free growth and withdrawals in retirement. 2025 income limits: $150,000 (single), $236,000 (married filing jointly) for full contribution
- Roth 401(k): Combines 401(k) contribution limits with Roth tax treatment. No income limits (unlike Roth IRA)
- SEP IRA: For self-employed. Contribute up to 25% of net self-employment income, max $69,000 (2025)
- HSA (Health Savings Account): Triple tax advantage — deductible contributions, tax-free growth, tax-free withdrawals for medical expenses. After 65, withdrawals for any purpose taxed like traditional IRA

INVESTMENT FUNDAMENTALS:
- Asset allocation: Mix of stocks, bonds, and other assets based on time horizon and risk tolerance. Generally: more stocks when younger (growth), gradually more bonds as retirement approaches (stability)
- Index funds: Low-cost funds that track a market index (S&P 500, Total Stock Market, Total Bond Market). Historically, most actively managed funds underperform index funds over long periods after fees
- Expense ratios: The annual fee charged by funds. Difference between 0.03% (index fund) and 1% (active fund) costs tens of thousands over a career. Fees matter enormously
- Dollar-cost averaging: Investing a fixed amount regularly regardless of market conditions. Removes emotion from investing decisions. Automatic contributions do this naturally
- Diversification: Don't put all eggs in one basket. Spread across asset classes, geographies, and sectors. Reduces risk without necessarily reducing expected returns
- Rebalancing: Periodically adjusting portfolio back to target allocation. Annually or when allocation drifts more than 5% from target

RETIREMENT PLANNING CALCULATIONS:
- The 4% rule (general guideline): Withdraw 4% of portfolio in first year of retirement, adjust for inflation annually. Originally designed for a 30-year retirement horizon
- Working backwards: If you need $60,000/year in retirement and use the 4% guideline, you'd need approximately $1.5 million saved ($60,000 / 0.04)
- Social Security: Estimated benefits available at ssa.gov/myaccount. Claiming at 62 reduces benefit permanently vs waiting until full retirement age (67 for those born 1960+) or 70
- Inflation consideration: $1 today won't buy $1 worth of goods in 30 years. Historically, inflation has averaged approximately 3% annually. Plan in today's dollars, then adjust
- Healthcare costs: Often underestimated. Fidelity estimates an average retired couple at 65 may need approximately $315,000+ for healthcare in retirement (2023 estimate)

COMMON MISTAKES:
- Not starting early: Time is the most powerful factor due to compound growth. Starting at 25 vs 35 can mean hundreds of thousands more by retirement, even with the same total contributions
- Cashing out 401(k) when changing jobs: Triggers income tax plus 10% penalty if under 59.5. Roll over to new employer plan or IRA instead
- Timing the market: Research consistently shows that time IN the market matters more than TIMING the market. Missing just the 10 best days in a 20-year period dramatically reduces returns
- Neglecting beneficiary designations: 401(k) and IRA beneficiary designations override your will. Review and update after life changes (marriage, divorce, children)
- Lifestyle inflation: As income increases, maintain savings rate. Increasing lifestyle proportionally leaves retirement underfunded`
    },
    {
      title: "Tax Basics and Optimization Strategies for Individuals",
      content: `TAX PLANNING FUNDAMENTALS — General Education:

DISCLAIMER: This is general tax education, NOT personalized tax advice. Tax laws change frequently. Consult a licensed CPA or tax professional for advice specific to your situation.

TAX BRACKET BASICS:
- Marginal tax system: Only income ABOVE each threshold is taxed at the higher rate. Earning more never results in less take-home pay
- 2025 Federal brackets (single): 10% ($0-$11,925), 12% ($11,926-$48,475), 22% ($48,476-$103,350), 24% ($103,351-$197,300), 32% ($197,301-$250,525), 35% ($250,526-$626,350), 37% (over $626,350)
- Effective tax rate: Your actual overall rate after all brackets. Always lower than your marginal rate. This is the meaningful number
- State income tax: Varies from 0% (TX, FL, WA, NV, WY, SD, AK, TN, NH) to 13.3% (CA). Consider state taxes in relocation decisions

COMMON DEDUCTIONS AND CREDITS:
- Standard deduction (2025): $15,000 (single), $30,000 (married filing jointly). Most taxpayers take the standard deduction
- Itemized deductions: Mortgage interest (up to $750K loan), state/local taxes (SALT, capped at $10,000), charitable contributions, medical expenses above 7.5% AGI
- Child Tax Credit: Up to $2,000 per qualifying child under 17. Partially refundable
- Education credits: American Opportunity Credit (up to $2,500 for first 4 years of college), Lifetime Learning Credit (up to $2,000)
- Earned Income Tax Credit: For low-to-moderate income workers. Refundable credit up to $7,830 (2025, 3+ children)
- Deduction vs credit: A deduction reduces taxable income. A credit reduces tax owed dollar-for-dollar. Credits are generally more valuable

TAX-ADVANTAGED STRATEGIES:
- Maximize pre-tax contributions: 401(k), Traditional IRA, HSA contributions reduce current taxable income
- Tax-loss harvesting: Selling investments at a loss to offset capital gains. Can offset up to $3,000 of ordinary income per year. Excess losses carry forward
- Roth conversion: Converting Traditional IRA to Roth in low-income years. Pay tax now at lower rate, enjoy tax-free growth going forward. Particularly useful in early retirement before Social Security and RMDs begin
- Charitable giving: Donate appreciated stock (held >1 year) instead of cash. Deduct full market value, avoid capital gains tax on appreciation. Donor-Advised Funds (DAFs) allow bunching contributions
- Timing income and deductions: If expecting lower income next year, defer income (delay freelance invoicing) and accelerate deductions (prepay property taxes). Reverse if expecting higher income

SELF-EMPLOYMENT TAX CONSIDERATIONS:
- Self-employment tax: 15.3% on first $168,600 (2025) of net earnings, 2.9% above that. This is in addition to income tax
- Quarterly estimated payments: Required if you expect to owe $1,000+ in tax. Due April 15, June 15, September 15, January 15
- Common deductions: Home office (simplified $5/sq ft up to 300 sq ft, or actual expenses), health insurance premiums, vehicle mileage or actual expenses, professional development, software/tools, business meals (50%)
- S-Corp election: May reduce self-employment tax for higher-earning self-employed individuals by splitting income between salary and distributions. Consult a CPA for analysis
- Record keeping: Save ALL receipts and records. Digital tools like QuickBooks Self-Employed, FreshBooks, or even a spreadsheet. IRS audit window is generally 3 years (6 years for substantial understatement)`
    },
  ],
};

async function main() {
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log("Connected to database.");

  // Get agent IDs by slug
  const agentRes = await client.query('SELECT id, slug, name FROM "Agent"');
  const agentMap = {};
  for (const row of agentRes.rows) {
    agentMap[row.slug] = { id: row.id, name: row.name };
  }

  let totalInserted = 0;
  const report = [];

  for (const [slug, seeds] of Object.entries(NEW_SEEDS)) {
    const agent = agentMap[slug];
    if (!agent) {
      console.log(`WARNING: Agent '${slug}' not found in database. Skipping.`);
      continue;
    }

    // Check existing chunk titles to avoid exact duplicates
    const existingRes = await client.query(
      'SELECT title FROM "AgentKnowledgeChunk" WHERE "agentId" = $1',
      [agent.id]
    );
    const existingTitles = new Set(existingRes.rows.map(r => r.title));

    let inserted = 0;
    let skipped = 0;

    for (const seed of seeds) {
      if (existingTitles.has(seed.title)) {
        console.log(`  SKIP (duplicate): ${slug} → "${seed.title}"`);
        skipped++;
        continue;
      }

      const id = randomUUID();
      await client.query(
        `INSERT INTO "AgentKnowledgeChunk" (id, "agentId", title, content, source, "createdAt")
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [id, agent.id, seed.title, seed.content, "seed-expansion"]
      );
      inserted++;
      totalInserted++;
    }

    const finalCount = await client.query(
      'SELECT COUNT(*) as count FROM "AgentKnowledgeChunk" WHERE "agentId" = $1',
      [agent.id]
    );

    report.push({
      slug,
      name: agent.name,
      added: inserted,
      skipped,
      totalChunks: parseInt(finalCount.rows[0].count),
    });

    console.log(`  ${agent.name}: +${inserted} chunks (${skipped} skipped), total: ${finalCount.rows[0].count}`);
  }

  console.log("\n=== SEEDING REPORT ===");
  console.log(`Total new chunks inserted: ${totalInserted}`);
  console.log("\nAgent | Added | Total Chunks");
  console.log("-".repeat(60));
  for (const r of report) {
    console.log(`${r.name.padEnd(40)} | +${String(r.added).padEnd(5)} | ${r.totalChunks}`);
  }

  await client.end();
}

main().catch(err => {
  console.error("FATAL:", err);
  process.exit(1);
});
