import { requirePermission } from "@/lib/guards";
import { ReviewsClient } from "./reviews-client";

export default async function ReviewsPage() {
  await requirePermission("moderate_reviews");
  return <ReviewsClient />;
}
