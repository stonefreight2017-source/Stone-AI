"use client";

import { AnimateOnScroll, StaggerChildren, StaggerItem, FadeIn, SlideUp, PulseGlow } from "@/components/ui/animate";

// Re-export everything for use in the landing page
export { AnimateOnScroll, StaggerChildren, StaggerItem, FadeIn, SlideUp, PulseGlow };

// Hero animation wrapper — immediate animation on load
export function HeroSection({ children }: { children: React.ReactNode }) {
  return (
    <FadeIn>
      <SlideUp delay={0.2}>
        {children}
      </SlideUp>
    </FadeIn>
  );
}

// Section animation — triggers when scrolled into view
export function ScrollSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <AnimateOnScroll delay={delay} className={className}>
      {children}
    </AnimateOnScroll>
  );
}

// Grid items that stagger in one by one
export function StaggerGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <StaggerChildren className={className} staggerDelay={0.1}>
      {children}
    </StaggerChildren>
  );
}

export function StaggerCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <StaggerItem className={className}>
      {children}
    </StaggerItem>
  );
}

// Ambient glow behind hero
export function HeroGlow() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <PulseGlow className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-3xl" />
      <PulseGlow className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-3xl" />
    </div>
  );
}
