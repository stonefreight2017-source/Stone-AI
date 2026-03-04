import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <nav className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
        <Link href="/" className="text-xl font-bold">Stone AI™</Link>
        <Link href="/" className="text-sm text-zinc-400 hover:text-white flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </nav>

      <main className="px-6 py-12 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-zinc-500 text-sm mb-10">Last updated: March 4, 2026</p>

        <div className="prose prose-invert prose-zinc max-w-none space-y-8 text-sm text-zinc-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white">1. Agreement to Terms</h2>
            <p>
              By accessing or using Stone AI ("the Service"), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, do not use the Service. The Service is operated by Stone AI ("we", "us", "our").
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">2. Description of Service</h2>
            <p>
              Stone AI is an AI-powered platform that provides conversational AI chat, specialized AI agents,
              a community forum, and API access. The Service offers both local AI inference (processed on our
              hardware) and cloud AI inference (processed via third-party providers like OpenAI) depending on
              your subscription tier and settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">3. Account Registration</h2>
            <p>
              You must create an account to use the Service. You are responsible for maintaining the security
              of your account credentials. You must provide accurate information during registration. You must
              be at least 18 years old to use the Service. One person may not maintain more than one account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">4. Subscription Plans and Billing</h2>
            <p>
              Stone AI offers free and paid subscription tiers. Paid subscriptions are billed through
              Stripe on a monthly, semi-annual, or annual basis depending on the billing period you select.
              By subscribing to a paid plan, you authorize us to charge your payment method on a
              recurring basis. You may cancel your subscription at any time through the billing portal.
              Cancellations take effect at the end of the current billing period. No refunds are provided
              for partial billing periods. We reserve the right to change pricing with 30 days notice.
            </p>
            <p>
              Free trial periods may be offered at our discretion. Free trials are limited to one per account.
              Enhanced free trials that require a payment method will automatically convert to a paid subscription
              at the end of the trial period unless canceled before the trial ends. You will not be charged
              during the trial period.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">5. Advertising and Sponsored Content</h2>
            <p>
              The Service may display advertisements, sponsored content, and promotional materials on
              ad-supported tiers, including the Free tier. By using the Service, you acknowledge and consent
              to the display of such content as part of the ad-supported experience. Paid subscription tiers
              provide an ad-free experience. We reserve the right to determine the placement, format, and
              frequency of advertising content. Advertisements may be contextually targeted based on
              anonymized usage patterns as described in our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">6. Usage Limits</h2>
            <p>
              Each subscription tier has defined usage limits including daily messages, monthly tokens,
              concurrent requests, and response length. Exceeding these limits may result in temporary
              throttling until the next reset period. Usage limits reset daily (messages) and monthly (tokens)
              based on UTC time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">7. AI Agents</h2>
            <p>
              AI agents are specialized conversational assistants with domain-specific knowledge. Agent
              availability depends on your subscription tier. Agents provide informational guidance only
              and do not constitute professional advice. You should not rely on agent output as a substitute
              for qualified professional counsel in legal, medical, financial, engineering, or compliance matters.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">8. API Access and Reselling</h2>
            <p>
              API access is available on the Pro plan. You may use the API to build products and services,
              including reselling AI capabilities to your own customers. API usage is subject to the same
              rate limits as your subscription tier. You are responsible for your end users' compliance with
              these terms. You may not misrepresent AI-generated output as human-created. You may not use
              the API for illegal purposes, spam, or generating harmful content.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">9. Community Forum</h2>
            <p>
              The community forum is provided for users to share tips, ask questions, and interact with
              each other. You retain ownership of content you post. By posting, you grant Stone AI a
              non-exclusive license to display your content on the platform. You may not post content that
              is illegal, harassing, defamatory, or violates the rights of others. We reserve the right to
              remove content and suspend accounts that violate these guidelines. Moderators may pin, lock,
              or remove posts at their discretion.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">10. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1 text-zinc-400">
              <li>Use the Service to generate illegal, harmful, or deceptive content</li>
              <li>Attempt to bypass rate limits, security measures, or access controls</li>
              <li>Reverse engineer, decompile, or extract the AI models</li>
              <li>Use automated tools to scrape or bulk-access the Service</li>
              <li>Share your account credentials or API keys with unauthorized parties</li>
              <li>Impersonate other users or Stone AI staff</li>
              <li>Upload malicious code, viruses, or exploit vulnerabilities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">11. Intellectual Property</h2>
            <p>
              You own the content you create using the Service, including AI-generated outputs produced
              from your prompts. Stone AI retains ownership of the platform, AI models, agent configurations,
              knowledge bases, and all underlying technology. You may not copy, redistribute, or sell
              Stone AI's proprietary technology.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">12. Disclaimers</h2>
            <p>
              The Service is provided "as is" without warranties of any kind. AI-generated content may
              contain errors, inaccuracies, or biases. Stone AI does not guarantee the accuracy, completeness,
              or reliability of any AI output. The Service is not a substitute for professional advice.
              We are not liable for decisions made based on AI-generated content.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">13. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Stone AI shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages, including loss of profits, data,
              or business opportunities, arising from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">14. Account Termination</h2>
            <p>
              We may suspend or terminate your account for violations of these terms, abusive behavior,
              or non-payment. You may delete your account at any time by contacting support. Upon termination,
              your data will be deleted within 30 days, except as required by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">15. Changes to Terms</h2>
            <p>
              We may update these terms at any time. Material changes will be communicated via email or
              in-app notification at least 14 days before taking effect. Continued use of the Service after
              changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">16. Contact</h2>
            <p>
              For questions about these terms, contact us at support@stone-ai.net.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
