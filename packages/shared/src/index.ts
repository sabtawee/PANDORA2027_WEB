/**
 * Contract shared between the web app and the sync agent that runs on the
 * game server. Both sides import these types, so a change on one side that
 * the other does not follow fails to compile.
 */

export const SYNC_JOB_TYPES = [
  "CREATE_GAME_ACCOUNT",
  "CHANGE_PASSWORD",
  "DELIVER_REWARD",
  "BAN",
  "UNBAN",
] as const;

export type SyncJobType = (typeof SYNC_JOB_TYPES)[number];

export const SYNC_JOB_STATUSES = ["PENDING", "PROCESSING", "DONE", "FAILED"] as const;
export type SyncJobStatus = (typeof SYNC_JOB_STATUSES)[number];

/** Password is sealed with the agent's public key; the web never holds plaintext. */
export interface CreateGameAccountPayload {
  userId: string;
  username: string;
  sealedPassword: string;
  email: string;
  sex: "M" | "F";
}

export interface ChangePasswordPayload {
  rathenaAccountId: number;
  sealedPassword: string;
}

export interface DeliverRewardPayload {
  rathenaAccountId: number;
  charId: number;
  title: string;
  message: string;
  items: { itemId: number; amount: number }[];
}

export interface BanPayload {
  rathenaAccountId: number;
  /** Unix seconds; 0 = permanent (rAthena `state = 5`). */
  until: number;
}

export type SyncJobPayloadMap = {
  CREATE_GAME_ACCOUNT: CreateGameAccountPayload;
  CHANGE_PASSWORD: ChangePasswordPayload;
  DELIVER_REWARD: DeliverRewardPayload;
  BAN: BanPayload;
  UNBAN: { rathenaAccountId: number };
};

export interface SyncJobDTO<T extends SyncJobType = SyncJobType> {
  id: string;
  type: T;
  idempotencyKey: string;
  payload: SyncJobPayloadMap[T];
  attempts: number;
  createdAt: string;
}

export interface SyncJobAck {
  status: "DONE" | "FAILED";
  error?: string;
  /** e.g. the new rAthena account_id after CREATE_GAME_ACCOUNT */
  result?: Record<string, unknown>;
}
