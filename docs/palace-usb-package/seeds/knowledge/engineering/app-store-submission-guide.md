# App Store Submission Guide — Best AI Mobile

## Seed Classification
- **Domain**: Mobile Engineering / DevOps
- **Application**: Best AI Mobile (Business #2)
- **Stack**: App Store Connect, Google Play Console, EAS Submit
- **Audience**: Senior DevOps Engineer, Senior Frontend Engineer

---

## 1. Apple App Store Submission

### App Store Review Guidelines — Key Points for AI Apps

**2.3 Accurate Metadata**
- App description must clearly state it uses AI
- Must describe what AI models are used and for what purpose
- Screenshots must show actual app functionality
- No misleading claims about AI capabilities

**3.1.1 In-App Purchase**
- All digital content/subscriptions sold through Apple IAP
- Cannot link to external payment methods
- Must offer "Restore Purchases" button
- Clear subscription terms visible without scrolling

**4.2 Minimum Functionality**
- App must provide significant value beyond a web wrapper
- AI chat must work reliably (not just a ChatGPT clone with no added value)
- Offline features demonstrate native app value

**5.1.1 Data Collection and Storage**
- Privacy Policy required
- App Privacy labels (nutrition labels) must be accurate
- Must disclose all data collection
- AI-generated content must be identifiable as such

**5.6.4 AI-Generated Content**
- Apps distributing AI-generated content must implement safeguards
- Must have content moderation
- Must not generate harmful/misleading content
- Clear user understanding that responses are AI-generated

### App Store Connect Configuration

```
App Information:
├── Name: Best AI
├── Subtitle: AI Agents & Your Bestie
├── Primary Category: Productivity
├── Secondary Category: Utilities
├── Content Rights: Does not contain third-party content
├── Age Rating: 12+ (Infrequent/Mild Mature/Suggestive Themes)
└── Price: Free (with in-app purchases)

Privacy:
├── Privacy Policy URL: https://stone-ai.net/privacy
├── Data Types Collected:
│   ├── Contact Info (Email) — App Functionality
│   ├── Identifiers (User ID) — App Functionality
│   ├── Usage Data (Product Interaction) — Analytics
│   ├── Diagnostics (Crash Data) — App Functionality
│   └── User Content (Chat Messages) — App Functionality
├── Data Linked to User: Contact Info, Identifiers
├── Data Used to Track: None
└── Data Not Linked: Usage Data, Diagnostics

In-App Purchases:
├── bestai_starter_monthly — $19.99 (Auto-Renewable)
├── bestai_starter_annual — $199.99 (Auto-Renewable)
├── bestai_plus_monthly — $49.99 (Auto-Renewable)
├── bestai_plus_annual — $499.99 (Auto-Renewable)
├── bestai_smart_monthly — $99.99 (Auto-Renewable)
├── bestai_smart_annual — $959.99 (Auto-Renewable)
├── bestai_pro_monthly — $199.99 (Auto-Renewable)
└── bestai_pro_annual — $2,039.99 (Auto-Renewable)
```

### Screenshot Requirements

| Device | Size | Count |
|--------|------|-------|
| iPhone 6.7" (15 Pro Max) | 1290 x 2796 | 3-10 |
| iPhone 6.5" (11 Pro Max) | 1242 x 2688 | 3-10 |
| iPhone 5.5" (8 Plus) | 1242 x 2208 | 3-10 |
| iPad Pro 12.9" (6th gen) | 2048 x 2732 | 3-10 |
| iPad Pro 12.9" (2nd gen) | 2048 x 2732 | 3-10 |

**Recommended Screenshots (5 per device):**
1. Chat with AI agent (streaming response visible)
2. Agent directory with tier badges
3. Bestie customization screen
4. Subscription plans
5. Dark mode variant of chat

### App Review Notes

```
Review Notes for Apple:

1. DEMO ACCOUNT:
   Email: review@stone-ai.net
   Password: [provided in App Store Connect]

2. AI FUNCTIONALITY:
   Best AI provides access to 42 AI agents, each specialized in
   different domains. The app uses Claude (by Anthropic) and local
   AI models for generating responses. All responses are clearly
   labeled as AI-generated.

3. CONTENT MODERATION:
   - All agent system prompts are pre-configured and reviewed
   - User inputs are validated and sanitized
   - AI responses go through safety filters
   - Inappropriate content reporting is available

4. SUBSCRIPTION MODEL:
   - Free tier: 4 agents, basic features
   - Starter ($19.99/mo): 16 agents
   - Plus ($49.99/mo): 30 agents
   - Smart ($99.99/mo): 39 agents with advanced AI
   - Pro ($199.99/mo): All 42 agents, priority

5. OFFLINE FUNCTIONALITY:
   The app caches conversations locally and supports
   offline message composition with sync when reconnected.

6. The "Bestie" feature is an AI companion with configurable
   personality traits. It does not impersonate real people.
```

---

## 2. Google Play Store Submission

### Play Console Configuration

```
App Details:
├── App Name: Best AI - AI Agents & Bestie
├── Short Description: Chat with 42 AI agents. Your personal AI team.
├── Full Description: [See below]
├── Category: Productivity
├── Tags: AI, Chat, Assistant, Productivity
├── Content Rating: Everyone 10+ (mild language in AI responses)
└── Target Audience: General (not children-directed)

Store Listing:
├── Feature Graphic: 1024 x 500 px
├── Icon: 512 x 512 px (32-bit PNG)
├── Screenshots: 2-8 per device type
│   ├── Phone: min 320px, max 3840px
│   └── Tablet (7"): min 320px
├── Video: Optional YouTube link
└── Contact: support@stone-ai.net

Data Safety:
├── Data Collected:
│   ├── Personal Info: Email (required for account)
│   ├── Messages: Chat content (for AI responses)
│   └── App Activity: Interaction data (analytics)
├── Data Shared: None
├── Encryption: Data encrypted in transit
├── Deletion: Users can request account deletion
└── Meets Families Policy: N/A (not child-directed)
```

### Google Play Policies for AI Apps

**AI-Generated Content Policy (2024+)**
- Must disclose AI-generated content
- Must not create deepfakes or misleading content
- Content moderation required
- User reporting mechanism required

**Subscription Policy**
- Clearly communicate subscription terms
- Free trial terms must be explicit
- Easy cancellation path

### Full Description Template

```
Best AI brings 42 specialized AI agents to your pocket. From creative
writing to technical assistance, business strategy to personal growth
— there's an agent for everything.

KEY FEATURES:
- 42 AI Agents — Each agent has unique expertise and personality
- Bestie — Your personal AI companion, customizable with 18 personality traits
- 6 Languages — English, Spanish, French, German, Japanese, Korean
- Offline Mode — Chat even without internet, syncs when connected
- Dark Mode — Easy on the eyes, beautiful design

PRICING:
- Free: 4 agents, basic features
- Starter: $19.99/mo — 16 agents
- Plus: $49.99/mo — 30 agents
- Smart: $99.99/mo — 39 agents with advanced AI
- Pro: $199.99/mo — All 42 agents

SECURITY:
- End-to-end encryption for all messages
- Biometric authentication (Face ID, fingerprint)
- No data sold to third parties

Best AI is powered by advanced AI models including Claude by Anthropic.
All responses are AI-generated and should be verified for accuracy.

Terms: https://stone-ai.net/terms
Privacy: https://stone-ai.net/privacy
```

---

## 3. Privacy Labels and Declarations

### Apple App Privacy

```typescript
// App Privacy Nutrition Label Data

const applePrivacyDeclaration = {
  dataTypes: [
    {
      type: 'Contact Info - Email Address',
      purpose: 'App Functionality',
      linkedToUser: true,
      tracking: false,
      collection: 'Required for account creation',
    },
    {
      type: 'Identifiers - User ID',
      purpose: 'App Functionality',
      linkedToUser: true,
      tracking: false,
      collection: 'For personalization and sync',
    },
    {
      type: 'User Content - Other User Content',
      purpose: 'App Functionality',
      linkedToUser: true,
      tracking: false,
      collection: 'Chat messages sent to AI agents',
    },
    {
      type: 'Usage Data - Product Interaction',
      purpose: 'Analytics',
      linkedToUser: false,
      tracking: false,
      collection: 'Screen views, feature usage',
    },
    {
      type: 'Diagnostics - Crash Data',
      purpose: 'App Functionality',
      linkedToUser: false,
      tracking: false,
      collection: 'Via Sentry for bug fixing',
    },
    {
      type: 'Diagnostics - Performance Data',
      purpose: 'App Functionality',
      linkedToUser: false,
      tracking: false,
      collection: 'App performance metrics',
    },
  ],
};
```

---

## 4. Rejection Handling

### Common Rejection Reasons and Fixes

| Reason | Fix |
|--------|-----|
| **Guideline 2.1 - Performance** (crashes) | Fix crash from Sentry, resubmit |
| **Guideline 3.1.1 - IAP** (external payment link) | Remove any Stripe references from mobile UI |
| **Guideline 4.0 - Design** (web view wrapper) | Ensure native UI components, offline features |
| **Guideline 4.2 - Minimum Functionality** | Demonstrate unique value (42 agents, Bestie, offline) |
| **Guideline 5.1.1 - Privacy** (incomplete labels) | Update privacy labels to match actual collection |
| **Guideline 5.1.2 - Data Use** (missing consent) | Add consent dialogs for analytics |
| **Guideline 5.6.4 - AI** (no content moderation) | Document moderation, add report button |

### Appeal Template

```
Dear App Review Team,

Thank you for reviewing Best AI. We'd like to address the concern
regarding [GUIDELINE NUMBER].

[SPECIFIC RESPONSE TO REJECTION]

We have made the following changes in the resubmitted build:
1. [Change 1]
2. [Change 2]
3. [Change 3]

We believe these changes fully address the guideline requirements.
Please let us know if you need any additional information.

Best regards,
Best AI Development Team
```

---

## 5. Metadata Localization

```typescript
// App Store metadata for all 6 supported languages

const metadata = {
  en: {
    name: 'Best AI - AI Agents & Bestie',
    subtitle: 'Your AI Team in Your Pocket',
    keywords: 'AI,chat,assistant,agents,productivity,bestie,companion',
    description: '...', // Full English description
  },
  es: {
    name: 'Best AI - Agentes IA y Bestie',
    subtitle: 'Tu Equipo de IA en tu Bolsillo',
    keywords: 'IA,chat,asistente,agentes,productividad,companero',
    description: '...', // Spanish description
  },
  fr: {
    name: 'Best AI - Agents IA & Bestie',
    subtitle: 'Votre Equipe IA dans votre Poche',
    keywords: 'IA,chat,assistant,agents,productivite,compagnon',
    description: '...', // French description
  },
  de: {
    name: 'Best AI - KI-Agenten & Bestie',
    subtitle: 'Ihr KI-Team in Ihrer Tasche',
    keywords: 'KI,Chat,Assistent,Agenten,Produktivitat,Begleiter',
    description: '...', // German description
  },
  ja: {
    name: 'Best AI - AIエージェント＆ベスティ',
    subtitle: 'ポケットの中のAIチーム',
    keywords: 'AI,チャット,アシスタント,エージェント,生産性,相棒',
    description: '...', // Japanese description
  },
  ko: {
    name: 'Best AI - AI 에이전트 & 베스티',
    subtitle: '주머니 속 AI 팀',
    keywords: 'AI,채팅,어시스턴트,에이전트,생산성,동반자',
    description: '...', // Korean description
  },
};
```

---

## 6. Submission Automation with EAS

```bash
# Build and submit to both stores in one flow:

# 1. Build production binaries
eas build --platform all --profile production --non-interactive

# 2. Submit to App Store (TestFlight first, then promote)
eas submit --platform ios --profile production --non-interactive

# 3. Submit to Google Play (internal track, then promote)
eas submit --platform android --profile production --non-interactive

# 4. After approval, promote via respective consoles
# Apple: App Store Connect → select build → submit for review
# Google: Play Console → Production → Create release → Review
```

---

## 7. Release Schedule Strategy

### Phased Rollout

**iOS**: App Store supports phased release (1%, 2%, 5%, 10%, 20%, 50%, 100% over 7 days)
**Android**: Play Store supports staged rollout (custom percentages)

### Recommended Release Flow

1. **Internal testing** (preview build) — Development team
2. **Closed beta** (TestFlight/internal track) — 50-100 external testers
3. **Open beta** (public TestFlight/open testing) — 1,000+ users
4. **Production** — Phased rollout starting at 5%
5. **Full release** — 100% after 48 hours with no critical issues

This submission guide ensures Best AI Mobile meets all store requirements on first submission, with proper metadata, privacy declarations, and contingency plans for rejections.
