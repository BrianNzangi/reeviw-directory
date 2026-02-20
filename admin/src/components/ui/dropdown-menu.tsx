"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import type { ReactNode } from "react";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export function DropdownMenuContent({ children }: { children: ReactNode }) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content className="z-50 min-w-40 rounded-md border border-border bg-white p-1 shadow-lg">
        {children}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({ children, onSelect }: { children: ReactNode; onSelect?: () => void }) {
  return (
    <DropdownMenuPrimitive.Item
      onSelect={onSelect}
      className="cursor-pointer rounded px-2 py-1.5 text-sm outline-none hover:bg-muted"
    >
      {children}
    </DropdownMenuPrimitive.Item>
  );
}
