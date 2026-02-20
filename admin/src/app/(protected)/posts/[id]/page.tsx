import { requirePermission } from "@/lib/guards";
import { PostEditor } from "../post-editor";

export default async function EditPostPage({ params }: { params: { id: string } }) {
  await requirePermission("manage_posts");
  return <PostEditor mode="edit" postId={params.id} />;
}
