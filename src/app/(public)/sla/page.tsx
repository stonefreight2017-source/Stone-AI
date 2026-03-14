import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SLAPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <nav aria-label="Page navigation" className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
        <Link href="/" className="text-xl font-bold">Stone AI&#8482;</Link>
        <Link href="/" className="text-sm text-zinc-400 hover:text-white flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </nav>

      <main id="main-content" className="px-6 py-12 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Service Level Agreement (SLA)</h1>
        <p className="text-zinc-400 text-sm mb-10">Last updated: March 14, 2026</p>

        <div className="prose prose-invert prose-zinc max-w-none space-y-8 text-sm text-zinc-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white">1. Overview</h2>
            <p>
              This Service Level Agreement (&quot;SLA&quot;) describes the uptime commitments, measurement methodology,
              and service credit remedies that Stone AI provides to eligible paid subscribers. This SLA is incorporated
              by reference into the Stone AI{" "}
              <Link href="/terms" className="text-emerald-400 underline">Terms of Service</Link>.
            </p>
            <p>
              Stone AI&apos;s infrastructure combines local AI inference (on dedicated GPU hardware) with cloud AI
              fallback (Anthropic Claude), providing redundancy that most competitors in the AI SaaS space do not
              offer. This SLA formalizes our commitment to reliability.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">2. Definitions</h2>
            <ul className="list-disc pl-6 space-y-2 text-zinc-400">
              <li>
                <strong className="text-zinc-300">&quot;Downtime&quot;</strong> means any period of five (5) or more
                consecutive minutes during which the Stone AI platform returns HTTP 5xx server errors or is completely
                unreachable, as measured by Stone AI&apos;s internal monitoring systems.
              </li>
              <li>
                <strong className="text-zinc-300">&quot;Monthly Uptime Percentage&quot;</strong> means the total number
                of minutes in a calendar month minus Downtime minutes, divided by the total number of minutes in that
                calendar month, multiplied by 100.
              </li>
              <li>
                <strong className="text-zinc-300">&quot;Measurement Period&quot;</strong> means each calendar month (UTC).
              </li>
              <li>
                <strong className="text-zinc-300">&quot;Service Credit&quot;</strong> means a percentage credit applied
                to the customer&apos;s next monthly billing cycle, calculated against the monthly subscription fee for
                the affected month.
              </li>
              <li>
                <strong className="text-zinc-300">&quot;Scheduled Maintenance&quot;</strong> means planned maintenance
                for which Stone AI provides at least twenty-four (24) hours advance notice via email or in-app notification.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">3. SLA Tiers</h2>
            <p>Service level commitments vary by subscription tier:</p>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-zinc-700">
                    <th className="text-left py-3 pr-4 text-zinc-300 font-semibold">Tier</th>
                    <th className="text-left py-3 pr-4 text-zinc-300 font-semibold">Uptime Target</th>
                    <th className="text-left py-3 pr-4 text-zinc-300 font-semibold">Service Credits</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-400">
                  <tr className="border-b border-zinc-800">
                    <td className="py-2.5 pr-4">Free</td>
                    <td className="py-2.5 pr-4">No SLA (best-effort)</td>
                    <td className="py-2.5 pr-4">None</td>
                  </tr>
                  <tr className="border-b border-zinc-800">
                    <td className="py-2.5 pr-4">Builder (Starter)</td>
                    <td className="py-2.5 pr-4">99.0%</td>
                    <td className="py-2.5 pr-4">Informational only</td>
                  </tr>
                  <tr className="border-b border-zinc-800">
                    <td className="py-2.5 pr-4">Growth (Plus)</td>
                    <td className="py-2.5 pr-4">99.0%</td>
                    <td className="py-2.5 pr-4">Informational only</td>
                  </tr>
                  <tr className="border-b border-zinc-800">
                    <td className="py-2.5 pr-4 text-white font-medium">Executive (Smart)</td>
                    <td className="py-2.5 pr-4 text-white font-medium">99.5%</td>
                    <td className="py-2.5 pr-4 text-emerald-400">Yes</td>
                  </tr>
                  <tr className="border-b border-zinc-800">
                    <td className="py-2.5 pr-4 text-white font-medium">Reseller (Pro)</td>
                    <td className="py-2.5 pr-4 text-white font-medium">99.5%</td>
                    <td className="py-2.5 pr-4 text-emerald-400">Yes (enhanced)</td>
                  </tr>
                  <tr className="border-b border-zinc-800">
                    <td className="py-2.5 pr-4 text-white font-medium">Enterprise</td>
                    <td className="py-2.5 pr-4 text-white font-medium">Custom (up to 99.9%)</td>
                    <td className="py-2.5 pr-4 text-emerald-400">Custom</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-4">
              <strong className="text-white">Free Tier:</strong> The Free tier is provided on a best-effort basis.
              Stone AI makes no uptime guarantees and offers no remedies for service interruptions on the Free tier.
            </p>
            <p>
              <strong className="text-white">Starter and Plus Tiers:</strong> These tiers receive an informational
              uptime target of 99.0% monthly uptime. This target reflects Stone AI&apos;s operational goal but does
              not entitle subscribers to service credits. Subscribers requiring uptime guarantees should upgrade to
              the Smart or Pro tier.
            </p>
            <p>
              <strong className="text-white">Enterprise Tier:</strong> Enterprise subscribers receive custom SLA terms
              negotiated as part of their enterprise agreement. Custom SLAs may include uptime targets up to 99.9%,
              dedicated infrastructure, and tailored remedies. Contact{" "}
              <Link href="mailto:sales@stone-ai.net" className="text-emerald-400 underline">sales@stone-ai.net</Link>{" "}
              for details.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">4. Service Credit Schedule</h2>
            <p>
              The following service credits apply to <strong className="text-white">Smart (Executive)</strong> and{" "}
              <strong className="text-white">Pro (Reseller)</strong> tier subscribers only:
            </p>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-zinc-700">
                    <th className="text-left py-3 pr-4 text-zinc-300 font-semibold">Monthly Uptime</th>
                    <th className="text-left py-3 pr-4 text-zinc-300 font-semibold">Service Credit</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-400">
                  <tr className="border-b border-zinc-800">
                    <td className="py-2.5 pr-4">Below 99.5% but at or above 99.0%</td>
                    <td className="py-2.5 pr-4 text-white font-medium">10% of monthly fee</td>
                  </tr>
                  <tr className="border-b border-zinc-800">
                    <td className="py-2.5 pr-4">Below 99.0% but at or above 95.0%</td>
                    <td className="py-2.5 pr-4 text-white font-medium">25% of monthly fee</td>
                  </tr>
                  <tr className="border-b border-zinc-800">
                    <td className="py-2.5 pr-4">Below 95.0%</td>
                    <td className="py-2.5 pr-4 text-amber-400 font-medium">50% of monthly fee (maximum)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-4">
              <strong className="text-white">Credit Cap:</strong> Service credits shall not exceed fifty percent
              (50%) of the customer&apos;s monthly subscription fee for the affected Measurement Period.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">5. How to Request Credits</h2>
            <p>
              To receive a service credit, the customer must submit a credit request to{" "}
              <Link href="mailto:support@stone-ai.net" className="text-emerald-400 underline">support@stone-ai.net</Link>{" "}
              within <strong className="text-white">thirty (30) days</strong> of the end of the Measurement Period
              in which the Downtime occurred. The request must include:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-zinc-400">
              <li>Your account email address</li>
              <li>The date(s) and approximate time(s) of the Downtime incident(s)</li>
              <li>A brief description of the impact experienced</li>
            </ul>
            <p>
              Stone AI will verify the Downtime against its internal monitoring records. If confirmed, the service
              credit will be applied to your next billing cycle within fifteen (15) business days of approval.
              Credits are not transferable, not redeemable for cash, and do not carry over beyond one billing cycle.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">6. Exclusions</h2>
            <p>The following events are excluded from Downtime calculations and do not qualify for service credits:</p>
            <ul className="list-disc pl-6 space-y-2 text-zinc-400">
              <li>
                <strong className="text-zinc-300">Scheduled Maintenance.</strong> Planned maintenance for which Stone AI
                provides at least twenty-four (24) hours advance notice. Stone AI will make reasonable efforts to schedule
                maintenance during low-usage periods (typically 2:00 AM &ndash; 6:00 AM Eastern Time).
              </li>
              <li>
                <strong className="text-zinc-300">Force Majeure.</strong> Events beyond Stone AI&apos;s reasonable
                control, including natural disasters, pandemics, acts of war or terrorism, government actions, internet
                backbone failures, or widespread power grid outages.
              </li>
              <li>
                <strong className="text-zinc-300">Third-Party Service Outages.</strong> Disruptions caused by outages
                of third-party services including Anthropic (cloud AI provider), Clerk (authentication), Stripe (payments),
                Cloudflare (DNS/CDN), Neon (database hosting), or Vercel (application hosting).
              </li>
              <li>
                <strong className="text-zinc-300">Customer-Caused Issues.</strong> Disruptions resulting from exceeding
                published rate limits, API abuse, account suspension due to Terms of Service violations, or issues with
                the customer&apos;s own network, device, or browser.
              </li>
              <li>
                <strong className="text-zinc-300">Beta and Preview Features.</strong> Any features, agents, or services
                designated as &quot;beta,&quot; &quot;preview,&quot; &quot;experimental,&quot; or &quot;early access.&quot;
              </li>
              <li>
                <strong className="text-zinc-300">Free Tier.</strong> The Free tier is not covered by this SLA.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">7. Sole and Exclusive Remedy</h2>
            <p>
              Service credits as described in Section 4 are the customer&apos;s{" "}
              <strong className="text-white">sole and exclusive remedy</strong> for any failure by Stone AI to meet
              the uptime targets described in this SLA. This SLA does not modify or supersede the limitation of
              liability provisions in the Stone AI{" "}
              <Link href="/terms" className="text-emerald-400 underline">Terms of Service</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">8. Infrastructure and Redundancy</h2>
            <p>Stone AI&apos;s architecture is designed for resilience:</p>
            <ul className="list-disc pl-6 space-y-1 text-zinc-400">
              <li>
                <strong className="text-zinc-300">Primary Inference:</strong> Local AI inference on dedicated GPU
                hardware, providing low-latency responses without dependence on external AI providers.
              </li>
              <li>
                <strong className="text-zinc-300">Cloud Fallback:</strong> When local inference is unavailable or
                under heavy load, requests are automatically routed to Anthropic Claude (cloud AI), ensuring continued
                service availability.
              </li>
              <li>
                <strong className="text-zinc-300">Global Distribution:</strong> Application hosted on Vercel&apos;s
                edge network with global distribution and Cloudflare DDoS protection.
              </li>
              <li>
                <strong className="text-zinc-300">Data Resilience:</strong> Neon PostgreSQL with automated backups
                and point-in-time recovery.
              </li>
            </ul>
            <p>
              This dual-inference architecture (local + cloud) provides a level of redundancy that most AI SaaS
              platforms in our competitive category do not offer.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">9. Monitoring and Incident Response</h2>
            <p>
              Stone AI monitors service availability continuously. In the event of a service disruption, Stone AI
              will acknowledge the incident and begin investigation. Status updates will be communicated via email
              and/or in-app notification to affected subscribers. Post-incident summaries are available for qualifying
              Downtime events affecting Smart, Pro, and Enterprise subscribers upon request.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">10. SLA Modifications</h2>
            <p>
              Stone AI reserves the right to modify this SLA at any time. Material changes will be communicated to
              eligible subscribers via email at least thirty (30) days before taking effect. Changes will not
              retroactively reduce credits already earned.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">11. Contact</h2>
            <p>
              For SLA-related inquiries, credit requests, or enterprise SLA negotiations:
            </p>
            <p>
              Stone AI LLC<br />
              4879 State Hwy 30, #183<br />
              Amsterdam, NY 12010<br />
              <Link href="mailto:support@stone-ai.net" className="text-emerald-400 underline">support@stone-ai.net</Link>
              {" | "}
              <Link href="mailto:sales@stone-ai.net" className="text-emerald-400 underline">sales@stone-ai.net</Link>
              {" | "}
              <Link href="mailto:legal@stone-ai.net" className="text-emerald-400 underline">legal@stone-ai.net</Link>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
