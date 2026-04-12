import { requirePermission } from "@/lib/guards";
import { PostEditor } from "@/components/posts";

export default async function NewPostPage() {
  await requirePermission("manage_posts");
  return <PostEditor mode="create" />;
}
