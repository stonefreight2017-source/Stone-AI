/**
 * Inbox Polling Manager for Three-Headed Monster command system.
 * Calls checkInbox() on a configurable interval and stores the last result
 * in memory for quick access by the Palace GUI or other consumers.
 *
 * Usage:
 *   import { inboxPoller } from './inbox-poller';
 *   inboxPoller.startPolling();   // default 60s
 *   inboxPoller.stopPolling();
 *   inboxPoller.getLastResult();
 */

import { checkInbox, type InboxResult } from "./inbox";

const DEFAULT_INTERVAL_MS = 60_000; // 60 seconds
const PREFIX = "[INBOX-POLLER]";

class InboxPoller {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private intervalMs: number = DEFAULT_INTERVAL_MS;
  private lastResult: InboxResult | null = null;
  private lastPollAt: Date | null = null;
  private pollCount: number = 0;
  private running: boolean = false;

  /**
   * Start polling the inbox at the given interval.
   * If already polling, stops the current interval and restarts with the new one.
   */
  startPolling(intervalMs?: number): void {
    if (this.intervalId) {
      this.stopPolling();
    }

    this.intervalMs = intervalMs ?? DEFAULT_INTERVAL_MS;
    this.running = true;

    console.log(
      `${PREFIX} Starting inbox polling every ${this.intervalMs / 1000}s`
    );

    // Run immediately on start, then on interval
    this.poll();
    this.intervalId = setInterval(() => this.poll(), this.intervalMs);
  }

  /**
   * Stop polling.
   */
  stopPolling(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.running = false;
    console.log(`${PREFIX} Polling stopped. Total polls this session: ${this.pollCount}`);
  }

  /**
   * Whether the poller is currently running.
   */
  isPolling(): boolean {
    return this.running;
  }

  /**
   * Get the last poll result (null if never polled).
   */
  getLastResult(): {
    result: InboxResult | null;
    lastPollAt: Date | null;
    pollCount: number;
    polling: boolean;
    intervalMs: number;
  } {
    return {
      result: this.lastResult,
      lastPollAt: this.lastPollAt,
      pollCount: this.pollCount,
      polling: this.running,
      intervalMs: this.intervalMs,
    };
  }

  /**
   * Execute a single poll cycle.
   */
  private async poll(): Promise<void> {
    try {
      const result = await checkInbox();
      this.lastResult = result;
      this.lastPollAt = new Date();
      this.pollCount++;

      if (result.success) {
        console.log(
          `${PREFIX} Poll #${this.pollCount} — ${result.messages.length} message(s), ${result.commands.length} command(s)`
        );

        // Log each command found
        for (const cmd of result.commands) {
          console.log(
            `${PREFIX} COMMAND: @${cmd.agent.toUpperCase()} ${cmd.command} (from: ${cmd.from})`
          );
        }
      } else {
        console.error(`${PREFIX} Poll #${this.pollCount} failed: ${result.error}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`${PREFIX} Poll #${this.pollCount + 1} exception: ${msg}`);
      this.lastResult = {
        success: false,
        messages: [],
        commands: [],
        error: msg,
      };
      this.lastPollAt = new Date();
      this.pollCount++;
    }
  }
}

/** Singleton inbox poller instance */
export const inboxPoller = new InboxPoller();
