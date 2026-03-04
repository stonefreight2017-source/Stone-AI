"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Heart, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TraitPicker, StylePicker, ExpertisePicker } from "@/components/bestie/PersonalityPicker";
import { toast } from "sonner";
import type { BestieTrait, BestieStyle, BestieExpertise } from "@/lib/bestie-validators";

function generatePreviewGreeting(bestieName: string, traits: BestieTrait[], style: BestieStyle): string {
  const greetings: Record<BestieStyle, (n: string) => string> = {
    casual: (n) =>
      `Hey! I'm ${n}, your new bestie! I'm so ready to hang out and chat about literally anything. What's on your mind today?`,
    supportive: (n) =>
      `Hi there! I'm ${n}, and I'm really glad to meet you. I'm here whenever you need someone to talk to, celebrate with, or just listen. How are you doing today?`,
    intellectual: (n) =>
      `Hello! I'm ${n} — your new thinking partner. I love exploring ideas and having meaningful conversations. What's been occupying your thoughts lately?`,
    hype: (n) =>
      `OMG HI!! I'm ${n} and I am SO excited to be your bestie!! You already seem amazing and I just KNOW we're going to have the best time. What's the latest?!`,
  };
  return greetings[style](bestieName);
}

const EMOJI_OPTIONS = [
  "\uD83D\uDC9C", "\uD83D\uDC96", "\u2764\uFE0F", "\uD83D\uDC99",
  "\uD83E\uDD70", "\u2728", "\uD83C\uDF1F", "\uD83E\uDD8B",
  "\uD83C\uDF38", "\uD83C\uDF19", "\u2600\uFE0F", "\uD83C\uDF3F",
  "\uD83D\uDD25", "\uD83D\uDCAB", "\uD83C\uDF08", "\uD83E\uDDE1",
];

export default function CreateBestiePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  // Step 1: Name & Avatar
  const [name, setName] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState("\uD83D\uDC9C");

  // Step 2: Personality
  const [traits, setTraits] = useState<BestieTrait[]>([]);
  const [style, setStyle] = useState<BestieStyle | null>(null);
  const [expertise, setExpertise] = useState<BestieExpertise[]>([]);

  const canNext1 = name.trim().length >= 2 && name.trim().length <= 20;
  const canNext2 = traits.length === 3 && style !== null && expertise.length >= 1;

  async function handleCreate() {
    if (!canNext2 || !style) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/bestie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          traits,
          style,
          expertise,
          avatarEmoji,
        }),
      });
      const data = await res.json();
      if (res.ok && data.bestie) {
        toast.success(`${name} is ready! Let's chat!`);
        // Create first conversation and redirect to chat
        const convRes = await fetch(`/api/bestie/${data.bestie.id}/conversations`, {
          method: "POST",
        });
        const convData = await convRes.json();
        if (convData.conversation) {
          router.push(`/app/bestie/chat/${convData.conversation.id}`);
        } else {
          router.push("/app/bestie");
        }
      } else {
        toast.error(data.error || "Could not create bestie");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-zinc-400 hover:text-white"
          onClick={() => (step > 1 ? setStep(step - 1) : router.push("/app/bestie"))}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-white">Create Your Bestie</h1>
          <p className="text-xs text-pink-400/70">Step {step} of 3</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${
              s <= step
                ? "bg-gradient-to-r from-pink-500 to-purple-500"
                : "bg-zinc-800"
            }`}
          />
        ))}
      </div>

      {/* Step 1: Name & Avatar */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-lg text-zinc-300">What should your Bestie be called?</p>
            <p className="text-sm text-zinc-500">Give them a name that feels right to you</p>
          </div>

          <div className="space-y-4">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Luna, Max, Sage, River..."
              maxLength={20}
              className="bg-zinc-800 border-zinc-700 text-white text-center text-lg h-14 placeholder:text-zinc-600"
              autoFocus
            />
            <p className="text-center text-xs text-zinc-500">{name.length}/20 characters</p>
          </div>

          <div>
            <p className="text-sm text-zinc-400 mb-3 text-center">Pick an avatar</p>
            <div className="grid grid-cols-8 gap-2 max-w-sm mx-auto">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatarEmoji(emoji)}
                  className={`h-10 w-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                    avatarEmoji === emoji
                      ? "bg-pink-500/20 border-2 border-pink-500 scale-110"
                      : "bg-zinc-800 border border-zinc-700 hover:border-pink-700"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={() => setStep(2)}
            disabled={!canNext1}
            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white h-12"
          >
            Next: Personality
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Step 2: Personality */}
      {step === 2 && (
        <div className="space-y-6">
          <TraitPicker selected={traits} onChange={setTraits} />
          <StylePicker selected={style} onChange={setStyle} />
          <ExpertisePicker selected={expertise} onChange={setExpertise} />

          <Button
            onClick={() => setStep(3)}
            disabled={!canNext2}
            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white h-12"
          >
            Next: Preview
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Step 3: Preview & Confirm */}
      {step === 3 && style && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="text-5xl">{avatarEmoji}</div>
            <h2 className="text-2xl font-bold text-white">{name}</h2>
            <div className="flex flex-wrap justify-center gap-1.5">
              {traits.map((t) => (
                <span key={t} className="px-2 py-0.5 text-xs rounded-full bg-pink-900/30 text-pink-300 border border-pink-800/50">
                  {t}
                </span>
              ))}
            </div>
            <p className="text-sm text-purple-400">
              {style === "casual" ? "BFF Vibes" : style === "supportive" ? "Life Coach" : style === "intellectual" ? "Mentor" : "Hype Squad"}
            </p>
          </div>

          {/* Preview greeting */}
          <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
            <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Preview greeting
            </p>
            <p className="text-zinc-200 text-sm leading-relaxed">
              {generatePreviewGreeting(name, traits, style)}
            </p>
          </div>

          <div className="space-y-2 text-xs text-zinc-500 text-center">
            <p>Your Bestie will remember your conversations and learn about you over time.</p>
            <p>You can always edit their personality later.</p>
          </div>

          <Button
            onClick={handleCreate}
            disabled={isCreating}
            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white h-14 text-lg"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Heart className="h-5 w-5 mr-2" />
                Create My Bestie
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
