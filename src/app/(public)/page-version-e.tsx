"use client";

/**
 * VERSION E — "The Cinematic" — Emotion-First, Premium Feel
 * Apple-style. Huge typography, dramatic spacing, scroll-driven reveals.
 * Each section is a full-viewport statement.
 * Accent: Cyan dominant (futuristic, premium)
 *
 * NOTE: metadata cannot be exported from a "use client" component in Next.js.
 * To use this version, import it in page.tsx or copy content to a server wrapper.
 */

import Link from "next/link";
import {
  ArrowRight,
  Shield,
  Star,
  Heart,
  Globe,
  Brain,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PricingSection } from "./pricing-section";
import {
  HeroSection,
  ScrollSection,
  AnimateOnScroll,
  StaggerGrid,
  StaggerCard,
} from "./animated-sections";
import { CountUp, PulseGlow } from "@/components/ui/animate";

/* ─── Testimonial (large format) ─── */
function CinematicTestimonial({
  quote,
  name,
  role,
}: {
  quote: string;
  name: string;
  role: string;
}) {
  return (
    <div className="text-center">
      <p className="text-lg sm:text-xl text-zinc-300 leading-relaxed mb-6 italic">
        &ldquo;{quote}&rdquo;
      </p>
      <div className="flex items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
          {name.charAt(0)}
        </div>
        <div className="text-left">
          <p className="text-white font-medium text-sm">{name}</p>
          <p className="text-zinc-500 text-xs">{role}</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */
export default function LandingPageE() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white scroll-smooth">
      {/* ── Floating Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/60 backdrop-blur-lg border-b border-zinc-800/30">
        <div className="flex items-center justify-between px-6 py-3 max-w-6xl mx-auto">
          <span className="text-lg font-bold">Stone AI&#8482;</span>
          <Button asChild size="sm" className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold">
            <Link href="/sign-up">Start Free</Link>
          </Button>
        </div>
      </nav>

      {/* ── Full-Screen Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <PulseGlow className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-cyan-500/[0.06] blur-[120px]" />
          <PulseGlow className="absolute top-1/2 left-1/3 w-[500px] h-[500px] rounded-full bg-blue-500/[0.04] blur-[100px]" />
        </div>

        <HeroSection>
          <div className="text-center max-w-4xl mx-auto relative z-10">
            <p className="text-sm tracking-[0.2em] uppercase text-cyan-400 mb-6 font-medium">
              The AI platform for builders
            </p>
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold tracking-tight leading-none mb-8">
              <span className="bg-gradient-to-r from-amber-400 via-cyan-400 to-cyan-300 bg-clip-text text-transparent">
                Your team
              </span>
              <br />
              <span className="text-white">is ready.</span>
            </h1>
            <p className="text-xl sm:text-2xl text-zinc-400 max-w-xl mx-auto mb-12 leading-relaxed">
              38 specialist agents. Local inference. From $0/month.
            </p>
            <Button asChild size="lg" className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-lg px-10">
              <Link href="/sign-up">
                Start Free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </HeroSection>
      </section>

      {/* ── Section 1: "Not a chatbot." ── */}
      <section className="min-h-[80vh] flex items-center px-6 py-24">
        <div className="max-w-5xl mx-auto w-full">
          <AnimateOnScroll direction="up">
            <p className="text-cyan-400 text-sm tracking-widest uppercase mb-4">
              Think bigger
            </p>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-8 max-w-3xl">
              ChatGPT gives you
              <br />
              one assistant.
              <br />
              <span className="text-cyan-400">We give you a department.</span>
            </h2>
            <div className="flex items-baseline gap-4 mt-12">
              <CountUp
                end={42}
                className="text-6xl sm:text-7xl font-bold text-white"
              />
              <p className="text-xl text-zinc-400">
                agents across 6 departments
              </p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ── Section 2: "Your data. Your rules." ── */}
      <section className="min-h-[80vh] flex items-center px-6 py-24">
        <div className="max-w-5xl mx-auto w-full">
          <AnimateOnScroll direction="up">
            <div className="text-right">
              <Shield className="h-20 w-20 text-cyan-400/30 ml-auto mb-8" />
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
                Your data.
                <br />
                <span className="text-cyan-400">Your rules.</span>
              </h2>
              <p className="text-xl text-zinc-400 max-w-lg ml-auto leading-relaxed">
                Local GPU inference. &lt;100ms response.
                <br />
                Your data never touches our servers.
              </p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ── Section 3: "Meet Bestie" ── */}
      <section className="min-h-[70vh] flex items-center px-6 py-24">
        <div className="max-w-4xl mx-auto text-center w-full">
          <AnimateOnScroll direction="up">
            <Heart className="h-12 w-12 text-pink-400 mx-auto mb-6" />
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              An AI companion that
              <br />
              <span className="text-pink-400">actually knows you.</span>
            </h2>
            <p className="text-zinc-400 text-lg mb-10 max-w-md mx-auto">
              Bestie adapts to your personality, remembers your conversations,
              and speaks your language.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { icon: Brain, label: "Remembers you" },
                { icon: Sparkles, label: "Adapts to your style" },
                { icon: Globe, label: "Cross-device" },
                { icon: Heart, label: "Your personality" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2"
                >
                  <Icon className="h-4 w-4 text-pink-400" />
                  <span className="text-sm text-zinc-300">{label}</span>
                </div>
              ))}
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ── Section 4: Social Proof ── */}
      <section className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <ScrollSection>
            <p className="text-center text-sm tracking-widest uppercase text-cyan-400 mb-12">
              What builders are saying
            </p>
          </ScrollSection>
          <StaggerGrid className="grid md:grid-cols-3 gap-10">
            <StaggerCard>
              <CinematicTestimonial
                quote="Stone AI replaced my entire freelance team. 38 agents, zero overhead. I shipped my MVP in a weekend."
                name="Alex Rivera"
                role="Solo Founder"
              />
            </StaggerCard>
            <StaggerCard>
              <CinematicTestimonial
                quote="The privacy angle is real. Local inference means our client data stays on our hardware. Compliance team loved it."
                name="Sarah Lin"
                role="CTO, FinTech Startup"
              />
            </StaggerCard>
            <StaggerCard>
              <CinematicTestimonial
                quote="Bestie is something else. It's like having a creative partner who actually remembers what you said last Tuesday."
                name="Marcus Webb"
                role="Content Agency Owner"
              />
            </StaggerCard>
          </StaggerGrid>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="px-6 py-16 max-w-6xl mx-auto">
        <ScrollSection>
          <PricingSection />
        </ScrollSection>
      </section>

      {/* ── Closer ── */}
      <section className="min-h-[60vh] flex items-center justify-center px-6 py-24 bg-black">
        <AnimateOnScroll direction="up">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-2xl sm:text-3xl text-zinc-400 mb-4">
              You came here looking for a tool.
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold mb-10">
              You found a <span className="text-cyan-400">team</span>.
            </h2>
            <Button asChild size="lg" className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-lg px-10">
              <Link href="/sign-up">
                Start Free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </AnimateOnScroll>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-800/60 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <span>&copy; {new Date().getFullYear()} Stone AI&#8482;. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/security" className="hover:text-white transition-colors">Security</Link>
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
