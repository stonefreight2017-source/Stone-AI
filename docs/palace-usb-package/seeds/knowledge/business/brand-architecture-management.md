# Brand Architecture Management — Stone AI Ecosystem

## Seed Classification
- **Domain**: Cross-Business Operations
- **Applies To**: Stone AI (Web SaaS), Best AI Mobile (React Native), Stone AI Tools (API Marketplace)
- **Owner**: Agent Stone (Head 1) + Cardinal (Head 2)
- **Created**: 2026-03-09
- **Sensitivity**: Internal — Brand Strategy

---

## 1. Executive Summary

Three products, one brand ecosystem. This seed defines the brand architecture: how the parent brand (Three-Headed Monster / Concept E) relates to three sub-brands (Stone AI, Best AI, Stone AI Tools), the visual identity system, naming conventions, and brand guidelines that keep everything coherent without making everything identical.

Principle: each product has its own personality, but they all clearly belong to the same family.

---

## 2. Brand Architecture Model

### 2.1 Architecture Type: Endorsed Brand

The Three-Headed Monster uses an **Endorsed Brand** architecture — each product has its own distinct brand identity, but is visually and verbally connected to the parent.

```
PARENT BRAND (The Endorser)
┌─────────────────────────────────────────────┐
│  Three-Headed Monster / Concept E            │
│  "Intelligence. Multiplied."                 │
│  Insignia: Concept E logo                    │
│  Domain: stone-ai.net                        │
└──────────┬──────────┬──────────┬────────────┘
           │          │          │
     ┌─────▼──┐ ┌─────▼──┐ ┌────▼──────┐
     │Stone AI│ │Best AI │ │Stone AI   │
     │  Web   │ │Mobile  │ │ Tools     │
     │        │ │        │ │           │
     │"Your AI│ │"AI in  │ │"Build     │
     │ team"  │ │your    │ │ with AI"  │
     │        │ │pocket" │ │           │
     └────────┘ └────────┘ └───────────┘
```

**Why Endorsed (vs. Branded House or House of Brands)**:
- **Branded House** (e.g., Google Everything) — too restrictive, products need distinct identities
- **House of Brands** (e.g., P&G) — too disconnected, loses cross-sell synergy
- **Endorsed Brand** (e.g., Marriott + sub-brands) — best of both: distinct products with parent credibility

### 2.2 Brand Hierarchy

**Level 1: Parent Brand**
- Name: Three-Headed Monster (internal) / Concept E (external-facing)
- Role: Endorser, trust anchor, quality signal
- Visibility: Footer of all products, "A Concept E company"
- Where it appears: Corporate communications, legal, press, investor materials

**Level 2: Product Brands**
- Stone AI: Primary product, most brand equity, the flagship
- Best AI: Mobile extension, younger/more casual brand energy
- Stone AI Tools: Developer-focused, technical credibility

**Level 3: Feature Brands**
- Bestie: Cross-product feature brand (AI companion)
- The Palace: Internal infrastructure brand (never customer-facing)
- Royal Guard: Internal security brand (never customer-facing)

### 2.3 Brand Relationships

```
"Stone AI" is the primary brand — most users will know this name first
"Best AI" is positioned as "Stone AI, but mobile-native"
"Stone AI Tools" is positioned as "Stone AI, but for developers"

Tagline structure:
  Stone AI: "Your AI team. 40 agents strong."
  Best AI: "Your AI team. In your pocket."
  Stone AI Tools: "Your AI team. Your way."
```

---

## 3. Visual Identity System

### 3.1 Color Palette

**Parent Brand Colors (Concept E)**:
```css
/* Primary */
--concept-e-primary: #1A1A2E;      /* Deep navy — authority, trust */
--concept-e-accent: #E94560;        /* Bold red — energy, power */
--concept-e-secondary: #16213E;     /* Dark blue — depth */
--concept-e-gold: #D4A843;          /* Gold — premium, achievement */

/* Neutral */
--concept-e-white: #FFFFFF;
--concept-e-gray-100: #F5F5F7;
--concept-e-gray-500: #6B7280;
--concept-e-gray-900: #111827;
```

**Stone AI (Web) — Extended Palette**:
```css
/* Inherits parent primary + accent */
--stone-primary: #1A1A2E;
--stone-accent: #E94560;
/* Product-specific extensions */
--stone-surface: #0F0F23;           /* Darker surface for "command center" feel */
--stone-agent-glow: #7C3AED;       /* Purple — agent interaction highlight */
--stone-success: #10B981;
--stone-warning: #F59E0B;
--stone-error: #EF4444;
```

**Best AI (Mobile) — Extended Palette**:
```css
/* Inherits parent primary */
--best-primary: #1A1A2E;
/* Product-specific: warmer, more approachable */
--best-accent: #FF6B6B;            /* Softer red — friendly, approachable */
--best-surface: #FAFAFA;           /* Light default (mobile convention) */
--best-surface-dark: #1A1A2E;      /* Dark mode matches parent */
--best-highlight: #4ECDC4;         /* Teal — fresh, modern */
--best-bestie: #FF9FF3;            /* Pink — bestie interaction color */
```

**Stone AI Tools (API Marketplace) — Extended Palette**:
```css
/* Inherits parent primary */
--tools-primary: #1A1A2E;
/* Product-specific: technical, clean */
--tools-accent: #3B82F6;           /* Blue — trust, technical, developer-familiar */
--tools-surface: #F8FAFC;          /* Clean white background */
--tools-code-bg: #1E293B;          /* Code block background */
--tools-success: #22C55E;          /* API success green */
--tools-endpoint: #8B5CF6;         /* Purple — endpoint highlights */
```

### 3.2 Typography

**Shared Font Stack**:
```css
/* Headlines — all products */
--font-heading: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Body — all products */
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Code — Tools product + code blocks everywhere */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

**Product-Specific Typography Rules**:
| Element | Stone AI (Web) | Best AI (Mobile) | Stone AI Tools |
|---------|---------------|-----------------|---------------|
| H1 | 36px / Bold | 28px / Bold | 32px / Bold |
| H2 | 28px / Semibold | 22px / Semibold | 24px / Semibold |
| Body | 16px / Regular | 15px / Regular | 16px / Regular |
| Small | 14px / Regular | 13px / Regular | 14px / Regular |
| Code | 14px Mono | 13px Mono | 15px Mono |
| Line Height | 1.6 | 1.5 | 1.6 |

### 3.3 Logo System

**Concept E Insignia** (Parent):
- Used as endorsement mark on all products
- Appears in footer: "A Concept E Company"
- Minimum size: 24px height
- Clear space: 1x insignia height on all sides

**Stone AI Logo**:
- Wordmark: "Stone AI" in Inter Bold
- Icon: Stylized "S" with three angular elements (representing Three Heads)
- Lockup: Icon + wordmark (horizontal preferred, stacked for mobile)

**Best AI Logo**:
- Wordmark: "Best AI" in Inter Bold
- Icon: Rounded, approachable version of parent insignia
- App icon: Simplified icon optimized for 1024x1024 → 29x29 scaling

**Stone AI Tools Logo**:
- Wordmark: "Stone AI Tools" in Inter Bold
- Icon: Technical/geometric version of parent insignia with bracket elements < >
- Favicon: Simplified for 16x16 rendering

### 3.4 Iconography

**Shared Icon Library**:
- Agent avatars: Same SVG avatars across ALL products (critical for consistency)
- Emotes: Same 24 emotes everywhere
- System icons: Lucide React (all products use same icon set)
- Badge icons: OG badge, Golden Egg — same design everywhere

**Product-Specific Icons**:
- Stone AI: Forum icons, backdrop thumbnails, admin icons
- Best AI: Mobile-specific navigation icons, gesture hints
- Tools: API method icons (GET/POST/PUT/DELETE), status indicators

### 3.5 Component Design Tokens

Shared design tokens (all products import from common package):

```typescript
// @stone-ai/design-tokens (shared npm package)
export const tokens = {
  // Spacing (all products)
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    "2xl": "48px",
  },

  // Border radius
  radius: {
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    full: "9999px",
  },

  // Shadows
  shadow: {
    sm: "0 1px 2px rgba(0,0,0,0.05)",
    md: "0 4px 6px rgba(0,0,0,0.07)",
    lg: "0 10px 15px rgba(0,0,0,0.1)",
    glow: "0 0 20px rgba(233,69,96,0.3)",  // Accent glow
  },

  // Animation
  transition: {
    fast: "150ms ease",
    normal: "250ms ease",
    slow: "400ms ease",
  },

  // Z-index layers
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    modal: 30,
    toast: 40,
    tooltip: 50,
  },
};
```

---

## 4. Naming Conventions

### 4.1 Product Naming Rules

| Context | Stone AI | Best AI | Stone AI Tools |
|---------|---------|--------|---------------|
| Full name | Stone AI | Best AI | Stone AI Tools |
| Short name | Stone | Best AI | Tools |
| URL | stone-ai.net | bestai.app (future) | tools.stone-ai.net |
| App Store | Best AI - Your AI Team | N/A | N/A |
| npm package prefix | @stone-ai/ | @best-ai/ | @stone-ai-tools/ |
| API prefix | /api/ | /api/mobile/ | /api/v1/ |
| Database schema | stone_ai | best_ai | tools |

### 4.2 Feature Naming

Features that exist across products should use consistent names:

| Feature | Name (all products) | Never call it |
|---------|-------------------|---------------|
| AI companion | Bestie | Bot, assistant, chatbot |
| AI specialists | Agents | Bots, models, AIs |
| Visual themes | Backdrops | Themes, skins, wallpapers |
| Emoji reactions | Emotes | Stickers, reactions, emoji |
| Achievement icons | Badges | Achievements, trophies |
| User ranking | Ecosystem Score | Points, XP, karma |
| Support AI | Help | Support bot, FAQ bot |

### 4.3 Tier Naming

Tier names should align across products while allowing product-specific customization:

```
Stone AI Tiers:     FREE → STARTER → PLUS → SMART → PRO
Best AI Tiers:      FREE → BASIC → PREMIUM
Tools Tiers:        FREE → DEVELOPER → BUSINESS

Bundle Tiers:       EXPLORER (2 products) → POWERHOUSE (all 3)
```

---

## 5. Brand Voice & Tone

### 5.1 Parent Brand Voice (Concept E)

**Personality**: Confident, innovative, bold, slightly irreverent. Not corporate stiff. Not Silicon Valley bro. A founder who built something real and isn't afraid to say so.

**Voice Pillars**:
1. **Direct**: Say what you mean. No filler. No "we're excited to announce."
2. **Knowledgeable**: We know AI. We built 40 agents. We know what works.
3. **Human**: Technology serves people. Never the other way around.
4. **Bold**: We're three products deep and we're just getting started.

### 5.2 Product-Specific Tone Adjustments

**Stone AI (Web)** — Professional Confident:
```
"40 agents. Zero BS. Get the AI team you actually need."
"Your competitors are using ChatGPT. You'll be using an army."
```
- Tone: Authoritative but approachable
- Register: Professional casual
- Humor: Dry, occasional

**Best AI (Mobile)** — Friendly Energetic:
```
"Your AI team goes wherever you go."
"Quick answers. Big brain. Small screen."
```
- Tone: Warm, encouraging, quick
- Register: Casual
- Humor: Light, playful (bestie-driven)

**Stone AI Tools (API Marketplace)** — Technical Precise:
```
"Production-ready AI agents. One API call away."
"Built by engineers who hate bad documentation."
```
- Tone: Technical, competent, no-nonsense
- Register: Professional
- Humor: Developer humor (dry, referential)

### 5.3 Copy Guidelines

**Always**:
- Use active voice
- Lead with the benefit, not the feature
- Respect the user's intelligence
- Keep sentences short (under 20 words preferred)

**Never**:
- "We're excited to..."
- "Revolutionary/game-changing/disruptive"
- "AI-powered" (everything we do is AI — it's redundant)
- "Leverage/utilize/synergize" or any corporate jargon
- Exclamation points in headlines (one per page max in body copy)

---

## 6. Brand Touchpoints

### 6.1 Digital Touchpoints

| Touchpoint | Brand Applied | Key Elements |
|-----------|--------------|-------------|
| stone-ai.net | Stone AI + Concept E endorsement | Full web brand, footer endorsement |
| tools.stone-ai.net | Stone AI Tools + Concept E | Technical brand, developer focus |
| App Store listing | Best AI | Mobile brand, screenshots, description |
| Social media | Concept E (parent account) | Unified voice, cross-product content |
| Email (transactional) | Product-specific sender | "From Stone AI" / "From Best AI" |
| Email (marketing) | Concept E | "From the Three-Headed Monster team" |
| Documentation | Stone AI Tools brand | Technical brand, code examples |
| Forum | Stone AI brand | Community brand extension |

### 6.2 Cross-Product Brand Moments

**Account Creation**: Welcome email uses parent brand
```
"Welcome to the Concept E family.
You've just joined Stone AI — but that's just the beginning.
Your Ecosystem awaits."
```

**Cross-Sell**: Product-specific brand transitions
```
Stone AI → Best AI: "Your agents just learned to travel."
Stone AI → Tools: "From using agents to building with them."
Best AI → Stone AI: "Ready for the full command center?"
```

**Bundle Upgrade**: Parent brand moment
```
"POWERHOUSE — All three products. One price. Unlimited potential.
Welcome to the full Concept E ecosystem."
```

### 6.3 Brand Consistency Checklist

Before shipping any customer-facing surface:
- [ ] Colors match product palette (no off-brand colors)
- [ ] Typography uses Inter (or approved fallback)
- [ ] Agent avatars are the canonical SVGs
- [ ] Concept E endorsement appears in footer
- [ ] Product name is spelled correctly (Stone AI, not StoneAI or Stone.AI)
- [ ] Copy follows voice guidelines
- [ ] Emotes/badges use canonical designs
- [ ] No competitor brand references
- [ ] Bestie personality matches across products

---

## 7. Brand Protection

### 7.1 Trademark Strategy

Trademarks to file ($2,100 budget allocated):
1. **Stone AI** — primary product brand
2. **Best AI** — mobile product brand
3. **Stone AI Tools** — API marketplace brand
4. **Concept E** — parent brand / insignia
5. **Three-Headed Monster** — if budget allows (distinctive enough to protect)
6. **Bestie** — feature brand (evaluate strength)

**Filing Priority**: Stone AI first (most brand equity), then Concept E, then Best AI, then Tools.

### 7.2 Brand Usage Guidelines

**Internal Use**:
- Agents must use correct product names
- Marketing must follow voice guidelines
- No agent creates customer-facing copy without marketing review

**External Use** (partners, press, etc.):
- Brand assets available at stone-ai.net/press (future)
- Logo usage requires minimum clear space
- No color modifications to logos
- No combining with other brand marks without approval

### 7.3 Brand Monitoring

- Set up Google Alerts for all brand names
- Monitor social media mentions weekly
- Check App Store for copycat apps quarterly
- Review trademark databases for conflicts semi-annually

---

## 8. Brand Evolution Roadmap

### Phase 1: Foundation (Current)
- Stone AI brand established and live
- Concept E insignia designed
- Brand guidelines documented (this seed)

### Phase 2: Multi-Product (Launch of Best AI + Tools)
- Best AI brand assets created
- Tools brand assets created
- Cross-product brand consistency enforced
- Trademark filings begin

### Phase 3: Maturity (6-12 months)
- Brand awareness measurement
- Brand perception surveys
- Visual refresh if needed
- Brand ambassador program

### Phase 4: Growth (12+ months)
- Parent brand (Concept E) becomes more prominent
- Consider brand architecture evolution as products mature
- Evaluate additional product brands
- International brand considerations

---

*Seed created by Agent Stone (Head 1) + Cardinal (Head 2) — Three-Headed Monster Operations*
*A strong brand architecture lets three products feel like one ecosystem. The parent brand provides trust; the product brands provide identity.*
