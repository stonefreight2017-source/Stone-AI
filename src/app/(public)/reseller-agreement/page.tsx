import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ResellerAgreementPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <nav className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
        <Link href="/" className="text-xl font-bold">Stone AI&trade;</Link>
        <Link href="/" className="text-sm text-zinc-400 hover:text-white flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </nav>

      <main className="px-6 py-12 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Reseller Agreement</h1>
        <p className="text-zinc-500 text-sm mb-10">Last updated: March 4, 2026</p>

        <div className="prose prose-invert prose-zinc max-w-none space-y-8 text-sm text-zinc-300 leading-relaxed">

          <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg p-4 mb-8">
            <p className="text-amber-300 text-sm font-medium">
              This Reseller Agreement (&quot;Agreement&quot;) must be executed before any reselling activity.
              Contact legal@stone-ai.net to request a signed copy. Unauthorized reselling is a material
              breach of the <Link href="/terms" className="text-emerald-400 hover:underline">Terms of Service</Link> and
              may result in legal action.
            </p>
          </div>

          <section>
            <h2 className="text-lg font-semibold text-white">1. Parties</h2>
            <p>
              This Reseller Agreement (&quot;Agreement&quot;) is entered into between Stone AI (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;)
              and the entity or individual approved as a reseller (&quot;Reseller&quot;, &quot;you&quot;, &quot;your&quot;).
              This Agreement governs your right to resell, distribute, or sublicense access to the Stone AI
              platform, API, AI agents, Bestie companions, and related services (collectively, the &quot;Products&quot;)
              to your end customers (&quot;End Users&quot;). &quot;Products&quot; includes, without limitation, browser search bar
              integrations, home screen widgets, mobile companion apps, voice-enabled interfaces, and any other
              access points or distribution channels developed by Stone AI.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">2. Eligibility and Approval</h2>
            <p>
              Reseller status requires: (a) an active Stone AI Pro subscription; (b) a completed reseller application;
              (c) execution of this Agreement; and (d) written approval from Stone AI. Stone AI reserves the
              sole and absolute right to approve or deny any reseller application for any reason. Approval
              may be conditioned on meeting minimum revenue commitments, compliance with brand guidelines,
              or other criteria specified by Stone AI.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">3. Grant of Rights</h2>
            <p>
              Subject to the terms of this Agreement, Stone AI grants Reseller a <strong className="text-white">limited, non-exclusive,
              non-transferable, revocable license</strong> to resell access to the Products within the approved
              territory and market segment. This license does not include any right to:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-zinc-400">
              <li>Modify, alter, or create derivative works from the Products</li>
              <li>White-label or rebrand the Products as Reseller&apos;s own (unless separately agreed in writing)</li>
              <li>Grant sublicenses or sub-reseller rights to any third party</li>
              <li>Access or distribute the underlying AI models, source code, or training data</li>
              <li>Represent themselves as Stone AI or an agent of Stone AI</li>
            </ul>
            <p>
              <strong className="text-white">All rights not expressly granted herein are reserved by Stone AI.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">3A. Bring Your Bestie Anywhere — Distribution Integrations</h2>
            <p>
              Stone AI offers users seamless access through lightweight integration points including, but not limited to:
              browser search bar integrations, mobile home screen widgets, voice-enabled interfaces, and OS-level
              quick-access features (collectively, &quot;Access Points&quot;). These Access Points are designed for convenience —
              allowing users to reach their AI agents and Bestie companions instantly, without switching apps or
              granting intrusive device permissions.
            </p>
            <p>
              Reseller may promote and distribute Access Points to End Users subject to the following:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-zinc-400">
              <li>Access Points must be installed with clear, informed user consent</li>
              <li>Reseller shall not bundle Access Points with unrelated software or use deceptive installation patterns</li>
              <li>All Access Points must remain unmodified and sourced from Stone AI&apos;s official distribution channels</li>
              <li>Reseller must clearly communicate that Access Points connect to Stone AI&apos;s infrastructure and provide links to Stone AI&apos;s Privacy Policy</li>
              <li>Reseller may not use Access Points to collect, intercept, or redirect user data for purposes outside the scope of this Agreement</li>
            </ul>
            <p>
              Stone AI is committed to a <strong className="text-white">privacy-first, minimal-permissions approach</strong> across all Access Points.
              Users should feel that their AI companion is with them wherever they go — not that an application is monitoring
              their activity. Reseller marketing must reflect this philosophy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">4. Pricing, Revenue, and Payment</h2>
            <p>
              Reseller shall pay Stone AI the wholesale price for each End User subscription as specified in the
              applicable pricing schedule. Reseller may set their own retail pricing to End Users, provided that
              Reseller does not engage in predatory pricing or pricing that materially undermines the Stone AI
              direct sales channel. Stone AI reserves the right to set minimum advertised prices (&quot;MAP&quot;) and
              maximum retail prices.
            </p>
            <p>
              Payment terms are Net 30 from invoice date. Late payments accrue interest at 1.5% per month
              or the maximum rate permitted by law, whichever is less. Stone AI may suspend Reseller&apos;s access
              for overdue payments exceeding 15 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">5. Brand Usage and Marketing</h2>
            <p>
              Reseller must comply with Stone AI&apos;s Brand Guidelines (provided separately) in all marketing,
              advertising, and customer communications. Specifically, Reseller shall:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-zinc-400">
              <li>Use only approved Stone AI logos, trademarks, and brand assets provided by Stone AI</li>
              <li>Include the designation &quot;Authorized Stone AI Reseller&quot; in all marketing materials</li>
              <li>Not alter, distort, or modify Stone AI logos or brand assets in any way</li>
              <li>Not use Stone AI trademarks in their own business name, domain name, or social media handles</li>
              <li>Submit all marketing materials featuring Stone AI branding for approval before publication</li>
              <li>Not make claims about the Products that are not substantiated by Stone AI&apos;s official documentation</li>
              <li>Not engage in any marketing that could damage Stone AI&apos;s reputation or brand integrity</li>
            </ul>
            <p>
              <strong className="text-white">Stone AI may revoke marketing approval at any time and require immediate removal of
              non-compliant materials.</strong> Failure to comply within 48 hours of notice constitutes a material breach.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">6. End User Obligations</h2>
            <p>
              Reseller is fully responsible for ensuring all End Users comply with Stone AI&apos;s Terms of Service
              and Acceptable Use Policy. Reseller must: (a) provide each End User with a copy of Stone AI&apos;s
              Terms of Service before activating their account; (b) require End Users to accept Stone AI&apos;s
              Terms of Service; (c) promptly report any End User violations to Stone AI; (d) cooperate
              with Stone AI in investigating and resolving any End User compliance issues.
            </p>
            <p>
              <strong className="text-white">Reseller is jointly and severally liable for any damages caused by End User violations
              of Stone AI&apos;s Terms of Service.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">7. Data Protection and Privacy</h2>
            <p>
              Reseller shall comply with all applicable data protection laws, including GDPR, CCPA, and any
              other relevant regulations. Reseller shall not access, use, or disclose End User data except
              as necessary to fulfill its obligations under this Agreement. Reseller agrees to execute a
              Data Processing Agreement (&quot;DPA&quot;) if required by Stone AI. Reseller must promptly notify
              Stone AI of any data breach affecting End User data within 24 hours of discovery.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">8. Intellectual Property</h2>
            <p>
              Nothing in this Agreement transfers any intellectual property rights from Stone AI to Reseller.
              The names &quot;Stone AI&quot;, &quot;Best AI&quot;, &quot;My Best AI&quot;, all associated logos, insignias (including the
              Meridian Mark), trade dress, and all underlying technology, AI models, agent configurations,
              system prompts, and knowledge bases are and shall remain the exclusive property of Stone AI.
            </p>
            <p>
              Reseller agrees not to: (a) challenge or assist others in challenging Stone AI&apos;s intellectual
              property rights; (b) register any trademark, domain name, or social media account confusingly
              similar to Stone AI&apos;s marks; (c) reverse engineer, decompile, or analyze the Products to
              extract proprietary information; (d) develop competing products using knowledge gained from
              access to the Products.
            </p>
            <p>
              <strong className="text-white">Any intellectual property developed by Reseller that incorporates or is based on
              Stone AI&apos;s technology shall be jointly owned, with Stone AI retaining a perpetual, irrevocable,
              worldwide license to use such intellectual property without restriction.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">9. Non-Competition</h2>
            <p>
              During the term of this Agreement and for twelve (12) months following termination, Reseller
              agrees not to directly or indirectly: (a) develop, market, or sell any product or service that
              competes with the Products; (b) solicit or hire Stone AI employees, contractors, or consultants;
              (c) use Stone AI&apos;s Confidential Information to benefit any competing business.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">10. Non-Circumvention</h2>
            <p>
              Reseller agrees not to circumvent Stone AI in any transaction with End Users, prospective customers,
              or business relationships introduced or facilitated through the reseller relationship. Specifically,
              Reseller shall not: (a) encourage End Users to cancel their Stone AI-sourced subscription and
              subscribe directly or through another channel; (b) use End User lists or contact information
              obtained through this Agreement to market competing products; (c) directly contract with Stone AI&apos;s
              technology providers, infrastructure partners, or model vendors to replicate the Products.
            </p>
            <p>
              <strong className="text-white">Violation of this non-circumvention clause entitles Stone AI to liquidated damages
              equal to five times (5x) the annual value of the circumvented relationship, plus
              reasonable attorneys&apos; fees and costs.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">11. Confidentiality</h2>
            <p>
              Reseller acknowledges access to Stone AI&apos;s Confidential Information, including pricing,
              technology, business strategies, customer data, roadmaps, and internal processes. Reseller
              agrees to: (a) maintain strict confidentiality of all Confidential Information; (b) use
              Confidential Information only for purposes of fulfilling this Agreement; (c) not disclose
              Confidential Information to any third party without prior written consent; (d) implement
              reasonable security measures to protect Confidential Information.
            </p>
            <p>
              This confidentiality obligation survives termination of this Agreement for five (5) years.
              Unauthorized disclosure may result in immediate termination and legal action for damages.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">12. Indemnification</h2>
            <p>
              <strong className="text-white">Reseller shall indemnify, defend, and hold harmless Stone AI</strong>, its officers, directors,
              employees, agents, and affiliates from and against any and all claims, damages, losses, liabilities,
              costs, and expenses (including reasonable attorneys&apos; fees) arising out of or related to:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-zinc-400">
              <li>Reseller&apos;s breach of this Agreement</li>
              <li>Reseller&apos;s marketing, sales, or support activities</li>
              <li>Any claims by End Users against Stone AI related to Reseller&apos;s representations or actions</li>
              <li>Any violation of applicable laws by Reseller or its End Users</li>
              <li>Any unauthorized use of Stone AI&apos;s intellectual property by Reseller</li>
              <li>Any data breach or privacy violation attributable to Reseller</li>
            </ul>
            <p>
              Stone AI shall have the right, but not the obligation, to participate in the defense of any such claim
              at Reseller&apos;s expense.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">13. Limitation of Stone AI&apos;s Liability</h2>
            <p>
              STONE AI&apos;S TOTAL LIABILITY TO RESELLER UNDER THIS AGREEMENT SHALL NOT EXCEED THE TOTAL FEES
              PAID BY RESELLER TO STONE AI IN THE SIX (6) MONTHS PRECEDING THE CLAIM. IN NO EVENT SHALL
              STONE AI BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR
              PUNITIVE DAMAGES, INCLUDING LOST PROFITS, LOST REVENUE, LOSS OF CUSTOMERS, OR LOSS OF
              BUSINESS OPPORTUNITIES, REGARDLESS OF WHETHER SUCH DAMAGES WERE FORESEEABLE.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">14. Term and Termination</h2>
            <p>
              This Agreement is effective upon execution and continues for one (1) year, automatically renewing
              for successive one-year terms unless either party provides 30 days&apos; written notice of non-renewal.
            </p>
            <p>
              <strong className="text-white">Stone AI may terminate this Agreement immediately, without notice or cure period, if Reseller:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-1 text-zinc-400">
              <li>Breaches any material provision of this Agreement</li>
              <li>Fails to meet minimum performance or revenue requirements</li>
              <li>Engages in conduct that damages Stone AI&apos;s reputation or brand</li>
              <li>Becomes insolvent, files for bankruptcy, or ceases business operations</li>
              <li>Violates applicable laws or regulations</li>
              <li>Fails to cure a non-material breach within 15 days of written notice</li>
            </ul>
            <p>
              Upon termination: (a) all rights granted to Reseller immediately cease; (b) Reseller must immediately
              stop marketing, selling, or distributing the Products; (c) Reseller must remove all Stone AI branding
              and marketing materials within 7 days; (d) Reseller must transition End Users to Stone AI direct
              or facilitate orderly account migration; (e) all outstanding fees become immediately due;
              (f) Sections 8-13 survive termination.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">15. Reporting and Audit</h2>
            <p>
              Reseller shall provide Stone AI with monthly reports detailing End User count, revenue generated,
              and any customer complaints or support issues. Stone AI reserves the right to audit Reseller&apos;s
              records, systems, and practices upon 10 days&apos; written notice. Reseller shall cooperate fully with
              any audit. If an audit reveals underpayment exceeding 5%, Reseller shall pay the deficiency plus
              the cost of the audit.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">16. Representations and Warranties</h2>
            <p>Reseller represents and warrants that:</p>
            <ul className="list-disc pl-6 space-y-1 text-zinc-400">
              <li>It has the legal authority to enter into this Agreement</li>
              <li>It will comply with all applicable laws and regulations</li>
              <li>It will not make unauthorized representations about Stone AI or the Products</li>
              <li>It maintains adequate insurance coverage for its business operations</li>
              <li>It will not assign or transfer this Agreement without Stone AI&apos;s prior written consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">17. Dispute Resolution</h2>
            <p>
              Any dispute arising out of or relating to this Agreement shall be resolved through binding
              arbitration in accordance with the American Arbitration Association (&quot;AAA&quot;) Commercial Arbitration
              Rules. Arbitration shall take place in the jurisdiction where Stone AI is headquartered.
              The prevailing party shall be entitled to recover its reasonable attorneys&apos; fees and costs.
            </p>
            <p>
              <strong className="text-white">Injunctive Relief:</strong> Notwithstanding the foregoing, Stone AI may seek injunctive or equitable
              relief in any court of competent jurisdiction to protect its intellectual property rights,
              confidential information, or brand integrity, without the necessity of posting bond.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">18. Governing Law</h2>
            <p>
              This Agreement shall be governed by and construed in accordance with the laws of the United States
              and the state where Stone AI is headquartered, without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">19. Entire Agreement and Amendment</h2>
            <p>
              This Agreement, together with the Terms of Service and any schedules or exhibits attached hereto,
              constitutes the entire agreement between the parties regarding the subject matter hereof.
              This Agreement may only be amended in writing signed by both parties. No waiver of any provision
              shall be effective unless in writing and signed by the waiving party.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">20. Contact</h2>
            <p>
              For reseller inquiries, applications, or legal questions regarding this Agreement, contact:
            </p>
            <p className="text-zinc-400">
              Stone AI — Reseller Program<br />
              Email: legal@stone-ai.net<br />
              Website: stone-ai.net
            </p>
          </section>

        </div>
      </main>
    </div>
  );
}
