/**
 * Command router for Three-Headed Monster inbound commands.
 * Takes parsed commands from inbox.ts and routes them to the
 * appropriate agent queue.
 *
 * Current implementation: in-memory queue + console logging.
 * Future: trigger actual agent actions, persist to DB.
 */

import type { ParsedCommand, AgentTarget } from "./inbox";

export interface QueuedCommand extends ParsedCommand {
  queuedAt: Date;
  status: "queued" | "processing" | "completed" | "failed";
}

// In-memory command queues per agent
const queues: Record<AgentTarget, QueuedCommand[]> = {
  chaos: [],
  stone: [],
  cardinal: [],
};

/**
 * Route a single parsed command to the appropriate agent queue.
 */
export function routeCommand(cmd: ParsedCommand): QueuedCommand {
  const queued: QueuedCommand = {
    ...cmd,
    queuedAt: new Date(),
    status: "queued",
  };

  queues[cmd.agent].push(queued);

  console.log(
    `[command-router] @${cmd.agent.toUpperCase()} command queued: "${cmd.command}" (from: ${cmd.from})`
  );

  return queued;
}

/**
 * Route all parsed commands from an inbox check.
 * Returns summary of what was routed.
 */
export function routeCommands(
  commands: ParsedCommand[]
): {
  routed: QueuedCommand[];
  summary: Record<AgentTarget, number>;
} {
  const routed: QueuedCommand[] = [];
  const summary: Record<AgentTarget, number> = {
    chaos: 0,
    stone: 0,
    cardinal: 0,
  };

  for (const cmd of commands) {
    const queued = routeCommand(cmd);
    routed.push(queued);
    summary[cmd.agent]++;
  }

  if (commands.length > 0) {
    console.log(
      `[command-router] Routed ${commands.length} command(s): ` +
        `Chaos=${summary.chaos}, Stone=${summary.stone}, Cardinal=${summary.cardinal}`
    );
  }

  return { routed, summary };
}

/**
 * Get the current queue for an agent.
 */
export function getAgentQueue(agent: AgentTarget): QueuedCommand[] {
  return [...queues[agent]];
}

/**
 * Get all queued commands across all agents.
 */
export function getAllQueues(): Record<AgentTarget, QueuedCommand[]> {
  return {
    chaos: [...queues.chaos],
    stone: [...queues.stone],
    cardinal: [...queues.cardinal],
  };
}

/**
 * Clear the queue for an agent (after commands are processed).
 */
export function clearAgentQueue(agent: AgentTarget): number {
  const count = queues[agent].length;
  queues[agent] = [];
  return count;
}
