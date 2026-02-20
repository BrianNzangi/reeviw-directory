import { requirePermission } from "@/lib/guards";
import { PostEditor } from "../post-editor";

export default async function NewPostPage() {
  await requirePermission("manage_posts");
  return <PostEditor mode="create" />;
}
