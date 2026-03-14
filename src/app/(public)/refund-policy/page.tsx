import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy | Stone AI",
  description: "Stone AI's refund and cancellation policy for subscriptions.",
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <nav aria-label="Page navigation" className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
        <Link href="/" className="text-xl font-bold">Stone AI&trade;</Link>
        <Link href="/" className="text-sm text-zinc-400 hover:text-white flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </nav>

      <main id="main-content" className="px-6 py-12 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Refund &amp; Cancellation Policy</h1>
        <p className="text-zinc-400 text-sm mb-10">Last updated: March 13, 2026</p>

        <div className="prose prose-invert prose-zinc max-w-none space-y-8 text-sm text-zinc-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white">Cancellation</h2>
            <p>
              You may cancel your subscription at any time through your Billing settings at{" "}
              <a href="https://app.stone-ai.net/app/billing" className="text-emerald-400 underline">
                app.stone-ai.net/app/billing
              </a>{" "}
              or through the Stripe customer portal. Cancellation takes effect at the end of your
              current billing period. You will retain full access to your plan features until the end
              of the period you have already paid for.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Refund Policy</h2>
            <p>
              Stone AI does not provide partial refunds for unused portions of a billing period. No
              prorated refunds are issued for tier downgrades. If you cancel mid-cycle, you will not
              be charged for the next billing period, but no refund will be issued for the current
              period.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Free Trials and Promotional Pricing</h2>
            <p>
              If you signed up for a free trial or promotional offer, your subscription will
              automatically renew at the standard rate for your selected tier at the end of the trial
              or promotional period unless you cancel before that date. Standard rates: Starter
              $19.99/mo, Plus $49.99/mo, Smart $99.99/mo, Pro $200/mo.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">How to Cancel</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Log in to your Stone AI account</li>
              <li>Navigate to Billing settings</li>
              <li>Click &ldquo;Manage Billing&rdquo; to access the Stripe customer portal</li>
              <li>Select &ldquo;Cancel subscription&rdquo;</li>
            </ol>
            <p className="mt-3">
              Alternatively, contact{" "}
              <a href="mailto:support@stone-ai.net" className="text-emerald-400 underline">
                support@stone-ai.net
              </a>{" "}
              and we will process your cancellation within 1 business day.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Contact</h2>
            <address className="not-italic">
              <p>Stone AI</p>
              <p>4879 State Hwy 30, #183</p>
              <p>Amsterdam, NY 12010</p>
              <p>
                <a href="mailto:support@stone-ai.net" className="text-emerald-400 underline">
                  support@stone-ai.net
                </a>
              </p>
            </address>
          </section>
        </div>
      </main>
    </div>
  );
}
