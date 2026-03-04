import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <nav className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
        <Link href="/" className="text-xl font-bold">Stone AI™</Link>
        <Link href="/" className="text-sm text-zinc-400 hover:text-white flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </nav>

      <main className="px-6 py-12 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-zinc-500 text-sm mb-10">Last updated: March 3, 2026</p>

        <div className="prose prose-invert prose-zinc max-w-none space-y-8 text-sm text-zinc-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white">1. Overview</h2>
            <p>
              Stone AI ("we", "us", "our") is committed to protecting your privacy. This policy explains
              what data we collect, how we use it, and your rights regarding your information. Stone AI
              is designed with a local-first architecture — on our Free and Starter plans, your
              conversations are processed entirely on local hardware and never sent to third-party AI providers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">2. Data We Collect</h2>
            <p><strong className="text-white">Account Information:</strong> Email address, name (optional), and authentication data provided through Clerk (our authentication provider).</p>
            <p><strong className="text-white">Conversation Data:</strong> Messages you send and AI responses generated during chat sessions. This includes message content, timestamps, and token usage counts.</p>
            <p><strong className="text-white">Usage Data:</strong> Daily message counts, token usage, feature usage statistics, and subscription status.</p>
            <p><strong className="text-white">Payment Data:</strong> Subscription and billing information is processed and stored by Stripe. We store only your Stripe customer ID and subscription ID — never your card number or banking details.</p>
            <p><strong className="text-white">Forum Content:</strong> Posts, replies, and likes you create in the community forum.</p>
            <p><strong className="text-white">Feedback:</strong> Messages you submit through the Help & Support feedback form.</p>
            <p><strong className="text-white">Agent Memory:</strong> Key-value pairs that AI agents store to remember your preferences across sessions.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">3. How Your Data Is Processed</h2>
            <p><strong className="text-white">Local Mode (Free, Starter, Plus plans default):</strong></p>
            <p>
              Your messages are sent to our local inference server running on our own hardware. The AI model
              processes your message and generates a response entirely on our infrastructure. Your conversation
              data is never sent to OpenAI, Google, Anthropic, or any third-party AI provider. This is true
              local-first AI.
            </p>
            <p><strong className="text-white">Smart Mode (Smart and Pro plans):</strong></p>
            <p>
              When you use Smart mode or when auto-routing selects it, your message may be sent to OpenAI's
              GPT-4o API for processing. OpenAI's data usage policies apply to these requests. OpenAI's API
              does not use your data for training. You can always use Local mode instead if you prefer
              complete data sovereignty.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">4. Data Storage and Security</h2>
            <p>
              All data is stored in our PostgreSQL database with the following protections:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-zinc-400">
              <li>AES-256-GCM encryption for sensitive data at rest</li>
              <li>TLS 1.2+ encryption for all data in transit</li>
              <li>API keys stored as salted hashes (never in plaintext)</li>
              <li>Rate limiting on all endpoints to prevent abuse</li>
              <li>Security audit logging for access and authentication events</li>
              <li>Enterprise security headers (CSP, HSTS, X-Frame-Options)</li>
              <li>Input sanitization on all user-submitted content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">5. How We Use Your Data</h2>
            <ul className="list-disc pl-6 space-y-1 text-zinc-400">
              <li>To provide the AI chat service and generate responses to your messages</li>
              <li>To enforce usage limits based on your subscription tier</li>
              <li>To process payments and manage your subscription</li>
              <li>To display your forum posts and replies to other users</li>
              <li>To allow AI agents to remember your preferences (agent memory)</li>
              <li>To improve the Service (aggregated, anonymized usage statistics only)</li>
              <li>To respond to your support inquiries and feedback</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">6. What We Do NOT Do</h2>
            <ul className="list-disc pl-6 space-y-1 text-zinc-400">
              <li>We do NOT sell your data to third parties</li>
              <li>We do NOT use your conversations to train AI models</li>
              <li>We do NOT share your data with advertisers</li>
              <li>We do NOT track you across other websites</li>
              <li>We do NOT store your payment card details (Stripe handles this)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">7. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc pl-6 space-y-1 text-zinc-400">
              <li><strong className="text-zinc-300">Clerk</strong> — authentication and user management</li>
              <li><strong className="text-zinc-300">Stripe</strong> — payment processing and subscription billing</li>
              <li><strong className="text-zinc-300">OpenAI</strong> — cloud AI inference (Smart mode only, Smart and Pro tiers)</li>
            </ul>
            <p>Each service has its own privacy policy. We recommend reviewing them.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">8. Data Retention</h2>
            <p>
              Conversation data is retained as long as your account is active. You can delete individual
              conversations at any time. Forum posts remain visible unless deleted by you or a moderator.
              Upon account deletion, all your data (conversations, agent memories, forum posts, usage records)
              is permanently deleted within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">9. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1 text-zinc-400">
              <li>Access your data (available in Settings and through conversation export)</li>
              <li>Delete your conversations at any time</li>
              <li>Delete your account and all associated data</li>
              <li>Export your conversation data (Plus plan and above)</li>
              <li>Opt out of Smart mode to keep all data local</li>
              <li>Request a copy of all data we hold about you</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">10. Cookies</h2>
            <p>
              We use only essential cookies required for authentication and session management (provided by
              Clerk). We do not use advertising cookies, analytics cookies, or third-party tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">11. Children's Privacy</h2>
            <p>
              Stone AI is not intended for users under 18 years of age. We do not knowingly collect data
              from minors. If we learn that we have collected data from a minor, we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">12. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. Material changes will be communicated
              via email at least 14 days before taking effect. The "last updated" date at the top of this
              page indicates when the policy was last revised.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">13. Contact</h2>
            <p>
              For privacy-related questions or data requests, contact us at support@stone-ai.net.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
