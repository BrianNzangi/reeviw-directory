import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectOption = { value: string; label: string; disabled?: boolean; className?: string };

type SelectProps = {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  options: SelectOption[];
};

export function Select({ value, onValueChange, placeholder, options }: SelectProps) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger className="inline-flex h-10 w-full items-center justify-between gap-2 rounded-md border border-border bg-white px-3 text-left text-sm">
        <SelectPrimitive.Value placeholder={placeholder || "Select"} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className="z-50 rounded-md border border-border bg-white p-1 shadow-lg">
          <SelectPrimitive.Viewport>
            {options
              .filter((option) => option.value !== "")
              .map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={cn(
                    "cursor-pointer rounded px-2 py-1 text-sm outline-none hover:bg-muted data-[disabled]:cursor-default data-[disabled]:opacity-60 data-[disabled]:hover:bg-transparent",
                    option.className,
                  )}
                >
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
