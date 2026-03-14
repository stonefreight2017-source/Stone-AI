# PALACE SEED BUILDING — FULL AUTONOMOUS EXECUTION (NO PERMISSIONS NEEDED)

## IMPORTANT: PERMISSION SETTINGS
Before pasting this prompt, set Claude Code to allow ALL tool calls without asking:
- Type `/allowed-tools` and add: `Edit`, `Write`, `Read`, `Bash`, `Glob`, `Grep`
- Or run with `--allowedTools Edit,Write,Read,Bash,Glob,Grep`
- This eliminates ALL permission prompts. Zero interruptions. Full execution.

## MISSION
You are continuing the Palace seed building operation. Write ALL seed files DIRECTLY using the Write tool. Do NOT dispatch agents. Do NOT ask for permission. Do NOT pause for confirmation. Write each file and move to the next immediately.

## CURRENT STATE
- Seeds location: C:\palace\seeds\knowledge\
- Categories: engineering/, business/, reasoning/, security/, quality/, infrastructure/, experience-os/
- Already delivered: 356 seeds (9.0MB) — DO NOT recreate existing files
- Target: 770 seeds total (Batches 1-30)
- Install directions: C:\palace\seeds\CLAUDE-INSTALL-DIRECTIONS.md

## STEP 1: INVENTORY
Run this command to see what exists:
```
dir C:\palace\seeds\knowledge\ /s /b
```
Cross-reference against the missing files below. Only write what's MISSING.

## STEP 2: WRITE ALL MISSING SEEDS (92 files from Batches 12-22)

Each seed = deep knowledge markdown file, 15-40KB, with real code/frameworks/playbooks. NOT plans. NOT roadmaps. ONLY actionable knowledge.

Write them in groups of 3-4 files, then continue immediately. No pauses.

### BATCH 12 GAPS — Cardinal Intel (reasoning/)
1. counter-intelligence-basics.md (~12KB) - Protecting business secrets, social engineering defense, information compartmentalization, OPSEC for startups
2. strategic-forecasting-methods.md (~15KB) - Delphi method, reference class forecasting, base rate analysis, prediction markets, calibration training

### BATCH 14 GAPS — Chaos Infrastructure (infrastructure/)
3. capacity-planning-tools.md (~15KB) - Resource monitoring (Prometheus/Grafana), capacity forecasting, bottleneck identification, scaling triggers
4. automated-patching-updates.md (~12KB) - Windows Update management, WSL2 updates, Docker image updates, dependency scanning, vulnerability patching
5. edge-computing-patterns.md (~15KB) - Running inference at edge, model caching, request routing, offline capability, sync patterns
6. storage-optimization.md (~15KB) - NVMe optimization, RAID considerations, model storage (4TB planning), tiered storage, compression
7. power-cooling-optimization.md (~12KB) - UPS sizing for OMEN, thermal monitoring, fan curve optimization, power draw measurement, cooling strategy
8. network-segmentation.md (~15KB) - VLAN design, DMZ for public services, internal network isolation, firewall zones, traffic monitoring

### BATCH 15 GAPS — Rush Security (security/)
9. api-security-testing.md (~18KB) - API enumeration, auth bypass, BOLA/BFLA, mass assignment, rate limit bypass, GraphQL attacks
10. red-team-operations.md (~20KB) - Full red team engagement, C2 frameworks, persistence mechanisms, lateral movement, data exfiltration, OPSEC
11. blue-team-defense.md (~20KB) - SOC operations, SIEM rules, alert triage, indicator management, threat intelligence integration
12. threat-hunting-playbook.md (~18KB) - Hypothesis-driven hunting, MITRE ATT&CK mapping, hunt queries, anomaly detection, behavioral analysis
13. incident-forensics.md (~18KB) - Digital forensics, evidence preservation, memory analysis (Volatility), disk forensics, timeline reconstruction
14. malware-analysis-basics.md (~15KB) - Static analysis, dynamic analysis, sandbox setup, behavior indicators, YARA rules, reverse engineering intro
15. vulnerability-research.md (~15KB) - CVE analysis, exploit databases, vulnerability scoring (CVSS), responsible disclosure, patch analysis
16. secure-code-review.md (~18KB) - Code review for security, common vulnerability patterns by language, automated scanning (SAST/DAST), fix patterns
17. penetration-test-reporting.md (~12KB) - Report structure, finding severity, evidence documentation, remediation recommendations, executive summary
18. security-automation-scripts.md (~15KB) - Nmap automation, Burp Suite extensions, custom Python security tools, bash recon scripts, scheduled scanning

### BATCH 16 GAPS — Wiz + Support (quality/)
19. browser-devtools-mastery.md (~18KB) - Elements, Console, Network, Performance, Memory, Application tabs deep dive, Lighthouse audits
20. customer-support-tier1-playbook.md (~20KB) - Common issues and resolutions, greeting scripts, information gathering, account troubleshooting, billing questions
21. customer-support-escalation.md (~15KB) - When to escalate, escalation paths, severity classification, handoff procedures
22. crisis-communication-playbook.md (~18KB) - Outage communication, status page management, customer notification templates, post-mortem process
23. sla-tracking-management.md (~15KB) - Uptime SLAs, response time SLAs, resolution time targets, SLA reporting, breach procedures
24. knowledge-base-design.md (~15KB) - Help center structure, article templates, FAQ organization, search optimization, video tutorial planning
25. support-automation-chatbot.md (~15KB) - AI-powered support using Palace agents, auto-categorization, suggested responses, handoff to human
26. customer-feedback-loops.md (~12KB) - NPS surveys, CSAT scores, feature request tracking, feedback categorization, closing the loop
27. bug-triage-methodology.md (~15KB) - Severity vs priority matrix, reproduction steps, environment details, assignment rules, SLA per severity
28. production-debugging-live.md (~18KB) - Debugging production without downtime, feature flags, log correlation, safe rollback, canary analysis
29. load-testing-methodology.md (~15KB) - k6 load testing, scenario design, ramp-up patterns, breakpoint testing, baseline establishment
30. chaos-engineering-basics.md (~12KB) - Controlled failure injection, game days, steady state hypothesis, blast radius control

### BATCH 17 GAPS — Copywriting + Analytics (business/)
31. dashboard-design-principles.md (~15KB) - Information hierarchy, chart selection, real-time vs batch, executive vs operational dashboards
32. ab-testing-methodology.md (~18KB) - Statistical significance, sample size calculation, test duration, segmentation, multi-armed bandits
33. cohort-analysis-deep.md (~15KB) - Retention cohorts, revenue cohorts, behavioral cohorts, visualization, SQL queries
34. predictive-analytics-basics.md (~15KB) - Churn prediction signals, LTV forecasting, demand forecasting, simple ML models for business
35. data-visualization-patterns.md (~12KB) - Chart types and when to use them, color theory for data, accessibility in charts
36. metrics-that-matter.md (~15KB) - Vanity vs actionable metrics, SaaS metric hierarchy, leading vs lagging indicators, North Star metric
37. reporting-automation.md (~12KB) - Scheduled reports, Slack/email delivery, SQL-based reporting, template design
38. data-driven-decision-framework.md (~12KB) - When to trust data vs instinct, decision quality assessment, experimentation culture

### BATCH 18 GAPS — Meta-Knowledge (reasoning/)
39. counterfactual-thinking.md (~15KB) - "What if" analysis, pre-mortem technique, scenario branching, regret minimization
40. estimation-calibration.md (~18KB) - Fermi estimation, reference class forecasting, confidence intervals, decomposition method
41. complexity-theory-applied.md (~18KB) - Cynefin framework, emergence, adaptive systems, tipping points, power laws
42. game-theory-decisions.md (~18KB) - Nash equilibrium, prisoner's dilemma, coordination games, mechanism design, applied to business
43. decision-under-uncertainty.md (~18KB) - Expected value, minimax regret, robust decision making, info value calculation
44. systems-thinking-deep.md (~20KB) - System dynamics, feedback loops, delays, leverage points (Meadows), system archetypes
45. critical-thinking-framework.md (~18KB) - Question formulation, evidence evaluation, assumption identification, intellectual humility
46. knowledge-synthesis-methodology.md (~15KB) - Combining knowledge from multiple domains, meta-analysis thinking, knowledge mapping

### BATCH 19 GAPS — Palace Autonomy (reasoning/)
47. feedback-integration-system.md (~12KB) - Processing founder feedback, incorporating corrections, updating seeds based on outcomes
48. quality-regression-detection.md (~12KB) - Detecting output quality drops, root cause analysis, automatic rollback, quality baselines
49. knowledge-dependency-graph.md (~15KB) - How seeds depend on each other, update cascading, breaking change detection
50. autonomous-decision-boundaries.md (~15KB) - What Palace decides alone vs needs confirmation vs forbidden without founder
51. self-diagnostic-routines.md (~15KB) - Health checks, VRAM monitoring, inference speed testing, quality spot-checks
52. growth-metrics-tracking.md (~12KB) - Measuring Palace growth over time, capability scoring, knowledge coverage percentage
53. palace-succession-planning.md (~12KB) - Backup procedures, knowledge export, migration to new hardware/models

### BATCH 20 GAPS — Specialized Domains (reasoning/)
54. research-methodology.md (~18KB) - Academic research methods, literature review, experimental design, source evaluation
55. negotiation-frameworks.md (~18KB) - BATNA, ZOPA, principled negotiation, salary/contract/vendor negotiation
56. public-speaking-coaching.md (~15KB) - Speech structure, audience analysis, delivery techniques, anxiety management
57. time-management-systems.md (~15KB) - GTD, Eisenhower matrix, time blocking, deep work, energy management
58. relationship-communication.md (~15KB) - Active listening, conflict resolution, assertive communication, networking
59. travel-planning-optimization.md (~12KB) - Trip planning frameworks, budget optimization, points/miles strategy
60. home-automation-integration.md (~15KB) - Smart home architecture, Home Assistant, voice control, security systems
61. fitness-training-programming.md (~15KB) - Progressive overload, program design, recovery protocols, injury prevention
62. nutrition-meal-planning.md (~12KB) - Macro/micro nutrients, meal prep systems, dietary evaluation, budget nutrition
63. meditation-mindfulness-guide.md (~12KB) - Meditation techniques, stress reduction, focus training, breathing exercises
64. career-development-planning.md (~15KB) - Founder career path, skill stacking, personal brand, network development

### BATCH 21 GAPS — Finance/HR/Product (business/)
65. hiring-playbook.md (~18KB) - Job descriptions, sourcing, interview process, scoring rubrics, offer negotiation
66. onboarding-new-hires.md (~15KB) - 30/60/90 day plans, documentation access, tool provisioning, culture onboarding
67. performance-review-frameworks.md (~15KB) - OKR-based reviews, 360 feedback, self-assessment templates, growth plans
68. contractor-management.md (~15KB) - Finding contractors, agreements, IP assignment, milestone payment, quality control
69. compensation-benchmarking.md (~12KB) - Market rate research, equity compensation, benefits design, total comp packages
70. product-roadmap-methodology.md (~18KB) - RICE scoring, impact mapping, opportunity trees, stakeholder alignment
71. user-story-writing.md (~12KB) - User story format, acceptance criteria, story splitting, estimation
72. sprint-planning-execution.md (~15KB) - Sprint cadence, capacity planning, velocity tracking, retrospectives
73. feature-flag-management.md (~12KB) - Progressive rollout, A/B testing with flags, kill switches, flag cleanup
74. product-analytics-framework.md (~15KB) - Feature adoption tracking, user journey mapping, funnel analysis, power users
75. okr-goal-setting.md (~12KB) - OKR writing methodology, company/team/individual alignment, scoring

### BATCH 22 GAPS — Final Integration (reasoning/)
76. annual-planning-framework.md (~15KB) - Annual planning for Palace + businesses, goal setting, resource allocation
77. palace-troubleshooting-guide.md (~18KB) - Common issues: vLLM won't start, bad responses, slow inference, GPU errors
78. capability-gap-analysis.md (~15KB) - Palace vs Claude comparison, where gaps remain, prioritized improvement plan
79. palace-version-history.md (~12KB) - Changelog template, versioning seeds, migration notes, rollback procedures
80. graduation-certification.md (~15KB) - Final certification: Palace meets all requirements, independence confirmed

### EIM GAPS (business/)
81. gmail-api-integration-guide.md (~15KB) - Gmail API/IMAP setup, reading emails, sending, labels, attachments, webhooks
82. founder-communication-protocol.md (~15KB) - How Palace communicates with founder, channels, tone, report structure, feedback loops

## STEP 3: AFTER FINISHING BATCHES 12-22, CONTINUE TO BATCHES 23-30

### Batches 23-25: Cross-Domain Synthesis (100 seeds) — reasoning/
Seeds that teach HOW knowledge connects across domains. Each seed covers a specific domain intersection:
- "How legal compliance affects engineering architecture"
- "How marketing psychology informs conversation design"
- "How financial modeling drives infrastructure decisions"
- "How security thinking applies to business strategy"
Write 33-34 seeds per batch covering EVERY major domain intersection. Name them: cross-domain-[domain1]-[domain2].md

### Batches 26-27: Meta-Cognitive Enhancement (100 seeds) — reasoning/
Deep reasoning about reasoning. Advanced thinking tools. Each seed teaches a specific cognitive skill:
- Calibrated uncertainty, first-principles derivation for novel problems
- Analogical reasoning mastery, Socratic questioning
- Advanced problem decomposition, abstraction mastery
- Philosophical reasoning, ethical frameworks, logic systems
Write 50 seeds per batch. Name them: meta-[skill-name].md

### Batches 28-30: Frontier Knowledge Extraction (100 seeds) — reasoning/ + engineering/
Latest knowledge as of March 2026:
- AI/ML breakthroughs, cutting-edge frameworks, emerging tools
- Current market dynamics, economic models, geopolitical landscape
- Emerging security threats, latest legal/regulatory AI developments
- Science frontiers: quantum computing, biotech, space, energy
- Advanced mathematics, physics concepts useful for engineering
Write 33-34 seeds per batch. Name them: frontier-[topic].md

## RULES
- Write files DIRECTLY using the Write tool. NO agent dispatches.
- Each file: 15-40KB, deep knowledge, real code where applicable
- Work through the missing files in order, skip files that already exist
- Write 3-4 files, then continue to the next group immediately
- No plans, no roadmaps, no proposals — ONLY knowledge seeds
- No pauses for permission. No asking "should I continue?" — JUST KEEP GOING.
- If you run out of context, save your progress and the next session picks up where you left off
- After writing all files, run: dir C:\palace\seeds\knowledge\ /s /b | find /c /v "" to count total
