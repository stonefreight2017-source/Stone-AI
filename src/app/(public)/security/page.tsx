import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <nav className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
        <Link href="/" className="text-xl font-bold">Stone AI™</Link>
        <Link href="/" className="text-sm text-zinc-400 hover:text-white flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </nav>

      <main className="px-6 py-12 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Security</h1>
        <p className="text-zinc-500 text-sm mb-10">Last updated: March 6, 2026</p>

        <div className="prose prose-invert prose-zinc max-w-none space-y-8 text-sm text-zinc-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white">1. Our Security Philosophy</h2>
            <p>
              Stone AI is built on a local-first architecture. By default, your data stays on our network
              and is never sent to third-party AI providers. We believe you should have full control over
              when and whether your data leaves our infrastructure. Security is not an afterthought — it
              is foundational to every layer of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">2. Local-First Architecture</h2>
            <p>
              On our Free, Starter, and Plus plans, all AI inference is performed on our own hardware
              using locally hosted models. Your prompts and conversation data are processed entirely
              within our infrastructure and are never transmitted to external AI providers such as
              OpenAI, Google, or Anthropic.
            </p>
            <p>
              <strong className="text-white">Smart mode (cloud AI) is strictly opt-in.</strong> Only users on
              Smart and Pro tiers can access cloud-based inference, and only when they explicitly select
              Smart mode or enable auto-routing. You always have the option to remain on Local mode for
              complete data sovereignty.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">3. Encryption</h2>
            <p>
              <strong className="text-white">Data at rest:</strong> Sensitive data is encrypted using AES-256-GCM,
              the same encryption standard used by governments and financial institutions worldwide. API keys
              are stored as salted hashes and are never persisted in plaintext.
            </p>
            <p>
              <strong className="text-white">Data in transit:</strong> All communication between your browser and
              our servers is encrypted using TLS 1.2 or higher. We enforce HTTPS across the entire platform
              with no exceptions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">4. Rate Limiting and Abuse Prevention</h2>
            <p>
              All API and application endpoints are protected by Redis-based rate limiting. This prevents
              brute-force attacks, credential stuffing, API abuse, and denial-of-service attempts. Rate
              limits are enforced per-user and per-IP, with automatic throttling when thresholds are exceeded.
              Repeated violations result in temporary or permanent access restrictions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">5. Security Headers</h2>
            <p>
              Stone AI deploys enterprise-grade HTTP security headers on every response:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-zinc-400">
              <li>
                <strong className="text-zinc-300">Content Security Policy (CSP):</strong> Restricts the sources
                from which scripts, styles, and other resources can be loaded, mitigating cross-site scripting
                (XSS) and data injection attacks.
              </li>
              <li>
                <strong className="text-zinc-300">HTTP Strict Transport Security (HSTS):</strong> Enforced with
                preload, ensuring browsers only connect over HTTPS and preventing protocol downgrade attacks.
              </li>
              <li>
                <strong className="text-zinc-300">X-Frame-Options:</strong> Prevents the application from being
                embedded in iframes, protecting against clickjacking attacks.
              </li>
              <li>
                <strong className="text-zinc-300">X-Content-Type-Options:</strong> Prevents MIME-type sniffing
                to reduce the risk of drive-by downloads.
              </li>
              <li>
                <strong className="text-zinc-300">Referrer-Policy:</strong> Controls how much referrer information
                is shared with external sites, limiting data leakage.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">6. CORS Policy</h2>
            <p>
              Cross-Origin Resource Sharing (CORS) is locked to an explicit allowlist of trusted origins.
              Requests from unauthorized origins are rejected at the server level. This prevents
              unauthorized third-party websites or scripts from interacting with Stone AI&apos;s APIs on
              behalf of authenticated users.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">7. Authentication</h2>
            <p>
              Stone AI uses <strong className="text-white">Clerk</strong> as its authentication provider.
              Clerk handles session management, token issuance, and identity verification with
              industry-standard security practices. Users can authenticate via email or OAuth through
              Google. All authentication tokens are short-lived and automatically rotated. Multi-session
              management and device tracking are supported.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">8. Payment Security</h2>
            <p>
              All payment processing is handled by <strong className="text-white">Stripe</strong>, a PCI DSS
              Level 1 certified payment processor — the highest level of certification in the payment
              card industry. Stone AI never stores, processes, or has access to your full credit card
              number, CVV, or banking details. We retain only your Stripe customer ID and subscription
              ID for billing management.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">9. Input Sanitization</h2>
            <p>
              All user-submitted content — including chat messages, forum posts, feedback forms, and API
              requests — is sanitized before processing and storage. This protects against cross-site
              scripting (XSS), SQL injection, and other injection-based attacks. Input validation is
              enforced on both the client and server side.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">10. Audit Logging</h2>
            <p>
              Stone AI maintains security audit logs for authentication events, access control decisions,
              administrative actions, and sensitive data operations. These logs enable rapid incident
              response and forensic analysis in the event of a security concern.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">11. No Training on User Data</h2>
            <p>
              <strong className="text-white">Stone AI does not use your conversations, prompts, or any user-generated
              content to train, fine-tune, or improve AI models.</strong> Your data is yours. When Smart mode
              routes a request to OpenAI, their API terms also prohibit using API data for model training.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">12. Compliance</h2>
            <p>
              <strong className="text-white">SOC 2 compliance</strong> is available on the Executive tier and above.
              This includes formal controls for security, availability, processing integrity, confidentiality,
              and privacy — verified through independent third-party audits. Enterprise and Executive customers
              may request compliance documentation and audit reports through their account manager.
            </p>
            <p>
              For all tiers, Stone AI adheres to security best practices aligned with industry standards
              including data encryption, access controls, vulnerability management, and incident response procedures.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">13. Infrastructure Security</h2>
            <p>
              Our production environment is hosted behind Cloudflare&apos;s global network, providing DDoS
              mitigation, Web Application Firewall (WAF) protection, and SSL termination. DNS is managed
              through Cloudflare with proxy enabled for all public-facing records, adding an additional
              layer of origin protection.
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
