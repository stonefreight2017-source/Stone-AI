import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getVllmStatus, getCurrentModelConfig, MODEL_REGISTRY } from "@/lib/vllm";
import { db } from "@/lib/db";

// GET /api/admin/status — full system status for admin dashboard
export async function GET() {
  try {
    await requireAdmin();

    const [vllmStatus, userCount, messageCount, todayMessages] =
      await Promise.all([
        getVllmStatus(),
        db.user.count(),
        db.message.count(),
        db.dailyUsage.aggregate({
          _sum: { messagesSent: true },
          where: {
            date: new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              new Date().getDate()
            ),
          },
        }),
      ]);

    const modelConfig = getCurrentModelConfig();
    const currentModel = MODEL_REGISTRY.find(
      (m) => m.id === modelConfig.modelId
    );

    // Find better alternatives
    const betterModels = MODEL_REGISTRY.filter(
      (m) =>
        m.id !== modelConfig.modelId &&
        m.benchmarkScore > (currentModel?.benchmarkScore ?? 0)
    ).sort((a, b) => b.benchmarkScore - a.benchmarkScore);

    const shouldSwitch =
      betterModels.length > 0 &&
      betterModels[0].benchmarkScore - (currentModel?.benchmarkScore ?? 0) >= 3;

    return NextResponse.json({
      vllm: vllmStatus,
      model: {
        current: modelConfig.modelId,
        currentInfo: currentModel ?? null,
        betterAlternatives: betterModels.slice(0, 3),
        shouldSwitch,
        switchReason: shouldSwitch
          ? `${betterModels[0].name} scores ${betterModels[0].benchmarkScore} vs your current ${currentModel?.benchmarkScore ?? "?"}`
          : null,
      },
      stats: {
        totalUsers: userCount,
        totalMessages: messageCount,
        messagesToday: todayMessages._sum.messagesSent ?? 0,
      },
      registry: MODEL_REGISTRY,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (error.message === "Forbidden")
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/admin/status:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
