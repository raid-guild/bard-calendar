import { listBundleRuns, listContentAssets } from "@/lib/bundles/queries";
import { getTopic, listDrafts } from "@/lib/content/queries";
import { listEvents } from "@/lib/events/queries";

export async function getTopicBundle(
  topicId: string,
  portalUserId?: string | null,
) {
  const topic = await getTopic(topicId);

  if (!topic) {
    return null;
  }

  const [drafts, runs, assets, publishingEvents] = await Promise.all([
    listDrafts({ topic_id: topicId }, portalUserId),
    listBundleRuns(topicId),
    listContentAssets(topicId),
    listEvents({ topic_id: topicId, status: "published", order: "desc" }),
  ]);

  return {
    topic,
    drafts,
    runs,
    assets,
    publishing_events: publishingEvents,
    latest_run: runs[0] ?? null,
  };
}
