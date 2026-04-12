import { requirePermission } from "@/lib/guards";
import { PostEditor } from "@/components/posts";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("manage_posts");
  const { id } = await params;
  return <PostEditor mode="edit" postId={id} />;
}
