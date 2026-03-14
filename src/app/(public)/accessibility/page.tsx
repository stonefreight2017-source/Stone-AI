import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accessibility Statement | Stone AI",
  description: "Stone AI's commitment to digital accessibility for people with disabilities.",
};

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <nav aria-label="Page navigation" className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
        <Link href="/" className="text-xl font-bold">Stone AI&trade;</Link>
        <Link href="/" className="text-sm text-zinc-400 hover:text-white flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </nav>

      <main id="main-content" className="px-6 py-12 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Accessibility Statement</h1>
        <p className="text-zinc-400 text-sm mb-10">Last updated: March 13, 2026</p>

        <div className="prose prose-invert prose-zinc max-w-none space-y-8 text-sm text-zinc-300 leading-relaxed">
          <section>
            <p>
              Stone AI is committed to ensuring digital accessibility for people with disabilities.
              We are continually improving the user experience for everyone and applying the relevant
              accessibility standards.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Conformance Status</h2>
            <p>
              We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA.
              These guidelines explain how to make web content more accessible for people with
              disabilities and more user-friendly for everyone.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Measures Taken</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Semantic HTML markup throughout the application</li>
              <li>Keyboard navigation support for all interactive elements</li>
              <li>Color contrast ratios meeting WCAG AA standards</li>
              <li>ARIA attributes for dynamic content and interactive components</li>
              <li>Responsive design supporting zoom up to 200%</li>
              <li>Text alternatives for non-text content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Known Limitations</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Some third-party embedded content (advertisements, payment forms) may not fully meet accessibility standards</li>
              <li>Real-time AI chat responses may not always be announced by screen readers immediately</li>
              <li>Some data visualization components may lack full text alternatives</li>
            </ul>
            <p className="mt-3">
              We are actively working to identify and remediate accessibility barriers across the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Feedback</h2>
            <p>
              We welcome your feedback on the accessibility of Stone AI. If you encounter accessibility
              barriers or have suggestions for improvement, please contact us:
            </p>
            <ul className="list-none pl-0 space-y-1 mt-3">
              <li><strong className="text-white">Email:</strong> accessibility@stone-ai.net</li>
              <li><strong className="text-white">Mail:</strong> Stone AI, 4879 State Hwy 30, #183, Amsterdam, NY 12010</li>
            </ul>
            <p className="mt-3">
              We aim to respond to accessibility feedback within 5 business days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Enforcement</h2>
            <p>This statement was last reviewed on March 13, 2026.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
