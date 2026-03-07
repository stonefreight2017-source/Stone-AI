import Link from "next/link";
import { ArrowLeft, Clock, Mail } from "lucide-react";

const upcomingPosts = [
  {
    title: "Why Local-First AI Matters",
    description:
      "How Stone AI keeps your data on our hardware — and why that changes everything for business privacy.",
    category: "Privacy & Security",
  },
  {
    title: "Meet Your 43 AI Specialists",
    description:
      "A deep dive into the specialized agents powering Stone AI — from legal review to marketing strategy.",
    category: "Product",
  },
  {
    title: "The Future of Private Business AI",
    description:
      "Where the industry is headed, and how local inference will reshape how companies adopt AI tools.",
    category: "Industry",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <nav className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
        <Link href="/" className="text-xl font-bold">Stone AI&trade;</Link>
        <Link href="/" className="text-sm text-zinc-400 hover:text-white flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </nav>

      <main className="px-6 py-12 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Blog</h1>
        <p className="text-zinc-400 text-sm mb-12">
          Insights, updates, and stories from the Stone AI team.
        </p>

        {/* Coming Soon Banner */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-8 text-center mb-12">
          <div className="flex justify-center mb-4">
            <Clock className="h-10 w-10 text-emerald-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
          <p className="text-zinc-400 text-sm max-w-md mx-auto">
            We&apos;re working on our first posts. Subscribe below to get notified
            when we publish new articles about AI, privacy, and building smarter
            businesses.
          </p>
        </div>

        {/* Upcoming Posts */}
        <h3 className="text-lg font-semibold mb-6">Upcoming Posts</h3>
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-3 mb-16">
          {upcomingPosts.map((post) => (
            <div
              key={post.title}
              className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col"
            >
              <span className="inline-block self-start rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-400 mb-4">
                Coming Soon
              </span>
              <h4 className="text-base font-semibold mb-2">{post.title}</h4>
              <p className="text-zinc-400 text-sm leading-relaxed flex-1">
                {post.description}
              </p>
              <p className="text-zinc-600 text-xs mt-4">{post.category}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">Stay in the Loop</h3>
          <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto">
            Want to know when new posts drop? Reach out and we&apos;ll add you to
            our mailing list.
          </p>
          <a
            href="mailto:blog@stone-ai.net?subject=Subscribe%20to%20Stone%20AI%20Blog"
            className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 transition-colors"
          >
            <Mail className="h-4 w-4" />
            Subscribe for Updates
          </a>
          <p className="text-zinc-600 text-xs mt-4">
            Or contact us at{" "}
            <a href="mailto:support@stone-ai.net" className="text-zinc-400 hover:text-white">
              support@stone-ai.net
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
