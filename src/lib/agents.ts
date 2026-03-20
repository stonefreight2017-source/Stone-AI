import fs from "fs";
import path from "path";

export function loadPrompt(filename: string): string {
  const filePath = path.join(process.cwd(), "prompts", filename);
  return fs.readFileSync(filePath, "utf8");
}

export const agentPromptMap: Record<string, string> = {
  general_assistant: "general-assistant.txt",
  troubleshooting_specialist: "troubleshooting-specialist.txt",
  dev_specialist: "dev-specialist.txt",
  billing_specialist: "billing-specialist.txt",
  saas_ops_specialist: "saas-ops-specialist.txt",
};
