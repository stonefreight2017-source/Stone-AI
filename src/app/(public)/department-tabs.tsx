"use client";

import { useState } from "react";
import {
  Briefcase,
  Pen,
  Megaphone,
  Code,
  TrendingUp,
  Brain,
  Rocket,
  Target,
  ShoppingCart,
  Package,
  Palette,
  Magnet,
  HandshakeIcon,
  Users,
  FolderKanban,
  Truck,
  FileCheck,
  ShieldCheck,
  Newspaper,
  BookOpen,
  PenTool,
  Video,
  Mic,
  Copy,
  Languages,
  BarChart2,
  Zap,
  Globe,
  Terminal,
  Shield,
  DollarSign,
  LineChart,
  FileText,
  Building2,
  Bot,
  Heart,
  GraduationCap,
  School,
  Search,
  Scale,
  Server,
  Store,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Tier = "FREE" | "STARTER" | "PLUS" | "SMART" | "PRO" | "ENTERPRISE";

interface Agent {
  name: string;
  description: string;
  benefit: string;
  tier: Tier;
  icon: LucideIcon;
}

interface Department {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  activeColor: string;
  agents: Agent[];
}

const tierColors: Record<Tier, string> = {
  FREE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  STARTER: "bg-zinc-500/15 text-zinc-300 border-zinc-500/25",
  PLUS: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  SMART: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  PRO: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  ENTERPRISE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
};

const departments: Department[] = [
  {
    id: "business",
    label: "Business Building",
    icon: Briefcase,
    color: "text-blue-400",
    activeColor: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    agents: [
      { name: "Startup Launcher", description: "Idea validation, MVP design, pitch deck creation, financial modeling, and go-to-market strategy", benefit: "Perfect for turning your next idea into a funded startup", tier: "PRO", icon: Rocket },
      { name: "AI Automation Agency", description: "Build and scale an AI automation agency. Client acquisition, workflow design, proposal generation", benefit: "Ideal when you want to sell AI services to businesses", tier: "SMART", icon: Bot },
      { name: "Vertical AI SaaS", description: "Plan, validate, build, and scale niche AI SaaS products. Market research, MVP scoping", benefit: "Perfect for launching a focused software product", tier: "SMART", icon: Server },
      { name: "E-Commerce Store Builder", description: "End-to-end guidance for building and scaling online stores", benefit: "Ideal when you need a revenue-generating store fast", tier: "SMART", icon: Store },
      { name: "Dropshipping", description: "Product research, supplier vetting, store optimization, ad strategy", benefit: "Perfect for starting an online business with minimal inventory", tier: "SMART", icon: Package },
      { name: "Print on Demand", description: "Design strategy, niche research, listing optimization, platform selection", benefit: "Ideal when you want to sell custom products with zero inventory", tier: "PLUS", icon: Palette },
      { name: "Brand Building", description: "Brand identity, positioning, voice guidelines, visual direction", benefit: "Perfect for establishing a memorable, cohesive brand", tier: "PLUS", icon: Target },
      { name: "Lead Generation Agency", description: "Outbound systems, lead magnets, pipeline building, CRM flows", benefit: "Ideal when you need a steady stream of qualified prospects", tier: "SMART", icon: Magnet },
      { name: "Sales Agent", description: "B2B and B2C sales strategy, pipeline management, cold outreach, closing frameworks", benefit: "Perfect for building repeatable sales processes that close", tier: "PLUS", icon: HandshakeIcon },
      { name: "HR & People Operations Coach", description: "Hiring, team building, employee management, HR compliance", benefit: "Ideal when you're scaling your team and need structure", tier: "SMART", icon: Users },
      { name: "Project Management Coach", description: "Planning, executing, and delivering projects on time and budget", benefit: "Perfect for keeping complex projects on track", tier: "PLUS", icon: FolderKanban },
      { name: "Dispatch Agent", description: "Fleet management, route optimization, load planning, driver coordination", benefit: "Ideal for logistics and transportation businesses", tier: "SMART", icon: Truck },
      { name: "Claims Agent", description: "Insurance claims processing, warranty claims, dispute resolution", benefit: "Perfect for streamlining your claims workflow", tier: "SMART", icon: FileCheck },
      { name: "Compliance Agent", description: "Regulatory compliance, policy development, audit preparation", benefit: "Ideal when you need to stay ahead of regulations", tier: "SMART", icon: ShieldCheck },
    ],
  },
  {
    id: "content",
    label: "Content & Media",
    icon: Pen,
    color: "text-purple-400",
    activeColor: "bg-purple-500/15 text-purple-400 border-purple-500/25",
    agents: [
      { name: "Content Studio", description: "Multi-format content strategy, editorial calendars, content repurposing", benefit: "Perfect for building a consistent content machine", tier: "PLUS", icon: Newspaper },
      { name: "Niche Blog & Affiliate", description: "SEO content strategy, keyword research, affiliate placement", benefit: "Ideal when you want your blog to generate passive income", tier: "PLUS", icon: BookOpen },
      { name: "Writing & Editing Coach", description: "Professional writing partner. Essays, articles, emails, editing, style coaching", benefit: "Perfect for leveling up any piece of writing", tier: "PLUS", icon: PenTool },
      { name: "Video Content Strategist", description: "YouTube channel strategy, short-form content, scriptwriting, thumbnails", benefit: "Ideal when you're building a video-first brand", tier: "SMART", icon: Video },
      { name: "Podcast Production Strategist", description: "Format development, recording, distribution, audience growth", benefit: "Perfect for launching and growing a podcast", tier: "PLUS", icon: Mic },
      { name: "Copywriting", description: "Sales pages, email copy, headlines, ad copy, persuasion frameworks", benefit: "Ideal when every word needs to convert", tier: "PLUS", icon: Copy },
      { name: "Translation & Localization", description: "Translation, cultural adaptation, localization strategy", benefit: "Perfect for reaching audiences in any language", tier: "SMART", icon: Languages },
    ],
  },
  {
    id: "marketing",
    label: "Marketing & Sales",
    icon: Megaphone,
    color: "text-green-400",
    activeColor: "bg-green-500/15 text-green-400 border-green-500/25",
    agents: [
      { name: "Digital Marketing Strategist", description: "Full-spectrum digital marketing. Agency building, organic social, paid ads, client acquisition", benefit: "Perfect for building a complete marketing operation", tier: "SMART", icon: Megaphone },
      { name: "High Ticket Funnel Builder", description: "VSL creation, landing page copy, email sequences, high-ticket sales funnels", benefit: "Ideal when you're selling premium products or services", tier: "SMART", icon: Zap },
      { name: "Copywriting", description: "Sales pages, email copy, headlines, ad copy, persuasion frameworks", benefit: "Perfect for crafting copy that drives action", tier: "PLUS", icon: Copy },
      { name: "Lead Generation Agency", description: "Outbound systems, lead magnets, pipeline building, CRM flows", benefit: "Ideal when you need qualified leads on autopilot", tier: "SMART", icon: Magnet },
    ],
  },
  {
    id: "technical",
    label: "Technical",
    icon: Code,
    color: "text-amber-400",
    activeColor: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    agents: [
      { name: "Website Development", description: "Architecture planning, code generation, tech stack selection, deployment", benefit: "Perfect for building production-ready web applications", tier: "SMART", icon: Globe },
      { name: "General Coding Assistant", description: "Code generation, debugging, refactoring, code review", benefit: "Ideal when you need a second pair of eyes on your code", tier: "PLUS", icon: Terminal },
      { name: "Automation Script Development", description: "Workflow automation, API integrations, web scraping", benefit: "Perfect for eliminating repetitive tasks", tier: "SMART", icon: Zap },
      { name: "Data Analytics", description: "Dashboard design, KPI tracking, data analysis, visualization", benefit: "Ideal when you need to turn data into decisions", tier: "SMART", icon: BarChart2 },
      { name: "Cybersecurity Consultant", description: "Security audits, vulnerability assessment, hardening guides", benefit: "Perfect for protecting your business and customer data", tier: "PRO", icon: Shield },
    ],
  },
  {
    id: "finance",
    label: "Finance & Career",
    icon: TrendingUp,
    color: "text-emerald-400",
    activeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    agents: [
      { name: "Personal Finance Advisor", description: "Budgeting, saving, investing, debt management, retirement planning", benefit: "Perfect for taking control of your financial future", tier: "PLUS", icon: DollarSign },
      { name: "Trading Signal Service", description: "Technical analysis frameworks, risk management, market analysis", benefit: "Ideal when you want data-driven trading insights", tier: "SMART", icon: LineChart },
      { name: "Resume & LinkedIn Optimization", description: "ATS-optimized resumes, LinkedIn profile rewriting, career branding", benefit: "Perfect for landing more interviews and opportunities", tier: "PLUS", icon: FileText },
      { name: "Real Estate Investment Advisor", description: "Investment strategy education, rental properties, REITs, market analysis", benefit: "Ideal when you want to build wealth through real estate", tier: "SMART", icon: Building2 },
    ],
  },
  {
    id: "education",
    label: "Education & Wellness",
    icon: Brain,
    color: "text-pink-400",
    activeColor: "bg-pink-500/15 text-pink-400 border-pink-500/25",
    agents: [
      { name: "Platform Onboarding Concierge", description: "Your personal guide to Stone AI", benefit: "Perfect for getting the most out of every feature", tier: "FREE", icon: Bot },
      { name: "AI Bestie Companion", description: "Personal AI companion with custom personality and persistent memory", benefit: "Ideal when you want an AI that truly knows you", tier: "FREE", icon: Heart },
      { name: "Health & Wellness Coach", description: "Fitness, nutrition, sleep, stress management, holistic wellness", benefit: "Perfect for building sustainable healthy habits", tier: "FREE", icon: Heart },
      { name: "Academic Tutor", description: "Patient tutor for any subject, homework strategy, study techniques", benefit: "Ideal when you need clear, patient explanations", tier: "FREE", icon: GraduationCap },
      { name: "Community & Education Platform", description: "Course creation, membership structures, curriculum design", benefit: "Perfect for building and monetizing your expertise", tier: "PLUS", icon: School },
      { name: "Research Synthesis Engine", description: "Academic paper analysis, literature review, evidence-based decisions", benefit: "Ideal when you need to distill complex research fast", tier: "SMART", icon: Search },
      { name: "Legal Basics & Contract Reviewer", description: "Plain-English legal explanations, contract review", benefit: "Perfect for understanding what you're signing", tier: "SMART", icon: Scale },
      { name: "Enterprise Implementation Architect", description: "Enterprise deployment, custom workflows, API integration", benefit: "Ideal for large-scale AI deployment and integration", tier: "PRO", icon: Server },
    ],
  },
];

export function DepartmentTabs() {
  const [activeTab, setActiveTab] = useState("business");

  const activeDept = departments.find((d) => d.id === activeTab) ?? departments[0];

  function handleDeptKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
      const currentIndex = departments.findIndex((d) => d.id === activeTab);
      let nextIndex: number | null = null;

      switch (e.key) {
        case "ArrowRight":
          nextIndex = (currentIndex + 1) % departments.length;
          break;
        case "ArrowLeft":
          nextIndex = (currentIndex - 1 + departments.length) % departments.length;
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = departments.length - 1;
          break;
        default:
          return;
      }

      e.preventDefault();
      const nextDept = departments[nextIndex];
      setActiveTab(nextDept.id);
      const nextButton = document.getElementById(`dept-tab-${nextDept.id}`);
      nextButton?.focus();
  }

  return (
    <div className="mb-8">
      {/* Tab pills */}
      <div className="flex flex-wrap gap-2 mb-6" role="tablist" aria-label="Department categories">
        {departments.map((dept) => {
          const Icon = dept.icon;
          const isActive = activeTab === dept.id;
          return (
            <button
              key={dept.id}
              id={`dept-tab-${dept.id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`dept-panel-${dept.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(dept.id)}
              onKeyDown={handleDeptKeyDown}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                isActive
                  ? dept.activeColor
                  : "bg-zinc-800/40 text-zinc-400 border-zinc-700/30 hover:text-zinc-300 hover:border-zinc-600/40"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {dept.label}
              <span className={isActive ? "opacity-70" : "opacity-40"}>({dept.agents.length})</span>
            </button>
          );
        })}
      </div>

      {/* Agent cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" role="tabpanel" id={`dept-panel-${activeDept.id}`} aria-labelledby={`dept-tab-${activeDept.id}`}>
        {activeDept.agents.map((agent) => {
          const AgentIcon = agent.icon;
          return (
            <div
              key={agent.name}
              className="rounded-xl bg-zinc-800/30 border border-zinc-700/30 p-4 hover:border-zinc-600/40 transition-colors"
            >
              <div className="flex items-start gap-3 mb-2">
                <div className={`flex-shrink-0 w-9 h-9 rounded-lg bg-zinc-700/30 flex items-center justify-center`}>
                  <AgentIcon className={`h-4.5 w-4.5 ${activeDept.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="text-sm font-semibold text-white truncate">{agent.name}</h4>
                    <span className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded-full border font-medium ${tierColors[agent.tier]}`}>
                      {agent.tier}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{agent.description}</p>
                </div>
              </div>
              <p className="text-xs text-zinc-400 italic mt-2 pl-12">{agent.benefit}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
