/**
 * Three-Headed Monster Alert System — barrel export.
 *
 * Usage:
 *   import { sendFounderAlert, AlertAgent, AlertPriority, AlertType } from "@/lib/alert-system";
 */

export { sendFounderAlert } from "./send";
export { checkCooldown, setCooldown } from "./cooldown";
export { buildAlertHtml, buildAlertSubject, getFromDisplayName } from "./templates";
export {
  AlertPriority,
  AlertAgent,
  AlertType,
  type AlertPayload,
  type AlertResult,
  type AlertMetadata,
} from "./types";
export { checkInbox, type ParsedCommand, type InboxMessage, type InboxResult } from "./inbox";
export { routeCommand, routeCommands, getAgentQueue, getAllQueues, clearAgentQueue, type QueuedCommand } from "./command-router";
export { processIncomingEmails, triageEmail, type TriageDecision } from "./inbox-manager";
// Daily digest exports removed — Forge disabled
export { sendAutoResponses } from "./auto-responder";
export { sendOutboundEmail, type OutboundEmailPayload, type OutboundEmailResult } from "./outbound";
export {
  addBatch,
  getPendingBatches,
  getBatch,
  updateBatch,
  sendBatchReminder,
  rollPendingBatches,
  processBatchResponse,
  parseApprovalResponse,
  runReminderCycle,
  getCurrentTimeET,
  getTodayET,
  type ContentItem,
  type ContentBatch,
} from "./content-approval";
