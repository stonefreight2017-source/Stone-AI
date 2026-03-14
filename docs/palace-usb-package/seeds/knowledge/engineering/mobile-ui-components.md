# Mobile UI Components — Best AI Mobile

## Seed Classification
- **Domain**: Mobile Engineering
- **Application**: Best AI Mobile (Business #2)
- **Stack**: React Native, Reanimated, Gesture Handler, expo-haptics
- **Audience**: Senior Frontend Engineer

---

## 1. Design System Foundation

### Theme System

```typescript
// src/theme/colors.ts
export const palette = {
  // Brand colors (shared with Stone AI web)
  primary: '#6366F1',       // Indigo
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',

  // Semantic colors
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
    950: '#09090B',
  },
};

// src/theme/darkTheme.ts
export const darkTheme = {
  isDark: true,
  colors: {
    primary: palette.primary,
    primaryLight: palette.primaryLight,
    background: palette.gray[950],
    surface: palette.gray[900],
    surfaceElevated: palette.gray[800],
    text: palette.gray[50],
    textSecondary: palette.gray[400],
    textTertiary: palette.gray[500],
    border: palette.gray[800],
    error: palette.error,
    errorBg: 'rgba(239, 68, 68, 0.1)',
    success: palette.success,
    warning: palette.warning,
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
};

// src/theme/lightTheme.ts
export const lightTheme = {
  isDark: false,
  colors: {
    primary: palette.primary,
    primaryLight: palette.primaryLight,
    background: palette.white,
    surface: palette.gray[50],
    surfaceElevated: palette.white,
    text: palette.gray[900],
    textSecondary: palette.gray[600],
    textTertiary: palette.gray[400],
    border: palette.gray[200],
    error: palette.error,
    errorBg: 'rgba(239, 68, 68, 0.05)',
    success: palette.success,
    warning: palette.warning,
    overlay: 'rgba(0, 0, 0, 0.3)',
  },
};
```

### Typography

```typescript
// src/theme/typography.ts
import { Platform, TextStyle } from 'react-native';

export const typography = {
  h1: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
  } as TextStyle,
  h2: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
  } as TextStyle,
  h3: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    lineHeight: 24,
  } as TextStyle,
  body: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 22,
  } as TextStyle,
  bodyMedium: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    lineHeight: 22,
  } as TextStyle,
  caption: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
  } as TextStyle,
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,
  button: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 22,
  } as TextStyle,
};

// Dynamic font sizes for accessibility
export function getScaledFontSize(
  base: number,
  setting: 'small' | 'medium' | 'large'
): number {
  const scale = { small: 0.85, medium: 1, large: 1.2 };
  return Math.round(base * scale[setting]);
}
```

---

## 2. Button Component

```typescript
// src/components/ui/Button.tsx
import { Pressable, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  fullWidth = true,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const isDisabled = disabled || loading;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    if (isDisabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const variantStyles = getVariantStyles(variant, theme, isDisabled);
  const sizeStyles = getSizeStyles(size);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[
        styles.base,
        variantStyles.container,
        sizeStyles.container,
        fullWidth && styles.fullWidth,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.textColor} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[sizeStyles.text, { color: variantStyles.textColor }]}>
            {title}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
}

function getVariantStyles(variant: string, theme: any, disabled: boolean) {
  const opacity = disabled ? 0.5 : 1;
  switch (variant) {
    case 'primary':
      return {
        container: { backgroundColor: theme.colors.primary, opacity },
        textColor: '#FFFFFF',
      };
    case 'secondary':
      return {
        container: { backgroundColor: theme.colors.surface, opacity },
        textColor: theme.colors.text,
      };
    case 'outline':
      return {
        container: {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: theme.colors.border,
          opacity,
        },
        textColor: theme.colors.text,
      };
    case 'ghost':
      return {
        container: { backgroundColor: 'transparent', opacity },
        textColor: theme.colors.primary,
      };
    case 'danger':
      return {
        container: { backgroundColor: theme.colors.error, opacity },
        textColor: '#FFFFFF',
      };
    default:
      return {
        container: { backgroundColor: theme.colors.primary, opacity },
        textColor: '#FFFFFF',
      };
  }
}

function getSizeStyles(size: string) {
  switch (size) {
    case 'small':
      return {
        container: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
        text: { fontFamily: 'Inter-SemiBold', fontSize: 14 },
      };
    case 'large':
      return {
        container: { paddingVertical: 16, paddingHorizontal: 24, borderRadius: 14 },
        text: { fontFamily: 'Inter-SemiBold', fontSize: 18 },
      };
    default:
      return {
        container: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
        text: { fontFamily: 'Inter-SemiBold', fontSize: 16 },
      };
  }
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  fullWidth: {
    width: '100%',
  },
});
```

---

## 3. Gesture Handlers

### Swipe-to-Delete

```typescript
// src/components/chat/SwipeableConversation.tsx
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const SWIPE_THRESHOLD = -80;
const DELETE_THRESHOLD = -150;

interface SwipeableConversationProps {
  children: React.ReactNode;
  onDelete: () => void;
  onArchive: () => void;
}

export function SwipeableConversation({
  children,
  onDelete,
  onArchive,
}: SwipeableConversationProps) {
  const translateX = useSharedValue(0);
  const theme = useTheme();

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      translateX.value = Math.min(0, event.translationX);

      // Haptic at threshold
      if (translateX.value < DELETE_THRESHOLD && translateX.value > DELETE_THRESHOLD - 5) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Heavy);
      }
    })
    .onEnd(() => {
      if (translateX.value < DELETE_THRESHOLD) {
        translateX.value = withTiming(-500, { duration: 200 });
        runOnJS(onDelete)();
      } else if (translateX.value < SWIPE_THRESHOLD) {
        translateX.value = withSpring(SWIPE_THRESHOLD);
      } else {
        translateX.value = withSpring(0);
      }
    });

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD, DELETE_THRESHOLD],
      [0, 0.5, 1],
      Extrapolation.CLAMP
    ),
    width: interpolate(
      translateX.value,
      [0, DELETE_THRESHOLD],
      [0, -DELETE_THRESHOLD],
      Extrapolation.CLAMP
    ),
  }));

  return (
    <View style={styles.container}>
      {/* Background actions */}
      <View style={styles.actionsContainer}>
        <Animated.View style={[styles.deleteAction, deleteStyle]}>
          <TrashIcon color="#FFFFFF" size={24} />
          <Text style={styles.actionText}>Delete</Text>
        </Animated.View>
      </View>

      {/* Content */}
      <GestureDetector gesture={pan}>
        <Animated.View style={contentStyle}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
```

### Pull-to-Refresh with Animation

```typescript
// src/components/common/AnimatedRefresh.tsx
import { RefreshControl as RNRefreshControl, Platform } from 'react-native';
import { useTheme } from '@/src/theme';

interface RefreshControlProps {
  refreshing: boolean;
  onRefresh: () => void;
}

export function RefreshControl({ refreshing, onRefresh }: RefreshControlProps) {
  const theme = useTheme();

  return (
    <RNRefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={theme.colors.primary}
      colors={[theme.colors.primary]}
      progressBackgroundColor={theme.colors.surface}
      progressViewOffset={Platform.select({ ios: 0, android: 20 })}
    />
  );
}
```

---

## 4. Animations with Reanimated

### Animated Card Entry

```typescript
// src/components/agents/AgentCard.tsx
import Animated, {
  FadeInDown,
  Layout,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';

interface AgentCardProps {
  agent: Agent;
  index: number;
  onPress: () => void;
}

export function AgentCard({ agent, index, onPress }: AgentCardProps) {
  const theme = useTheme();
  const pressed = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(pressed.value ? 0.97 : 1) },
    ],
    shadowOpacity: withSpring(pressed.value ? 0.05 : 0.1),
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      layout={Layout.springify()}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => { pressed.value = true; }}
        onPressOut={() => { pressed.value = false; }}
      >
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: theme.colors.surface },
            animatedStyle,
          ]}
        >
          <AgentAvatar agent={agent} size={48} />
          <View style={styles.info}>
            <Text style={[styles.name, { color: theme.colors.text }]}>
              {agent.name}
            </Text>
            <Text
              style={[styles.description, { color: theme.colors.textSecondary }]}
              numberOfLines={2}
            >
              {agent.description}
            </Text>
          </View>
          <TierBadge tier={agent.tier} />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}
```

### Page Transition Animation

```typescript
// Shared element transitions between screens
import { SharedTransition, withSpring } from 'react-native-reanimated';

// On AgentCard:
<Animated.Image
  sharedTransitionTag={`agent-avatar-${agent.id}`}
  source={{ uri: agent.avatar }}
  style={styles.avatar}
/>

// On AgentDetail screen:
<Animated.Image
  sharedTransitionTag={`agent-avatar-${agent.id}`}
  source={{ uri: agent.avatar }}
  style={styles.heroAvatar}
/>

// The avatar smoothly animates between the card and detail screen
```

---

## 5. Haptic Feedback Patterns

```typescript
// src/utils/haptics.ts
import * as Haptics from 'expo-haptics';
import { settingsStore } from '@/src/stores/settingsStore';
import { Platform } from 'react-native';

// Centralized haptic feedback with user preference respect
export const haptic = {
  light: () => {
    if (!shouldVibrate()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  medium: () => {
    if (!shouldVibrate()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  heavy: () => {
    if (!shouldVibrate()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },
  success: () => {
    if (!shouldVibrate()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  warning: () => {
    if (!shouldVibrate()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },
  error: () => {
    if (!shouldVibrate()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
  selection: () => {
    if (!shouldVibrate()) return;
    Haptics.selectionAsync();
  },
};

function shouldVibrate(): boolean {
  if (Platform.OS === 'web') return false;
  return settingsStore.getState().preferences.hapticFeedback;
}

// Usage patterns:
// Button press: haptic.light()
// Toggle switch: haptic.selection()
// Delete action: haptic.warning()
// Error state: haptic.error()
// Success confirmation: haptic.success()
// Swipe threshold: haptic.heavy()
// Tab switch: haptic.selection()
```

---

## 6. Platform-Specific UI

```typescript
// src/components/common/PlatformView.tsx
import { Platform, View, ViewProps } from 'react-native';

// Render different components based on platform
export function PlatformView({
  ios,
  android,
  ...props
}: ViewProps & {
  ios?: React.ReactNode;
  android?: React.ReactNode;
}) {
  return (
    <View {...props}>
      {Platform.select({
        ios: ios,
        android: android,
        default: ios ?? android,
      })}
    </View>
  );
}

// Platform-specific styling patterns
import { StyleSheet, Platform } from 'react-native';

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
```

---

## 7. Bottom Sheet Component

```typescript
// src/components/ui/BottomSheet.tsx
import { forwardRef, useCallback, useMemo } from 'react';
import BottomSheetLib, {
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { useTheme } from '@/src/theme';

interface AppBottomSheetProps {
  children: React.ReactNode;
  snapPoints?: (string | number)[];
  onClose?: () => void;
  scrollable?: boolean;
}

export const AppBottomSheet = forwardRef<BottomSheetModal, AppBottomSheetProps>(
  ({ children, snapPoints: customSnaps, onClose, scrollable = false }, ref) => {
    const theme = useTheme();
    const snapPoints = useMemo(
      () => customSnaps ?? ['50%', '90%'],
      [customSnaps]
    );

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      []
    );

    const Content = scrollable ? BottomSheetScrollView : BottomSheetView;

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        onDismiss={onClose}
        handleIndicatorStyle={{
          backgroundColor: theme.colors.textTertiary,
          width: 40,
        }}
        backgroundStyle={{
          backgroundColor: theme.colors.surface,
        }}
        enablePanDownToClose
      >
        <Content style={{ flex: 1, padding: 16 }}>
          {children}
        </Content>
      </BottomSheetModal>
    );
  }
);
```

---

## 8. Toast/Notification Component

```typescript
// src/components/ui/Toast.tsx
import Toast, {
  BaseToast,
  ErrorToast,
  ToastConfig,
} from 'react-native-toast-message';

export const toastConfig: ToastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#22C55E',
        backgroundColor: '#18181B',
        borderRadius: 12,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ color: '#FAFAFA', fontFamily: 'Inter-SemiBold', fontSize: 14 }}
      text2Style={{ color: '#A1A1AA', fontFamily: 'Inter-Regular', fontSize: 12 }}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: '#EF4444',
        backgroundColor: '#18181B',
        borderRadius: 12,
      }}
      text1Style={{ color: '#FAFAFA', fontFamily: 'Inter-SemiBold', fontSize: 14 }}
      text2Style={{ color: '#A1A1AA', fontFamily: 'Inter-Regular', fontSize: 12 }}
    />
  ),
  bestie: ({ text1, text2 }) => (
    <View style={styles.bestieToast}>
      <BestieAvatar size={32} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.toastTitle}>{text1}</Text>
        <Text style={styles.toastBody}>{text2}</Text>
      </View>
    </View>
  ),
};

// Show toast from anywhere
export const toast = {
  success: (title: string, message?: string) =>
    Toast.show({ type: 'success', text1: title, text2: message }),
  error: (title: string, message?: string) =>
    Toast.show({ type: 'error', text1: title, text2: message }),
  bestie: (title: string, message: string) =>
    Toast.show({ type: 'bestie', text1: title, text2: message }),
};
```

---

## 9. Skeleton Loading

```typescript
// src/components/ui/Skeleton.tsx
import { View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  interpolateColor,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { useTheme } from '@/src/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const theme = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [
        theme.isDark ? '#27272A' : '#E4E4E7',
        theme.isDark ? '#3F3F46' : '#F4F4F5',
      ]
    ),
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

// Pre-built skeleton patterns
export function ChatListSkeleton() {
  return (
    <View style={{ padding: 16, gap: 16 }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
          <Skeleton width={48} height={48} borderRadius={24} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="90%" height={14} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function AgentGridSkeleton() {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} height={80} borderRadius={12} />
      ))}
    </View>
  );
}
```

This UI component library provides Best AI Mobile with a consistent, performant, and accessible design system that feels native on both iOS and Android while maintaining the Stone AI brand identity.
