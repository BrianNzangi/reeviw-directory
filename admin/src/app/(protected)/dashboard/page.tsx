import { requireMe } from "@/lib/me";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const me = await requireMe();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="text-sm text-slate-600">Overview and quick access to CMS modules.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: "Posts", value: "--" },
          { label: "Tools", value: "--" },
          { label: "Pending Reviews", value: "--" },
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
