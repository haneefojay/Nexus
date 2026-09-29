export const fieldCommandTypes = [
  "START_INSPECTION",
  "SAVE_RESPONSE",
  "SAVE_NOTE",
  "ADD_FINDING",
  "ADD_EVIDENCE",
  "SUBMIT_INSPECTION",
] as const;

export type FieldCommandType = (typeof fieldCommandTypes)[number];

export interface FieldCommand<TPayload = unknown> {
  commandId: string;
  inspectionRunId: string;
  userId: string;
  deviceId: string;
  sequence: number;
  occurredAt: string;
  idempotencyKey: string;
  type: FieldCommandType;
  payload: TPayload;
}
