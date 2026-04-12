import { requirePermission } from "@/lib/guards";
import { PostsClient } from "@/components/posts";

export default async function PostsPage() {
  await requirePermission("manage_posts");
  return <PostsClient />;
}
