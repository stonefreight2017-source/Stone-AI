import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <nav className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
        <Link href="/" className="text-xl font-bold">Stone AI™</Link>
        <Link href="/" className="text-sm text-zinc-400 hover:text-white flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </nav>

      <main className="px-6 py-12 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">About Stone AI</h1>
        <p className="text-zinc-500 text-sm mb-10">Founded 2026</p>

        <div className="prose prose-invert prose-zinc max-w-none space-y-8 text-sm text-zinc-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white">What We Do</h2>
            <p>
              Stone AI is a local-first AI platform built for businesses. We give teams of every size
              access to powerful AI tools — without sending their data to the cloud, without enterprise
              pricing, and without complexity. Whether you are a solo founder or a growing company,
              Stone AI puts an entire department of AI specialists at your fingertips.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Our Mission</h2>
            <p>
              Make AI accessible, private, and affordable for every business. We believe that the
              advantages of artificial intelligence should not be locked behind six-figure contracts
              or require handing your most sensitive data to third parties. Stone AI was founded on
              the principle that businesses deserve both power and privacy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">43 AI Specialist Agents</h2>
            <p>
              Stone AI provides 43 purpose-built AI agents spanning every major business department —
              marketing, sales, finance, legal, HR, operations, engineering, customer support, strategy,
              and more. Each agent carries domain-specific knowledge and is designed to deliver
              actionable guidance, not generic responses. Pick the specialist you need, ask your
              question, and get results that move your business forward.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Local-First AI</h2>
            <p>
              By default, your conversations are processed on our own hardware using Llama 3.1 70B
              running on local GPU inference. Your prompts and responses never leave our infrastructure
              and are never sent to third-party AI providers. For teams that need the highest
              capability, we also offer optional cloud AI powered by OpenAI GPT-4o — but the choice
              is always yours.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Your Data Stays Yours</h2>
            <p>
              Privacy is not an add-on at Stone AI — it is the default. Local-first processing means
              your business conversations, strategy discussions, and proprietary information stay on
              our servers and are never used to train AI models. We encrypt data at rest with
              AES-256-GCM, enforce strict access controls, and give you full ownership of everything
              you create on the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Built for Businesses That Move Fast</h2>
            <p>
              Stone AI is designed for speed — fast inference, fast answers, fast decisions. No setup
              wizards that take a week. No consultants required. Sign up, pick an agent, and start
              getting value in minutes. We offer flexible pricing from a free tier all the way to
              Pro plans with API access and reseller capabilities, so the platform scales with you.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Contact</h2>
            <p>
              Have questions or want to learn more? Reach us at{" "}
              <a href="mailto:support@stone-ai.net" className="text-emerald-400 hover:underline">
                support@stone-ai.net
              </a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
