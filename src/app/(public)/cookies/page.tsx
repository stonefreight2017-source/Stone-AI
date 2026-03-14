import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy | Stone AI",
  description: "How Stone AI uses cookies and similar technologies to provide and improve the service.",
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <nav aria-label="Page navigation" className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
        <Link href="/" className="text-xl font-bold">Stone AI&trade;</Link>
        <Link href="/" className="text-sm text-zinc-400 hover:text-white flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </nav>

      <main id="main-content" className="px-6 py-12 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Cookie Policy</h1>
        <p className="text-zinc-400 text-sm mb-10">Last updated: March 7, 2026</p>

        <div className="prose prose-invert prose-zinc max-w-none space-y-8 text-sm text-zinc-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white">1. What Are Cookies</h2>
            <p>
              Cookies are small text files stored on your device when you visit a website. They help
              the site remember your preferences, keep you signed in, and understand how you use the
              service. Stone AI uses a minimal number of cookies — only what&apos;s necessary to make the
              platform work well.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">2. Cookies We Use</h2>
            <p>Here&apos;s exactly what we set and why:</p>

            <div className="mt-4 space-y-4">
              <div>
                <p><strong className="text-white">Authentication Cookies (Essential)</strong></p>
                <p>
                  Set by Clerk, our authentication provider. These keep you signed in and secure your
                  session. Without them, you&apos;d have to log in on every page load. These are strictly
                  necessary and cannot be disabled.
                </p>
              </div>

              <div>
                <p><strong className="text-white">Preference Cookies (Functional)</strong></p>
                <p>
                  Store your UI preferences like theme selection, sidebar state, and language settings.
                  These make the app feel like yours. They&apos;re stored locally and never sent to third parties.
                </p>
              </div>

              <div>
                <p><strong className="text-white">Analytics Cookies (Performance)</strong></p>
                <p>
                  Help us understand how people use Stone AI so we can improve the experience. We collect
                  anonymized usage data — things like which features are popular, page load times, and
                  general navigation patterns. We do not track you across other websites.
                </p>
              </div>

              <div>
                <p><strong className="text-white">Advertising Cookies (Ad-Supported Tiers Only)</strong></p>
                <p>
                  On ad-supported tiers (including the Free tier), third-party advertising services may set
                  cookies to deliver relevant ads and measure ad performance. Paid subscription tiers are
                  ad-free and do not receive advertising cookies. See our{" "}
                  <Link href="/privacy" className="text-emerald-400 underline">Privacy Policy</Link>{" "}
                  for details on advertising data practices.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">3. Third-Party Cookies</h2>
            <p>
              The following third-party services may set cookies when you use Stone AI:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-zinc-400">
              <li><strong className="text-zinc-300">Clerk</strong> — session management and authentication</li>
              <li><strong className="text-zinc-300">Stripe</strong> — payment processing (only during checkout)</li>
              <li><strong className="text-zinc-300">Cloudflare</strong> — security and performance optimization</li>
            </ul>
            <p>
              Each of these services operates under its own privacy and cookie policies. We recommend
              reviewing them if you want the full picture.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">4. Managing Cookies</h2>
            <p>
              You can control cookies through your browser settings. Most browsers let you block or
              delete cookies, and you can usually set preferences for specific sites. Here&apos;s how:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-zinc-400">
              <li><strong className="text-zinc-300">Chrome:</strong> Settings &gt; Privacy and Security &gt; Cookies</li>
              <li><strong className="text-zinc-300">Firefox:</strong> Settings &gt; Privacy &amp; Security &gt; Cookies</li>
              <li><strong className="text-zinc-300">Safari:</strong> Preferences &gt; Privacy &gt; Manage Website Data</li>
              <li><strong className="text-zinc-300">Edge:</strong> Settings &gt; Privacy &gt; Cookies</li>
            </ul>
            <p>
              Keep in mind: blocking essential cookies (authentication) will prevent you from signing in
              to Stone AI. The platform requires these to function.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">5. Updates to This Policy</h2>
            <p>
              If we change how we use cookies, we&apos;ll update this page and the &quot;last updated&quot; date above.
              For material changes, we&apos;ll notify you via email or in-app notification.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">6. Contact</h2>
            <p>
              Questions about cookies? Reach us at{" "}
              <a href="mailto:support@stone-ai.net" className="text-emerald-400 underline">support@stone-ai.net</a>.
            </p>
          </section>

          <section className="border-t border-zinc-800 pt-6 text-zinc-400">
            <p>
              See also: <Link href="/terms" className="text-emerald-400 underline">Terms of Service</Link>{" · "}
              <Link href="/privacy" className="text-emerald-400 underline">Privacy Policy</Link>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
