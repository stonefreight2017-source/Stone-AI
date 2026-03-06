"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Heart, Loader2, Sparkles, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TraitPicker, StylePicker, ExpertisePicker } from "@/components/bestie/PersonalityPicker";
import { toast } from "sonner";
import type { BestieTrait, BestieStyle, BestieExpertise, BestieLanguage } from "@/lib/bestie-validators";
import { BESTIE_LANGUAGES, BESTIE_LANGUAGE_LABELS } from "@/lib/bestie-validators";

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

  // Step 1: Name, Avatar & Language
  const [name, setName] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState("\uD83D\uDC9C");
  const [language, setLanguage] = useState<BestieLanguage>("en");

  // Step 2: Personality
  const [traits, setTraits] = useState<BestieTrait[]>([]);
  const [style, setStyle] = useState<BestieStyle | null>(null);
  const [expertise, setExpertise] = useState<BestieExpertise[]>([]);

  // Step 3: About Me — things a friend should know
  const [aboutName, setAboutName] = useState("");
  const [aboutBirthday, setAboutBirthday] = useState("");
  const [aboutSiblings, setAboutSiblings] = useState("");
  const [aboutLocation, setAboutLocation] = useState("");
  const [aboutFavorites, setAboutFavorites] = useState("");
  const [aboutOther, setAboutOther] = useState("");

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
          language,
          aboutMe: {
            name: aboutName.trim() || undefined,
            birthday: aboutBirthday.trim() || undefined,
            siblings: aboutSiblings.trim() || undefined,
            location: aboutLocation.trim() || undefined,
            favorites: aboutFavorites.trim() || undefined,
            other: aboutOther.trim() || undefined,
          },
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
          <p className="text-xs text-pink-400/70">Step {step} of 4</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((s) => (
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

          {/* Language picker */}
          <div>
            <p className="text-sm text-zinc-400 mb-3 text-center flex items-center justify-center gap-1.5">
              <Globe className="h-4 w-4" />
              What language should {name || "your Bestie"} speak?
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-w-md mx-auto">
              {BESTIE_LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`p-2.5 rounded-lg text-center transition-all ${
                    language === lang
                      ? "bg-pink-500/20 border-2 border-pink-500"
                      : "bg-zinc-800 border border-zinc-700 hover:border-pink-700"
                  }`}
                >
                  <p className="text-[10px] font-bold text-pink-400">{lang.toUpperCase()}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{BESTIE_LANGUAGE_LABELS[lang]}</p>
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
            Next: About You
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Step 3: About Me — things a friend should know */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-lg text-zinc-300">Tell {name} about yourself</p>
            <p className="text-sm text-zinc-500">Things a friend should know. All fields are optional.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Your name</label>
              <Input
                value={aboutName}
                onChange={(e) => setAboutName(e.target.value)}
                placeholder="What should they call you?"
                maxLength={50}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Birthday</label>
              <Input
                value={aboutBirthday}
                onChange={(e) => setAboutBirthday(e.target.value)}
                placeholder="e.g. March 15, July 4th"
                maxLength={20}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Siblings</label>
              <Input
                value={aboutSiblings}
                onChange={(e) => setAboutSiblings(e.target.value)}
                placeholder="e.g. 2 brothers, 1 sister"
                maxLength={100}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Where you live</label>
              <Input
                value={aboutLocation}
                onChange={(e) => setAboutLocation(e.target.value)}
                placeholder="e.g. Austin, Texas"
                maxLength={100}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Favorites</label>
              <Input
                value={aboutFavorites}
                onChange={(e) => setAboutFavorites(e.target.value)}
                placeholder="e.g. Coffee, hip-hop, sci-fi movies"
                maxLength={200}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Anything else they should know</label>
              <Textarea
                value={aboutOther}
                onChange={(e) => setAboutOther(e.target.value)}
                placeholder="Night owl, dog person, learning guitar..."
                maxLength={500}
                rows={3}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 resize-none"
              />
            </div>
          </div>

          <Button
            onClick={() => setStep(4)}
            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white h-12"
          >
            Next: Preview
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Step 4: Preview & Confirm */}
      {step === 4 && style && (
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
            <p className="text-xs text-zinc-500 flex items-center justify-center gap-1">
              <Globe className="h-3 w-3" />
              Speaks {BESTIE_LANGUAGE_LABELS[language]}
            </p>
          </div>

          {/* About Me summary */}
          {(aboutName || aboutBirthday || aboutSiblings || aboutLocation || aboutFavorites || aboutOther) && (
            <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
              <p className="text-xs text-pink-400 font-medium mb-2">What {name} knows about you:</p>
              <div className="space-y-1 text-xs text-zinc-400">
                {aboutName && <p>Name: <span className="text-zinc-300">{aboutName}</span></p>}
                {aboutBirthday && <p>Birthday: <span className="text-zinc-300">{aboutBirthday}</span></p>}
                {aboutSiblings && <p>Siblings: <span className="text-zinc-300">{aboutSiblings}</span></p>}
                {aboutLocation && <p>Location: <span className="text-zinc-300">{aboutLocation}</span></p>}
                {aboutFavorites && <p>Favorites: <span className="text-zinc-300">{aboutFavorites}</span></p>}
                {aboutOther && <p>Other: <span className="text-zinc-300">{aboutOther}</span></p>}
              </div>
            </div>
          )}

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
