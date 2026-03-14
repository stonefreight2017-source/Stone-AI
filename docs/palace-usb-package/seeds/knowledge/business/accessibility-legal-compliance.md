# Accessibility Legal Compliance for AI SaaS

## Palace Knowledge Seed — Legal & Compliance Series
### Classification: Important Legal Infrastructure
### Applicable To: Stone AI, Best AI Mobile, Stone AI Tools

---

## 1. Executive Summary

Digital accessibility is not optional. It is a legal requirement under federal and state law, and the enforcement landscape has intensified dramatically since 2020. Title III of the Americans with Disabilities Act (ADA) has been applied to websites and web applications by federal courts across the country. New York has the highest volume of digital accessibility lawsuits in the nation.

For an AI SaaS company like Stone AI, accessibility means ensuring that users with disabilities — visual impairments, motor disabilities, hearing impairments, cognitive disabilities — can fully interact with the platform, including the chat interface, agent interactions, and all UI components.

WCAG 2.1 AA is the de facto legal standard. Meeting it is both a legal shield and a competitive advantage — approximately 26% of US adults have some form of disability.

---

## 2. Legal Framework

### 2.1 Americans with Disabilities Act (ADA) — Title III

```typescript
const adaTitleIII = {
  // ADA Title III prohibits discrimination by "places of public accommodation"
  applicability: {
    // Federal courts have increasingly ruled that websites and apps
    // are "places of public accommodation"
    websitesIncluded: true,
    mobileAppsIncluded: true,
    webApplicationsIncluded: true,

    // Key cases:
    precedent: [
      'Robles v. Domino\'s Pizza (9th Cir. 2019) — websites must be accessible',
      'Gil v. Winn-Dixie (11th Cir. 2021) — narrower ruling, still evolving',
      'NAD v. Netflix (D. Mass. 2012) — streaming service must be accessible',
    ],
  },

  requirements: {
    // ADA does not specify technical standards, but courts
    // consistently reference WCAG 2.1 AA as the standard
    standard: 'WCAG 2.1 Level AA',
    enforcement: 'Private lawsuits + DOJ enforcement',
    damages: 'Injunctive relief (must fix it) + attorney\'s fees',
    // No statutory damages under federal ADA Title III,
    // BUT state laws may provide damages
  },

  // DOJ guidance (2022+): websites of businesses open to the public
  // must be accessible under Title III
  dojGuidance: {
    websiteAccessibility: 'required',
    mobileAppAccessibility: 'required',
    standardReferenced: 'WCAG 2.1 AA',
  },
};
```

### 2.2 New York Accessibility Laws

New York has the most aggressive accessibility litigation in the US:

```typescript
const nyAccessibilityLaws = {
  // New York State Human Rights Law (NYSHRL)
  nyshrl: {
    applicability: 'Any place of public accommodation',
    websitesIncluded: true,
    damages: {
      compensatory: true,
      punitive: true,     // Available under NY law (not federal ADA)
      attorneyFees: true,
      civilPenalties: 'up to $100,000 for willful violations',
    },
    noMinimumEmployees: true, // Applies to ALL businesses
    // NY is the #1 state for digital accessibility lawsuits
  },

  // New York City Human Rights Law (NYCHRL)
  nychrl: {
    // Even broader than state law
    applicability: 'Broadest anti-discrimination law in the country',
    damages: {
      compensatory: true,
      punitive: true,
      attorneyFees: true,
      civilPenalties: 'up to $250,000 for willful violations',
    },
  },

  // NY Executive Order 142 (state agencies)
  // Not directly applicable to private companies but sets NY policy direction
  eo142: {
    standard: 'WCAG 2.0 AA minimum',
    signal: 'NY takes accessibility seriously',
  },

  litigationVolume: {
    annualSuits2024: '4,000+', // NY leads the nation
    targetedBusinesses: 'e-commerce, SaaS, media, hospitality',
    averageSettlement: '$5,000-$25,000',
    serialPlaintiffs: true, // Some law firms file hundreds of suits
  },
};
```

### 2.3 Section 508 (Federal)

```typescript
const section508 = {
  // Applies to federal agencies and federally funded programs
  // Not directly applicable to Stone AI UNLESS selling to federal government
  applicability: 'federal agencies and contractors',
  standard: 'WCAG 2.0 AA (updated to align)',
  relevance: {
    ifSellingToGovernment: 'Must comply with Section 508',
    ifNotSellingToGovernment: 'Not required but good practice',
    vpat: 'Voluntary Product Accessibility Template required for govt sales',
  },
};
```

---

## 3. WCAG 2.1 AA Requirements

### 3.1 The Four Principles (POUR)

All WCAG requirements fall under four principles:

```
P — Perceivable: Users can perceive all content and UI components
O — Operable: Users can operate all UI components and navigation
U — Understandable: Users can understand all content and operation
R — Robust: Content works with current and future assistive technologies
```

### 3.2 Key WCAG 2.1 AA Requirements for Stone AI

```typescript
const wcagRequirements = {
  perceivable: {
    // 1.1 Text Alternatives
    textAlternatives: {
      requirement: 'All non-text content has text alternatives',
      stoneAIApplication: [
        'All agent avatars have alt text',
        'All UI icons have labels or aria-labels',
        'All images in responses have alt text',
        'Charts and diagrams have text descriptions',
        'Emotes (24) have text descriptions',
        'Backdrops have descriptive alt text',
      ],
    },

    // 1.3 Adaptable
    adaptable: {
      requirement: 'Content can be presented in different ways without losing meaning',
      stoneAIApplication: [
        'Semantic HTML throughout (headings, lists, landmarks)',
        'Chat messages use proper ARIA roles',
        'Tables have proper headers',
        'Form elements have associated labels',
        'Reading order makes sense without CSS',
      ],
    },

    // 1.4 Distinguishable
    distinguishable: {
      colorContrast: {
        requirement: '4.5:1 for normal text, 3:1 for large text',
        stoneAIApplication: [
          'All text on backgrounds meets 4.5:1',
          'Chat bubbles meet contrast requirements',
          'Agent names and labels meet contrast requirements',
          'Status indicators use more than just color',
          'Dark theme meets all contrast requirements',
        ],
      },
      resizeText: {
        requirement: 'Text resizable up to 200% without loss of content',
        stoneAIApplication: [
          'Chat interface works at 200% zoom',
          'No content clipped or hidden at 200%',
          'Horizontal scrolling not required at 320px width',
        ],
      },
    },
  },

  operable: {
    // 2.1 Keyboard Accessible
    keyboard: {
      requirement: 'All functionality available via keyboard',
      stoneAIApplication: [
        'Tab through all interactive elements in logical order',
        'Enter/Space activates buttons and links',
        'Escape closes modals and dropdowns',
        'Arrow keys navigate within components (menus, tabs)',
        'Chat input accessible via keyboard',
        'Agent selection via keyboard',
        'All settings and controls keyboard-operable',
        'No keyboard traps (can always tab out)',
      ],
    },

    // 2.4 Navigable
    navigable: {
      requirement: 'Users can navigate, find content, and determine location',
      stoneAIApplication: [
        'Skip navigation link (skip to chat content)',
        'Page titles describe the current page',
        'Focus order matches visual order',
        'Link purposes clear from text or context',
        'Multiple ways to find pages (nav + search)',
        'Headings organize content logically',
        'Focus visible on all interactive elements',
      ],
    },

    // 2.5 Input Modalities
    inputModalities: {
      requirement: 'Support various input methods beyond keyboard and mouse',
      stoneAIApplication: [
        'Touch targets at least 44x44 CSS pixels',
        'Gestures have single-pointer alternatives',
        'No motion-triggered actions (or can be disabled)',
      ],
    },
  },

  understandable: {
    // 3.1 Readable
    readable: {
      requirement: 'Text content is readable and understandable',
      stoneAIApplication: [
        'Page language declared (<html lang="en">)',
        'Language changes within content marked (multilingual Bestie)',
        'Unusual words explained or defined',
        'Abbreviations expanded on first use',
      ],
    },

    // 3.2 Predictable
    predictable: {
      requirement: 'Pages appear and operate in predictable ways',
      stoneAIApplication: [
        'Focus does not trigger unexpected context changes',
        'Input does not trigger unexpected context changes',
        'Navigation consistent across pages',
        'Components identified consistently',
      ],
    },

    // 3.3 Input Assistance
    inputAssistance: {
      requirement: 'Help users avoid and correct mistakes',
      stoneAIApplication: [
        'Error messages identify the error clearly',
        'Labels or instructions provided for user input',
        'Error suggestions offered when possible',
        'Important submissions can be reviewed before sending',
      ],
    },
  },

  robust: {
    // 4.1 Compatible
    compatible: {
      requirement: 'Content compatible with current and future tools',
      stoneAIApplication: [
        'Valid HTML (no parsing errors)',
        'ARIA roles and properties used correctly',
        'Status messages announced to screen readers',
        'Custom components have proper ARIA patterns',
      ],
    },
  },
};
```

---

## 4. AI Chat Interface Accessibility

### 4.1 Chat Component Accessibility

The chat interface is Stone AI's primary interaction surface and has unique accessibility requirements:

```typescript
const chatAccessibility = {
  chatContainer: {
    role: 'log',              // ARIA role for chat log
    ariaLive: 'polite',      // New messages announced to screen readers
    ariaLabel: 'Chat conversation with [Agent Name]',
    ariaRelevant: 'additions', // Announce new additions
  },

  messageInput: {
    role: 'textbox',
    ariaLabel: 'Message input',
    ariaMultiline: true,
    ariaPlaceholder: 'Type a message...',
    keyboardShortcuts: {
      enter: 'Send message',
      shiftEnter: 'New line',
      escape: 'Clear input / close suggestions',
      arrowUp: 'Edit last message (optional)',
    },
  },

  messageBubble: {
    role: 'article',
    ariaLabel: (msg) => `${msg.role === 'user' ? 'You' : msg.agentName} said: ${msg.preview}`,
    // For code blocks within messages:
    codeBlock: {
      role: 'region',
      ariaLabel: (lang, lines) => `Code block in ${lang}, ${lines} lines`,
      copyButton: { ariaLabel: 'Copy code to clipboard' },
    },
  },

  agentSelector: {
    role: 'listbox',
    ariaLabel: 'Select an agent',
    options: {
      role: 'option',
      ariaSelected: true,
      ariaLabel: (agent) => `${agent.name}: ${agent.description}`,
    },
  },

  // Screen reader announcements for dynamic content
  liveRegions: {
    newMessage: {
      type: 'polite',
      template: (agent) => `${agent} responded`,
    },
    agentTyping: {
      type: 'polite',
      template: (agent) => `${agent} is typing`,
    },
    agentSwitch: {
      type: 'assertive',
      template: (agent) => `Switched to ${agent}`,
    },
    error: {
      type: 'assertive',
      template: (error) => `Error: ${error}`,
    },
  },
};
```

### 4.2 Screen Reader Compatibility

```tsx
// React component example for accessible chat message
function ChatMessage({ message, agentName }: ChatMessageProps) {
  return (
    <article
      role="article"
      aria-label={`${message.role === 'user' ? 'You' : agentName} at ${formatTime(message.timestamp)}`}
      className="chat-message"
    >
      <div className="message-header">
        <span className="sr-only">
          {message.role === 'user' ? 'You said' : `${agentName} said`}
        </span>
        <time dateTime={message.timestamp.toISOString()}>
          {formatTime(message.timestamp)}
        </time>
      </div>

      <div
        className="message-content"
        // If content includes markdown-rendered HTML:
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        // Ensure rendered content has proper semantic structure
      />

      {message.attachments?.map(attachment => (
        <div
          key={attachment.id}
          role="img"
          aria-label={attachment.altText || `Attachment: ${attachment.filename}`}
        >
          {/* Attachment rendering */}
        </div>
      ))}
    </article>
  );
}

// Live region for new messages
function ChatLiveRegion({ latestMessage, agentName }: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="false"
      className="sr-only" // Visually hidden, read by screen readers
    >
      {latestMessage && (
        <p>
          {latestMessage.role === 'user'
            ? 'Message sent'
            : `${agentName} responded: ${truncate(latestMessage.content, 100)}`
          }
        </p>
      )}
    </div>
  );
}
```

### 4.3 Keyboard Navigation Map

```
Tab Order (within chat interface):

1. Skip link ("Skip to chat") → jumps to message input
2. Navigation menu (sidebar)
3. Agent selector (if visible)
4. Chat history (scrollable region)
   - Arrow keys to navigate between messages
   - Enter to expand collapsed messages
   - Tab within message to reach interactive elements (links, copy buttons)
5. Message input (textarea)
6. Send button
7. Attachment button
8. Settings/menu buttons

Escape behavior:
- From agent selector dropdown → close dropdown, return focus to trigger
- From modal → close modal, return focus to trigger
- From message input → clear input (if not empty)

Focus management on new message:
- When agent responds, focus stays on input (do NOT move focus)
- New message announced via aria-live region
- User can choose to review with arrow keys
```

---

## 5. Color and Visual Design Accessibility

### 5.1 Color Contrast Requirements

```typescript
const colorContrast = {
  // WCAG 2.1 AA requirements
  normalText: {
    minRatio: 4.5,    // 4.5:1 contrast ratio
    appliesTo: 'text smaller than 18pt (or 14pt bold)',
  },
  largeText: {
    minRatio: 3.0,    // 3:1 contrast ratio
    appliesTo: 'text 18pt+ (or 14pt+ bold)',
  },
  uiComponents: {
    minRatio: 3.0,    // 3:1 for active UI components and graphical objects
    appliesTo: 'buttons, input borders, icons, focus indicators',
  },

  // Stone AI specific checks
  stoneAIChecks: [
    { element: 'Chat text on background', standard: 4.5 },
    { element: 'Agent name labels', standard: 4.5 },
    { element: 'Sidebar navigation text', standard: 4.5 },
    { element: 'Button text on button background', standard: 4.5 },
    { element: 'Input placeholder text', standard: 4.5 },
    { element: 'Error message text', standard: 4.5 },
    { element: 'Link text on background', standard: 4.5 },
    { element: 'Code block text', standard: 4.5 },
    { element: 'Focus indicator on background', standard: 3.0 },
    { element: 'Icon meaning (status, alerts)', standard: 3.0 },
  ],

  // Tools for checking
  tools: [
    'Chrome DevTools Lighthouse audit',
    'axe DevTools browser extension',
    'WebAIM Contrast Checker (webaim.org/resources/contrastchecker)',
    'Figma Stark plugin (design phase)',
  ],
};
```

### 5.2 Color-Independent Information

```
RULE: Never use color as the ONLY way to convey information.

BAD: Red text for errors, green text for success (colorblind users can't distinguish)
GOOD: Red text + error icon + "Error:" prefix for errors
      Green text + checkmark icon + "Success:" prefix for success

BAD: Color-coded agent categories (blue for writing, green for code)
GOOD: Color + icon + text label for each category

BAD: "Click the red button" in instructions
GOOD: "Click the 'Delete' button" (identify by label, not color)
```

---

## 6. Testing and Auditing

### 6.1 Automated Testing

```typescript
const accessibilityTesting = {
  automated: {
    // Catches ~30-50% of accessibility issues
    tools: [
      {
        name: 'axe-core',
        integration: 'Jest + @axe-core/react',
        usage: 'Every component test runs accessibility checks',
        catches: 'Missing labels, contrast issues, ARIA errors, structure issues',
      },
      {
        name: 'Lighthouse',
        integration: 'CI/CD pipeline',
        usage: 'Run on every deployment',
        catches: 'Overall accessibility score, common issues',
        target: 'Score > 90',
      },
      {
        name: 'pa11y',
        integration: 'CI/CD pipeline',
        usage: 'Automated page crawling',
        catches: 'WCAG 2.1 AA violations across all pages',
      },
    ],
    cicdGate: 'Deployment blocked if accessibility score < 85',
  },

  manual: {
    // Catches the other 50-70% of issues
    methods: [
      {
        name: 'Keyboard navigation test',
        frequency: 'Every major feature release',
        procedure: 'Navigate entire application using only keyboard',
        checks: ['Tab order logical', 'No keyboard traps',
                 'Focus visible', 'All functions accessible'],
      },
      {
        name: 'Screen reader test',
        frequency: 'Every major feature release',
        tools: ['NVDA (Windows, free)', 'VoiceOver (Mac, built-in)'],
        checks: ['All content read correctly', 'Dynamic content announced',
                 'Navigation makes sense', 'Forms usable'],
      },
      {
        name: 'Zoom test',
        frequency: 'Every major feature release',
        procedure: 'Test at 200% and 400% zoom',
        checks: ['No content lost', 'No horizontal scroll at 200%',
                 'Layout adapts properly'],
      },
    ],
  },
};
```

### 6.2 Accessibility Audit Checklist

```
PERCEIVABLE
□ All images have alt text
□ All form inputs have labels
□ Color contrast meets 4.5:1 for text, 3:1 for UI
□ Color is not the only way to convey information
□ Content readable at 200% zoom
□ No horizontal scrolling at 320px viewport
□ Audio/video has captions or transcripts (if applicable)
□ Content has proper semantic structure (headings, lists, landmarks)

OPERABLE
□ All functionality works with keyboard only
□ No keyboard traps
□ Focus order matches visual order
□ Focus indicator visible on all interactive elements
□ Skip navigation link present
□ Touch targets at least 44x44px
□ No content that flashes more than 3 times per second
□ Users have enough time to read/interact with content

UNDERSTANDABLE
□ Page language declared in HTML
□ Error messages are clear and helpful
□ Labels and instructions provided for forms
□ Navigation is consistent across pages
□ Unusual terms or abbreviations are explained

ROBUST
□ HTML validates without errors
□ ARIA roles and properties used correctly
□ Custom components have appropriate ARIA patterns
□ Works with current screen readers (NVDA, VoiceOver, JAWS)
```

---

## 7. Compliance Documentation

### 7.1 Accessibility Statement

Every website should have an accessibility statement:

```
Accessibility Statement — Stone AI

Last Updated: [Date]

Stone AI is committed to ensuring digital accessibility for people
with disabilities. We are continually improving the user experience
for everyone and applying the relevant accessibility standards.

Conformance Status:
We aim to conform to WCAG 2.1 Level AA. We are currently working
toward full conformance and regularly audit our platform.

Technical Specifications:
Stone AI relies on the following technologies for accessibility:
- HTML5, CSS3, JavaScript (React/Next.js)
- WAI-ARIA for dynamic content
- SVG for scalable graphics

Known Limitations:
[List any known accessibility issues and timeline for remediation]

Feedback:
We welcome feedback on the accessibility of Stone AI. Please
contact us at:
- Email: accessibility@stone-ai.net
- [Phone if available]

We aim to respond to accessibility feedback within 5 business days.
```

### 7.2 VPAT (Voluntary Product Accessibility Template)

If selling to government or enterprise customers:

```typescript
const vpatGuidance = {
  // VPAT documents your product's accessibility conformance
  purpose: 'Required for government procurement, expected by enterprise',
  format: 'VPAT 2.4 (aligned with WCAG 2.1, Section 508, EN 301 549)',
  template: 'Available from ITIC (itic.org/policy/accessibility/vpat)',

  // Fill out when:
  when: [
    'Selling to federal government',
    'Selling to state/local government',
    'Selling to enterprise customers with accessibility requirements',
    'Responding to RFPs that require accessibility documentation',
  ],

  // Stone AI should prepare VPAT when pursuing enterprise/government sales
};
```

---

## 8. AI-Specific Accessibility Considerations

### 8.1 AI Response Accessibility

```typescript
const aiResponseAccessibility = {
  // AI-generated content must be accessible
  markdownRendering: {
    headingsUsedCorrectly: true,  // Proper heading hierarchy
    listsAreSemanticLists: true,  // <ul>/<ol>, not just dashes
    tablesHaveHeaders: true,       // <th> for header cells
    linksHaveDescriptiveText: true, // Not "click here"
    imagesHaveAlt: true,           // Agent-generated alt text
  },

  codeBlocks: {
    languageAnnounced: true,       // "Code block in TypeScript"
    lineCountAnnounced: true,      // "15 lines"
    copyButtonAccessible: true,     // Keyboard accessible with label
    syntaxHighlightingNotRequired: true, // Color is supplementary
  },

  streamingResponses: {
    // Screen readers need to handle streaming gracefully
    ariaLive: 'polite',            // Don't interrupt user
    updateGranularity: 'sentence', // Announce per sentence, not per token
    completionAnnounced: true,     // "Response complete"
  },

  agentHandoffs: {
    announced: true,               // "Switching to Pixel"
    contextPreserved: true,        // Accessible context carries over
    focusManaged: true,            // Focus stays predictable
  },
};
```

---

## 9. Production Checklist

- [ ] WCAG 2.1 AA audit completed for all pages
- [ ] Automated accessibility testing in CI/CD (axe-core + Lighthouse)
- [ ] Deployment gate: accessibility score > 85
- [ ] Keyboard navigation tested for all features
- [ ] Screen reader testing completed (NVDA + VoiceOver)
- [ ] Color contrast verified for all text and UI elements
- [ ] All images and icons have alt text or aria-labels
- [ ] Chat interface has proper ARIA roles and live regions
- [ ] Code blocks accessible with language and line count announced
- [ ] Focus management correct for modals, dropdowns, agent switches
- [ ] Skip navigation link present
- [ ] Touch targets meet 44x44px minimum
- [ ] 200% zoom test passed with no content loss
- [ ] Accessibility statement published at /accessibility
- [ ] Feedback mechanism for accessibility issues in place
- [ ] Known issues documented with remediation timeline
- [ ] Quarterly manual accessibility review scheduled
