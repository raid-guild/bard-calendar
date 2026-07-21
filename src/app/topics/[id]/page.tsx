import { TopicBundleWorkspace } from "@/components/topic-bundle-workspace";

type TopicPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TopicPage({ params }: TopicPageProps) {
  const { id } = await params;
  return <TopicBundleWorkspace topicId={id} />;
}
