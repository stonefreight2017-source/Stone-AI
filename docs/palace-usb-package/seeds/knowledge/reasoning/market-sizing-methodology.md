# Market Sizing Methodology

> Cardinal Seed — Intelligence Architecture
> Classification: Market Analysis / Strategic Planning
> Operates independently on OMEN without cloud dependencies

---

## Purpose

Market sizing answers the fundamental question: "How big is the opportunity?" Accurate market sizing informs pricing strategy, investment decisions, resource allocation, and growth planning. Bad market sizing leads to chasing markets too small to matter or underestimating markets big enough to build a company on.

Cardinal uses market sizing to ground the founder's strategic decisions in quantitative reality.

---

## 1. TAM / SAM / SOM Framework

### Definitions

**TAM — Total Addressable Market**
The total revenue opportunity available if a product achieved 100% market share. This is the theoretical maximum — the entire market for your category worldwide.

**SAM — Serviceable Addressable Market**
The portion of TAM that your product/service can actually reach given your business model, geography, pricing, and distribution channels. This is the realistic target market.

**SOM — Serviceable Obtainable Market**
The portion of SAM that you can realistically capture in the near term (1-3 years) given your current resources, brand, and competitive position. This is your actual target.

### The Funnel

```
┌─────────────────────────────────────┐
│              TAM                     │  "Everyone who could conceivably use this"
│  ┌─────────────────────────────┐    │
│  │           SAM                │    │  "Everyone we could realistically serve"
│  │  ┌─────────────────────┐    │    │
│  │  │       SOM            │    │    │  "Everyone we'll likely capture in 1-3 years"
│  │  └─────────────────────┘    │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### Stone AI Market Sizing Example

**TAM: Global AI Assistant Market**
- All consumers and businesses who could benefit from AI-powered personal assistance
- Include: chatbots, virtual assistants, AI copilots, agent platforms
- Estimated at $XX billion (research reports, growing at XX% CAGR)
- This is a huge number but mostly irrelevant — Stone AI won't serve enterprise chatbots or industrial AI

**SAM: Consumer AI Assistant Platforms (English-speaking markets)**
- Subset: Individual consumers willing to pay for AI assistant subscriptions
- Geography: US, UK, Canada, Australia (primary English markets)
- Price range: $0-$200/month (our pricing tier range)
- Platform: Web + mobile users (our delivery channels)
- Estimated at $X billion

**SOM: Achievable Stone AI Revenue (12-month target)**
- Given: Current marketing budget, team size, brand awareness
- Realistic conversion funnel: Traffic → Signup → Paid → Retained
- Target: X thousand paying users × $Y average revenue per user
- Estimated at $X million

### Common TAM/SAM/SOM Mistakes

**Mistake 1: "Everyone is our market"**
- TAM = "All internet users" is meaningless. Narrow to your actual category.
- Fix: Define the job-to-be-done, then count people with that job.

**Mistake 2: Conflating TAM with opportunity**
- A $100B TAM means nothing if your SOM is $500K.
- Fix: Focus investors and planning on SOM. Use TAM only to show long-term potential.

**Mistake 3: Using only top-down estimates**
- Analyst reports give round numbers that may not reflect your specific niche.
- Fix: Cross-validate with bottom-up calculations.

**Mistake 4: Static market sizing**
- Markets grow, shrink, and shift. A market size from 2023 may be wrong in 2026.
- Fix: Model growth rates and project forward with uncertainty ranges.

---

## 2. Top-Down Market Sizing

### Method

Start with a large, known market figure and narrow it down using filters:

```
Known total market
  × Percentage relevant to your geography
  × Percentage relevant to your customer segment
  × Percentage addressable by your business model
  × Percentage within your price range
  = Your addressable market
```

### Top-Down Process

**Step 1: Find a credible market estimate**
Sources for total market data:
- Gartner, Forrester, IDC (industry analyst firms)
- Statista (aggregated statistics)
- Grand View Research, Markets and Markets (market research firms)
- Government statistics (Census, BLS, Eurostat)
- Industry associations and trade groups
- Public company filings (revenue = portion of market they capture)

**Step 2: Apply geographic filter**
- If your product is US-only: US share of global market (typically 30-40% for software)
- If English-speaking: US + UK + Canada + Australia + others (~45-55%)
- If truly global: No filter needed, but consider localization costs

**Step 3: Apply segment filter**
- Consumer vs enterprise
- Age demographic
- Income level
- Technology adoption level
- Specific job-to-be-done

**Step 4: Apply business model filter**
- Subscription vs one-time purchase
- Self-serve vs sales-led
- Platform vs standalone
- Freemium vs paid-only

**Step 5: Calculate**

Example:
```
Global AI Assistant Market (2026):          $15B
× English-speaking markets:                 × 45% = $6.75B
× Consumer segment (not enterprise):        × 35% = $2.36B
× Willing to pay for subscription:          × 25% = $590M
× Relevant price range ($0-$200/mo):        × 80% = $472M

Stone AI SAM ≈ $472M
```

### Top-Down Strengths and Weaknesses

**Strengths**:
- Fast to calculate
- Uses authoritative data sources
- Good for communicating market potential to investors
- Useful for very early-stage sizing when you lack your own data

**Weaknesses**:
- Each filter multiplied introduces estimation error
- Small errors compound multiplicatively
- Tends to overestimate (every filter is a guess)
- Dependent on quality of initial market estimate
- Doesn't account for competitive dynamics

---

## 3. Bottom-Up Market Sizing

### Method

Start with unit economics and build up to the total market:

```
Number of potential customers
  × Percentage who would adopt this type of product
  × Percentage who would choose your product specifically
  × Average revenue per customer
  = Your addressable market
```

### Bottom-Up Process

**Step 1: Count potential customers**

For a consumer product, estimate the target population:
- Total population in target geography
- Subtract: Too young, too old, no internet access
- Subtract: Not in target demographic
- Result: Total potential customers

For B2B, count companies:
- Total companies in target geography
- Filter by industry, size, technology adoption
- Result: Total potential customer companies

**Step 2: Estimate adoption rate**

What percentage of potential customers would use a product in your category?

Methods to estimate:
- **Analogy**: What's the adoption rate for similar products? (e.g., if Spotify has 30% penetration in music streaming, what's a reasonable penetration for AI assistants?)
- **Survey data**: Industry surveys on AI tool adoption
- **Benchmark**: Technology adoption curves (Innovators 2.5%, Early Adopters 13.5%, Early Majority 34%, etc.)

**Step 3: Estimate your market share**

Given competitors and your competitive position:
- In a fragmented market with many competitors: 1-5% share is realistic for a new entrant
- In a market with 3-5 major players: 10-25% for a successful player
- Market leader in a mature market: 30-50%

**Step 4: Calculate average revenue per customer**

Based on your pricing tiers and expected tier distribution:

```
Pricing Tier Mix:
  FREE:    60% of users × $0/mo     = $0/user/mo
  STARTER: 20% of users × $19.99/mo = $4.00/user/mo
  PLUS:    10% of users × $49.99/mo = $5.00/user/mo
  SMART:   6% of users × $99.99/mo  = $6.00/user/mo
  PRO:     4% of users × $200/mo    = $8.00/user/mo

Blended ARPU = $23.00/user/mo (across ALL users including free)
Paid-only ARPU = $57.50/mo (across paying users only)
```

**Step 5: Build up**

Example:
```
US population (18-65, internet access):     200M
× AI assistant category adoption (2026):    × 8% = 16M
× Willingness to pay for AI assistant:      × 20% = 3.2M paying users (industry)
× Realistic Stone AI share (3 years):       × 2% = 64K paying users
× Annual revenue per paying user:           × $690/yr (ARPU)
= Stone AI SOM ≈ $44M ARR (3-year target)
```

### Bottom-Up Strengths and Weaknesses

**Strengths**:
- Grounded in unit economics you can validate
- Each assumption can be tested independently
- More conservative and defensible
- Directly connected to your business model

**Weaknesses**:
- Requires more detailed knowledge of your market
- Customer counting can be imprecise
- Adoption rate estimates are still guesses
- May underestimate if market dynamics change rapidly

---

## 4. Proxy Metrics

### When Direct Data Is Unavailable

Often, the market data you need doesn't exist in published form. Proxy metrics let you estimate from related, available data.

### Types of Proxies

**Revenue Proxies**
- Competitor employee count × revenue-per-employee benchmarks
- Competitor web traffic × industry conversion rates × average deal size
- App store downloads × estimated conversion to paid × average subscription price
- Job posting volume as proxy for growth rate

**Demand Proxies**
- Google Trends search volume for category keywords
- Reddit/forum discussion volume and sentiment
- App store category ranking trends
- Related product review volume growth

**Size Proxies**
- Number of companies in a vertical × average software spend per company
- Number of professionals in a role × percentage using category tools × average spend
- Device shipments × software attach rate × average price

### Proxy Calculation Example

"How much revenue does Competitor X have?"

Known:
- Competitor X has ~150 employees (LinkedIn)
- SaaS companies typically generate $150K-$300K revenue per employee
- Competitor X has raised $50M total (Crunchbase)
- At Series B, companies typically have $5M-$15M ARR

Proxy estimates:
- Employee proxy: 150 × $200K = **$30M ARR** (range: $22.5M - $45M)
- Funding proxy: **$10M ARR** (range: $5M - $15M)
- Reconciled estimate: **$15M-$30M ARR** (employee count suggests higher end; funding stage suggests lower end)

### Proxy Reliability

Rate each proxy on:
- **Directness**: How closely related is the proxy to what you're measuring?
- **Timeliness**: How current is the proxy data?
- **Precision**: How narrow is the range of estimates from this proxy?
- **Validation**: Can you cross-check with another independent proxy?

Always use multiple proxies and triangulate. If they converge, you have higher confidence. If they diverge, investigate why.

---

## 5. Market Growth Modeling

### Why Growth Rates Matter More Than Current Size

A $500M market growing at 40% annually is more attractive than a $5B market growing at 2%. In 5 years, the small fast-growing market will be $2.7B and accelerating. The large slow-growing market will be $5.5B and stagnating.

### Growth Rate Sources

**Historical growth rates**:
- Market research reports (Gartner, IDC publish CAGRs)
- Public company revenue growth in your category
- App store download trends for your category
- Google Trends for category search terms

**Growth rate modeling**:

**Linear growth**: Market grows by a fixed dollar amount each year
- Rare in technology markets. More common in mature, slow-growth industries.
- Formula: Size(t) = Size(0) + (Growth × t)

**Exponential growth**: Market grows by a fixed percentage each year (CAGR)
- Common in technology markets during growth phase
- Formula: Size(t) = Size(0) × (1 + CAGR)^t
- At 30% CAGR, market doubles in ~2.6 years

**S-curve growth**: Market grows exponentially, then decelerates as it approaches saturation
- Most realistic model for technology markets over long periods
- Early phase: exponential (technology adoption)
- Middle phase: rapid but decelerating (mainstream adoption)
- Late phase: slow growth approaching ceiling (market saturation)

**Logistic growth model**:
- Size(t) = Ceiling / (1 + e^(-k(t - t_midpoint)))
- Ceiling: Maximum market size (when everyone who will adopt has adopted)
- k: Growth rate parameter
- t_midpoint: When market reaches 50% of ceiling

### Estimating Market Ceiling

The ceiling is determined by:
1. **Total potential adopters** × **average spend when fully adopted**
2. Technology limitations (what the tech can't do yet)
3. Trust/regulatory barriers (what the market won't allow)
4. Substitution effects (what alternative solutions capture)

### Growth Scenario Modeling

Don't use a single growth rate. Model three scenarios:

| Scenario | CAGR | Assumption |
|----------|------|------------|
| Conservative | 15% | Current trends continue, no major catalysts |
| Base | 25% | Moderate acceleration from AI adoption trends |
| Aggressive | 40% | Major catalyst (breakthrough model, killer app, platform shift) |

```
Year    | Conservative | Base    | Aggressive
2026    | $500M        | $500M   | $500M
2027    | $575M        | $625M   | $700M
2028    | $661M        | $781M   | $980M
2029    | $760M        | $977M   | $1.37B
2030    | $874M        | $1.22B  | $1.92B
```

The spread between conservative and aggressive WIDENS over time — this is the cone of uncertainty applied to market sizing.

---

## 6. Competitive Market Share Analysis

### Market Share Estimation Methods

**Known data method** (for public companies):
- Public company revenue is reported in filings
- Sum up known revenue of major players
- Estimate total market = sum of known + estimate of long tail

**Traffic-based method** (for web/app businesses):
- Use SimilarWeb for relative traffic volumes
- If you know one company's revenue, use traffic ratios to estimate others
- Caution: Traffic correlates with but does not equal revenue

**App download method** (for mobile):
- Sensor Tower / App Annie for download and revenue estimates
- Category rankings as relative size indicators
- In-app purchase revenue estimates

### Market Concentration Metrics

**Herfindahl-Hirschman Index (HHI)**:
- Sum of squared market shares of all firms
- HHI < 1,500: Competitive market (many players, no dominant one)
- HHI 1,500-2,500: Moderately concentrated
- HHI > 2,500: Highly concentrated (few players dominate)

**Why this matters**:
- Fragmented markets (low HHI) = easier to enter but harder to grow large
- Concentrated markets (high HHI) = harder to enter but larger prizes if successful
- Markets transitioning from fragmented to concentrated = golden opportunity for consolidators

### Market Share Trajectory Planning

Where does Stone AI need to be on the market share curve?

```
Year 1: 0.1% of SAM (proving product-market fit)
Year 2: 0.5% of SAM (scaling acquisition)
Year 3: 2% of SAM (establishing brand and community)
Year 5: 5-10% of SAM (strong player in the market)
```

Each phase requires different strategies:
- 0-0.5%: Product quality and early adopter love
- 0.5-2%: Marketing efficiency and channel discovery
- 2-5%: Brand building and competitive differentiation
- 5-10%: Market expansion and platform effects

---

## 7. Market Sizing Pitfalls

### Pitfall 1: "The 1% Fallacy"

"If we capture just 1% of a $100B market, we'll be a $1B company!"

Why this is wrong:
- The $100B market likely includes segments you can't serve
- 1% market share still requires massive investment to achieve
- The calculation skips over HOW you get to 1%
- It's used to avoid doing actual market sizing

Fix: Build bottom-up from your actual customers, conversion rates, and unit economics.

### Pitfall 2: Double-Counting Markets

"The AI market is $50B and the productivity software market is $100B, so our TAM is $150B."

If your product sits at the intersection of AI and productivity, you can't add both markets. Your market is the INTERSECTION, which is much smaller than either market alone.

### Pitfall 3: Ignoring Willingness to Pay

You can count 100M potential users, but if only 5% are willing to pay and the average payment is $10/month, your revenue opportunity is very different from what a user count suggests.

Always convert user estimates to REVENUE estimates using realistic conversion and pricing assumptions.

### Pitfall 4: Static Competitor Assumptions

"Competitor X has 60% of the market, so only 40% is available."

Competitors can lose share. New entrants can create new demand. Markets can expand. Don't treat the current competitive landscape as fixed.

### Pitfall 5: Confusing Adjacent Markets

"Slack is in the communication market, so our communication tool competes with Slack."

Slack competes for enterprise team communication. A consumer messaging app does not compete with Slack despite both being "communication." Define your market by the specific job-to-be-done, not by broad category labels.

---

## 8. Market Sizing for Stone AI — Applied Framework

### Step 1: Define the Market

**Category**: Consumer AI assistant platforms with multi-agent capabilities
**Job-to-be-done**: Personal AI assistance across multiple domains (writing, coding, analysis, creativity, companionship)
**Customer**: Individual consumers, tech-savvy early adopters, willing to pay for premium AI tools
**Geography**: English-speaking markets (US primary, UK/Canada/Australia secondary)

### Step 2: Top-Down Estimate

```
Global AI assistant market (2026):        $12B (various analyst estimates)
× Consumer segment:                       × 30% = $3.6B
× English-speaking markets:               × 50% = $1.8B
× Multi-agent/comprehensive platforms:    × 20% = $360M

Stone AI SAM (top-down) ≈ $360M
```

### Step 3: Bottom-Up Estimate

```
US adults 18-55 with internet (2026):     180M
× Awareness of AI assistants:             × 60% = 108M
× Have tried an AI assistant:             × 40% = 43.2M
× Willing to pay monthly:                 × 15% = 6.5M
× Would choose a multi-agent platform:    × 10% = 650K
× Average annual revenue:                 × $480/yr
= Bottom-up SAM estimate:                 ≈ $312M

Stone AI SOM (2% of SAM in 3 years):      ≈ $6.2M ARR
```

### Step 4: Triangulate and Reconcile

- Top-down SAM: $360M
- Bottom-up SAM: $312M
- Convergence: Both estimates are in the $300-400M range. Reasonable confidence.
- SOM (3-year): $5-10M ARR range, requiring 10-20K paying subscribers at current ARPU

### Step 5: Sensitivity Analysis

What if adoption is 2x faster than assumed? SAM doubles to ~$650M.
What if willingness to pay is half? SAM drops to ~$160M.
What if ARPU is $100/mo instead of $40? Revenue opportunity multiplies 2.5x.

The biggest lever: willingness to pay for AI assistants. If this shifts significantly (either direction), all estimates change dramatically.

---

## 9. Integration with Other Cardinal Seeds

- **Competitive Intelligence Operations**: Competitor revenue estimates inform market share analysis
- **Scenario Planning Methodology**: Market size under different scenarios
- **Network Effects Analysis**: Network effects can expand TAM by creating new demand
- **Strategic Decision Analysis**: Market sizing informs investment and pricing decisions
- **Technology Radar Assessment**: Technology shifts can create or destroy markets
- **Weak Signal Detection**: Detecting market expansion or contraction signals early

---

## Summary

Market sizing provides the quantitative foundation for strategic planning. Cardinal's approach:

1. **TAM/SAM/SOM**: Frame the opportunity from global to achievable
2. **Top-down AND bottom-up**: Cross-validate with both methods
3. **Proxy metrics**: Fill data gaps with indirect but estimable measures
4. **Growth modeling**: Project markets forward with scenario-based growth rates
5. **Competitive analysis**: Understand market structure and share dynamics
6. **Avoid pitfalls**: No 1% fallacy, no double-counting, no static assumptions

The founder gets a grounded, defensible view of the market opportunity — not a fantasy number, not a pessimistic floor, but a range of estimates with stated assumptions that can be tested and updated.
