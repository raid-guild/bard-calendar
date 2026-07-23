import { listBundleRuns, listContentAssets } from "@/lib/bundles/queries";
import { getTopic, listDrafts } from "@/lib/content/queries";

export async function getTopicBundle(
  topicId: string,
  portalUserId?: string | null,
) {
  const topic = await getTopic(topicId);

  if (!topic) {
    return null;
  }

  const [drafts, runs, assets] = await Promise.all([
    listDrafts({ topic_id: topicId }, portalUserId),
    listBundleRuns(topicId),
    listContentAssets(topicId),
  ]);

  return {
    topic,
    drafts,
    runs,
    assets,
    latest_run: runs[0] ?? null,
  };
}
