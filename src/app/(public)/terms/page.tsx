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
              By accessing or using Stone AI, Best AI, My Best AI, or any related services, applications, APIs, or websites
              (collectively, &quot;the Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;).
              If you do not agree to these Terms, do not use the Service. The Service is owned and operated by
              Stone AI (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;, &quot;Company&quot;). These Terms constitute a legally binding
              agreement between you (&quot;User&quot;, &quot;you&quot;, &quot;your&quot;) and Stone AI.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">2. Description of Service</h2>
            <p>
              Stone AI is an AI-powered platform that provides conversational AI chat, specialized AI agents,
              AI companion (&quot;Bestie&quot;) features, a community forum, and API access. The Service offers both local AI inference
              (processed on our hardware) and cloud AI inference (processed via third-party providers) depending on
              your subscription tier and settings. &quot;Best AI&quot; and &quot;My Best AI&quot; are companion products and extensions
              of the Stone AI platform, subject to these same Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">3. Account Registration</h2>
            <p>
              You must create an account to use the Service. You are responsible for maintaining the security
              of your account credentials and for all activity that occurs under your account. You must provide accurate,
              current, and complete information during registration. You must be at least 18 years old to use the Service.
              One person may not maintain more than one account. Sharing accounts is prohibited and may result in
              immediate termination without refund.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">4. Subscription Plans and Billing</h2>
            <p>
              Stone AI offers free and paid subscription tiers. Paid subscriptions are billed through
              Stripe on a monthly, semi-annual, or annual basis depending on the billing period you select.
              By subscribing to a paid plan, you authorize us to charge your payment method on a
              recurring basis. You may cancel your subscription at any time through the billing portal.
              Cancellations take effect at the end of the current billing period. <strong className="text-white">No refunds are provided
              for partial billing periods, unused credits, or tier downgrades.</strong> We reserve the right to change pricing
              with 30 days notice to existing subscribers; new subscribers are subject to current pricing.
            </p>
            <p>
              Free trial periods may be offered at our discretion. Free trials are limited to one per person,
              household, and payment method. Abuse of free trials (including creating multiple accounts) will result
              in account termination. Enhanced free trials that require a payment method will automatically convert to
              a paid subscription at the end of the trial period unless canceled before the trial ends.
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
              based on UTC time. Attempting to circumvent usage limits through any means (including but not limited to
              multiple accounts, automated tools, or API abuse) constitutes a material breach of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">7. AI Agents and Bestie Companions</h2>
            <p>
              AI agents are specialized conversational assistants with domain-specific knowledge. AI Bestie companions
              are personalized conversational AI characters created and customized by users. Agent and Bestie
              availability depends on your subscription tier. Both provide informational guidance only
              and do not constitute professional advice. You should not rely on agent or Bestie output as a substitute
              for qualified professional counsel in legal, medical, financial, engineering, or compliance matters.
              Stone AI is not liable for any actions taken based on AI-generated advice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">8. API Access and Reselling</h2>
            <p>
              API access is available on the Pro plan. You may use the API to build products and services,
              including reselling AI capabilities to your own customers, <strong className="text-white">subject to the Stone AI
              Reseller Agreement</strong> (available at <Link href="/reseller-agreement" className="text-emerald-400 hover:underline">/reseller-agreement</Link>).
              All reseller activity requires a separate executed Reseller Agreement. Unauthorized reselling
              is a material breach of these Terms and may result in immediate termination, forfeiture of all revenue
              generated through unauthorized resale, and legal action.
            </p>
            <p>
              API usage is subject to the same rate limits as your subscription tier. You are responsible for
              your end users&apos; compliance with these Terms. You may not misrepresent AI-generated output as
              human-created. You may not use the API for illegal purposes, spam, or generating harmful content.
              Stone AI reserves the right to revoke API access at any time for violations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">9. Community Forum</h2>
            <p>
              The community forum is provided for users to share tips, ask questions, and interact with
              each other. You retain ownership of content you post. By posting, you grant Stone AI a
              perpetual, worldwide, royalty-free, non-exclusive license to display, reproduce, distribute,
              and create derivative works from your content on the platform and in marketing materials.
              You may not post content that is illegal, harassing, defamatory, or violates the rights of others.
              We reserve the right to remove content and suspend accounts that violate these guidelines without notice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">10. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1 text-zinc-400">
              <li>Use the Service to generate illegal, harmful, deceptive, or defamatory content</li>
              <li>Attempt to bypass rate limits, security measures, or access controls</li>
              <li>Reverse engineer, decompile, disassemble, or extract the AI models, algorithms, or training data</li>
              <li>Use automated tools to scrape, crawl, or bulk-access the Service</li>
              <li>Share your account credentials or API keys with unauthorized parties</li>
              <li>Impersonate other users, Stone AI staff, or any third party</li>
              <li>Upload malicious code, viruses, or exploit vulnerabilities</li>
              <li>Use the Service to compete with or build a competing product to Stone AI</li>
              <li>Resell, sublicense, or redistribute access to the Service without a valid Reseller Agreement</li>
              <li>Use the Service to train, fine-tune, or develop competing AI models</li>
              <li>Engage in prompt injection, jailbreaking, or attempts to extract system prompts</li>
              <li>Misrepresent your identity, tier, or relationship with Stone AI</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">11. Intellectual Property and Trademarks</h2>
            <p>
              You own the content you create using the Service, including AI-generated outputs produced
              from your prompts. <strong className="text-white">Stone AI retains all right, title, and interest in the platform,
              AI models, agent configurations, agent prompts, knowledge bases, Bestie personality system,
              brand assets, trademarks, trade dress, and all underlying technology.</strong> The names &quot;Stone AI&quot;,
              &quot;Best AI&quot;, &quot;My Best AI&quot;, and all associated logos, insignias, designs, and trade dress are
              trademarks or pending trademarks of Stone AI. You may not copy, redistribute, sell, license,
              or create derivative works from Stone AI&apos;s proprietary technology or brand assets.
            </p>
            <p>
              <strong className="text-white">Trademark Usage:</strong> You may not use Stone AI trademarks, logos, or brand assets without
              prior written permission. Authorized use (e.g., by approved resellers) must comply with our
              Brand Guidelines. Any unauthorized use of our trademarks will be met with legal action.
              You may not register domain names, social media accounts, or business names that are confusingly
              similar to Stone AI, Best AI, or My Best AI trademarks.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">12. Brand Protection</h2>
            <p>
              Stone AI takes its brand integrity seriously. You agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-zinc-400">
              <li>Use Stone AI&apos;s name, logo, or trademarks in any way that suggests endorsement, affiliation, or sponsorship without written authorization</li>
              <li>Register or use any domain name, trademark, or business name that is confusingly similar to any Stone AI trademark</li>
              <li>Create or distribute marketing materials that misrepresent the nature of your relationship with Stone AI</li>
              <li>Modify, distort, or use Stone AI brand assets in a way that diminishes or tarnishes the brand</li>
              <li>Engage in keyword advertising, SEO manipulation, or social media practices that trade on Stone AI&apos;s brand reputation</li>
            </ul>
            <p>
              <strong className="text-white">Violations of brand protection provisions entitle Stone AI to seek immediate injunctive relief
              without posting bond, in addition to any other remedies available at law or equity.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">13. Confidentiality</h2>
            <p>
              You acknowledge that through use of the Service, you may have access to information that is confidential
              to Stone AI, including but not limited to system prompts, agent configurations, pricing structures,
              business strategies, and technical architecture (&quot;Confidential Information&quot;). You agree to maintain
              the confidentiality of all Confidential Information and not to disclose it to any third party.
              This obligation survives termination of your account for a period of three (3) years.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">14. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Stone AI, its officers, directors, employees,
              agents, and affiliates from and against any and all claims, damages, losses, liabilities, costs,
              and expenses (including reasonable attorneys&apos; fees) arising out of or related to: (a) your use of
              the Service; (b) your violation of these Terms; (c) your violation of any third-party rights;
              (d) content you create, distribute, or make available through the Service; or (e) any reselling
              activity conducted through your account. This indemnification obligation survives termination
              of your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">15. Disclaimers</h2>
            <p>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED,
              INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
              NON-INFRINGEMENT, AND ACCURACY. AI-generated content may contain errors, inaccuracies, hallucinations,
              or biases. Stone AI does not guarantee the accuracy, completeness, timeliness, or reliability of any AI output.
              The Service is not a substitute for professional advice. We are not liable for decisions made based on
              AI-generated content. Service availability is not guaranteed and may be interrupted for maintenance,
              updates, or unforeseen circumstances.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">16. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, STONE AI&apos;S TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATED
              TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNTS YOU PAID TO STONE AI
              IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR (B) ONE HUNDRED U.S. DOLLARS ($100).
              IN NO EVENT SHALL STONE AI BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY,
              OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, GOODWILL, OR BUSINESS OPPORTUNITIES,
              REGARDLESS OF WHETHER SUCH DAMAGES WERE FORESEEABLE OR WHETHER STONE AI WAS ADVISED OF THE POSSIBILITY
              OF SUCH DAMAGES.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">17. Dispute Resolution and Arbitration</h2>
            <p>
              <strong className="text-white">Any dispute, claim, or controversy arising out of or relating to these Terms or the Service shall
              be resolved through binding arbitration</strong> administered by the American Arbitration Association (&quot;AAA&quot;)
              under its Commercial Arbitration Rules. Arbitration shall take place in the state where Stone AI
              is headquartered. The arbitrator&apos;s award shall be final and binding. Judgment on the award may be
              entered in any court of competent jurisdiction.
            </p>
            <p>
              <strong className="text-white">CLASS ACTION WAIVER:</strong> You agree that any dispute resolution proceedings will be conducted
              only on an individual basis and not in a class, consolidated, or representative action. If this
              class action waiver is found to be unenforceable, the entirety of this arbitration provision shall
              be null and void.
            </p>
            <p>
              <strong className="text-white">Exception:</strong> Either party may seek injunctive or other equitable relief in any court of
              competent jurisdiction to prevent the actual or threatened infringement, misappropriation, or
              violation of intellectual property rights or confidentiality obligations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">18. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the United States
              and the state where Stone AI is headquartered, without regard to conflict of law principles.
              For any matters not subject to arbitration, exclusive jurisdiction and venue shall be in the
              state and federal courts located in Stone AI&apos;s headquarter jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">19. Account Termination</h2>
            <p>
              We may suspend or terminate your account immediately and without notice for violations of these Terms,
              abusive behavior, suspected fraud, or non-payment. You may delete your account at any time by
              contacting support. Upon termination: (a) all licenses granted to you under these Terms immediately cease;
              (b) you must immediately stop using the Service and any Stone AI materials; (c) your data will be
              deleted within 30 days, except as required by law or for legitimate business purposes; (d) any
              outstanding fees become immediately due and payable; (e) Sections 11-18 survive termination.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">20. Non-Circumvention</h2>
            <p>
              You agree not to circumvent, avoid, or bypass Stone AI in any business relationship or transaction
              introduced or facilitated through the Service. This includes but is not limited to: directly contacting
              or soliciting Stone AI&apos;s AI model providers, infrastructure partners, or other vendors with the intent
              to bypass Stone AI&apos;s platform. Violation of this provision entitles Stone AI to damages equal to the
              value of the circumvented transaction plus reasonable attorneys&apos; fees.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">21. Audit Rights</h2>
            <p>
              Stone AI reserves the right to audit your use of the Service, API, and any reselling activity to
              ensure compliance with these Terms. You agree to cooperate with any such audit and to provide
              access to relevant records upon reasonable notice. For Pro and API users, Stone AI may conduct
              automated monitoring of API usage patterns to detect violations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">22. Force Majeure</h2>
            <p>
              Stone AI shall not be liable for any failure or delay in performance resulting from causes beyond
              its reasonable control, including but not limited to acts of God, natural disasters, pandemic,
              war, terrorism, government actions, internet or telecommunications failures, power outages,
              or third-party service provider failures.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">23. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable or invalid, that provision shall be
              limited or eliminated to the minimum extent necessary so that these Terms shall otherwise remain
              in full force and effect. The unenforceability of any provision shall not affect the validity
              of any other provision.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">24. Entire Agreement</h2>
            <p>
              These Terms, together with the Privacy Policy and any applicable Reseller Agreement, constitute the
              entire agreement between you and Stone AI regarding the Service and supersede all prior agreements,
              understandings, negotiations, and discussions, whether oral or written. No waiver of any provision
              shall be deemed a further or continuing waiver of such provision or any other provision.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">25. Changes to Terms</h2>
            <p>
              We may update these Terms at any time. Material changes will be communicated via email or
              in-app notification at least 14 days before taking effect. Continued use of the Service after
              changes constitutes acceptance of the updated Terms. If you do not agree to the updated Terms,
              you must stop using the Service before the changes take effect.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">26. Contact</h2>
            <p>
              For questions about these Terms, contact us at legal@stone-ai.net or support@stone-ai.net.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
