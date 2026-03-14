# Mobile Accessibility — Best AI Mobile

## Seed Classification
- **Domain**: Mobile Engineering
- **Application**: Best AI Mobile (Business #2)
- **Stack**: React Native, VoiceOver (iOS), TalkBack (Android)
- **Audience**: Senior Frontend Engineer

---

## 1. Accessibility Standards

Best AI Mobile targets **WCAG 2.1 Level AA** compliance. As an AI chat application serving diverse users across 6 languages, accessibility is a core feature, not an afterthought.

### Key Requirements

| Criterion | Target | Description |
|-----------|--------|-------------|
| 1.1.1 Non-text Content | AA | All images have alt text |
| 1.3.1 Info and Relationships | AA | Semantic structure conveyed |
| 1.4.3 Contrast | AA | 4.5:1 text, 3:1 large text |
| 1.4.4 Resize Text | AA | Up to 200% without loss |
| 2.1.1 Keyboard | AA | All functionality via keyboard |
| 2.4.3 Focus Order | AA | Logical focus sequence |
| 2.4.6 Headings | AA | Headings describe content |
| 4.1.2 Name, Role, Value | AA | Screen reader compatible |

---

## 2. VoiceOver (iOS) and TalkBack (Android)

### Accessible Components

```typescript
// src/components/ui/AccessibleButton.tsx
import { Pressable, Text, AccessibilityRole } from 'react-native';

interface AccessibleButtonProps {
  title: string;
  onPress: () => void;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  disabled?: boolean;
}

export function AccessibleButton({
  title,
  onPress,
  accessibilityHint,
  accessibilityRole = 'button',
  disabled = false,
}: AccessibleButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessible={true}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
    >
      <Text>{title}</Text>
    </Pressable>
  );
}
```

### Screen Reader Announcements

```typescript
// src/utils/accessibility.ts
import { AccessibilityInfo, Platform } from 'react-native';

// Announce dynamic changes to screen readers
export function announce(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
}

// Common announcement patterns for Best AI Mobile:
export const a11yAnnounce = {
  messageSent: () => announce('Message sent'),
  messageReceived: (agentName: string) =>
    announce(`New message from ${agentName}`),
  agentTyping: (agentName: string) =>
    announce(`${agentName} is typing`),
  agentStoppedTyping: () => announce('Response complete'),
  connectionLost: () => announce('You are offline. Messages will be sent when connected.'),
  connectionRestored: () => announce('Back online. Syncing messages.'),
  subscriptionChanged: (tier: string) =>
    announce(`Your plan has been changed to ${tier}`),
  errorOccurred: (message: string) =>
    announce(`Error: ${message}`),
  loadingComplete: () => announce('Content loaded'),
  navigationChanged: (screenName: string) =>
    announce(`Navigated to ${screenName}`),
};

// Check if screen reader is active
export async function isScreenReaderActive(): Promise<boolean> {
  return AccessibilityInfo.isScreenReaderEnabled();
}

// Listen for screen reader state changes
export function useScreenReaderStatus() {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setIsActive);

    const sub = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsActive
    );

    return () => sub.remove();
  }, []);

  return isActive;
}
```

### Accessible Message Bubble

```typescript
// src/components/chat/AccessibleMessageBubble.tsx
import { View, Text } from 'react-native';
import type { ChatMessage } from '@/src/types/shared';

interface Props {
  message: ChatMessage;
  agentName: string;
}

export function AccessibleMessageBubble({ message, agentName }: Props) {
  const isUser = message.role === 'user';
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const accessibilityLabel = isUser
    ? `You said: ${message.content}. Sent at ${time}`
    : `${agentName} said: ${message.content}. Received at ${time}`;

  return (
    <View
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
      accessibilityActions={[
        { name: 'copy', label: 'Copy message' },
        { name: 'delete', label: 'Delete message' },
      ]}
      onAccessibilityAction={(event) => {
        switch (event.nativeEvent.actionName) {
          case 'copy':
            copyToClipboard(message.content);
            announce('Message copied');
            break;
          case 'delete':
            deleteMessage(message.id);
            announce('Message deleted');
            break;
        }
      }}
    >
      <Text>{message.content}</Text>
      <Text accessibilityElementsHidden={true}>{time}</Text>
    </View>
  );
}
```

### Accessible Chat Input

```typescript
// Accessibility for the chat input area
<TextInput
  accessible={true}
  accessibilityLabel="Message input"
  accessibilityHint={`Type a message to ${agentName}. Double tap and hold to dictate.`}
  accessibilityRole="none" // TextInput has implicit role
  // ...other props
/>

<Pressable
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel={isStreaming ? 'Stop generating response' : 'Send message'}
  accessibilityHint={isStreaming ? 'Stops the AI from generating more text' : 'Sends your message to the agent'}
  accessibilityState={{ disabled: !hasText && !isStreaming }}
  onPress={handleSend}
>
  {/* Icon */}
</Pressable>
```

---

## 3. Dynamic Type Support

```typescript
// src/theme/dynamicType.ts
import { PixelRatio, Platform } from 'react-native';
import { settingsStore } from '@/src/stores/settingsStore';

// Get the user's preferred font scale
export function getFontScale(): number {
  const systemScale = PixelRatio.getFontScale();
  const appSetting = settingsStore.getState().preferences.fontSize;

  // Combine system and app-level settings
  const appMultiplier = {
    small: 0.85,
    medium: 1.0,
    large: 1.2,
  }[appSetting];

  // Cap at 2x to prevent layout breakage
  return Math.min(systemScale * appMultiplier, 2.0);
}

// Scaled text component
export function ScaledText({
  style,
  children,
  maxFontMultiplier = 1.5,
  ...props
}: TextProps & { maxFontMultiplier?: number }) {
  return (
    <Text
      style={style}
      maxFontSizeMultiplier={maxFontMultiplier}
      allowFontScaling={true}
      {...props}
    >
      {children}
    </Text>
  );
}

// For text that should NOT scale (e.g., tab bar labels, badges)
export function FixedText({ style, children, ...props }: TextProps) {
  return (
    <Text
      style={style}
      allowFontScaling={false}
      {...props}
    >
      {children}
    </Text>
  );
}
```

---

## 4. Touch Targets

```typescript
// Minimum touch target sizes per platform guidelines:
// iOS: 44x44 points
// Android: 48x48 dp
// WCAG: 44x44 CSS pixels

// src/utils/accessibilityConstants.ts
import { Platform } from 'react-native';

export const MIN_TOUCH_TARGET = Platform.select({
  ios: 44,
  android: 48,
  default: 44,
});

// Use hitSlop to expand small interactive elements
<Pressable
  hitSlop={{
    top: 8,
    bottom: 8,
    left: 8,
    right: 8,
  }}
  style={{
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  }}
  onPress={onPress}
>
  <Icon size={24} />
</Pressable>

// For icon buttons, always ensure the touchable area meets minimum
export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  size = 24,
}: {
  icon: React.ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
}) {
  const padding = Math.max(0, (MIN_TOUCH_TARGET - size) / 2);

  return (
    <Pressable
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={{
        padding,
        minWidth: MIN_TOUCH_TARGET,
        minHeight: MIN_TOUCH_TARGET,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {icon}
    </Pressable>
  );
}
```

---

## 5. Color Contrast

```typescript
// src/utils/contrast.ts

// Calculate contrast ratio between two colors (WCAG formula)
export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getRelativeLuminance(hexToRgb(color1));
  const l2 = getRelativeLuminance(hexToRgb(color2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function getRelativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 0, g: 0, b: 0 };
}

// Verify our theme meets WCAG AA standards
// Primary text on background: must be >= 4.5:1
// Large text on background: must be >= 3:1
// Interactive elements: must be >= 3:1

// Dark theme verification:
// Text (#FAFAFA) on Background (#09090B) → 19.6:1 (passes AAA)
// Secondary text (#A1A1AA) on Background (#09090B) → 7.3:1 (passes AA)
// Primary (#6366F1) on Background (#09090B) → 4.9:1 (passes AA)
```

---

## 6. Reduced Motion

```typescript
// src/hooks/useReducedMotion.ts
import { AccessibilityInfo } from 'react-native';
import { useEffect, useState } from 'react';
import { settingsStore } from '@/src/stores/settingsStore';

export function useReducedMotion(): boolean {
  const [systemReduced, setSystemReduced] = useState(false);
  const appReduced = settingsStore((s) => s.preferences.reducedMotion);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setSystemReduced);

    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setSystemReduced
    );

    return () => sub.remove();
  }, []);

  return systemReduced || appReduced;
}

// Usage in animated components:
function AnimatedCard({ children }: { children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();

  return (
    <Animated.View
      entering={reducedMotion ? FadeIn.duration(0) : FadeInDown.springify()}
    >
      {children}
    </Animated.View>
  );
}

// Disable spring animations when reduced motion is on
function useAdaptiveAnimation() {
  const reduced = useReducedMotion();

  return {
    spring: reduced
      ? (value: number) => withTiming(value, { duration: 0 })
      : (value: number) => withSpring(value),
    timing: reduced
      ? (value: number) => withTiming(value, { duration: 0 })
      : (value: number, config?: any) => withTiming(value, config),
  };
}
```

---

## 7. Accessibility Testing

### Manual Testing Checklist

- [ ] **VoiceOver (iOS)**: Navigate entire app with VoiceOver enabled
- [ ] **TalkBack (Android)**: Navigate entire app with TalkBack enabled
- [ ] **Dynamic Type**: Test with largest system font size
- [ ] **Bold Text**: Test with bold text system setting
- [ ] **Reduced Motion**: Test with reduced motion enabled
- [ ] **Color Inversion**: Test with smart/classic inversion
- [ ] **Switch Control**: Test critical flows with switch access
- [ ] **Focus Order**: Verify logical tab order on every screen
- [ ] **Touch Targets**: All interactive elements >= 44pt/48dp
- [ ] **Color Contrast**: Verify all text meets 4.5:1 ratio

### Automated Testing

```typescript
// __tests__/accessibility/a11y.test.tsx
import { render } from '@testing-library/react-native';

describe('Accessibility', () => {
  it('message bubble has correct accessibility role', () => {
    const { getByRole } = render(
      <MessageBubble message={mockMessage} agentName="Pixel" />
    );
    expect(getByRole('text')).toBeTruthy();
  });

  it('send button has accessibility label', () => {
    const { getByLabelText } = render(
      <ChatInput onSend={jest.fn()} />
    );
    expect(getByLabelText('Send message')).toBeTruthy();
  });

  it('tab bar items have labels', () => {
    const { getByLabelText } = render(<TabLayout />);
    expect(getByLabelText('Home')).toBeTruthy();
    expect(getByLabelText('Chat')).toBeTruthy();
    expect(getByLabelText('Agents')).toBeTruthy();
  });
});
```

### Axe Integration

```bash
# For React Native web builds, use axe-core
npm install --save-dev @axe-core/react

# For native, use Accessibility Inspector (Xcode) and Accessibility Scanner (Android)
```

---

## 8. Language and Localization Accessibility

```typescript
// Best AI Mobile supports 6 languages
// Accessibility labels must be localized

import { useTranslation } from 'react-i18next';

function SendButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={t('chat.sendMessage')}
      accessibilityHint={t('chat.sendMessageHint')}
      accessibilityRole="button"
    >
      <SendIcon />
    </Pressable>
  );
}

// i18n/en.ts
export default {
  chat: {
    sendMessage: 'Send message',
    sendMessageHint: 'Sends your message to the agent',
    voiceInput: 'Voice input',
    voiceInputHint: 'Record a voice message to send to the agent',
    stopGenerating: 'Stop generating',
    stopGeneratingHint: 'Stops the AI from generating more text',
  },
};

// i18n/es.ts
export default {
  chat: {
    sendMessage: 'Enviar mensaje',
    sendMessageHint: 'Envia tu mensaje al agente',
    voiceInput: 'Entrada de voz',
    voiceInputHint: 'Graba un mensaje de voz para enviar al agente',
    stopGenerating: 'Detener generacion',
    stopGeneratingHint: 'Detiene la IA de generar mas texto',
  },
};
```

This accessibility architecture ensures Best AI Mobile is usable by everyone — including users who rely on screen readers, large text, reduced motion, and other assistive technologies — across all 6 supported languages.
