import { and, desc, eq } from "drizzle-orm";
import {
  mapCreateBundleRunInputToRow,
  mapRowToBundleRun,
  mapRowToContentAsset,
  mapUpdateBundleRunInputToRow,
  mapUpsertContentAssetInputToRow,
  mapUpsertContentAssetInputToUpdateRow,
} from "@/lib/bundles/mapping";
import type {
  CreateBundleRunInput,
  UpdateBundleRunInput,
  UpsertContentAssetInput,
} from "@/lib/bundles/validation";
import { getDb } from "@/lib/db/client";
import { contentAssets, contentBundleRuns } from "@/lib/db/schema";

export async function createBundleRun(
  topicId: string,
  input: CreateBundleRunInput,
  createdBy?: string | null,
) {
  const db = getDb();
  const [row] = await db
    .insert(contentBundleRuns)
    .values(mapCreateBundleRunInputToRow(topicId, input, createdBy))
    .returning();
  return mapRowToBundleRun(row);
}

export async function getBundleRun(id: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(contentBundleRuns)
    .where(eq(contentBundleRuns.id, id));
  return row ? mapRowToBundleRun(row) : null;
}

export async function getBundleRunByPrismRequestId(prismRequestId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(contentBundleRuns)
    .where(eq(contentBundleRuns.prismRequestId, prismRequestId));
  return row ? mapRowToBundleRun(row) : null;
}

export async function getBundleRunByIdempotencyKey(topicId: string, idempotencyKey: string) {
  const db = getDb();
  const [row] = await db.select().from(contentBundleRuns).where(
    and(eq(contentBundleRuns.topicId, topicId), eq(contentBundleRuns.idempotencyKey, idempotencyKey)),
  );
  return row ? mapRowToBundleRun(row) : null;
}

export async function listBundleRuns(topicId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(contentBundleRuns)
    .where(eq(contentBundleRuns.topicId, topicId))
    .orderBy(desc(contentBundleRuns.createdAt));
  return rows.map(mapRowToBundleRun);
}

export async function updateBundleRun(
  id: string,
  input: UpdateBundleRunInput,
) {
  const db = getDb();
  const [row] = await db
    .update(contentBundleRuns)
    .set(mapUpdateBundleRunInputToRow(input))
    .where(eq(contentBundleRuns.id, id))
    .returning();
  return row ? mapRowToBundleRun(row) : null;
}

export async function listContentAssets(topicId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(contentAssets)
    .where(eq(contentAssets.topicId, topicId))
    .orderBy(desc(contentAssets.createdAt));
  return rows.map(mapRowToContentAsset);
}

export async function getContentAsset(id: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(contentAssets)
    .where(eq(contentAssets.id, id));
  return row ? mapRowToContentAsset(row) : null;
}

export async function upsertContentAsset(input: UpsertContentAssetInput) {
  const db = getDb();
  const now = new Date();
  const [row] = await db
    .insert(contentAssets)
    .values(mapUpsertContentAssetInputToRow(input))
    .onConflictDoUpdate({
      target: [contentAssets.prismRequestId, contentAssets.prismArtifactId],
      set: mapUpsertContentAssetInputToUpdateRow(input, now),
    })
    .returning();
  return mapRowToContentAsset(row);
}
