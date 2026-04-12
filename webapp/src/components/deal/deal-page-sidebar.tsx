import { SidebarAdSlot } from "@/components/ads/sidebar-ad-slot";

type DealPageSidebarProps = {
  variant?: "default" | "single";
};

export function DealPageSidebar({ variant = "default" }: DealPageSidebarProps) {
  if (variant === "single") {
    return (
      <aside>
        <div className="lg:sticky lg:top-24">
          <SidebarAdSlot className="min-h-62.5" />
        </div>
      </aside>
    );
  }

  return (
    <aside className="space-y-5 lg:h-full">
      <SidebarAdSlot className="min-h-62.5" />
      <SidebarAdSlot size="300x250" className="min-h-62.5" />
      <div className="lg:sticky lg:top-24">
        <SidebarAdSlot className="min-h-62.5" />
      </div>
    </aside>
  );
}
