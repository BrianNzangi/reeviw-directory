import * as SelectPrimitive from "@radix-ui/react-select";

type SelectOption = { value: string; label: string };

type SelectProps = {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  options: SelectOption[];
};

export function Select({ value, onValueChange, placeholder, options }: SelectProps) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger className="h-10 w-full rounded-md border border-border bg-white px-3 text-left text-sm">
        <SelectPrimitive.Value placeholder={placeholder || "Select"} />
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className="z-50 rounded-md border border-border bg-white p-1 shadow-lg">
          <SelectPrimitive.Viewport>
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className="cursor-pointer rounded px-2 py-1 text-sm outline-none hover:bg-muted"
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
