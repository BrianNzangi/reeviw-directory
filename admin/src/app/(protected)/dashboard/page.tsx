import { requireMe } from "@/lib/me";
import { Badge } from "@/components/ui/badge";
import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";

async function fetchCount(path: string) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "GET",
      headers: {
        cookie: cookieHeader,
      },
      cache: "no-store",
    });
  } catch {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as unknown;
  if (Array.isArray(data)) {
    return data.length;
  }

  if (data && typeof data === "object" && Array.isArray((data as { items?: unknown[] }).items)) {
    return (data as { items: unknown[] }).items.length;
  }

  if (data && typeof data === "object" && typeof (data as { count?: number }).count === "number") {
    return (data as { count: number }).count;
  }

  return null;
}

export default async function DashboardPage() {
  const me = await requireMe();
  const [postsCount, productsCount, categoriesCount, pendingReviewsCount, usersCount] = await Promise.all([
    fetchCount("/api/posts"),
    fetchCount("/api/admin/products/count"),
    fetchCount("/api/categories"),
    fetchCount("/api/reviews?status=pending"),
    fetchCount("/api/users"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="text-sm text-slate-600">Overview and quick access to CMS modules.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: "Posts", value: postsCount ?? "--" },
          { label: "Products", value: productsCount ?? "--" },
          { label: "Categories", value: categoriesCount ?? "--" },
          { label: "Pending Reviews", value: pendingReviewsCount ?? "--" },
          { label: "Users", value: usersCount ?? "--" },
        ].map((card) => (
          <div key={card.label} className="rounded-lg border border-border bg-card p-4">
            <div className="text-sm text-slate-500">{card.label}</div>
            <div className="mt-2 text-2xl font-semibold">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-2 text-sm text-slate-500">Session</div>
        <div className="text-sm">User: {me.user?.email}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {me.permissions.map((permission) => (
            <Badge key={permission}>{permission}</Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
