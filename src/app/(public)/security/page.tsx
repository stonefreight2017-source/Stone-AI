import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <nav className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
        <Link href="/" className="text-zinc-400 hover:text-white transition-colors" aria-label="Home">
          <Home className="h-5 w-5" />
        </Link>
        <Link href="/" className="text-sm text-zinc-400 hover:text-white flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </nav>

      <main className="px-6 py-12 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Security</h1>
        <p className="text-zinc-500 text-sm mb-10">Last updated: March 7, 2026</p>

        <div className="prose prose-invert prose-zinc max-w-none space-y-8 text-sm text-zinc-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white">1. Our Security Philosophy</h2>
            <p>
              Stone AI is designed to be local-first by default. Security is foundational to every layer
              of the platform — not an afterthought. We believe you should have full control over your
              data and how it is processed.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">2. Local vs. Non-Local Processing</h2>
            <p>
              <strong className="text-white">Local mode (Free, Starter, Plus tiers):</strong> All AI processing
              is performed entirely on Stone AI&apos;s own infrastructure. Your prompts, conversations, and data
              never leave our servers and are never transmitted to any third party.
            </p>
            <p>
              <strong className="text-white">Smart and Cloud modes (Smart, Pro tiers):</strong> When you opt into
              Smart or Cloud mode, your data is transmitted to third-party AI providers for processing. In these
              modes, your data is subject to those providers&apos; own privacy policies and data handling practices.
              Smart and Cloud modes are strictly opt-in — you always have the option to remain on Local mode for
              complete data sovereignty.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">3. Encryption</h2>
            <p>
              <strong className="text-white">Data at rest:</strong> Sensitive data is protected using
              industry-standard encryption. Credentials and API keys are stored securely and are never
              persisted in plaintext.
            </p>
            <p>
              <strong className="text-white">Data in transit:</strong> All communication between your browser and
              our servers is encrypted using modern transport-layer security. HTTPS is enforced across the
              entire platform with no exceptions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">4. Abuse Prevention</h2>
            <p>
              All endpoints are protected by automated threat detection and rate limiting. This prevents
              brute-force attacks, credential stuffing, API abuse, and denial-of-service attempts. Repeated
              violations result in temporary or permanent access restrictions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">5. Browser Security</h2>
            <p>
              Stone AI enforces a comprehensive set of browser security policies on every response.
              These protections defend against cross-site scripting, clickjacking, protocol downgrade
              attacks, and unauthorized resource loading. All policies are continuously reviewed and
              updated to reflect current best practices.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">6. Origin Protection</h2>
            <p>
              API access is restricted to authorized origins only. Requests from unauthorized sources are
              rejected at the server level, preventing third-party websites or scripts from interacting
              with Stone AI&apos;s services on behalf of authenticated users.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">7. Authentication</h2>
            <p>
              Stone AI uses an enterprise-grade authentication provider for session management, token
              issuance, and identity verification. Authentication tokens are short-lived and automatically
              rotated. Users can authenticate via email or supported social login providers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">8. Payment Security</h2>
            <p>
              All payment processing is handled by a PCI DSS Level 1 certified payment processor — the
              highest level of certification in the payment card industry. Stone AI never stores, processes,
              or has access to your full credit card number, CVV, or banking details. We retain only the
              minimum identifiers necessary for billing management.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">9. Input Sanitization</h2>
            <p>
              All user-submitted content — including chat messages, forum posts, and feedback — is validated
              and sanitized before processing and storage. Input validation is enforced on both the client
              and server side to protect against injection-based attacks.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">10. Audit Logging</h2>
            <p>
              Stone AI maintains security audit logs to support rapid incident response and forensic analysis.
              Logging covers security-relevant events across the platform and is continuously monitored for
              anomalous activity.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">11. Data Usage and AI Training</h2>
            <p>
              <strong className="text-white">Stone AI does not use your conversations or prompts to train AI models
              when using Local mode.</strong> When using Smart or Cloud modes, your data is transmitted to third-party
              AI providers whose data handling practices are governed by their own policies. Anonymized, aggregated
              usage patterns may be used to improve service quality and platform performance across all modes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">12. Compliance</h2>
            <p>
              Stone AI&apos;s security practices are aligned with industry-recognized frameworks for data protection,
              access control, vulnerability management, and incident response. We regularly review and update our
              controls to meet evolving standards and regulatory expectations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">13. Infrastructure Security</h2>
            <p>
              Our production infrastructure is protected by enterprise-grade network security, encrypted in
              transit and at rest, and continuously monitored for threats. Origin servers are shielded behind
              multiple layers of protection to prevent unauthorized access and ensure high availability.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">14. Responsible Disclosure</h2>
            <p>
              We take security vulnerabilities seriously and appreciate the work of security researchers
              who help keep Stone AI and its users safe. If you discover a security vulnerability, please
              report it responsibly.
            </p>
            <p>
              <strong className="text-white">Report vulnerabilities to:</strong>{" "}
              <a href="mailto:security@stone-ai.net" className="text-emerald-400 hover:underline">
                security@stone-ai.net
              </a>
            </p>
            <p>
              When reporting, please include:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-zinc-400">
              <li>A detailed description of the vulnerability</li>
              <li>Steps to reproduce the issue</li>
              <li>The potential impact of the vulnerability</li>
              <li>Any suggested remediation (optional but appreciated)</li>
            </ul>
            <p>
              We ask that you give us reasonable time to investigate and address reported vulnerabilities
              before making any public disclosure. We will not take legal action against security
              researchers who act in good faith and comply with this responsible disclosure policy.
            </p>
            <p>
              Stone AI develops AI-powered security and compliance tools as part of our platform
              offering. We work with security professionals across our reseller and enterprise
              programs to bring these capabilities to organizations at scale. If your background
              is in security and our mission resonates with you, we&apos;d welcome a conversation
              &mdash;{" "}
              <a href="mailto:careers@stone-ai.net" className="text-emerald-400 hover:underline">
                careers@stone-ai.net
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">15. Contact</h2>
            <p>
              For security-related questions, concerns, or vulnerability reports, contact us at{" "}
              <a href="mailto:security@stone-ai.net" className="text-emerald-400 hover:underline">
                security@stone-ai.net
              </a>
              . For general support inquiries, contact{" "}
              <a href="mailto:support@stone-ai.net" className="text-emerald-400 hover:underline">
                support@stone-ai.net
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
