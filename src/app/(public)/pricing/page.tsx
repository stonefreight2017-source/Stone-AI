import type { Metadata } from "next";
import { PricingSection } from "../pricing-section";

export const metadata: Metadata = {
  title: "Pricing — Stone AI",
  description:
    "Choose the plan that fits your ambition. From free to enterprise, Stone AI puts specialist AI agents in your corner.",
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-black text-white pt-24">
      <PricingSection />
    </main>
  );
}
