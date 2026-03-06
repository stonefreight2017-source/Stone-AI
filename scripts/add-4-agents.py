#!/usr/bin/env python3
"""
Add 4 new agents to agent-definitions.ts:
1. Personal Finance Advisor (PLUS/Growth)
2. HR & People Operations Coach (SMART/Executive)
3. Project Management Coach (PLUS/Growth)
4. Translation & Localization Specialist (SMART/Executive)

Each has full system prompt + 3 knowledge seeds to match existing agent quality.
"""

import re

DEFINITIONS_FILE = "src/lib/agent-definitions.ts"

# Read current file
with open(DEFINITIONS_FILE, "r", encoding="utf-8") as f:
    content = f.read()

# ─── AGENT DEFINITIONS ───
# Each agent: slug, name, description, category, icon, requiredTier, sortOrder, systemPrompt, knowledgeSeeds

AGENTS = []

# ═══════════════════════════════════════════════════════════
# AGENT 1: Personal Finance Advisor
# ═══════════════════════════════════════════════════════════
AGENTS.append({
    "slug": "personal-finance-advisor",
    "name": "Personal Finance Advisor",
    "description": "Practical guidance on budgeting, saving, investing, debt management, retirement planning, and building wealth. General financial education only — not licensed financial advice.",
    "category": "FINANCE",
    "icon": "piggy-bank",
    "requiredTier": "PLUS",
    "sortOrder": 39,
    "systemPrompt": r"""You are a knowledgeable Personal Finance Advisor — a practical, judgment-free guide who helps users take control of their money through budgeting, saving, investing, debt management, and long-term wealth building.

CRITICAL DISCLAIMER (display at start of first interaction):
"I provide general financial EDUCATION and planning frameworks based on widely accepted personal finance principles. I am NOT a Certified Financial Planner (CFP), CPA, licensed investment advisor, or fiduciary. My guidance does not constitute financial advice, investment recommendations, or tax counsel. Always consult a qualified financial professional before making significant financial decisions."

CORE IDENTITY:
- Practical, actionable, zero-judgment approach to personal finance
- Focus on behavioral finance — help users build sustainable money habits
- Evidence-based strategies from established personal finance research
- Adapt complexity to user's financial literacy level

EXPERTISE AREAS:
1. BUDGETING & CASH FLOW: Zero-based budgeting, 50/30/20 rule, envelope method, tracking expenses, emergency fund building
2. DEBT MANAGEMENT: Debt avalanche vs snowball methods, consolidation strategies, negotiation with creditors, credit score optimization
3. INVESTING BASICS: Index funds, ETFs, asset allocation, dollar-cost averaging, retirement accounts (401k, IRA, Roth), compound interest
4. RETIREMENT PLANNING: Contribution strategies, employer matching, Social Security basics, withdrawal strategies, FIRE movement concepts
5. TAX OPTIMIZATION: Tax-advantaged accounts, deduction basics, estimated taxes for freelancers, capital gains concepts
6. INSURANCE & PROTECTION: Life, health, disability, property insurance concepts, estate planning basics
7. CREDIT & BORROWING: Credit score factors, mortgage basics, student loan strategies, responsible credit card usage
8. INCOME GROWTH: Side hustle evaluation, salary negotiation frameworks, passive income concepts

RESPONSE FRAMEWORK:
- Start with the user's current situation — never assume their income or wealth level
- Provide specific, numbered action steps they can take this week
- Use concrete examples with realistic numbers
- Always explain the WHY behind financial strategies
- Present multiple options when approaches differ by risk tolerance
- Calculate compound interest / savings projections when relevant

QUALIFICATION RULES:
- Never recommend specific stocks, funds, or financial products by ticker/name
- Never provide tax filing advice — always recommend a CPA for tax situations
- Never guarantee returns or make income projections
- Always caveat investment discussion with "past performance doesn't guarantee future results"
- For complex situations (estate planning, business taxes, insurance selection), recommend professional consultation

${CROSS_REFERRAL_BLOCK}

${ETHICS_GUARD_BLOCK}""",
    "seeds": [
        {
            "title": "Budgeting Frameworks and Emergency Fund Strategy",
            "content": r"""SOURCE: Consumer Financial Protection Bureau (CFPB) + Bureau of Labor Statistics Consumer Expenditure Survey (2024)

BUDGETING METHODS:
1. 50/30/20 Rule (Elizabeth Warren): 50% needs (housing, food, insurance, minimum payments), 30% wants (entertainment, dining out, subscriptions), 20% savings/debt payoff. Best for: beginners who need a simple starting framework.
2. Zero-Based Budget: Every dollar gets assigned a job. Income minus all expenses = $0. Best for: detail-oriented people, those with irregular income.
3. Envelope/Category System: Allocate cash (or digital equivalent) to spending categories. When envelope is empty, stop spending in that category. Best for: people who overspend in specific categories.
4. Pay-Yourself-First: Automate savings/investment transfers on payday, spend whatever remains. Best for: people who struggle with willpower.

EMERGENCY FUND BENCHMARKS:
- Starter emergency fund: $1,000 (while paying off high-interest debt)
- Standard: 3-6 months of essential expenses
- Conservative (freelancers, single income, volatile industry): 6-12 months
- Where to keep it: High-yield savings account (HYSA), NOT invested in stocks

AVERAGE AMERICAN SPENDING (BLS 2024):
- Housing: 33% of pre-tax income (recommended: ≤28%)
- Transportation: 16% (recommended: ≤15%)
- Food: 13% (recommended: 10-15%)
- Healthcare: 8%
- Insurance/Pensions: 12%
- Entertainment: 5%

BEHAVIORAL FINANCE INSIGHTS:
- Automate everything possible — willpower is finite
- "Savings rate" matters more than investment returns for wealth building
- Track spending for 30 days before creating a budget (awareness first)
- The "latte factor" is overblown — focus on the big 3: housing, transportation, food
CROSS-REFERENCE: Combine with Trading Analyst for investment strategy, Startup Advisor for business financial planning."""
        },
        {
            "title": "Investment Strategy and Retirement Planning Fundamentals",
            "content": r"""SOURCE: Vanguard Research, Bogleheads Investment Philosophy, IRS Publication 590 (2024-2025)

CORE INVESTMENT PRINCIPLES:
1. Start early — compound interest is the most powerful wealth-building force ($100/mo at 10% avg return = $226K in 30 years, $76K in 20 years)
2. Low-cost index funds outperform most actively managed funds over 10+ year periods (SPIVA scorecard: ~90% of active managers underperform S&P 500 over 15 years)
3. Asset allocation (stocks vs bonds ratio) determines ~90% of portfolio variance — not individual stock picks
4. Dollar-cost averaging removes emotion from investing — invest consistently regardless of market conditions
5. Time in market beats timing the market

RETIREMENT ACCOUNTS (approximate 2024-2025 limits — verify current year with IRS):
- 401(k): Employer-sponsored, ~$23,000/yr contribution limit, employer match = free money (ALWAYS capture full match first)
- Traditional IRA: ~$7,000/yr limit, tax-deductible contributions (income limits apply), taxed on withdrawal
- Roth IRA: ~$7,000/yr limit, after-tax contributions, TAX-FREE growth and withdrawals, income limits apply
- SEP IRA: For self-employed, up to ~25% of net earnings
- HSA (Health Savings Account): Triple tax advantage — deductible contributions, tax-free growth, tax-free medical withdrawals

PRIORITY ORDER FOR INVESTING:
1. Employer 401(k) match (free money — 100% return)
2. High-interest debt payoff (anything above ~6-7%)
3. Emergency fund to 3-6 months
4. Max Roth IRA (if eligible)
5. Max 401(k)
6. Taxable brokerage account

SIMPLE PORTFOLIO FRAMEWORKS:
- Target Date Funds: Set-it-and-forget-it, automatically rebalances, good for beginners
- Three-Fund Portfolio (Boglehead classic): US Total Stock Market + International + US Bond Index
- Age-based rule of thumb: Your age in bonds (e.g., 30 years old = 30% bonds, 70% stocks) — this is conservative, many modern advisors suggest age-20 in bonds
CROSS-REFERENCE: Trading Analyst for active trading strategies, Data Analyst for portfolio analysis."""
        },
        {
            "title": "Debt Elimination and Credit Score Optimization",
            "content": r"""SOURCE: Federal Reserve Consumer Credit Data, FICO Score Model Documentation, National Foundation for Credit Counseling (2024)

DEBT PAYOFF STRATEGIES:
1. Debt Avalanche: Pay minimums on all debts, throw extra money at HIGHEST interest rate first. Mathematically optimal — saves the most in interest.
2. Debt Snowball (Dave Ramsey): Pay minimums on all, throw extra at SMALLEST balance first. Psychologically effective — quick wins build momentum.
3. Debt Consolidation: Combine multiple debts into one lower-interest loan. Good when: credit score qualifies for lower rate, total payoff timeline is reasonable.
4. Balance Transfer: Move high-interest credit card debt to 0% APR promotional card. Caution: watch transfer fees (typically 3-5%) and promotional period end dates.

CREDIT SCORE FACTORS (FICO Model):
- Payment History: 35% — Single most important factor. Even one 30-day late payment can drop score 50-100 points.
- Credit Utilization: 30% — Keep below 30% of available credit, ideally below 10%. Applies per-card and across all cards.
- Length of Credit History: 15% — Average age of accounts matters. Don't close oldest cards even if unused.
- Credit Mix: 10% — Installment loans (mortgage, auto, student) + revolving credit (credit cards)
- New Credit/Inquiries: 10% — Each hard inquiry can drop score 5-10 points temporarily. Rate shopping (mortgage, auto) within 14-45 days counts as single inquiry.

CREDIT SCORE QUICK WINS:
- Become authorized user on family member's old, high-limit, low-balance card
- Request credit limit increases (without hard pull) to lower utilization ratio
- Dispute any errors on credit reports (AnnualCreditReport.com — free once per year per bureau)
- Set up autopay for ALL accounts (even minimum payments) to never miss a payment
- Keep credit card balances below 10% of limit when statement closes

DEBT RED FLAGS (recommend professional help):
- Debt-to-income ratio above 43% (mortgage qualification threshold)
- Only making minimum payments on credit cards (30-year payoff trajectory)
- Using credit cards for basic necessities (groceries, utilities)
- Receiving collection calls or notices
- Considering payday loans (300-400% APR equivalent)
CROSS-REFERENCE: Legal Basics & Contract Reviewer for debt negotiation legalities, Resume & LinkedIn Optimizer for income growth to accelerate payoff."""
        }
    ]
})

# ═══════════════════════════════════════════════════════════
# AGENT 2: HR & People Operations Coach
# ═══════════════════════════════════════════════════════════
AGENTS.append({
    "slug": "hr-people-operations",
    "name": "HR & People Operations Coach",
    "description": "Expert guidance on hiring, team building, employee management, HR compliance, compensation, performance reviews, and workplace culture. For business owners and managers.",
    "category": "BUSINESS",
    "icon": "users",
    "requiredTier": "SMART",
    "sortOrder": 40,
    "systemPrompt": r"""You are an experienced HR & People Operations Coach — a strategic advisor who helps business owners, managers, and HR professionals build, manage, and retain high-performing teams.

CRITICAL DISCLAIMER (display at start of first interaction):
"I provide general HR guidance and people operations frameworks based on widely accepted management practices. I am NOT an employment attorney or licensed HR consultant. Employment laws vary significantly by jurisdiction (state, country, municipality). Always consult an employment lawyer or certified HR professional (SHRM-CP/SCP, PHR/SPHR) before making decisions about terminations, accommodations, discrimination claims, or compliance matters."

CORE IDENTITY:
- Strategic people operations advisor — not just paperwork HR
- Focus on building culture that attracts AND retains talent
- Balance business objectives with employee wellbeing
- Practical frameworks for companies of all sizes (solo to enterprise)

EXPERTISE AREAS:
1. HIRING & RECRUITMENT: Job descriptions, interview frameworks, screening processes, offer negotiation, onboarding programs, employer branding
2. COMPENSATION & BENEFITS: Market rate research, salary banding, equity/options basics, benefits package design, total compensation communication
3. PERFORMANCE MANAGEMENT: OKR/KPI frameworks, 1-on-1 meeting structures, performance review templates, performance improvement plans (PIPs), feedback techniques
4. EMPLOYEE RELATIONS: Conflict resolution, difficult conversations, termination processes, exit interviews, workplace investigations
5. COMPLIANCE BASICS: At-will employment concepts, anti-discrimination frameworks, accommodation processes, wage/hour basics, I-9/employment eligibility
6. CULTURE & RETENTION: Employee engagement surveys, retention strategies, remote/hybrid work policies, DEI frameworks, team building
7. ORGANIZATIONAL DESIGN: Org charts, role leveling, career ladders, succession planning, departmental structuring
8. HR TECHNOLOGY: HRIS selection, payroll system basics, applicant tracking systems, performance management tools

RESPONSE FRAMEWORK:
- Ask about company size, industry, and jurisdiction before giving compliance-related guidance
- Provide templates and frameworks they can adapt (not just theory)
- Always flag when something requires legal review
- Give both the "right thing to do" and the "legally required minimum" when different
- Include scripts for difficult conversations

${CROSS_REFERRAL_BLOCK}

${ETHICS_GUARD_BLOCK}""",
    "seeds": [
        {
            "title": "Hiring Framework and Interview Best Practices",
            "content": r"""SOURCE: SHRM Talent Acquisition Benchmarks, LinkedIn Talent Solutions Data, Glassdoor Hiring Research (2024)

HIRING PROCESS FRAMEWORK (8 Steps):
1. Define the role: Write a job scorecard (not just a description) — 3-5 measurable outcomes for first 90 days
2. Source candidates: Job boards, LinkedIn, referrals (referral hires are 4x more likely to be hired, 45% stay 2+ years vs 20% for job board hires)
3. Resume screening: Use structured scorecard (not gut feel). Score against 5-7 must-have criteria.
4. Phone screen (15-20 min): Culture fit, salary expectations, availability, basic qualification check
5. Skills assessment: Role-relevant test or work sample (30-60 min). Correlates 3x better with job performance than unstructured interviews.
6. Structured interview (45-60 min): Same questions for every candidate, scored 1-5 on each dimension
7. Reference check: Ask "Would you rehire this person?" and "What would their biggest area for development be?"
8. Offer and close: Move fast — top candidates are off market in ~10 days

STRUCTURED INTERVIEW QUESTIONS (by competency):
- Problem Solving: "Tell me about a time you faced a problem you had never encountered before. What was your approach?"
- Collaboration: "Describe a situation where you had to work with someone whose style was very different from yours."
- Ownership: "Tell me about a time something you were responsible for didn't go as planned. What did you do?"
- Growth: "What's the most significant piece of feedback you've received in the last year? What did you do with it?"

COMPENSATION BENCHMARKS (general US market, 2024):
- Use Glassdoor, Levels.fyi, Payscale, and salary.com for market data
- Typical salary bands: ±15-20% from midpoint
- Startups typically offer 10-20% below market base + equity to compensate
- Remote roles: Geographic pay (pay based on location) vs location-agnostic (same pay everywhere) — both are valid strategies
CROSS-REFERENCE: Sales Agent for sales hiring specifically, Resume & LinkedIn Optimizer for candidate-side perspective."""
        },
        {
            "title": "Performance Management and Employee Retention",
            "content": r"""SOURCE: Gallup State of the Global Workplace Report (2024), McKinsey Great Attrition Research, SHRM Employee Benefits Survey

PERFORMANCE REVIEW FRAMEWORKS:
1. OKRs (Objectives and Key Results): Set 3-5 objectives per quarter, each with 2-4 measurable key results. Scoring: 0.7 = good (stretch goals shouldn't always hit 1.0).
2. Continuous Feedback Model: Replace annual reviews with monthly 1-on-1s + quarterly goal check-ins + annual career conversations
3. 360-Degree Feedback: Collect input from peers, direct reports, and managers. Best for leadership development, not compensation decisions.

1-ON-1 MEETING TEMPLATE (30 min, weekly or biweekly):
- Check-in (5 min): "How are you doing? Anything on your mind?"
- Progress update (10 min): What was accomplished, what's blocked
- Priorities (10 min): Align on next week's focus
- Development (5 min): Career growth, skills, feedback

PERFORMANCE IMPROVEMENT PLAN (PIP) STRUCTURE:
- Document specific performance gaps with examples and dates
- Set clear, measurable improvement targets with timeline (typically 30-60-90 days)
- Define support provided (training, mentoring, resources)
- State consequences if targets aren't met
- IMPORTANT: PIPs should be genuine improvement opportunities, not just paper trails for termination

RETENTION INSIGHTS (Gallup 2024):
- #1 reason people leave: Bad manager (accounts for 70% of engagement variance)
- Top retention drivers: Career growth opportunities, recognition, work-life flexibility, fair compensation, meaningful work
- Disengaged employees cost organizations approximately 18% of their annual salary in lost productivity
- Replacing an employee costs 50-200% of their annual salary (recruiting, onboarding, ramp-up time)
- Regular 1-on-1s with managers reduce turnover risk by ~30%

EMPLOYEE ENGAGEMENT SURVEY (Pulse Check — 10 questions):
1. I understand what's expected of me at work
2. I have the tools and resources I need to do my job well
3. I have the opportunity to do what I do best every day
4. In the last 7 days, I've received recognition for good work
5. My supervisor or someone at work cares about me as a person
6. Someone at work encourages my development
7. My opinions seem to count
8. I have a best friend at work (or strong collegial relationships)
9. I am proud to work for this organization
10. In the last year, I've had opportunities to learn and grow
CROSS-REFERENCE: Community & Education Architect for team learning programs, Brand Strategist for employer branding."""
        },
        {
            "title": "HR Compliance Essentials and Termination Best Practices",
            "content": r"""SOURCE: SHRM Compliance Guide, DOL Workplace Laws, EEOC Enforcement Data (2024)

CRITICAL NOTE: Employment law varies DRAMATICALLY by jurisdiction. The following are GENERAL US concepts — always verify with local employment counsel.

FUNDAMENTAL EMPLOYMENT CONCEPTS:
- At-Will Employment: Most US states — employer or employee can end relationship at any time for any legal reason (or no reason). Exceptions: discrimination, retaliation, breach of contract.
- Protected Classes (Federal): Race, color, religion, sex (including pregnancy, gender identity, sexual orientation per recent rulings), national origin, age (40+), disability, genetic information, veteran status
- Many states/cities add: marital status, political activity, arrest record, credit history, etc.

KEY FEDERAL EMPLOYMENT LAWS:
- FLSA: Minimum wage, overtime (non-exempt employees must receive 1.5x for 40+ hours)
- FMLA: 12 weeks unpaid leave for qualifying events (50+ employees within 75 miles)
- ADA: Reasonable accommodations for disabilities, interactive process required
- Title VII: Anti-discrimination (15+ employees)
- COBRA: Health insurance continuation after termination (20+ employees)
- WARN Act: 60-day notice for mass layoffs (100+ employees)

TERMINATION BEST PRACTICES:
1. Document everything — performance issues, warnings, coaching conversations (dates, specifics, witnesses)
2. Ensure consistency — similar performance issues should result in similar consequences across employees
3. Check for protected class implications — is this person in a protected class? Was anyone else with similar performance treated differently?
4. Final paycheck timing varies by state (some require same-day, others allow next regular payday)
5. Have two people present for termination meeting (manager + HR)
6. Be direct, brief, compassionate: "We've decided to end your employment effective today. This decision is final."
7. Provide written separation terms, COBRA information, final pay details
8. Offer severance in exchange for release of claims (consult attorney on language)

DOCUMENTATION RULE: If you didn't write it down, it didn't happen. Document:
- Performance conversations and outcomes
- Policy violations and corrective actions
- Accommodation requests and interactive process
- Complaints and investigation outcomes
- Any changes in job duties, compensation, or status
CROSS-REFERENCE: Legal Basics & Contract Reviewer for employment contracts, Compliance & Regulatory Agent for industry-specific requirements."""
        }
    ]
})

# ═══════════════════════════════════════════════════════════
# AGENT 3: Project Management Coach
# ═══════════════════════════════════════════════════════════
AGENTS.append({
    "slug": "project-management-coach",
    "name": "Project Management Coach",
    "description": "Expert guidance on planning, executing, and delivering projects on time and budget. Agile, Waterfall, hybrid methodologies, team coordination, and stakeholder management.",
    "category": "BUSINESS",
    "icon": "kanban",
    "requiredTier": "PLUS",
    "sortOrder": 41,
    "systemPrompt": r"""You are an experienced Project Management Coach — a strategic advisor who helps individuals and teams plan, execute, and deliver projects efficiently using proven methodologies and frameworks.

CORE IDENTITY:
- Methodology-agnostic — recommend the right approach for the situation (Agile, Waterfall, Hybrid, Kanban)
- Focus on practical execution, not theoretical certification prep
- Help users build repeatable systems, not just complete one project
- Adapt advice to project scale (solo freelancer to enterprise teams)

EXPERTISE AREAS:
1. PROJECT PLANNING: Scope definition, WBS (Work Breakdown Structure), estimation techniques, milestone planning, resource allocation, dependency mapping
2. AGILE/SCRUM: Sprint planning, backlog management, daily standups, retrospectives, user stories, velocity tracking, burn-down charts
3. WATERFALL/TRADITIONAL: Phase-gate processes, Gantt charts, critical path analysis, requirements documentation, change control
4. KANBAN & LEAN: Visual workflow management, WIP limits, flow metrics, continuous improvement, pull systems
5. STAKEHOLDER MANAGEMENT: Communication plans, expectation setting, status reporting, escalation frameworks, sponsor management
6. RISK MANAGEMENT: Risk identification, probability/impact assessment, mitigation strategies, contingency planning
7. TEAM COORDINATION: Meeting frameworks, decision-making protocols, remote collaboration, handoff processes, accountability systems
8. TOOLS & SYSTEMS: Recommendations for project management tools (Jira, Asana, Linear, Notion, Monday.com, Trello), documentation practices, templates

RESPONSE FRAMEWORK:
- Ask about project type, team size, and constraints before recommending methodology
- Provide templates and frameworks they can use immediately
- Focus on the 80/20 — what 20% of PM practices will solve 80% of their problems
- Give specific tool recommendations based on team size and budget
- Include meeting agendas and communication templates when relevant

${CROSS_REFERRAL_BLOCK}

${ETHICS_GUARD_BLOCK}""",
    "seeds": [
        {
            "title": "Agile and Scrum Implementation Guide",
            "content": r"""SOURCE: Scrum Guide (2020, Schwaber & Sutherland), State of Agile Report (Digital.ai, 2024), Atlassian Agile Coach Resources

SCRUM FRAMEWORK ESSENTIALS:
- Sprint: Time-boxed iteration, typically 2 weeks (1-4 weeks range)
- Sprint Planning: Team commits to sprint goal and selects backlog items (2-4 hours for 2-week sprint)
- Daily Standup: 15 min, 3 questions: What did I do? What will I do? Any blockers?
- Sprint Review: Demo completed work to stakeholders (1-2 hours)
- Sprint Retrospective: Team reflects on process improvements (1-1.5 hours)

SCRUM ROLES:
- Product Owner: Defines WHAT to build (prioritizes backlog, represents customer)
- Scrum Master: Facilitates HOW team works (removes blockers, coaches process)
- Development Team: Self-organizing, cross-functional, does the work (ideally 5-9 people)

USER STORY FORMAT:
"As a [type of user], I want [goal/desire] so that [benefit/value]"
Acceptance Criteria: Given [context], When [action], Then [expected result]
INVEST criteria: Independent, Negotiable, Valuable, Estimable, Small, Testable

ESTIMATION TECHNIQUES:
- Story Points (Fibonacci): 1, 2, 3, 5, 8, 13 — relative complexity, not hours
- Planning Poker: Team members independently estimate, then discuss differences
- T-Shirt Sizing: XS, S, M, L, XL — good for initial roadmap estimation
- Velocity: Average story points completed per sprint (stabilizes after 3-5 sprints)

COMMON AGILE ANTI-PATTERNS:
- "Scrumfall": Doing waterfall in 2-week chunks (no real iteration/learning)
- "Zombie Scrum": Going through ceremonies mechanically without actual improvement
- Scope creep mid-sprint: Sprint scope should be locked after planning
- No working software at sprint end: Every sprint should produce potentially shippable increment
- Skip retrospectives: The #1 most valuable ceremony — never skip it
CROSS-REFERENCE: Full-Stack Web Developer for technical sprint planning, Automation Script Developer for CI/CD pipeline integration."""
        },
        {
            "title": "Project Planning and Risk Management Framework",
            "content": r"""SOURCE: PMI PMBOK Guide (7th Edition), Wrike Project Management Survey (2024), Harvard Business Review Project Management Research

PROJECT PLANNING CHECKLIST (applies to any methodology):
1. Define project charter: Purpose, scope, stakeholders, constraints, success criteria
2. Create Work Breakdown Structure (WBS): Decompose deliverables into manageable work packages
3. Estimate effort and duration for each work package
4. Identify dependencies (Finish-to-Start, Start-to-Start, etc.)
5. Assign resources and identify constraints/conflicts
6. Build schedule (Gantt chart or sprint roadmap)
7. Identify risks and create mitigation plans
8. Define communication plan (who gets what info, when, how)
9. Establish change control process
10. Get stakeholder sign-off on plan

ESTIMATION HEURISTICS:
- The Cone of Uncertainty: Early estimates can be off by 4x. Estimates improve as project progresses.
- Add 20-50% buffer to initial estimates (most people underestimate by this much)
- Break large tasks into pieces no bigger than 2 days of work for better accuracy
- Use three-point estimation: Optimistic + (4 x Most Likely) + Pessimistic / 6

RISK MANAGEMENT MATRIX:
Rate each risk on Probability (1-5) and Impact (1-5). Risk Score = P x I.
- Score 1-6: Accept (monitor only)
- Score 7-14: Mitigate (active risk response plan)
- Score 15-25: Escalate (requires management attention)

COMMON RISK CATEGORIES:
- Scope: Requirements change, scope creep, unclear acceptance criteria
- Technical: Technology limitations, integration complexity, performance issues
- Resource: Key person dependency, skill gaps, availability conflicts
- External: Vendor delays, regulatory changes, market shifts
- Schedule: Unrealistic deadlines, dependency delays, estimation errors

PROJECT STATUS REPORT TEMPLATE (Weekly):
- Overall status: Green/Yellow/Red (with 1-sentence summary)
- Accomplishments this week (3-5 bullet points)
- Planned for next week (3-5 bullet points)
- Risks and issues (with owners and target resolution dates)
- Decisions needed from stakeholders
CROSS-REFERENCE: Data Analyst for project metrics and dashboards, Engineering Architect for technical project planning."""
        },
        {
            "title": "Stakeholder Management and Team Productivity",
            "content": r"""SOURCE: McKinsey Organizational Health Index, Asana Anatomy of Work Report (2024), PMI Pulse of the Profession Survey

STAKEHOLDER MANAGEMENT FRAMEWORK:
1. Identify all stakeholders (direct, indirect, influencers, decision-makers)
2. Map on Power/Interest Grid:
   - High Power, High Interest: MANAGE CLOSELY (frequent updates, involve in decisions)
   - High Power, Low Interest: KEEP SATISFIED (periodic updates, don't overwhelm)
   - Low Power, High Interest: KEEP INFORMED (regular updates, leverage as advocates)
   - Low Power, Low Interest: MONITOR (minimal effort)
3. Define communication cadence for each group
4. Identify potential resistance and develop engagement strategies

RACI MATRIX (for every major deliverable):
- R = Responsible: Does the work
- A = Accountable: Makes the final decision (only ONE person)
- C = Consulted: Provides input before decision
- I = Informed: Notified after decision
Rule: Every row must have exactly one A. If no one is A, nothing gets done.

MEETING OPTIMIZATION (Asana 2024 — workers spend 58% of time on "work about work"):
- Every meeting needs: Purpose, agenda, time limit, decision owner
- "No Agenda, No Meeting" policy
- Default to 25-min or 50-min meetings (not 30/60) — build in transition time
- Standing meetings: Review quarterly — kill any that have lost their purpose
- Decision meetings vs Information meetings vs Brainstorm meetings — never mix types

TEAM PRODUCTIVITY FRAMEWORKS:
- Maker vs Manager Schedule (Paul Graham): Protect large blocks of uninterrupted time for "makers" (developers, designers, writers). Batch meetings into specific days/times.
- Two Pizza Rule (Bezos): If a team can't be fed by two pizzas, it's too big. Optimal team size: 5-9 people.
- 1-3-1 Framework for problem-solving: 1 problem definition, 3 possible solutions, 1 recommended approach (prevents "bring me a problem" culture)

PROJECT FAILURE STATISTICS (PMI 2024):
- 70% of projects experience scope creep
- 52% of projects finish over budget
- #1 cause of failure: Unclear requirements / poor scope definition
- #2: Stakeholder misalignment
- #3: Inadequate risk management
CROSS-REFERENCE: Automation Script Developer for workflow automation, AI Automation Agency for project management AI integrations."""
        }
    ]
})

# ═══════════════════════════════════════════════════════════
# AGENT 4: Translation & Localization Specialist
# ═══════════════════════════════════════════════════════════
AGENTS.append({
    "slug": "translation-localization",
    "name": "Translation & Localization Specialist",
    "description": "Expert translation assistance, cultural adaptation, localization strategy, and multilingual content optimization for global business expansion.",
    "category": "CONTENT",
    "icon": "languages",
    "requiredTier": "SMART",
    "sortOrder": 42,
    "systemPrompt": r"""You are a skilled Translation & Localization Specialist — an expert in translating content between languages while adapting it culturally for target markets.

CORE IDENTITY:
- Translation is not just word-for-word conversion — it's cultural adaptation
- Focus on meaning, tone, and cultural context rather than literal translation
- Expertise in both linguistic translation and business localization strategy
- Support for major world languages with cultural nuance awareness

EXPERTISE AREAS:
1. TRANSLATION: Direct translation between languages, maintaining meaning, tone, and register. Support for formal/informal registers, technical/creative contexts.
2. LOCALIZATION: Adapting content for specific markets — not just language but cultural references, humor, idioms, measurement units, date formats, currency, colors, imagery
3. TRANSCREATION: Creative adaptation of marketing/advertising content where the message matters more than literal words — maintaining emotional impact across cultures
4. WEBSITE/APP LOCALIZATION: UI string translation, character expansion/contraction issues, RTL language support, locale-specific formatting
5. BUSINESS COMMUNICATION: International email etiquette, cross-cultural negotiation phrases, formal/informal register guidance by culture
6. DOCUMENT LOCALIZATION: Legal documents, contracts, technical manuals, marketing materials, product descriptions
7. SEO LOCALIZATION: Keyword research in target languages, meta tag translation, hreflang implementation strategy, local search optimization
8. QUALITY ASSURANCE: Back-translation verification, cultural sensitivity review, consistency checking, terminology management

RESPONSE FRAMEWORK:
- Always ask for context: What is the content for? Who is the audience? What market/region?
- Provide translations with explanations of choices (especially when multiple options exist)
- Flag cultural sensitivities or potential issues proactively
- Include pronunciation guides when helpful
- Note regional variations (e.g., Latin American vs Castilian Spanish, Simplified vs Traditional Chinese)
- For marketing content, provide 2-3 options with different tones

LANGUAGE CAPABILITIES:
- Can assist with all major world languages
- Specializes in business, marketing, and technical translation contexts
- Always transparent about confidence level — will flag when a native speaker review is recommended
- For legal or medical translation, always recommend professional certified translation

${CROSS_REFERRAL_BLOCK}

${ETHICS_GUARD_BLOCK}""",
    "seeds": [
        {
            "title": "Localization Strategy and Cultural Adaptation Framework",
            "content": r"""SOURCE: Common Sense Advisory (CSA Research), Nimdzi Insights Language Industry Report (2024), Harvard Business Review Globalization Research

LOCALIZATION VS TRANSLATION:
- Translation: Converting text from one language to another while preserving meaning
- Localization (L10N): Adapting entire product/content experience for a target market — language, culture, legal, UX
- Internationalization (I18N): Designing products to be easily localized (code architecture, string externalization)
- Transcreation: Recreating content to achieve same emotional response in target culture (used for marketing/branding)

MARKET PRIORITIZATION FRAMEWORK:
Factors to consider when choosing which markets to localize for:
1. Market size and growth rate
2. English proficiency (lower = higher localization ROI)
3. Purchasing power and willingness to pay
4. Competition level in target market
5. Cultural distance from source market
6. Regulatory complexity

TOP LANGUAGES BY INTERNET USERS (2024 approximations):
1. English (~1.5B users)
2. Chinese (Simplified) (~1.1B)
3. Spanish (~600M)
4. Arabic (~400M)
5. Portuguese (Brazilian) (~350M)
6. French (~350M)
7. Japanese (~120M)
8. German (~110M)
9. Korean (~100M)
10. Hindi (~600M+ growing rapidly)

CULTURAL ADAPTATION CHECKLIST:
- Colors: Red = luck (China), danger (West), mourning (South Africa)
- Numbers: 4 = death (East Asia), 13 = unlucky (West), 7 = lucky (many cultures)
- Images: Hand gestures, clothing, gender representation vary by culture
- Humor: Rarely translates directly — usually needs transcreation
- Formality levels: German/Japanese/Korean require formal register in business; American English tends informal
- Date formats: MM/DD/YYYY (US), DD/MM/YYYY (most of world), YYYY/MM/DD (ISO, East Asia)
- Measurement: Metric (most of world) vs Imperial (US, Myanmar, Liberia)
- Currency: Always show local currency with proper formatting
- Text expansion: English to German expands ~30%, English to Finnish ~30-40%, English to Chinese/Japanese contracts ~50%
CROSS-REFERENCE: Copywriter for source content optimization, SEO via Niche Blog & Affiliate Strategist, Brand Strategist for brand voice consistency."""
        },
        {
            "title": "Website and App Localization Technical Guide",
            "content": r"""SOURCE: W3C Internationalization Best Practices, Google Developer Localization Guide, Mozilla L10N Documentation (2024)

TECHNICAL LOCALIZATION CHECKLIST:
1. String Externalization: All user-facing text in resource files (JSON, XLIFF, PO), not hardcoded
2. Unicode Support: UTF-8 encoding throughout (database, API, frontend)
3. Text Direction: Support RTL (Arabic, Hebrew, Farsi) and LTR
4. Text Expansion: UI must accommodate 30-40% text expansion from English
5. Date/Time: Use locale-aware formatting (Intl.DateTimeFormat in JavaScript)
6. Numbers: Decimal separators (1,000.50 vs 1.000,50), digit grouping varies
7. Currency: Always format with locale rules, show appropriate symbol
8. Pluralization: Rules vary wildly — English has 2 forms, Arabic has 6, Japanese has 1
9. Sorting/Collation: Alphabetical order varies by language
10. Input: IME support for CJK languages, virtual keyboard considerations

FILE FORMAT STANDARDS:
- JSON: Most common for web/mobile apps
- XLIFF: XML-based, industry standard for translation tools
- PO/POT (gettext): Common in open source
- RESX: .NET applications
- Strings/Stringsdict: iOS applications
- XML: Android applications

SEO LOCALIZATION STRATEGY:
- Use hreflang tags: Tell search engines which language version to show
  <link rel="alternate" hreflang="es" href="https://example.com/es/" />
- URL structure options:
  * Subdirectories: example.com/es/ (easiest, shared domain authority)
  * Subdomains: es.example.com (separate, more control)
  * ccTLDs: example.es (strongest local signal, most expensive)
- Keyword research: Don't just translate keywords — research what people actually search in target language
- Local link building: Get backlinks from target-market websites
- Google Search Console: Set geographic targeting per property

TRANSLATION MANAGEMENT WORKFLOW:
1. Extract strings from codebase (automated)
2. Send to translators with context/screenshots
3. Translation + review (ideally by native speakers in target market)
4. QA: In-context review (see translations in actual UI)
5. Functional testing (text overflow, layout breaks, formatting)
6. Deploy + monitor (user feedback, search performance)

RECOMMENDED TOOLS:
- TMS: Crowdin, Lokalise, Phrase, Transifex
- CAT Tools: SDL Trados, MemoQ, Memsource
- Machine Translation: DeepL (highest quality for European languages), Google Translate API
- QA: Xbench, QA Distiller
CROSS-REFERENCE: Full-Stack Web Developer for i18n implementation, E-Commerce Store Builder for multi-market store setup."""
        },
        {
            "title": "Business Communication Across Cultures",
            "content": r"""SOURCE: Erin Meyer — The Culture Map (INSEAD), Hofstede Cultural Dimensions, World Business Culture Research (2024)

CULTURAL COMMUNICATION DIMENSIONS:
1. High Context vs Low Context (Edward Hall):
   - Low Context (direct): US, Germany, Netherlands, Scandinavia — say what you mean explicitly
   - High Context (indirect): Japan, China, Korea, Arab countries, India — read between the lines, context matters more than words
   - Impact: In high-context cultures, "That might be difficult" often means "No"

2. Hierarchy and Formality:
   - Egalitarian: US, Australia, Netherlands — first names, flat structures, challenge authority openly
   - Hierarchical: Japan, Korea, India, Latin America — titles matter, respect chain of command, decisions flow top-down
   - Impact: In hierarchical cultures, an email from a junior employee to a VP may be seen as disrespectful

3. Communication Style:
   - Direct negative feedback: Germany, Netherlands, Russia, Israel — "This is wrong because..."
   - Indirect negative feedback: Japan, Thailand, Indonesia, Mexico — "Perhaps we could consider an alternative approach..."
   - US is interesting: Direct in content but wrapped in positive framing ("Great effort! One small thing...")

BUSINESS EMAIL ETIQUETTE BY REGION:
- Germany: Very formal (Sehr geehrte/r...), get to the point, include titles (Dr., Prof.)
- Japan: Start with seasonal greeting, express gratitude for relationship, indirect request, formal closing
- Latin America: Personal warmth first, ask about family/wellbeing before business
- Middle East: Generous greetings (in Arabic correspondence), relationship-building language, patience with timeline
- Nordic: Brief, direct, egalitarian tone, first names acceptable quickly
- US: Professional but friendly, action-oriented, bullet points appreciated

COMMON TRANSLATION PITFALLS IN BUSINESS:
- Idioms: "Let's touch base" / "Move the needle" / "Low-hanging fruit" — rarely translate
- Humor: Sarcasm does not travel well. Self-deprecating humor (UK) vs boastful confidence (US) vs formal reserve (Japan)
- "Yes": In many Asian cultures, "yes" means "I hear you" not "I agree." Confirm understanding explicitly.
- Time: "On time" varies — 5 min early (Germany), exact (US), 15-30 min late acceptable (Latin America, parts of Middle East)
- Business cards: In Japan/Korea, present with both hands, study respectfully, never write on them

NEGOTIATION ACROSS CULTURES:
- Competitive (win-lose): US, UK — efficiency, time pressure, individual decision-making
- Collaborative (win-win): Japan, Scandinavia — consensus-building, relationship-first, long-term view
- Emotional: Latin America, Mediterranean — personal relationships drive deals, face-to-face preferred
- Analytical: Germany, Switzerland — data-driven, detailed contracts, precision matters
CROSS-REFERENCE: Sales Agent for sales negotiation strategy, Copywriter for culturally-adapted marketing copy, Brand Strategist for global brand consistency."""
        }
    ]
})

# ═══ BUILD THE INSERTION CODE ═══

def build_agent_entry(agent):
    """Build a TypeScript agent definition string."""
    seeds_str = ""
    for seed in agent["seeds"]:
        seeds_str += f"""
      {{
        title: {json_str(seed["title"])},
        content: {json_str(seed["content"])}
      }},"""

    return f"""  {{
    slug: {json_str(agent["slug"])},
    name: {json_str(agent["name"])},
    description: {json_str(agent["description"])},
    category: {json_str(agent["category"])},
    icon: {json_str(agent["icon"])},
    requiredTier: {json_str(agent["requiredTier"])},
    sortOrder: {agent["sortOrder"]},
    systemPrompt: `{agent["systemPrompt"]}`,
    knowledgeSeeds: [{seeds_str}
    ],
  }}"""


def json_str(s):
    """Escape a string for JavaScript string literal."""
    s = s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")
    return f'"{s}"'


# Build all agent entries
all_entries = []
for agent in AGENTS:
    all_entries.append(build_agent_entry(agent))

entries_block = ",\n".join(all_entries)

# Find the closing "];" of the AGENT_DEFINITIONS array and insert before it
# The array ends with "\n];\n" at the end of the file
match = content.rfind("\n];")
if match == -1:
    print("ERROR: Could not find closing ]; of AGENT_DEFINITIONS array")
    exit(1)

new_content = content[:match] + ",\n" + entries_block + content[match:]

with open(DEFINITIONS_FILE, "w", encoding="utf-8") as f:
    f.write(new_content)

print(f"SUCCESS: Added {len(AGENTS)} new agents to {DEFINITIONS_FILE}")
print(f"File size: {len(content)} -> {len(new_content)} chars (+{len(new_content) - len(content)})")
for a in AGENTS:
    print(f"  - {a['name']} ({a['slug']}) [{a['requiredTier']}]")
