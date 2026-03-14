# Mobile AI Chat Interface — Best AI Mobile

## Seed Classification
- **Domain**: Mobile Engineering
- **Application**: Best AI Mobile (Business #2)
- **Stack**: React Native, Reanimated, React Native Gesture Handler
- **Audience**: Senior Frontend Engineer

---

## 1. Chat UI Architecture

### Overview

The chat interface is the core experience of Best AI Mobile. It must handle streaming AI responses, keyboard avoidance, voice input, typing indicators, and smooth scrolling — all while feeling native on both iOS and Android.

```
┌────────────────────────────────────────┐
│  Agent Header (name, avatar, status)    │
├────────────────────────────────────────┤
│                                        │
│  ┌──────────────────────┐              │
│  │ Agent message bubble  │              │
│  └──────────────────────┘              │
│              ┌──────────────────────┐  │
│              │ User message bubble   │  │
│              └──────────────────────┘  │
│  ┌──────────────────────┐              │
│  │ Streaming response... │              │
│  │ ▌                     │              │
│  └──────────────────────┘              │
│  ┌─────┐                              │
│  │ ●●● │  ← Typing indicator          │
│  └─────┘                              │
│                                        │
├────────────────────────────────────────┤
│  [🎤] [ Type a message...        ] [➤] │
│        ← Chat Input Bar               │
└────────────────────────────────────────┘
```

---

## 2. Message List Component

```typescript
// src/components/chat/MessageList.tsx
import { useCallback, useRef, useEffect } from 'react';
import { FlatList, View, StyleSheet, Platform, Keyboard } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { DateSeparator } from './DateSeparator';
import type { ChatMessage } from '@/src/types/shared';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<ChatMessage>);

interface MessageListProps {
  messages: ChatMessage[];
  isTyping: boolean;
  isStreaming: boolean;
  streamingContent: string;
  agentName: string;
  onLoadMore: () => void;
  isLoadingMore: boolean;
}

export function MessageList({
  messages,
  isTyping,
  isStreaming,
  streamingContent,
  agentName,
  onLoadMore,
  isLoadingMore,
}: MessageListProps) {
  const flatListRef = useRef<FlatList>(null);
  const scrollY = useSharedValue(0);
  const isAtBottom = useSharedValue(true);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isAtBottom.value && messages.length > 0) {
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [messages.length, streamingContent]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      const contentHeight = event.contentSize.height;
      const layoutHeight = event.layoutMeasurement.height;
      const offset = event.contentOffset.y;
      isAtBottom.value = offset >= contentHeight - layoutHeight - 100;
    },
  });

  const renderItem = useCallback(
    ({ item, index }: { item: ChatMessage; index: number }) => {
      const prevMessage = index > 0 ? messages[index - 1] : null;
      const showDateSeparator = shouldShowDateSeparator(item, prevMessage);
      const isConsecutive = prevMessage?.role === item.role;

      return (
        <View>
          {showDateSeparator && <DateSeparator date={item.createdAt} />}
          <MessageBubble
            message={item}
            isConsecutive={isConsecutive}
            agentName={agentName}
          />
        </View>
      );
    },
    [messages, agentName]
  );

  const renderFooter = useCallback(() => {
    if (isStreaming) {
      return (
        <MessageBubble
          message={{
            id: 'streaming',
            conversationId: '',
            role: 'assistant',
            content: streamingContent,
            agentId: '',
            createdAt: new Date().toISOString(),
          }}
          isStreaming
          agentName={agentName}
        />
      );
    }
    if (isTyping) {
      return <TypingIndicator agentName={agentName} />;
    }
    return null;
  }, [isStreaming, isTyping, streamingContent, agentName]);

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  return (
    <AnimatedFlatList
      ref={flatListRef}
      data={messages}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListFooterComponent={renderFooter}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
        autoscrollToTopThreshold: 100,
      }}
      // Pagination
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.3}
      inverted={false}
      // Performance
      removeClippedSubviews={Platform.OS === 'android'}
      maxToRenderPerBatch={15}
      windowSize={21}
      initialNumToRender={20}
      getItemLayout={undefined} // Variable height messages
    />
  );
}

function shouldShowDateSeparator(
  current: ChatMessage,
  previous: ChatMessage | null
): boolean {
  if (!previous) return true;
  const currentDate = new Date(current.createdAt).toDateString();
  const previousDate = new Date(previous.createdAt).toDateString();
  return currentDate !== previousDate;
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
});
```

---

## 3. Message Bubble Component

```typescript
// src/components/chat/MessageBubble.tsx
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { useTheme } from '@/src/theme';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { StreamingText } from './StreamingText';
import type { ChatMessage } from '@/src/types/shared';

interface MessageBubbleProps {
  message: ChatMessage;
  isConsecutive?: boolean;
  isStreaming?: boolean;
  agentName?: string;
}

export function MessageBubble({
  message,
  isConsecutive = false,
  isStreaming = false,
  agentName,
}: MessageBubbleProps) {
  const theme = useTheme();
  const isUser = message.role === 'user';
  const scale = useSharedValue(1);

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });
    showMessageActions(message);
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(message.content);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const bubbleStyle = [
    styles.bubble,
    isUser ? styles.userBubble : styles.agentBubble,
    {
      backgroundColor: isUser
        ? theme.colors.primary
        : theme.colors.surface,
      borderTopLeftRadius: !isUser && isConsecutive ? 4 : 16,
      borderTopRightRadius: isUser && isConsecutive ? 4 : 16,
    },
  ];

  const textStyle = {
    color: isUser ? '#FFFFFF' : theme.colors.text,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 22,
  };

  const isOffline = message.metadata?.offline && !message.metadata?.synced;

  return (
    <Animated.View
      entering={FadeInDown.duration(200).springify()}
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.agentContainer,
        isConsecutive && styles.consecutive,
        animatedStyle,
      ]}
    >
      <Pressable onLongPress={handleLongPress} delayLongPress={300}>
        <View style={bubbleStyle}>
          {isStreaming ? (
            <StreamingText
              text={message.content}
              style={textStyle}
            />
          ) : (
            <Text style={textStyle} selectable>
              {message.content}
            </Text>
          )}

          {/* Metadata row */}
          <View style={styles.metaRow}>
            <Text style={[styles.time, { color: isUser ? 'rgba(255,255,255,0.6)' : theme.colors.textTertiary }]}>
              {formatTime(message.createdAt)}
            </Text>
            {isOffline && (
              <Text style={[styles.offlineIndicator, { color: theme.colors.warning }]}>
                Pending sync
              </Text>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function showMessageActions(message: ChatMessage): void {
  // Show action sheet with: Copy, Reply, Delete, Report
  // Implementation using @gorhom/bottom-sheet or ActionSheetIOS
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
    maxWidth: '80%',
  },
  consecutive: {
    marginVertical: 1,
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  agentContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  agentBubble: {
    borderBottomLeftRadius: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  time: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
  },
  offlineIndicator: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
  },
});
```

---

## 4. Streaming Text Component

```typescript
// src/components/chat/StreamingText.tsx
import { useEffect, useState } from 'react';
import { Text, TextStyle, View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';

interface StreamingTextProps {
  text: string;
  style?: TextStyle;
  cursorColor?: string;
}

export function StreamingText({
  text,
  style,
  cursorColor = '#6366F1',
}: StreamingTextProps) {
  const cursorOpacity = useSharedValue(1);

  useEffect(() => {
    cursorOpacity.value = withRepeat(
      withTiming(0, { duration: 500 }),
      -1,
      true
    );
  }, []);

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  return (
    <Text style={style}>
      {text}
      <Animated.Text
        style={[
          { color: cursorColor, fontWeight: 'bold', fontSize: 18 },
          cursorStyle,
        ]}
      >
        |
      </Animated.Text>
    </Text>
  );
}
```

---

## 5. Keyboard Avoidance

```typescript
// src/components/layout/KeyboardAvoid.tsx
import { Platform, KeyboardAvoidingView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboard } from '@/src/hooks/useKeyboard';

interface KeyboardAvoidProps {
  children: React.ReactNode;
}

export function KeyboardAvoid({ children }: KeyboardAvoidProps) {
  const insets = useSafeAreaInsets();

  if (Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior="padding"
        keyboardVerticalOffset={insets.top + 44} // Header height
      >
        {children}
      </KeyboardAvoidingView>
    );
  }

  // Android handles keyboard avoidance via windowSoftInputMode="adjustResize"
  // in AndroidManifest.xml or app.json
  return <>{children}</>;
}

// Custom keyboard hook for precise control
// src/hooks/useKeyboard.ts
import { useEffect, useState } from 'react';
import { Keyboard, KeyboardEvent, Platform } from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';

export function useKeyboard() {
  const [isVisible, setIsVisible] = useState(false);
  const keyboardHeight = useSharedValue(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event: KeyboardEvent) => {
      setIsVisible(true);
      keyboardHeight.value = withTiming(event.endCoordinates.height, {
        duration: event.duration || 250,
      });
    });

    const hideSub = Keyboard.addListener(hideEvent, (event: KeyboardEvent) => {
      setIsVisible(false);
      keyboardHeight.value = withTiming(0, {
        duration: event.duration || 250,
      });
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return { isVisible, keyboardHeight };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

---

## 6. Chat Input Bar

```typescript
// src/components/chat/ChatInput.tsx
import { useState, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  useSharedValue,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme';
import { MicIcon, SendIcon, StopIcon } from '@/src/components/ui/Icons';
import { VoiceInput } from './VoiceInput';

interface ChatInputProps {
  onSend: (message: string) => void;
  onStopStreaming?: () => void;
  isStreaming?: boolean;
  isDisabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  onStopStreaming,
  isStreaming = false,
  isDisabled = false,
  placeholder = 'Message...',
}: ChatInputProps) {
  const theme = useTheme();
  const [text, setText] = useState('');
  const [inputHeight, setInputHeight] = useState(40);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const sendScale = useSharedValue(0);

  // Animate send button visibility
  const hasText = text.trim().length > 0;
  sendScale.value = withSpring(hasText || isStreaming ? 1 : 0);

  const sendButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
    opacity: interpolate(sendScale.value, [0, 1], [0, 1]),
  }));

  const handleSend = useCallback(() => {
    if (isStreaming && onStopStreaming) {
      onStopStreaming();
      return;
    }

    const trimmed = text.trim();
    if (!trimmed || isDisabled) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSend(trimmed);
    setText('');
    setInputHeight(40);
  }, [text, isStreaming, isDisabled, onSend, onStopStreaming]);

  const handleContentSizeChange = useCallback(
    (event: any) => {
      const height = event.nativeEvent.contentSize.height;
      setInputHeight(Math.min(Math.max(40, height), 120)); // Max 5 lines
    },
    []
  );

  const handleVoiceResult = useCallback((transcript: string) => {
    setText((prev) => prev + transcript);
    setShowVoiceInput(false);
    inputRef.current?.focus();
  }, []);

  if (showVoiceInput) {
    return (
      <VoiceInput
        onResult={handleVoiceResult}
        onCancel={() => setShowVoiceInput(false)}
      />
    );
  }

  return (
    <View style={[styles.container, { borderTopColor: theme.colors.border }]}>
      <View
        style={[
          styles.inputRow,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        {/* Voice input button */}
        {!hasText && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowVoiceInput(true);
            }}
            style={styles.iconButton}
            hitSlop={8}
          >
            <MicIcon color={theme.colors.textSecondary} size={22} />
          </Pressable>
        )}

        {/* Text input */}
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          multiline
          onContentSizeChange={handleContentSizeChange}
          style={[
            styles.input,
            {
              height: inputHeight,
              color: theme.colors.text,
              fontFamily: 'Inter-Regular',
            },
          ]}
          editable={!isDisabled}
          returnKeyType="default"
          blurOnSubmit={false}
          textAlignVertical="center"
          keyboardAppearance={theme.isDark ? 'dark' : 'light'}
        />

        {/* Send / Stop button */}
        <Animated.View style={sendButtonStyle}>
          <Pressable
            onPress={handleSend}
            style={[
              styles.sendButton,
              {
                backgroundColor: isStreaming
                  ? theme.colors.error
                  : theme.colors.primary,
              },
            ]}
            hitSlop={8}
          >
            {isStreaming ? (
              <StopIcon color="#FFFFFF" size={18} />
            ) : (
              <SendIcon color="#FFFFFF" size={18} />
            )}
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    paddingTop: Platform.OS === 'ios' ? 8 : 6,
    paddingBottom: Platform.OS === 'ios' ? 8 : 6,
    maxHeight: 120,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
});
```

---

## 7. Typing Indicator

```typescript
// src/components/chat/TypingIndicator.tsx
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { useTheme } from '@/src/theme';

interface TypingIndicatorProps {
  agentName: string;
}

export function TypingIndicator({ agentName }: TypingIndicatorProps) {
  const theme = useTheme();

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
    >
      <View style={styles.dots}>
        <BouncingDot delay={0} color={theme.colors.textSecondary} />
        <BouncingDot delay={150} color={theme.colors.textSecondary} />
        <BouncingDot delay={300} color={theme.colors.textSecondary} />
      </View>
    </Animated.View>
  );
}

function BouncingDot({ delay, color }: { delay: number; color: string }) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: withDelay(
          delay,
          withRepeat(
            withSequence(
              withTiming(-4, { duration: 300 }),
              withTiming(0, { duration: 300 })
            ),
            -1,
            false
          )
        ),
      },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    marginVertical: 4,
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
```

---

## 8. Voice Input

```typescript
// src/components/chat/VoiceInput.tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  cancelAnimation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme';
import { MicIcon, XIcon } from '@/src/components/ui/Icons';

// Note: expo-speech-recognition or @react-native-voice/voice for actual speech-to-text
// This component handles the UI; the STT service is pluggable

interface VoiceInputProps {
  onResult: (transcript: string) => void;
  onCancel: () => void;
}

export function VoiceInput({ onResult, onCancel }: VoiceInputProps) {
  const theme = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    // Start recording on mount
    startRecording();
    return () => stopRecording();
  }, []);

  const startRecording = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRecording(true);

    // Pulse animation while recording
    pulseScale.value = withRepeat(
      withTiming(1.3, { duration: 1000 }),
      -1,
      true
    );

    // Start speech recognition
    // Voice.start('en-US'); // or use the user's preferred language
  };

  const stopRecording = async () => {
    cancelAnimation(pulseScale);
    pulseScale.value = withTiming(1);
    setIsRecording(false);

    // Stop speech recognition
    // Voice.stop();
  };

  const handleDone = () => {
    stopRecording();
    if (transcript) {
      onResult(transcript);
    } else {
      onCancel();
    }
  };

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Pressable onPress={onCancel} style={styles.cancelButton}>
        <XIcon color={theme.colors.textSecondary} size={24} />
      </Pressable>

      <View style={styles.center}>
        <Animated.View style={[styles.pulseCircle, pulseStyle, {
          backgroundColor: `${theme.colors.primary}20`,
        }]}>
          <View style={[styles.micCircle, { backgroundColor: theme.colors.primary }]}>
            <MicIcon color="#FFFFFF" size={32} />
          </View>
        </Animated.View>

        <Text style={[styles.label, { color: theme.colors.text }]}>
          {isRecording ? 'Listening...' : 'Processing...'}
        </Text>

        {transcript ? (
          <Text style={[styles.transcript, { color: theme.colors.textSecondary }]}>
            "{transcript}"
          </Text>
        ) : null}
      </View>

      <Pressable
        onPress={handleDone}
        style={[styles.doneButton, { backgroundColor: theme.colors.primary }]}
      >
        <Text style={styles.doneText}>Done</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cancelButton: {
    padding: 8,
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  pulseCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginTop: 8,
  },
  transcript: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  doneButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  doneText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
});
```

---

## 9. Complete Chat Screen

```typescript
// app/(tabs)/chat/[agentId].tsx
import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import { MessageList } from '@/src/components/chat/MessageList';
import { ChatInput } from '@/src/components/chat/ChatInput';
import { AgentHeader } from '@/src/components/chat/AgentHeader';
import { KeyboardAvoid } from '@/src/components/layout/KeyboardAvoid';
import { useChat } from '@/src/hooks/useChat';
import { useAgent } from '@/src/hooks/useAgent';

export default function ChatScreen() {
  const { agentId } = useLocalSearchParams<{ agentId: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const { agent } = useAgent(agentId);
  const {
    messages,
    sendMessage,
    isTyping,
    isStreaming,
    streamingContent,
    stopStreaming,
    loadMore,
    isLoadingMore,
  } = useChat(agentId);

  const handleSend = useCallback(
    (content: string) => {
      sendMessage(content);
    },
    [sendMessage]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen
        options={{
          header: () => (
            <AgentHeader
              agent={agent}
              isOnline={true}
            />
          ),
        }}
      />

      <KeyboardAvoid>
        <MessageList
          messages={messages}
          isTyping={isTyping}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
          agentName={agent?.name ?? 'Agent'}
          onLoadMore={loadMore}
          isLoadingMore={isLoadingMore}
        />

        <View style={{ paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8 }}>
          <ChatInput
            onSend={handleSend}
            onStopStreaming={stopStreaming}
            isStreaming={isStreaming}
            placeholder={`Message ${agent?.name ?? 'agent'}...`}
          />
        </View>
      </KeyboardAvoid>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

---

## 10. useChat Hook with Streaming

```typescript
// src/hooks/useChat.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { chatService } from '@/src/services/api/chat';
import { offlineMutations } from '@/src/services/offline/offlineMutations';
import { useNetworkStatus } from './useNetworkStatus';
import type { ChatMessage } from '@/src/types/shared';

export function useChat(agentId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { isOnline } = useNetworkStatus();
  const abortControllerRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  // Load initial messages
  useEffect(() => {
    loadMessages();
  }, [agentId]);

  const loadMessages = async () => {
    const msgs = await chatService.getMessages(agentId);
    setMessages(msgs);
  };

  const sendMessage = useCallback(
    async (content: string) => {
      // Create user message immediately
      const userMessage: ChatMessage = {
        id: `local-${Date.now()}`,
        conversationId: agentId,
        role: 'user',
        content,
        agentId,
        createdAt: new Date().toISOString(),
        metadata: { offline: !isOnline },
      };

      setMessages((prev) => [...prev, userMessage]);

      if (!isOnline) {
        // Queue for offline sync
        await offlineMutations.sendMessage({
          conversationId: agentId,
          agentId,
          content,
        });
        return;
      }

      // Show typing indicator
      setIsTyping(true);

      try {
        // Start streaming response
        abortControllerRef.current = new AbortController();
        setIsTyping(false);
        setIsStreaming(true);
        setStreamingContent('');

        let fullContent = '';

        await chatService.streamMessage(
          {
            agentId,
            content,
            conversationId: agentId,
          },
          {
            onToken: (token: string) => {
              fullContent += token;
              setStreamingContent(fullContent);
            },
            onComplete: (response: ChatMessage) => {
              setIsStreaming(false);
              setStreamingContent('');
              setMessages((prev) => [...prev, response]);
            },
            onError: (error: Error) => {
              setIsStreaming(false);
              setStreamingContent('');
              console.error('Stream error:', error);
            },
            signal: abortControllerRef.current.signal,
          }
        );
      } catch (error) {
        setIsTyping(false);
        setIsStreaming(false);
      }
    },
    [agentId, isOnline]
  );

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);

    // Save partial response as a complete message
    if (streamingContent) {
      const partialMessage: ChatMessage = {
        id: `partial-${Date.now()}`,
        conversationId: agentId,
        role: 'assistant',
        content: streamingContent,
        agentId,
        createdAt: new Date().toISOString(),
        metadata: { partial: true },
      };
      setMessages((prev) => [...prev, partialMessage]);
    }

    setStreamingContent('');
  }, [agentId, streamingContent]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || messages.length === 0) return;
    setIsLoadingMore(true);

    const oldest = messages[0];
    const older = await chatService.getMessages(agentId, {
      before: oldest.createdAt,
    });

    setMessages((prev) => [...older, ...prev]);
    setIsLoadingMore(false);
  }, [agentId, messages, isLoadingMore]);

  return {
    messages,
    sendMessage,
    isTyping,
    isStreaming,
    streamingContent,
    stopStreaming,
    loadMore,
    isLoadingMore,
  };
}
```

---

## 11. Agent Header Component

```typescript
// src/components/chat/AgentHeader.tsx
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import { AgentAvatar } from '../agents/AgentAvatar';
import { TierBadge } from '../agents/TierBadge';
import { ChevronLeftIcon } from '../ui/Icons';
import type { Agent } from '@/src/types/shared';

interface AgentHeaderProps {
  agent: Agent | null;
  isOnline: boolean;
}

export function AgentHeader({ agent, isOnline }: AgentHeaderProps) {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  if (!agent) return null;

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.colors.background,
          paddingTop: insets.top,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
        <ChevronLeftIcon color={theme.colors.primary} size={28} />
      </Pressable>

      <Pressable
        style={styles.agentInfo}
        onPress={() => router.push(`/(tabs)/agents/${agent.id}`)}
      >
        <AgentAvatar agent={agent} size={36} />
        <View style={styles.nameContainer}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
              {agent.name}
            </Text>
            <TierBadge tier={agent.tier} size="small" />
          </View>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isOnline ? '#22C55E' : theme.colors.textTertiary },
              ]}
            />
            <Text style={[styles.status, { color: theme.colors.textSecondary }]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
  },
  backButton: {
    padding: 8,
  },
  agentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
    paddingLeft: 4,
  },
  nameContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  status: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
});
```

This chat interface architecture delivers a native-feeling AI conversation experience with smooth streaming, keyboard handling, and offline support — the core interaction that makes Best AI Mobile worth downloading.
