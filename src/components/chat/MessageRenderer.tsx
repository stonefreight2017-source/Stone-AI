"use client";

import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Copy, Check } from "lucide-react";
import { useState, useCallback } from "react";

const CHART_COLORS = [
  "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6",
  "#ef4444", "#06b6d4", "#ec4899", "#f97316",
];

interface ChartData {
  type: "bar" | "line" | "pie" | "area";
  title?: string;
  data: Record<string, string | number>[];
  xKey?: string;
  yKeys?: string[];
  colors?: string[];
}

function parseChartBlock(code: string): ChartData | null {
  try {
    const parsed = JSON.parse(code);
    if (parsed && parsed.type && Array.isArray(parsed.data) && parsed.data.length > 0) {
      return parsed as ChartData;
    }
    return null;
  } catch {
    return null;
  }
}

function ChartRenderer({ chart }: { chart: ChartData }) {
  const xKey = chart.xKey || Object.keys(chart.data[0])[0];
  const yKeys =
    chart.yKeys ||
    Object.keys(chart.data[0]).filter((k) => k !== xKey && typeof chart.data[0][k] === "number");
  const colors = chart.colors || CHART_COLORS;

  return (
    <div className="my-4 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
      {chart.title && (
        <p className="text-sm font-semibold text-zinc-200 mb-3">{chart.title}</p>
      )}
      <ResponsiveContainer width="100%" height={280}>
        {chart.type === "bar" ? (
          <BarChart data={chart.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey={xKey} tick={{ fill: "#9ca3af", fontSize: 12 }} />
            <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: 8 }}
              labelStyle={{ color: "#e4e4e7" }}
            />
            <Legend />
            {yKeys.map((key, i) => (
              <Bar key={key} dataKey={key} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        ) : chart.type === "line" ? (
          <LineChart data={chart.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey={xKey} tick={{ fill: "#9ca3af", fontSize: 12 }} />
            <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: 8 }}
              labelStyle={{ color: "#e4e4e7" }}
            />
            <Legend />
            {yKeys.map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[i % colors.length]}
                strokeWidth={2}
                dot={{ fill: colors[i % colors.length], r: 4 }}
              />
            ))}
          </LineChart>
        ) : chart.type === "area" ? (
          <AreaChart data={chart.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey={xKey} tick={{ fill: "#9ca3af", fontSize: 12 }} />
            <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: 8 }}
              labelStyle={{ color: "#e4e4e7" }}
            />
            <Legend />
            {yKeys.map((key, i) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[i % colors.length]}
                fill={colors[i % colors.length]}
                fillOpacity={0.2}
              />
            ))}
          </AreaChart>
        ) : (
          <PieChart>
            <Tooltip
              contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: 8 }}
              labelStyle={{ color: "#e4e4e7" }}
            />
            <Legend />
            <Pie
              data={chart.data}
              dataKey={yKeys[0] || "value"}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {chart.data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function CodeBlockCopy({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 rounded bg-zinc-700/80 hover:bg-zinc-600 text-zinc-400 hover:text-white transition-colors opacity-0 group-hover/code:opacity-100"
      aria-label="Copy code"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

interface MessageRendererProps {
  content: string;
}

export const MessageRenderer = memo(function MessageRenderer({ content }: MessageRendererProps) {
  const components = useMemo(
    () => ({
      // Code blocks — syntax highlighted with chart detection
      code({
        className,
        children,
        ...props
      }: React.ComponentPropsWithoutRef<"code"> & { className?: string }) {
        const match = /language-(\w+)/.exec(className || "");
        const codeStr = String(children).replace(/\n$/, "");

        // Detect chart blocks
        if (match && match[1] === "chart") {
          const chart = parseChartBlock(codeStr);
          if (chart) return <ChartRenderer chart={chart} />;
        }

        // Multi-line code blocks
        if (match || codeStr.includes("\n")) {
          return (
            <div className="relative group/code my-3">
              <CodeBlockCopy code={codeStr} />
              <SyntaxHighlighter
                style={oneDark}
                language={match?.[1] || "text"}
                PreTag="div"
                customStyle={{
                  margin: 0,
                  borderRadius: 8,
                  fontSize: "13px",
                  border: "1px solid #3f3f46",
                }}
              >
                {codeStr}
              </SyntaxHighlighter>
            </div>
          );
        }

        // Inline code
        return (
          <code className="px-1.5 py-0.5 bg-zinc-800 text-amber-300 text-[13px] rounded font-mono" {...props}>
            {children}
          </code>
        );
      },

      // Tables
      table({ children }: React.ComponentPropsWithoutRef<"table">) {
        return (
          <div className="overflow-x-auto my-3 rounded-lg border border-zinc-700/50">
            <table className="w-full text-sm">{children}</table>
          </div>
        );
      },
      thead({ children }: React.ComponentPropsWithoutRef<"thead">) {
        return <thead className="bg-zinc-800/80">{children}</thead>;
      },
      th({ children }: React.ComponentPropsWithoutRef<"th">) {
        return (
          <th className="px-3 py-2 text-left text-xs font-semibold text-zinc-300 border-b border-zinc-700">
            {children}
          </th>
        );
      },
      td({ children }: React.ComponentPropsWithoutRef<"td">) {
        return (
          <td className="px-3 py-2 text-zinc-300 border-b border-zinc-800/50">
            {children}
          </td>
        );
      },

      // Headings
      h1({ children }: React.ComponentPropsWithoutRef<"h1">) {
        return <h1 className="text-xl font-bold text-white mt-4 mb-2">{children}</h1>;
      },
      h2({ children }: React.ComponentPropsWithoutRef<"h2">) {
        return <h2 className="text-lg font-bold text-white mt-4 mb-2">{children}</h2>;
      },
      h3({ children }: React.ComponentPropsWithoutRef<"h3">) {
        return <h3 className="text-base font-semibold text-white mt-3 mb-1.5">{children}</h3>;
      },

      // Lists
      ul({ children }: React.ComponentPropsWithoutRef<"ul">) {
        return <ul className="list-disc list-inside space-y-1 my-2 text-zinc-300">{children}</ul>;
      },
      ol({ children }: React.ComponentPropsWithoutRef<"ol">) {
        return <ol className="list-decimal list-inside space-y-1 my-2 text-zinc-300">{children}</ol>;
      },
      li({ children }: React.ComponentPropsWithoutRef<"li">) {
        return <li className="text-zinc-300 leading-relaxed">{children}</li>;
      },

      // Blockquotes
      blockquote({ children }: React.ComponentPropsWithoutRef<"blockquote">) {
        return (
          <blockquote className="border-l-3 border-amber-500 pl-4 my-3 text-zinc-400 italic">
            {children}
          </blockquote>
        );
      },

      // Links
      a({ href, children }: React.ComponentPropsWithoutRef<"a">) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
          >
            {children}
          </a>
        );
      },

      // Horizontal rule
      hr() {
        return <hr className="border-zinc-700 my-4" />;
      },

      // Strong / em
      strong({ children }: React.ComponentPropsWithoutRef<"strong">) {
        return <strong className="font-semibold text-white">{children}</strong>;
      },

      // Paragraphs
      p({ children }: React.ComponentPropsWithoutRef<"p">) {
        return <p className="text-zinc-200 leading-relaxed mb-2 last:mb-0">{children}</p>;
      },
    }),
    []
  );

  return (
    <div className="text-sm prose-invert max-w-none">
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
});
