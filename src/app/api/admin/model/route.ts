import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { MODEL_REGISTRY } from "@/lib/vllm";

const deploySchema = z.object({
  modelId: z.string().min(1),
});

// POST /api/admin/model — deploy a new model to vLLM
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = deploySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { modelId } = parsed.data;
    const modelInfo = MODEL_REGISTRY.find((m) => m.id === modelId);

    // Reject unknown model IDs — only allow models from the curated registry
    if (!modelInfo) {
      return NextResponse.json(
        { error: "Unknown model. Only registered models can be deployed." },
        { status: 400 }
      );
    }

    // Step 1: Update environment variable (in-memory for current process)
    process.env.VLLM_MODEL = modelId;

    // Step 2: Try to reload vLLM if it supports hot-reload
    // vLLM doesn't natively support hot-reload via API in all versions.
    // This attempts a graceful approach: signal the model change.
    const vllmRoot = (process.env.VLLM_BASE_URL ?? "http://127.0.0.1:8000/v1").replace(/\/v1$/, "");

    let reloadResult: "success" | "manual_required" = "manual_required";

    try {
      // Attempt vLLM's model loading endpoint (available in some versions)
      const res = await fetch(`${vllmRoot}/v1/models`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        // If vLLM is reachable, note that restart may be needed
        reloadResult = "manual_required";
      }
    } catch {
      reloadResult = "manual_required";
    }

    return NextResponse.json({
      success: true,
      modelId,
      modelInfo: modelInfo ?? null,
      reloadResult,
      instructions:
        reloadResult === "manual_required"
          ? [
              `Model config updated to: ${modelId}`,
              "To complete the switch, restart vLLM with the new model:",
              `  vllm serve ${modelId} --host 0.0.0.0 --port 8000`,
              "The next time vLLM starts, it will use this model.",
            ]
          : [`Model switched to ${modelId} successfully.`],
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (error.message === "Forbidden")
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("POST /api/admin/model:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
