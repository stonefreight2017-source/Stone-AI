import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <nav aria-label="Page navigation" className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
        <Link href="/" className="text-xl font-bold">Stone AI™</Link>
        <Link href="/" className="text-sm text-zinc-400 hover:text-white flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </nav>

      <main id="main-content" className="px-6 py-12 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-zinc-400 text-sm mb-10">Last updated: March 13, 2026</p>

        <div className="prose prose-invert prose-zinc max-w-none space-y-8 text-sm text-zinc-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white">1. Overview</h2>
            <p>
              Stone AI (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your privacy. This policy explains
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
            <p><strong className="text-white">Bestie Companion Data:</strong> AI Bestie personality configurations (traits, communication style, expertise areas), Bestie conversation memories (AI-generated summaries of past interactions), and Bestie usage statistics. Bestie memories are stored as key-value data linked to your Bestie profile and may be inaccurate. You can delete Bestie memories at any time through Settings.</p>
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
              When you use Smart mode or when auto-routing selects it, your message may be sent to Anthropic&apos;s
              Claude API for processing. Anthropic&apos;s data usage policies apply to these requests. Anthropic&apos;s API
              does not use your data for training by default. You can always use Local mode instead if you prefer
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
            <h2 className="text-lg font-semibold text-white">4A. NY SHIELD Act Compliance</h2>
            <p>
              Stone AI maintains a data security program that includes reasonable administrative, technical, and physical safeguards to protect the security, confidentiality, and integrity of personal information of New York residents, as required by the New York SHIELD Act (N.Y. Gen. Bus. Law §899-bb).
            </p>
            <p>
              <strong className="text-white">Administrative safeguards:</strong> Designated personnel responsible for security program coordination, risk assessments, and vendor security evaluation.
            </p>
            <p>
              <strong className="text-white">Technical safeguards:</strong> AES-256-GCM encryption at rest, TLS 1.2+ encryption in transit, API key hashing, rate limiting, security audit logging, CSP headers, input sanitization, and regular security reviews.
            </p>
            <p>
              <strong className="text-white">Physical safeguards:</strong> Access controls to physical infrastructure, secure data center hosting (via Vercel/Neon), and disposal procedures for data-bearing equipment.
            </p>
            <p>
              <strong className="text-white">Breach notification:</strong> In the event of a data breach affecting personal information of New York residents, Stone AI will notify affected individuals in the most expedient time possible and without unreasonable delay, consistent with any law enforcement investigation needs. If a breach affects more than 500 New York residents, Stone AI will also notify the New York Attorney General within 10 business days.
            </p>
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
              <li>To personalize your experience, including the display of contextually relevant content and advertisements on ad-supported tiers</li>
              <li>To generate anonymized, aggregated interest segments based on usage patterns for service optimization and advertising relevance</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">6. Advertising and Sponsored Content</h2>
            <p>
              Stone AI offers both ad-supported and ad-free subscription tiers. On ad-supported tiers (including the
              Free tier), the Service may display contextual advertisements and sponsored content. These ads are
              selected based on anonymized interest categories derived from your usage of the Service, such as
              conversation topics, agent categories used, and general engagement patterns.
            </p>
            <p>
              We do not sell personally identifiable information (PII) to advertisers. Advertising partners may
              receive anonymized, aggregated audience segment data to deliver relevant ads. Paid subscription tiers
              receive an ad-free experience. By using the Service, you consent to the display of advertisements on
              ad-supported tiers as described in this policy.
            </p>
            <p>
              We may use third-party advertising services (such as Google AdSense) to serve ads. These services
              may use cookies and similar technologies as described in their own privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">7. What We Do NOT Do</h2>
            <ul className="list-disc pl-6 space-y-1 text-zinc-400">
              <li>We do NOT sell your personally identifiable information to third parties</li>
              <li>We do NOT use your conversations to train AI models</li>
              <li>We do NOT share your conversation content with advertisers</li>
              <li>We do NOT track you across other websites</li>
              <li>We do NOT store your payment card details (Stripe handles this)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">8. AI Companion (Bestie) Data</h2>
            <p>
              AI Bestie companions store personalization data to improve your experience. This includes:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-zinc-400">
              <li>Personality configuration (traits, communication style, expertise areas) — stored as structured JSON</li>
              <li>Conversation memories — AI-generated summaries extracted from your conversations to enable continuity across sessions</li>
              <li>Conversation history — full message logs stored the same way as standard chat conversations</li>
            </ul>
            <p>
              <strong className="text-white">HIPAA Exclusion:</strong> Stone AI is NOT a &quot;covered entity&quot; or &quot;business associate&quot; as
              defined under the Health Insurance Portability and Accountability Act (HIPAA). AI Bestie conversations are
              NOT protected health information (PHI). We do NOT provide healthcare services, medical treatment, therapy,
              counseling, or any form of clinical care. Do NOT share sensitive health information, medical records, diagnoses,
              treatment plans, or prescription details in Bestie conversations. Stone AI assumes no responsibility for the
              confidentiality of health-related information voluntarily shared in conversations beyond the protections described
              in this Privacy Policy.
            </p>
            <p>
              <strong className="text-white">Bestie Memory Accuracy:</strong> Bestie memories are AI-generated and may contain
              inaccuracies or misinterpretations. They do not constitute a factual record of your conversations. You may
              delete Bestie memory data at any time through your account Settings or by deleting the Bestie profile.
            </p>
          </section>

          <section className="border border-amber-500/30 bg-amber-500/5 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-amber-400">⚠ HIPAA / Protected Health Information (PHI) Disclaimer</h2>
            <p className="mt-2">
              <strong className="text-white">Stone AI does not support HIPAA-regulated workflows and should not be used to store,
              process, or transmit protected health information (PHI).</strong> Users are responsible for ensuring that uploaded
              data does not contain regulated or sensitive information including PHI, financial records, or
              government-protected data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">9. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc pl-6 space-y-1 text-zinc-400">
              <li><strong className="text-zinc-300">Clerk</strong> — authentication and user management</li>
              <li><strong className="text-zinc-300">Stripe</strong> — payment processing and subscription billing</li>
              <li><strong className="text-zinc-300">Anthropic</strong> — cloud AI inference (Smart mode only, Smart and Pro tiers)</li>
              <li><strong className="text-zinc-300">Google AdSense</strong> — contextual advertising on ad-supported tiers</li>
              <li><strong className="text-zinc-300">Vercel</strong> — web application hosting and serverless functions (processes all HTTP traffic)</li>
              <li><strong className="text-zinc-300">Neon</strong> — managed PostgreSQL database hosting (stores all user data)</li>
              <li><strong className="text-zinc-300">Cloudflare</strong> — DNS, CDN, DDoS protection, and SSL/TLS termination (processes all network traffic)</li>
            </ul>
            <p>Each service has its own privacy policy. We recommend reviewing them.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">10. Data Retention</h2>
            <p>
              Conversation data is retained as long as your account is active. You can delete individual
              conversations at any time. Forum posts remain visible unless deleted by you or a moderator.
              Upon account deletion, all your data (conversations, agent memories, forum posts, usage records)
              is permanently deleted within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">11. Your Rights</h2>
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
            <h2 className="text-lg font-semibold text-white">12. Cookies and Tracking Technologies</h2>
            <p>
              We use essential cookies required for authentication and session management (provided by Clerk).
              On ad-supported tiers, third-party advertising services may set additional cookies to deliver
              relevant advertisements and measure ad performance. These cookies help ensure you see content
              that is relevant to your interests. For details on third-party cookies, please refer to the
              respective privacy policies of our advertising partners.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">13. Children&apos;s Privacy</h2>
            <p>
              Stone AI is not intended for users under 18 years of age. We do not knowingly collect data
              from minors. If we learn that we have collected data from a minor, we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">14. California Privacy Rights (CCPA/CPRA)</h2>
            <p>
              If you are a California resident, you have the right to request disclosure of the categories of
              personal information we collect, the purposes for which it is used, and the categories of third
              parties with whom it is shared. You may also request deletion of your personal information and
              opt out of the sale or sharing of personal information. We will respond to verified requests within 45 days.
            </p>
            <p>
              <strong className="text-white">Do Not Sell or Share My Personal Information:</strong> Stone AI uses contextual advertising on ad-supported tiers via Google AdSense, which may constitute &quot;sharing&quot; of personal information under the CCPA/CPRA. You have the right to opt out. To exercise this right, visit the Privacy Choices section in your account Settings, use the &quot;Do Not Sell or Share My Personal Information&quot; link in our site footer, or contact us at support@stone-ai.net.
            </p>
            <p>
              <strong className="text-white">Categories of Personal Information Collected:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-1 text-zinc-400">
              <li><strong className="text-zinc-300">Identifiers:</strong> Email address, name, Clerk user ID, Stripe customer ID</li>
              <li><strong className="text-zinc-300">Commercial information:</strong> Subscription tier, payment history, purchase records</li>
              <li><strong className="text-zinc-300">Internet or electronic network activity:</strong> Usage data, message counts, token usage, feature usage statistics, conversation metadata</li>
              <li><strong className="text-zinc-300">Inferences:</strong> Anonymized interest segments derived from usage patterns for advertising relevance</li>
            </ul>
            <p>
              <strong className="text-white">Purposes of Collection:</strong> To provide and improve the Service, process payments, enforce usage limits, personalize your experience, display contextual advertisements on ad-supported tiers, respond to support inquiries, and comply with legal obligations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">15. European Privacy Rights (GDPR)</h2>
            <p>
              If you are located in the European Economic Area (EEA), United Kingdom, or Switzerland, the following additional provisions apply:
            </p>
            <p>
              <strong className="text-white">Legal Basis for Processing:</strong> We process your personal data on the following legal bases: (a) Contract performance — to provide the Service you subscribed to; (b) Legitimate interests — to improve our Service, prevent fraud, and ensure security; (c) Consent — for optional features such as marketing communications and non-essential cookies; (d) Legal obligation — to comply with applicable laws.
            </p>
            <p>
              <strong className="text-white">Your Rights Under GDPR:</strong> In addition to the rights listed in Section 11, you have the right to: lodge a complaint with your local data protection authority (supervisory authority); request data portability (receive your data in a structured, commonly used, machine-readable format); restrict processing of your personal data; and object to processing based on legitimate interests.
            </p>
            <p>
              <strong className="text-white">International Data Transfers:</strong> Your data may be transferred to and processed in the United States. We rely on Standard Contractual Clauses (SCCs) approved by the European Commission as our data transfer mechanism to ensure adequate protection of your data in accordance with GDPR Article 46.
            </p>
            <p>
              <strong className="text-white">Data Controller:</strong> Stone AI, 4879 State Hwy 30, #183, Amsterdam, NY 12010, USA. For GDPR inquiries, contact privacy@stone-ai.net.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">16. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. Material changes will be communicated
              via email at least 14 days before taking effect. The &quot;last updated&quot; date at the top of this
              page indicates when the policy was last revised.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">17. Contact</h2>
            <p>
              For privacy-related questions or data requests, contact us at privacy@stone-ai.net or support@stone-ai.net.
            </p>
            <p>
              Stone AI, 4879 State Hwy 30, #183, Amsterdam, NY 12010.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
