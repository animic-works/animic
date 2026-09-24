import { index, integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const scoringWorker = sqliteTable("scoring_worker", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  secretHash: text("secret_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  lastSeenAt: integer("last_seen_at", { mode: "timestamp_ms" }),
  status: text("status"),
  revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
});

export const scoringLinkCode = sqliteTable("scoring_link_code", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
});

export const scoringJob = sqliteTable(
  "scoring_job",
  {
    id: text("id").primaryKey(),
    battleId: text("battle_id").notNull(),
    roomCode: text("room_code").notNull(),
    workflowVersion: text("workflow_version").notNull(),
    inputs: text("inputs").notNull(),
    state: text("state", { enum: ["queued", "running", "succeeded", "failed"] }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    workerId: text("worker_id").references(() => scoringWorker.id, { onDelete: "set null" }),
    leaseUntil: integer("lease_until", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    claimedAt: integer("claimed_at", { mode: "timestamp_ms" }),
    finishedAt: integer("finished_at", { mode: "timestamp_ms" }),
    rawResult: text("raw_result"),
    error: text("error"),
  },
  (table) => [index("scoring_job_state_created_at_idx").on(table.state, table.createdAt)],
);

export const scoringResult = sqliteTable(
  "scoring_result",
  {
    jobId: text("job_id")
      .notNull()
      .references(() => scoringJob.id, { onDelete: "cascade" }),
    participantId: text("participant_id").notNull(),
    total: real("total").notNull(),
  },
  (table) => [primaryKey({ columns: [table.jobId, table.participantId] })],
);
