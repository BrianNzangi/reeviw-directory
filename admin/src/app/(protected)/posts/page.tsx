import { requirePermission } from "@/lib/guards";
import { PostsClient } from "./posts-client";

export default async function PostsPage() {
  await requirePermission("manage_posts");
  return <PostsClient />;
}
