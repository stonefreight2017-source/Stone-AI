"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { Loader2, StopCircle, Zap, Brain, Info, X, Mic, MicOff, Volume2, VolumeX, ArrowUp } from "lucide-react";
import { ThinkingIndicator } from "@/components/chat/ThinkingIndicator";
import { MessageRenderer } from "@/components/chat/MessageRenderer";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/store/app-store";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";
import type { ChatError } from "@/types";

const DEFAULT_REDISCLOSURE_MS = 3 * 60 * 60 * 1000; // 3 hours fallback (NY law)
const DEFAULT_CRISIS_RESOURCES = "988 Suicide & Crisis Lifeline (call or text 988), Crisis Text Line (text HOME to 741741), or call 911";

type BestiePath = "friend" | "colleague" | "hybrid" | "tutor";

interface VoicePrefs {
  autoEnable?: boolean;
  speed?: "slow" | "normal" | "fast";
  pitch?: "low" | "medium" | "high";
  autoSpeak?: boolean;
}

interface BestieChatProps {
  conversationId: string;
  bestieName: string;
  bestieEmoji: string;
  bestiePath?: BestiePath;
  bgTheme?: string;
  bestieTraits?: string[];
  voicePrefs?: VoicePrefs;
}

/** Map personality traits to emoji sets for thinking/reactions */
const TRAIT_EMOJIS: Record<string, string[]> = {
  empathetic: ["\uD83E\uDD17", "\uD83D\uDC9B", "\uD83E\uDE77"],
  witty: ["\uD83D\uDE0F", "\uD83D\uDE04", "\uD83C\uDFAD"],
  direct: ["\uD83C\uDFAF", "\uD83D\uDCAA", "\u26A1"],
  nurturing: ["\uD83C\uDF3B", "\uD83E\uDEF6", "\uD83C\uDF3F"],
  adventurous: ["\uD83C\uDFD4\uFE0F", "\uD83D\uDE80", "\uD83C\uDF0D"],
  intellectual: ["\uD83E\uDDD0", "\uD83D\uDCDA", "\uD83D\uDD2C"],
  playful: ["\uD83C\uDF89", "\uD83D\uDE1C", "\uD83C\uDFAE"],
  calm: ["\uD83E\uDDD8", "\u2615", "\uD83C\uDF19"],
  motivating: ["\uD83D\uDD25", "\uD83D\uDCAA", "\uD83C\uDFC6"],
  creative: ["\uD83C\uDFA8", "\u2728", "\uD83C\uDF08"],
  loyal: ["\uD83D\uDC3A", "\uD83E\uDD1D", "\uD83D\uDEE1\uFE0F"],
  sarcastic: ["\uD83D\uDE0F", "\uD83D\uDC40", "\u2615"],
  analytical: ["\uD83D\uDD2C", "\uD83D\uDCC8", "\uD83E\uDDE0"],
  spontaneous: ["\u26A1", "\uD83C\uDF89", "\uD83D\uDE80"],
  protective: ["\uD83D\uDEE1\uFE0F", "\uD83D\uDCAA", "\uD83D\uDC3B"],
  philosophical: ["\uD83C\uDF0C", "\uD83E\uDDD0", "\u267E\uFE0F"],
  competitive: ["\uD83C\uDFC6", "\uD83D\uDD25", "\uD83D\uDCAF"],
  chill: ["\uD83C\uDF0A", "\uD83D\uDE0E", "\u2615"],
};

function getPersonalityEmojis(traits: string[]): string[] {
  const pool: string[] = [];
  for (const t of traits) {
    const emojis = TRAIT_EMOJIS[t];
    if (emojis) pool.push(...emojis);
  }
  return pool.length > 0 ? [...new Set(pool)] : ["\u2728", "\uD83D\uDCAD", "\uD83D\uDC9C"];
}

/** Path-based UI themes — colors, gradients, and labels */
const PATH_THEMES: Record<BestiePath, {
  headerBg: string;
  headerAccent: string;
  inputBg: string;
  inputBorder: string;
  userBubble: string;
  userAvatar: string;
  accentText: string;
  subtitleText: string;
  subtitle: string;
  sendButton: string;
  placeholder: string;
}> = {
  friend: {
    headerBg: "bg-zinc-900/80",
    headerAccent: "border-zinc-800",
    inputBg: "bg-zinc-900/60",
    inputBorder: "border-zinc-800",
    userBubble: "bg-rose-600/90 text-white",
    userAvatar: "bg-rose-700/80 text-rose-100",
    accentText: "text-rose-400",
    subtitleText: "text-zinc-500",
    subtitle: "Your Right Hand",
    sendButton: "bg-rose-600 hover:bg-rose-500",
    placeholder: "placeholder:text-zinc-600",
  },
  colleague: {
    headerBg: "bg-zinc-900/80",
    headerAccent: "border-zinc-800",
    inputBg: "bg-zinc-900/60",
    inputBorder: "border-zinc-800",
    userBubble: "bg-blue-600/90 text-white",
    userAvatar: "bg-blue-700/80 text-blue-100",
    accentText: "text-blue-400",
    subtitleText: "text-zinc-500",
    subtitle: "Business Operator",
    sendButton: "bg-blue-600 hover:bg-blue-500",
    placeholder: "placeholder:text-zinc-600",
  },
  hybrid: {
    headerBg: "bg-zinc-900/80",
    headerAccent: "border-zinc-800",
    inputBg: "bg-zinc-900/60",
    inputBorder: "border-zinc-800",
    userBubble: "bg-amber-600/90 text-white",
    userAvatar: "bg-amber-700/80 text-amber-100",
    accentText: "text-amber-400",
    subtitleText: "text-zinc-500",
    subtitle: "Full-Stack Partner",
    sendButton: "bg-amber-600 hover:bg-amber-500",
    placeholder: "placeholder:text-zinc-600",
  },
  tutor: {
    headerBg: "bg-zinc-900/80",
    headerAccent: "border-zinc-800",
    inputBg: "bg-zinc-900/60",
    inputBorder: "border-zinc-800",
    userBubble: "bg-emerald-600/90 text-white",
    userAvatar: "bg-emerald-700/80 text-emerald-100",
    accentText: "text-emerald-400",
    subtitleText: "text-zinc-500",
    subtitle: "Growth Advisor",
    sendButton: "bg-emerald-600 hover:bg-emerald-500",
    placeholder: "placeholder:text-zinc-600",
  },
};

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// Render avatar — handles both emoji strings and data URI images
function AvatarDisplay({ avatar, size = "sm" }: { avatar: string; size?: "sm" | "md" | "lg" }) {
  const isImage = avatar.startsWith("data:") || avatar.startsWith("http");
  const sizeClasses = size === "lg" ? "h-14 w-14" : size === "md" ? "h-9 w-9" : "h-8 w-8";
  if (isImage) {
    return (
      <img
        src={avatar}
        alt=""
        className={`${sizeClasses} rounded-full object-cover ring-1 ring-white/10 shadow-sm`}
      />
    );
  }
  const textSize = size === "lg" ? "text-3xl" : size === "md" ? "text-xl" : "text-sm";
  return <span className={textSize}>{avatar}</span>;
}

export function BestieChat({ conversationId, bestieName, bestieEmoji, bestiePath = "friend", bgTheme, bestieTraits = [], voicePrefs }: BestieChatProps) {
  const theme = PATH_THEMES[bestiePath];
  const personalityEmojis = getPersonalityEmojis(bestieTraits);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { selectedMode, setSelectedMode, setTierError } = useAppStore();
  const { data: userData } = useUser();

  // AI Disclosure banner — legally required (NY AI Companion Safeguards Act, CA SB 243)
  const [showDisclosure, setShowDisclosure] = useState(true);
  const [crisisResources, setCrisisResources] = useState(DEFAULT_CRISIS_RESOURCES);
  const disclosureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch geo-compliance rules and set jurisdiction-specific values
  useEffect(() => {
    fetch("/api/geo")
      .then((r) => r.json())
      .then((geo: { crisisResources?: string; redisclosureIntervalMs?: number }) => {
        if (geo.crisisResources) setCrisisResources(geo.crisisResources);

        // Set re-disclosure timer based on jurisdiction (0 = not required, use default as safety net)
        const interval = geo.redisclosureIntervalMs || DEFAULT_REDISCLOSURE_MS;
        function scheduleRedisclosure() {
          disclosureTimerRef.current = setTimeout(() => {
            setShowDisclosure(true);
            scheduleRedisclosure();
          }, interval);
        }
        scheduleRedisclosure();
      })
      .catch(() => {
        // Fallback: use US rules (strictest for disclosure timing)
        function scheduleRedisclosure() {
          disclosureTimerRef.current = setTimeout(() => {
            setShowDisclosure(true);
            scheduleRedisclosure();
          }, DEFAULT_REDISCLOSURE_MS);
        }
        scheduleRedisclosure();
      });

    return () => {
      if (disclosureTimerRef.current) clearTimeout(disclosureTimerRef.current);
    };
  }, []);

  // Input state
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Voice chat state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(voicePrefs?.autoEnable ?? false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceLang, setVoiceLang] = useState("en-US");

  // Voice pref mappings
  const speedRateMap: Record<string, number> = { slow: 0.8, normal: 1.0, fast: 1.3 };
  const pitchMap: Record<string, number> = { low: 0.8, medium: 1.0, high: 1.2 };
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const sendMessageRef = useRef<((msg: { text: string }) => void) | null>(null);

  const VOICE_LANGUAGES = [
    { code: "en-US", label: "English", flag: "EN" },
    { code: "zh-CN", label: "Chinese", flag: "ZH" },
    { code: "es-ES", label: "Spanish", flag: "ES" },
    { code: "hi-IN", label: "Hindi", flag: "HI" },
    { code: "fr-FR", label: "French", flag: "FR" },
    { code: "ar-SA", label: "Arabic", flag: "AR" },
  ];

  // Latency tracking
  const sendTimeRef = useRef<number>(0);
  const [latencyMap, setLatencyMap] = useState<Record<string, number>>({});
  const firstTokenCaptured = useRef(false);

  const {
    messages,
    sendMessage,
    status,
    stop,
    error: chatError,
  } = useChat({
    id: conversationId,
    transport: new TextStreamChatTransport({
      api: "/api/bestie/chat",
      body: {
        conversationId,
        mode: selectedMode,
      },
    }),
    onError: (error) => {
      try {
        const parsed = JSON.parse(error.message) as ChatError;
        if (parsed.code === "TIER_MISMATCH" || parsed.code === "QUOTA_EXCEEDED") {
          setTierError(parsed);
          return;
        }
        if (parsed.code === "SMART_QUOTA_EXCEEDED") {
          setSelectedMode("LOCAL");
          toast.error(parsed.message || "Smart mode limit reached. Switched to Local mode.");
          return;
        }
        if (parsed.code === "RATE_LIMITED") {
          toast.error("Slow down — too many requests. Try again in a moment.");
          return;
        }
      } catch {
        // Not a structured error
      }
      toast.error("Failed to send message. Please try again.");
    },
    onFinish: ({ message }) => {
      if (sendTimeRef.current > 0) {
        const totalMs = Date.now() - sendTimeRef.current;
        setLatencyMap((prev) => ({ ...prev, [message.id]: totalMs }));
        sendTimeRef.current = 0;
      }
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const isStreaming = status === "streaming";
  const isSubmitted = status === "submitted";
  const isBusy = isStreaming || isSubmitted;

  // Keep sendMessageRef in sync so voice callbacks can use it
  useEffect(() => { sendMessageRef.current = sendMessage; }, [sendMessage]);

  // Check browser speech support
  useEffect(() => {
    const w = window as any;
    if ((w.SpeechRecognition || w.webkitSpeechRecognition) && w.speechSynthesis) {
      setSpeechSupported(true);
    }
  }, []);

  // Toggle microphone listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      // Stop
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const w = window as any;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = voiceLang;
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript && sendMessageRef.current) {
        sendTimeRef.current = Date.now();
        firstTokenCaptured.current = false;
        sendMessageRef.current({ text: transcript });
      }
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "aborted") {
        toast.error(`Voice error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, voiceLang]);

  // Speak text aloud using SpeechSynthesis
  const speakText = useCallback((text: string) => {
    if (!voiceEnabled) return;
    const synth = window.speechSynthesis;
    synth.cancel(); // stop any current speech

    // Strip markdown formatting for cleaner speech
    const cleanText = text
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/`(.+?)`/g, "$1")
      .replace(/#{1,6}\s/g, "")
      .replace(/\[(.+?)\]\(.+?\)/g, "$1")
      .replace(/[_~]/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = voiceLang;
    utterance.rate = speedRateMap[voicePrefs?.speed ?? "normal"] ?? 1.0;
    utterance.pitch = pitchMap[voicePrefs?.pitch ?? "medium"] ?? 1.0;

    // Try to find a voice matching the language
    const voices = synth.getVoices();
    const langPrefix = voiceLang.split("-")[0];
    const matchingVoice = voices.find((v) => v.lang.startsWith(langPrefix));
    if (matchingVoice) utterance.voice = matchingVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current = utterance;
    synth.speak(utterance);
  }, [voiceEnabled, voiceLang, voicePrefs?.speed, voicePrefs?.pitch]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  // Auto-speak assistant messages when voice is enabled and autoSpeak is on
  const shouldAutoSpeak = voiceEnabled && (voicePrefs?.autoSpeak !== false);
  useEffect(() => {
    if (!shouldAutoSpeak || !messages.length || isBusy) return;
    const last = messages[messages.length - 1];
    if (last.role === "assistant" && last.parts) {
      const text = last.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("");
      if (text) speakText(text);
    }
  }, [shouldAutoSpeak, messages, isBusy, speakText]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis.cancel();
    };
  }, []);

  // Capture first-token latency
  useEffect(() => {
    if (isStreaming && !firstTokenCaptured.current && sendTimeRef.current > 0) {
      firstTokenCaptured.current = true;
      const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
      if (lastAssistant) {
        const firstTokenMs = Date.now() - sendTimeRef.current;
        setLatencyMap((prev) => ({ ...prev, [`${lastAssistant.id}-ttft`]: firstTokenMs }));
      }
    }
  }, [isStreaming, messages]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    if (!text || isBusy) return;
    sendTimeRef.current = Date.now();
    firstTokenCaptured.current = false;
    sendMessage({ text });
    setInputValue("");
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [inputValue, isBusy, sendMessage]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  type DisplayMessage = {
    id: string;
    role: string;
    parts: Array<{ type: "text"; text: string }>;
  };

  const allMessages: DisplayMessage[] = messages.map((m) => ({
    id: m.id,
    role: m.role,
    parts:
      m.parts
        ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => ({ type: "text" as const, text: p.text })) ?? [],
  }));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={cn("flex items-center justify-between px-4 py-3 border-b", theme.headerAccent, theme.headerBg)}>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
            <AvatarDisplay avatar={bestieEmoji} size="md" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">{bestieName}</h1>
            <p className={cn("text-[10px]", theme.subtitleText)}>{theme.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-zinc-600">
              <Brain className="h-3 w-3" />
              <span>Memory active</span>
            </div>
          )}
          {speechSupported && (
            <div className="flex items-center gap-1">
              <select
                value={voiceLang}
                onChange={(e) => setVoiceLang(e.target.value)}
                className="h-7 bg-transparent border border-zinc-700/50 rounded text-[10px] text-zinc-400 px-1 outline-none focus:border-pink-500 cursor-pointer"
                title="Voice language"
              >
                {VOICE_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-zinc-900">{l.flag}</option>
                ))}
              </select>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-7 w-7",
                  voiceEnabled ? "text-pink-400 hover:text-pink-300" : "text-zinc-500 hover:text-zinc-300"
                )}
                onClick={() => {
                  const next = !voiceEnabled;
                  setVoiceEnabled(next);
                  if (!next) stopSpeaking();
                }}
                aria-label={voiceEnabled ? "Disable voice mode" : "Enable voice mode"}
                title={voiceEnabled ? "Voice mode on — Bestie will speak responses" : "Enable voice mode"}
              >
                {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            </div>
          )}
          {isBusy && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-zinc-400 hover:text-white"
              onClick={stop}
              aria-label="Stop generating"
            >
              <StopCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* AI Disclosure Banner — legally required (NY/CA) */}
      {showDisclosure && (
        <div className="px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800 flex items-start gap-2.5">
          <Info className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs text-zinc-400 leading-relaxed">
            <strong className="text-zinc-300">AI Disclosure:</strong> {bestieName} is an AI companion created by Stone AI. Not a real person, not a substitute for professional support. Crisis resources: {crisisResources}
          </div>
          <button
            onClick={() => setShowDisclosure(false)}
            className="shrink-0 text-zinc-600 hover:text-zinc-400 p-0.5"
            aria-label="Dismiss disclosure"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
            <div className="flex items-center justify-center"><AvatarDisplay avatar={bestieEmoji} size="lg" /></div>
            <p className="text-zinc-500 text-sm max-w-md">
              Start a conversation with <span className={cn("font-medium", theme.accentText)}>{bestieName}</span>.
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-4">
            {allMessages.map((msg) => {
              const ttft = latencyMap[`${msg.id}-ttft`];
              const totalLatency = latencyMap[msg.id];

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3 px-4 py-3",
                    msg.role === "user" ? "justify-end" : ""
                  )}
                >
                  {msg.role !== "user" && (
                    <div className="shrink-0 h-8 w-8 rounded-full bg-zinc-800/60 flex items-center justify-center overflow-hidden">
                      <AvatarDisplay avatar={bestieEmoji} />
                    </div>
                  )}
                  <div className="flex flex-col gap-1 max-w-[75%]">
                    <div
                      className={cn(
                        "rounded-lg px-4 py-2.5 text-sm leading-relaxed",
                        msg.role === "user"
                          ? theme.userBubble
                          : "bg-zinc-800 text-zinc-200"
                      )}
                    >
                      {msg.role === "user" ? (
                        <div className="whitespace-pre-wrap break-words">
                          {msg.parts.map((p) => p.text).join("")}
                        </div>
                      ) : (
                        <MessageRenderer content={msg.parts.map((p) => p.text).join("")} />
                      )}
                    </div>
                    {msg.role === "assistant" && (ttft || totalLatency) && (
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                        <Zap className="h-2.5 w-2.5" />
                        {ttft && <span>First token: {formatLatency(ttft)}</span>}
                        {ttft && totalLatency && <span className="text-zinc-700">|</span>}
                        {totalLatency && <span>Total: {formatLatency(totalLatency)}</span>}
                      </div>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className={cn("shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold", theme.userAvatar)}>
                      U
                    </div>
                  )}
                </div>
              );
            })}

            {/* Thinking indicator with escalating bestie emojis */}
            {isSubmitted && (
              <div className="flex gap-3 px-4 py-3">
                <div className="shrink-0 h-8 w-8 rounded-full bg-zinc-800/60 flex items-center justify-center overflow-hidden">
                  <AvatarDisplay avatar={bestieEmoji} />
                </div>
                <ThinkingIndicator variant="bestie" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {chatError && (
        <div className="px-4 py-2 bg-red-900/30 border-t border-red-800 text-red-300 text-sm text-center">
          {chatError.message}
        </div>
      )}

      {/* Themed input */}
      <div className={cn("border-t p-4", theme.inputBorder, theme.inputBg)}>
        {/* Voice status indicator */}
        {(isListening || isSpeaking) && (
          <div className="flex items-center justify-center gap-2 mb-2">
            {isListening && (
              <div className="flex items-center gap-1.5 text-xs text-red-400 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Listening... speak now
              </div>
            )}
            {isSpeaking && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Volume2 className="h-3 w-3 animate-pulse" />
                {bestieName} is speaking...
                <button
                  onClick={stopSpeaking}
                  className="text-zinc-500 hover:text-white text-[10px] underline ml-1"
                >
                  Stop
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 max-w-3xl mx-auto">
          <Textarea
            ref={textareaRef}
            aria-label="Message input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening..." : `Message ${bestieName}...`}
            disabled={isBusy || isListening}
            className={cn(
              "min-h-[44px] max-h-[200px] resize-none bg-zinc-800 text-white",
              theme.inputBorder, theme.placeholder,
              isListening && "border-red-500/50 placeholder:text-red-300/50"
            )}
            rows={1}
          />

          {/* Mic button */}
          {speechSupported && (
            <Button
              onClick={toggleListening}
              disabled={isBusy}
              size="icon"
              variant="ghost"
              aria-label={isListening ? "Stop listening" : "Start voice input"}
              className={cn(
                "shrink-0 h-[44px] w-[44px] rounded-full transition-all",
                isListening
                  ? "bg-red-600 hover:bg-red-500 text-white animate-pulse"
                  : cn("bg-zinc-800 hover:bg-zinc-700 border", theme.accentText, theme.inputBorder)
              )}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
          )}

          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isBusy}
            size="icon"
            aria-label={isBusy ? "Sending message" : "Send message"}
            className={cn("shrink-0 h-[44px] w-[44px]", theme.sendButton)}
          >
            {isBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
