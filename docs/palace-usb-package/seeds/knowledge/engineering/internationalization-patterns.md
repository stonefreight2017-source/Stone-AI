# Internationalization Patterns — Deep Knowledge Seed

> Stone AI Engineering Knowledge Base
> Scope: next-intl, locale management, RTL support, Intl API, translation workflows
> Stack: Next.js 16, TypeScript, App Router, Stone AI Bestie (6 languages)

---

## Table of Contents

1. [next-intl Setup for Next.js 16 App Router](#next-intl-setup-for-nextjs-16-app-router)
2. [Message Extraction and Translation Workflow](#message-extraction-and-translation-workflow)
3. [Dynamic Locale Switching](#dynamic-locale-switching)
4. [RTL Layout Support](#rtl-layout-support)
5. [Date, Number, and Currency Formatting](#date-number-and-currency-formatting)
6. [Pluralization Rules](#pluralization-rules)
7. [SEO: hreflang and Locale-Specific Sitemaps](#seo-hreflang-and-locale-specific-sitemaps)
8. [Stone AI Bestie: 6-Language System](#stone-ai-bestie-6-language-system)
9. [Translation Management and CI/CD](#translation-management-and-cicd)
10. [Fallback Strategies](#fallback-strategies)
11. [Real Code Examples](#real-code-examples)

---

## next-intl Setup for Next.js 16 App Router

### Installation

```bash
npm install next-intl
```

### Project Structure

```
stone-ai/
├── messages/
│   ├── en.json          # English (default)
│   ├── es.json          # Spanish
│   ├── fr.json          # French
│   ├── de.json          # German
│   ├── ja.json          # Japanese
│   └── ar.json          # Arabic (RTL)
├── src/
│   ├── i18n/
│   │   ├── config.ts    # Locale configuration
│   │   ├── request.ts   # Server-side locale detection
│   │   └── navigation.ts # Localized navigation helpers
│   ├── app/
│   │   └── [locale]/
│   │       ├── layout.tsx
│   │       ├── page.tsx
│   │       ├── chat/
│   │       │   └── page.tsx
│   │       └── agents/
│   │           └── page.tsx
│   ├── middleware.ts
│   └── components/
│       └── locale-switcher.tsx
```

### Configuration

```typescript
// src/i18n/config.ts
export const locales = ['en', 'es', 'fr', 'de', 'ja', 'ar'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Espanol',
  fr: 'Francais',
  de: 'Deutsch',
  ja: '日本語',
  ar: 'العربية',
};

// RTL locales
export const rtlLocales: Locale[] = ['ar'];

export function isRtl(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}

// src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server';
import { locales, type Locale } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  // Validate the locale from the request
  let locale = await requestLocale;

  if (!locale || !locales.includes(locale as Locale)) {
    locale = 'en';
  }

  return {
    locale,
    messages: (await import(`../../../messages/${locale}.json`)).default,
    // Shared formatting defaults
    timeZone: 'America/New_York',
    now: new Date(),
    formats: {
      dateTime: {
        short: {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        },
        long: {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        },
      },
      number: {
        currency: {
          style: 'currency',
          currency: 'USD',
        },
        precise: {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        },
      },
    },
  };
});
```

### Middleware for Locale Detection

```typescript
// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

export default createMiddleware({
  locales,
  defaultLocale,
  // Prefix-based routing: /en/chat, /es/chat, etc.
  localePrefix: 'as-needed', // Don't show prefix for default locale
  // Detect locale from Accept-Language header, cookies, or URL
  localeDetection: true,
});

export const config = {
  // Match all pathnames except:
  // - API routes
  // - Static files
  // - Next.js internal routes
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
    // Also match root
    '/',
  ],
};
```

### Root Layout with Locale

```typescript
// src/app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, isRtl, type Locale } from '@/i18n/config';

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Get messages for the current locale
  const messages = await getMessages();

  return (
    <html lang={locale} dir={isRtl(locale as Locale) ? 'rtl' : 'ltr'}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  // Locale-specific metadata
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return {
    title: t('title'),
    description: t('description'),
  };
}
```

### Navigation Helpers

```typescript
// src/i18n/navigation.ts
import { createNavigation } from 'next-intl/navigation';
import { locales, defaultLocale } from './config';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation({
    locales,
    defaultLocale,
    localePrefix: 'as-needed',
  });
```

---

## Message Extraction and Translation Workflow

### Message File Structure

```json
// messages/en.json
{
  "Metadata": {
    "title": "Stone AI — Your AI Agent Platform",
    "description": "Access 42+ AI agents for research, writing, coding, and more"
  },
  "Common": {
    "loading": "Loading...",
    "error": "Something went wrong",
    "retry": "Try again",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "confirm": "Confirm",
    "back": "Back",
    "next": "Next",
    "search": "Search",
    "noResults": "No results found"
  },
  "Navigation": {
    "chat": "Chat",
    "agents": "Agents",
    "settings": "Settings",
    "billing": "Billing",
    "forum": "Forum",
    "help": "Help",
    "signIn": "Sign In",
    "signOut": "Sign Out"
  },
  "Chat": {
    "placeholder": "Type your message...",
    "send": "Send",
    "stop": "Stop generating",
    "selectAgent": "Select an agent to start chatting",
    "noMessages": "No messages yet. Say hello!",
    "messageCount": "You have {count, plural, =0 {no messages} one {# message} other {# messages}}",
    "typing": "{agent} is typing...",
    "streamError": "Failed to get a response. Please try again.",
    "rateLimited": "You're sending messages too quickly. Please wait {seconds} seconds.",
    "copied": "Copied to clipboard"
  },
  "Agents": {
    "title": "AI Agents",
    "subtitle": "Choose from {count} specialized agents",
    "searchPlaceholder": "Search agents...",
    "categories": {
      "all": "All",
      "research": "Research",
      "writing": "Writing",
      "coding": "Coding",
      "analysis": "Analysis",
      "creative": "Creative"
    },
    "locked": "Upgrade to {tier} to unlock this agent",
    "agentCount": "{available} of {total} agents available on your plan"
  },
  "Billing": {
    "title": "Billing & Subscription",
    "currentPlan": "Current Plan",
    "upgrade": "Upgrade",
    "downgrade": "Downgrade",
    "cancel": "Cancel Subscription",
    "renews": "Renews on {date}",
    "cancelConfirm": "Are you sure you want to cancel? You'll lose access to {tier} features at the end of your billing period.",
    "tiers": {
      "free": "Free",
      "starter": "Starter",
      "plus": "Plus",
      "smart": "Smart",
      "pro": "Pro"
    },
    "prices": {
      "monthly": "{price}/month",
      "annual": "{price}/year",
      "annualSavings": "Save {percent}% with annual billing"
    },
    "features": {
      "agentAccess": "{count} AI agents",
      "bestie": "Bestie companion",
      "prioritySupport": "Priority support",
      "customBackdrops": "Custom backdrops"
    }
  },
  "Settings": {
    "title": "Settings",
    "profile": {
      "title": "Profile",
      "displayName": "Display Name",
      "email": "Email",
      "bio": "Bio",
      "avatar": "Avatar",
      "changeAvatar": "Change Avatar"
    },
    "appearance": {
      "title": "Appearance",
      "theme": "Theme",
      "themeLight": "Light",
      "themeDark": "Dark",
      "themeSystem": "System",
      "language": "Language"
    },
    "notifications": {
      "title": "Notifications",
      "email": "Email notifications",
      "push": "Push notifications",
      "marketing": "Marketing emails"
    }
  },
  "Bestie": {
    "title": "Your Bestie",
    "description": "A personalized AI companion that adapts to you",
    "setup": {
      "chooseName": "Give your Bestie a name",
      "choosePersonality": "Choose a personality",
      "chooseLanguage": "Choose a language",
      "personalities": {
        "supportive": "Supportive",
        "playful": "Playful",
        "professional": "Professional",
        "creative": "Creative"
      }
    },
    "noBestie": "You haven't set up your Bestie yet",
    "createBestie": "Create Your Bestie"
  },
  "Errors": {
    "notFound": "Page not found",
    "notFoundDescription": "The page you're looking for doesn't exist.",
    "unauthorized": "You need to sign in to access this page",
    "forbidden": "You don't have permission to access this",
    "serverError": "Our servers are having trouble. Please try again later.",
    "offline": "You appear to be offline. Some features may be unavailable."
  }
}
```

```json
// messages/es.json (Spanish)
{
  "Metadata": {
    "title": "Stone AI — Tu Plataforma de Agentes de IA",
    "description": "Accede a mas de 42 agentes de IA para investigacion, escritura, codigo y mas"
  },
  "Common": {
    "loading": "Cargando...",
    "error": "Algo salio mal",
    "retry": "Intentar de nuevo",
    "cancel": "Cancelar",
    "save": "Guardar",
    "delete": "Eliminar",
    "confirm": "Confirmar",
    "back": "Atras",
    "next": "Siguiente",
    "search": "Buscar",
    "noResults": "No se encontraron resultados"
  },
  "Navigation": {
    "chat": "Chat",
    "agents": "Agentes",
    "settings": "Configuracion",
    "billing": "Facturacion",
    "forum": "Foro",
    "help": "Ayuda",
    "signIn": "Iniciar Sesion",
    "signOut": "Cerrar Sesion"
  },
  "Chat": {
    "placeholder": "Escribe tu mensaje...",
    "send": "Enviar",
    "stop": "Detener generacion",
    "selectAgent": "Selecciona un agente para comenzar a chatear",
    "noMessages": "Aun no hay mensajes. Di hola!",
    "messageCount": "Tienes {count, plural, =0 {ningun mensaje} one {# mensaje} other {# mensajes}}",
    "typing": "{agent} esta escribiendo...",
    "streamError": "No se pudo obtener una respuesta. Por favor intenta de nuevo.",
    "rateLimited": "Estas enviando mensajes muy rapido. Espera {seconds} segundos.",
    "copied": "Copiado al portapapeles"
  },
  "Agents": {
    "title": "Agentes de IA",
    "subtitle": "Elige entre {count} agentes especializados",
    "searchPlaceholder": "Buscar agentes...",
    "categories": {
      "all": "Todos",
      "research": "Investigacion",
      "writing": "Escritura",
      "coding": "Programacion",
      "analysis": "Analisis",
      "creative": "Creativo"
    },
    "locked": "Actualiza a {tier} para desbloquear este agente",
    "agentCount": "{available} de {total} agentes disponibles en tu plan"
  }
}
```

### Translation Extraction Script

```typescript
// scripts/extract-messages.ts
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

interface MessageUsage {
  key: string;
  file: string;
  line: number;
}

function extractMessages(sourceDir: string): MessageUsage[] {
  const files = glob.sync(`${sourceDir}/**/*.{ts,tsx}`, {
    ignore: ['**/node_modules/**', '**/*.test.*', '**/*.spec.*'],
  });

  const usages: MessageUsage[] = [];

  // Match patterns: t('key'), t('namespace.key'), useTranslations('namespace')
  const patterns = [
    /\bt\(\s*['"]([^'"]+)['"]\s*\)/g,
    /useTranslations\(\s*['"]([^'"]+)['"]\s*\)/g,
    /getTranslations\(\s*\{[^}]*namespace:\s*['"]([^'"]+)['"]/g,
  ];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      for (const pattern of patterns) {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(lines[lineNum])) !== null) {
          usages.push({
            key: match[1],
            file: path.relative(sourceDir, file),
            line: lineNum + 1,
          });
        }
      }
    }
  }

  return usages;
}

// Find unused translation keys
function findUnusedKeys(
  messagesPath: string,
  usages: MessageUsage[]
): string[] {
  const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
  const usedKeys = new Set(usages.map((u) => u.key));

  function flattenKeys(obj: any, prefix = ''): string[] {
    return Object.entries(obj).flatMap(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null) {
        return flattenKeys(value, fullKey);
      }
      return [fullKey];
    });
  }

  const allKeys = flattenKeys(messages);
  return allKeys.filter((key) => !usedKeys.has(key));
}

// Run extraction
const usages = extractMessages('./src');
const unused = findUnusedKeys('./messages/en.json', usages);

console.log(`Found ${usages.length} translation key usages`);
console.log(`Found ${unused.length} unused keys:`);
unused.forEach((key) => console.log(`  - ${key}`));
```

---

## Dynamic Locale Switching

```typescript
// src/components/locale-switcher.tsx
'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { locales, localeNames, type Locale } from '@/i18n/config';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(newLocale: string) {
    // Transition to the new locale while preserving the current path
    router.replace(pathname, { locale: newLocale as Locale });
  }

  return (
    <Select value={locale} onValueChange={handleChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            <span className="flex items-center gap-2">
              <LocaleFlag locale={loc} />
              {localeNames[loc]}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Flag component using emoji or SVG
function LocaleFlag({ locale }: { locale: Locale }) {
  const flags: Record<Locale, string> = {
    en: '\u{1F1FA}\u{1F1F8}',
    es: '\u{1F1EA}\u{1F1F8}',
    fr: '\u{1F1EB}\u{1F1F7}',
    de: '\u{1F1E9}\u{1F1EA}',
    ja: '\u{1F1EF}\u{1F1F5}',
    ar: '\u{1F1F8}\u{1F1E6}',
  };

  return <span className="text-lg">{flags[locale]}</span>;
}
```

### Persisting Locale Preference

```typescript
// The middleware handles this via cookies automatically.
// next-intl sets a NEXT_LOCALE cookie when the user switches.
// On subsequent visits, the middleware reads this cookie.

// For additional control:
// src/lib/locale-storage.ts
export function setLocalePreference(locale: string) {
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;

  // Also store in user's server-side settings if logged in
  fetch('/api/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: locale }),
  }).catch(() => {
    // Silently fail — cookie is the primary mechanism
  });
}
```

---

## RTL Layout Support

### CSS Strategy for RTL

```typescript
// Tailwind CSS v4 with RTL support via logical properties
// tailwind.config.ts — no special config needed, use logical properties

// PHYSICAL PROPERTIES (avoid for RTL):
// ml-4, mr-4, pl-4, pr-4, left-0, right-0, text-left, text-right

// LOGICAL PROPERTIES (use for RTL):
// ms-4 (margin-inline-start), me-4 (margin-inline-end)
// ps-4 (padding-inline-start), pe-4 (padding-inline-end)
// start-0 (inset-inline-start), end-0 (inset-inline-end)
// text-start, text-end

// Example: sidebar layout that flips for RTL
function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <aside className="
      fixed top-0 start-0 z-40
      w-64 h-screen
      border-e
      bg-background
    ">
      <nav className="px-4 py-6">
        {children}
      </nav>
    </aside>
  );
}

// Example: chat message alignment
function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn(
      'flex gap-3 px-4 py-2',
      isUser ? 'flex-row-reverse' : 'flex-row'
      // flex-row-reverse works correctly in both LTR and RTL
    )}>
      <Avatar />
      <div className={cn(
        'rounded-lg px-4 py-2 max-w-[80%]',
        isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
      )}>
        <p className="text-start">{message.content}</p>
        <time className="text-xs text-end block mt-1">
          {formatTime(message.createdAt)}
        </time>
      </div>
    </div>
  );
}
```

### RTL-Specific Component Adjustments

```typescript
// src/hooks/use-direction.ts
'use client';

import { useLocale } from 'next-intl';
import { isRtl, type Locale } from '@/i18n/config';

export function useDirection() {
  const locale = useLocale() as Locale;
  return isRtl(locale) ? 'rtl' : 'ltr';
}

// Icons that need to flip in RTL
function NavigationIcon({ direction }: { direction: 'ltr' | 'rtl' }) {
  return (
    <ChevronRight
      className={cn(
        'h-4 w-4 transition-transform',
        direction === 'rtl' && 'rotate-180'
      )}
    />
  );
}

// Swipeable components need reversed gesture direction
function SwipeablePanel() {
  const direction = useDirection();

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      // In RTL, swiping left opens the panel (opposite of LTR)
      direction === 'rtl' ? openPanel() : closePanel();
    },
    onSwipedRight: () => {
      direction === 'rtl' ? closePanel() : openPanel();
    },
  });

  return <div {...handlers}>...</div>;
}
```

---

## Date, Number, and Currency Formatting

### Using next-intl's Formatting

```typescript
// In server components
import { getFormatter, getTranslations } from 'next-intl/server';

export default async function BillingPage() {
  const t = await getTranslations('Billing');
  const format = await getFormatter();

  const renewalDate = new Date('2026-04-09');
  const price = 19.99;

  return (
    <div>
      <p>{t('renews', { date: format.dateTime(renewalDate, 'short') })}</p>
      <p>{t('prices.monthly', { price: format.number(price, 'currency') })}</p>
    </div>
  );
}
```

```typescript
// In client components
'use client';

import { useFormatter, useTranslations } from 'next-intl';

function PriceDisplay({ amount, interval }: { amount: number; interval: 'month' | 'year' }) {
  const t = useTranslations('Billing.prices');
  const format = useFormatter();

  const formattedPrice = format.number(amount, {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <span>
      {interval === 'month'
        ? t('monthly', { price: formattedPrice })
        : t('annual', { price: formattedPrice })}
    </span>
  );
}

// Relative time formatting
function MessageTimestamp({ date }: { date: Date }) {
  const format = useFormatter();

  return (
    <time dateTime={date.toISOString()}>
      {format.relativeTime(date)} {/* "5 minutes ago", "hace 5 minutos" */}
    </time>
  );
}

// Number formatting for stats
function StatsDisplay({ messageCount, tokensUsed }: StatsProps) {
  const format = useFormatter();

  return (
    <div>
      <span>{format.number(messageCount)}</span> {/* "1,234" or "1.234" */}
      <span>{format.number(tokensUsed, { notation: 'compact' })}</span> {/* "12K" */}
    </div>
  );
}
```

### Direct Intl API Usage

```typescript
// For cases where next-intl formatting is not available
// (e.g., in utility functions, Web Workers)

export function formatCurrency(
  amount: number,
  locale: string,
  currency = 'USD'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatRelativeTime(date: Date, locale: string): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const diffMs = date.getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHr / 24);

  if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'second');
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
  if (Math.abs(diffHr) < 24) return rtf.format(diffHr, 'hour');
  return rtf.format(diffDay, 'day');
}

// List formatting (for displaying lists of items)
export function formatList(items: string[], locale: string): string {
  return new Intl.ListFormat(locale, {
    style: 'long',
    type: 'conjunction',
  }).format(items);
  // en: "Research, Writing, and Coding"
  // es: "Investigacion, Escritura y Programacion"
  // ja: "Research、Writing、Coding"
}

// Locale-specific number separators
// en: 1,234,567.89
// de: 1.234.567,89
// ja: 1,234,567.89
// ar: ١٬٢٣٤٬٥٦٧٫٨٩ (using Eastern Arabic numerals)
```

---

## Pluralization Rules

### ICU Message Format with next-intl

```json
// messages/en.json
{
  "Chat": {
    "messageCount": "You have {count, plural, =0 {no messages} one {# message} other {# messages}}",
    "agentAvailable": "{count, plural, one {# agent is} other {# agents are}} available",
    "unreadNotifications": "{count, plural, =0 {No new notifications} one {# new notification} other {# new notifications}}",
    "remainingTokens": "You have {count, number} {count, plural, one {token} other {tokens}} remaining"
  },
  "Agents": {
    "agentCount": "{available} of {total, plural, one {# agent} other {# agents}} available on your plan"
  }
}
```

```json
// messages/ar.json — Arabic has 6 plural forms!
{
  "Chat": {
    "messageCount": "{count, plural, =0 {لا توجد رسائل} one {رسالة واحدة} two {رسالتان} few {# رسائل} many {# رسالة} other {# رسالة}}"
  }
}
```

```json
// messages/ja.json — Japanese has no plural forms
{
  "Chat": {
    "messageCount": "メッセージ {count} 件"
  }
}
```

### Usage in Components

```typescript
'use client';

import { useTranslations } from 'next-intl';

function ChatHeader({ messageCount }: { messageCount: number }) {
  const t = useTranslations('Chat');

  return (
    <header className="border-b p-4">
      <p className="text-sm text-muted-foreground">
        {t('messageCount', { count: messageCount })}
        {/* en: "You have 5 messages" */}
        {/* es: "Tienes 5 mensajes" */}
        {/* ja: "メッセージ 5 件" */}
        {/* ar: "لديك ٥ رسائل" */}
      </p>
    </header>
  );
}
```

### Select and Rich Text

```json
// messages/en.json
{
  "Bestie": {
    "greeting": "{gender, select, male {He} female {She} other {They}} will be ready in a moment",
    "description": "Your Bestie speaks <bold>{language}</bold> and has a <italic>{personality}</italic> personality"
  }
}
```

```typescript
function BestieCard({ bestie }: { bestie: Bestie }) {
  const t = useTranslations('Bestie');

  return (
    <div>
      <p>{t('greeting', { gender: bestie.gender })}</p>
      <p>
        {t.rich('description', {
          language: bestie.language,
          personality: bestie.personality,
          bold: (chunks) => <strong>{chunks}</strong>,
          italic: (chunks) => <em>{chunks}</em>,
        })}
      </p>
    </div>
  );
}
```

---

## SEO: hreflang and Locale-Specific Sitemaps

### hreflang Tags

```typescript
// src/app/[locale]/layout.tsx
import { locales } from '@/i18n/config';

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;

  return {
    alternates: {
      canonical: `https://stone-ai.net/${locale === 'en' ? '' : locale}`,
      languages: Object.fromEntries(
        locales.map((loc) => [
          loc,
          `https://stone-ai.net/${loc === 'en' ? '' : loc}`,
        ])
      ),
    },
  };
}

// This generates:
// <link rel="alternate" hreflang="en" href="https://stone-ai.net/" />
// <link rel="alternate" hreflang="es" href="https://stone-ai.net/es" />
// <link rel="alternate" hreflang="fr" href="https://stone-ai.net/fr" />
// <link rel="alternate" hreflang="de" href="https://stone-ai.net/de" />
// <link rel="alternate" hreflang="ja" href="https://stone-ai.net/ja" />
// <link rel="alternate" hreflang="ar" href="https://stone-ai.net/ar" />
```

### Locale-Specific Sitemaps

```typescript
// src/app/sitemap.ts
import { MetadataRoute } from 'next';
import { locales, defaultLocale } from '@/i18n/config';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://stone-ai.net';

  const routes = [
    '',
    '/chat',
    '/agents',
    '/billing',
    '/forum',
    '/help',
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const route of routes) {
    const alternates: Record<string, string> = {};

    for (const locale of locales) {
      const prefix = locale === defaultLocale ? '' : `/${locale}`;
      alternates[locale] = `${baseUrl}${prefix}${route}`;
    }

    entries.push({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: route === '' ? 'daily' : 'weekly',
      priority: route === '' ? 1 : 0.8,
      alternates: {
        languages: alternates,
      },
    });
  }

  return entries;
}
```

---

## Stone AI Bestie: 6-Language System

### Bestie Language Configuration

The Bestie system supports 6 languages for personalized AI companion interactions. These correspond to the platform's supported locales.

```typescript
// src/lib/bestie/languages.ts
export const bestieLanguages = {
  en: {
    name: 'English',
    greeting: 'Hey there!',
    sampleMessages: [
      "How's your day going?",
      "What are you working on today?",
      "Need any help with something?",
    ],
  },
  es: {
    name: 'Espanol',
    greeting: 'Hola!',
    sampleMessages: [
      'Como va tu dia?',
      'En que estas trabajando hoy?',
      'Necesitas ayuda con algo?',
    ],
  },
  fr: {
    name: 'Francais',
    greeting: 'Salut!',
    sampleMessages: [
      'Comment se passe ta journee?',
      'Sur quoi travailles-tu?',
      "Besoin d'aide?",
    ],
  },
  de: {
    name: 'Deutsch',
    greeting: 'Hallo!',
    sampleMessages: [
      'Wie lauft dein Tag?',
      'Woran arbeitest du heute?',
      'Brauchst du Hilfe?',
    ],
  },
  ja: {
    name: '日本語',
    greeting: 'こんにちは！',
    sampleMessages: [
      '今日はどうですか？',
      '今何に取り組んでいますか？',
      '何か手伝えることはありますか？',
    ],
  },
  ar: {
    name: 'العربية',
    greeting: 'مرحبا!',
    sampleMessages: [
      'كيف يومك؟',
      'ماذا تعمل اليوم؟',
      'هل تحتاج مساعدة؟',
    ],
  },
} as const;

export type BestieLanguage = keyof typeof bestieLanguages;

// Bestie setup component with language selection
function BestieLanguageStep({
  selected,
  onSelect,
}: {
  selected: BestieLanguage | null;
  onSelect: (lang: BestieLanguage) => void;
}) {
  const t = useTranslations('Bestie.setup');

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t('chooseLanguage')}</h2>
      <div className="grid grid-cols-2 gap-3">
        {(Object.entries(bestieLanguages) as [BestieLanguage, typeof bestieLanguages[BestieLanguage]][]).map(
          ([code, lang]) => (
            <button
              key={code}
              onClick={() => onSelect(code)}
              className={cn(
                'rounded-lg border p-4 text-start transition-colors',
                selected === code
                  ? 'border-primary bg-primary/10'
                  : 'hover:border-primary/50'
              )}
            >
              <p className="font-medium">{lang.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {lang.greeting}
              </p>
            </button>
          )
        )}
      </div>
    </div>
  );
}
```

### Bestie System Prompt with Language

```typescript
// src/lib/bestie/prompt.ts
export function buildBestieSystemPrompt(bestie: {
  name: string;
  language: BestieLanguage;
  personality: string;
  traits: string[];
}): string {
  const langInstructions: Record<BestieLanguage, string> = {
    en: 'Respond in English.',
    es: 'Responde en espanol. Usa un tono natural y cercano.',
    fr: 'Reponds en francais. Utilise un ton naturel et amical.',
    de: 'Antworte auf Deutsch. Verwende einen naturlichen und freundlichen Ton.',
    ja: '日本語で返答してください。自然で親しみやすいトーンを使ってください。',
    ar: 'اجب باللغة العربية. استخدم نبرة طبيعية وودودة.',
  };

  return `You are ${bestie.name}, a personal AI companion.
Language: ${langInstructions[bestie.language]}
Personality: ${bestie.personality}
Key traits: ${bestie.traits.join(', ')}

Important rules:
- Always respond in ${bestieLanguages[bestie.language].name}
- Match the personality described above
- Be consistent with your character across conversations
- If the user writes in a different language, acknowledge it but respond in your configured language`;
}
```

---

## Translation Management and CI/CD

### CI Translation Checks

```yaml
# .github/workflows/i18n-check.yml
name: i18n Checks

on:
  pull_request:
    paths:
      - 'messages/**'
      - 'src/**'

jobs:
  check-translations:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install dependencies
        run: npm ci

      - name: Check for missing translation keys
        run: node scripts/check-translations.js

      - name: Check for unused translation keys
        run: node scripts/check-unused-keys.js

      - name: Validate ICU message syntax
        run: node scripts/validate-icu.js
```

### Translation Validation Script

```typescript
// scripts/check-translations.ts
import * as fs from 'fs';
import * as path from 'path';
import { locales, defaultLocale } from '../src/i18n/config';

const messagesDir = path.join(__dirname, '..', 'messages');

function flattenObject(obj: any, prefix = ''): Map<string, string> {
  const result = new Map<string, string>();

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      for (const [k, v] of flattenObject(value, fullKey)) {
        result.set(k, v);
      }
    } else {
      result.set(fullKey, String(value));
    }
  }

  return result;
}

// Load base (English) messages
const baseMessages = JSON.parse(
  fs.readFileSync(path.join(messagesDir, `${defaultLocale}.json`), 'utf-8')
);
const baseKeys = flattenObject(baseMessages);

let hasErrors = false;

for (const locale of locales) {
  if (locale === defaultLocale) continue;

  const filePath = path.join(messagesDir, `${locale}.json`);

  if (!fs.existsSync(filePath)) {
    console.error(`MISSING: ${locale}.json does not exist`);
    hasErrors = true;
    continue;
  }

  const messages = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const keys = flattenObject(messages);

  // Check for missing keys
  const missing: string[] = [];
  for (const key of baseKeys.keys()) {
    if (!keys.has(key)) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error(`\n${locale}: ${missing.length} missing keys:`);
    missing.forEach((key) => console.error(`  - ${key}`));
    hasErrors = true;
  }

  // Check for extra keys (not in base)
  const extra: string[] = [];
  for (const key of keys.keys()) {
    if (!baseKeys.has(key)) {
      extra.push(key);
    }
  }

  if (extra.length > 0) {
    console.warn(`\n${locale}: ${extra.length} extra keys (not in ${defaultLocale}):`);
    extra.forEach((key) => console.warn(`  - ${key}`));
  }
}

if (hasErrors) {
  process.exit(1);
} else {
  console.log('All translation files are complete.');
}
```

### ICU Syntax Validator

```typescript
// scripts/validate-icu.ts
import IntlMessageFormat from 'intl-messageformat';

function validateIcuMessages(messages: Map<string, string>, locale: string): string[] {
  const errors: string[] = [];

  for (const [key, value] of messages) {
    try {
      new IntlMessageFormat(value, locale);
    } catch (error) {
      errors.push(`${key}: ${(error as Error).message}`);
    }
  }

  return errors;
}
```

---

## Fallback Strategies

### Missing Translation Fallback

```typescript
// src/i18n/request.ts
export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !locales.includes(locale as Locale)) {
    locale = 'en';
  }

  // Load locale messages with English fallback
  const localeMessages = (await import(`../../../messages/${locale}.json`)).default;
  const fallbackMessages = locale !== 'en'
    ? (await import('../../../messages/en.json')).default
    : {};

  // Deep merge: locale messages override English fallbacks
  const messages = deepMerge(fallbackMessages, localeMessages);

  return {
    locale,
    messages,
    // Handle missing message keys
    onError: (error) => {
      if (error.code === 'MISSING_MESSAGE') {
        console.warn(`Missing translation: ${error.message}`);
        // In development, show the key for easy identification
        // In production, fall back silently to default locale
      }
    },
    getMessageFallback: ({ namespace, key }) => {
      // Return the English version or the key itself
      const fallbackKey = namespace ? `${namespace}.${key}` : key;
      return getNestedValue(fallbackMessages, fallbackKey) || fallbackKey;
    },
  };
});

function deepMerge(target: any, source: any): any {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      typeof source[key] === 'object' &&
      source[key] !== null &&
      !Array.isArray(source[key])
    ) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}
```

### Progressive Translation Loading

```typescript
// For large applications, load translations on demand per namespace
// instead of loading all messages upfront

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) || 'en';

  // Load only common messages initially
  const commonMessages = (
    await import(`../../../messages/${locale}/common.json`)
  ).default;

  return {
    locale,
    messages: commonMessages,
  };
});

// Then load page-specific messages in the page component
// src/app/[locale]/billing/page.tsx
import { unstable_setRequestLocale } from 'next-intl/server';

export default async function BillingPage({ params }: Props) {
  const { locale } = await params;
  unstable_setRequestLocale(locale);

  // Load billing-specific translations
  const billingMessages = (
    await import(`../../../../messages/${locale}/billing.json`)
  ).default;

  return (
    <NextIntlClientProvider messages={billingMessages}>
      <BillingContent />
    </NextIntlClientProvider>
  );
}
```

---

## Real Code Examples

### Internationalized Chat Input

```typescript
'use client';

import { useTranslations } from 'next-intl';
import { useDirection } from '@/hooks/use-direction';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled: boolean;
}

export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const t = useTranslations('Chat');
  const direction = useDirection();
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading || disabled) return;
    onSend(message.trim());
    setMessage('');
  };

  return (
    <form onSubmit={handleSubmit} className="border-t p-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('placeholder')}
          disabled={disabled}
          dir={direction}
          className="flex-1 rounded-md border px-3 py-2 text-start"
          aria-label={t('placeholder')}
        />
        <button
          type="submit"
          disabled={!message.trim() || isLoading || disabled}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
        >
          {isLoading ? t('stop') : t('send')}
        </button>
      </div>
    </form>
  );
}
```

### Internationalized Billing Page

```typescript
'use client';

import { useTranslations, useFormatter } from 'next-intl';

const tierPrices = {
  free: { monthly: 0, annual: 0 },
  starter: { monthly: 19.99, annual: 19.99 * 12 * 0.85 },
  plus: { monthly: 49.99, annual: 49.99 * 12 * 0.85 },
  smart: { monthly: 99.99, annual: 79.99 * 12 },
  pro: { monthly: 200, annual: 170 * 12 },
};

const tierAgentCounts = { free: 4, starter: 16, plus: 30, smart: 39, pro: 42 };

export function BillingTierCards({ currentTier }: { currentTier: string }) {
  const t = useTranslations('Billing');
  const format = useFormatter();
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-center gap-3 mb-8">
        <span>{t('prices.monthly', { price: '' }).replace('/', '')}</span>
        <Switch
          checked={isAnnual}
          onCheckedChange={setIsAnnual}
          aria-label={t('prices.annualSavings', { percent: '15' })}
        />
        <span>{t('prices.annual', { price: '' }).replace('/', '')}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {(Object.entries(tierPrices) as [string, { monthly: number; annual: number }][]).map(
          ([tier, prices]) => {
            const price = isAnnual ? prices.annual / 12 : prices.monthly;
            const formattedPrice = format.number(price, {
              style: 'currency',
              currency: 'USD',
            });

            return (
              <div
                key={tier}
                className={cn(
                  'rounded-lg border p-6',
                  tier === currentTier && 'border-primary ring-2 ring-primary'
                )}
              >
                <h3 className="text-lg font-semibold">
                  {t(`tiers.${tier}` as any)}
                </h3>

                <p className="text-2xl font-bold mt-2">
                  {price === 0
                    ? t('tiers.free')
                    : isAnnual
                      ? t('prices.annual', { price: formattedPrice })
                      : t('prices.monthly', { price: formattedPrice })}
                </p>

                {isAnnual && price > 0 && (
                  <p className="text-sm text-green-600 mt-1">
                    {t('prices.annualSavings', { percent: '15' })}
                  </p>
                )}

                <ul className="mt-4 space-y-2 text-sm">
                  <li>
                    {t('features.agentAccess', {
                      count: tierAgentCounts[tier as keyof typeof tierAgentCounts],
                    })}
                  </li>
                  {tier !== 'free' && <li>{t('features.bestie')}</li>}
                  {(tier === 'smart' || tier === 'pro') && (
                    <li>{t('features.prioritySupport')}</li>
                  )}
                </ul>

                <button
                  className={cn(
                    'mt-4 w-full rounded-md px-4 py-2',
                    tier === currentTier
                      ? 'bg-muted text-muted-foreground cursor-default'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  )}
                  disabled={tier === currentTier}
                >
                  {tier === currentTier
                    ? t('currentPlan')
                    : tier > currentTier
                      ? t('upgrade')
                      : t('downgrade')}
                </button>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}
```

### Server Component with Translations

```typescript
// src/app/[locale]/agents/page.tsx
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export default async function AgentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('Agents');
  const { userId } = await auth();

  const user = userId
    ? await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { tier: true },
      })
    : null;

  const tier = user?.tier ?? 'free';
  const agentLimit = { free: 4, starter: 16, plus: 30, smart: 39, pro: 42 }[tier] ?? 4;

  const agents = await prisma.agent.findMany({
    where: { isActive: true },
    orderBy: { number: 'asc' },
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('subtitle', { count: agents.length })}
        </p>
        <p className="text-sm text-muted-foreground">
          {t('agentCount', { available: agentLimit, total: agents.length })}
        </p>
      </div>

      <AgentGrid agents={agents} userTier={tier} />
    </div>
  );
}
```

---

## Quick Reference

| Task | API | Example |
|---|---|---|
| Server translation | `getTranslations('Namespace')` | `const t = await getTranslations('Chat')` |
| Client translation | `useTranslations('Namespace')` | `const t = useTranslations('Chat')` |
| Format date | `useFormatter()` | `format.dateTime(date, 'short')` |
| Format number | `useFormatter()` | `format.number(42, 'currency')` |
| Relative time | `useFormatter()` | `format.relativeTime(date)` |
| Pluralization | ICU syntax in messages | `{count, plural, one {# item} other {# items}}` |
| Rich text | `t.rich()` | `t.rich('key', { bold: (c) => <b>{c}</b> })` |
| Locale switch | `useRouter().replace()` | `router.replace(pathname, { locale: 'es' })` |
| Current locale | `useLocale()` | `const locale = useLocale()` |
| Direction | Custom hook | `isRtl(locale) ? 'rtl' : 'ltr'` |
| hreflang | `generateMetadata` | `alternates.languages` |

---

*This seed covers the complete internationalization system for Stone AI, supporting 6 languages across the platform and the Bestie companion system. The key principle: use ICU message format for all user-facing strings, leverage the Intl API for formatting, and always test RTL layouts alongside LTR.*
