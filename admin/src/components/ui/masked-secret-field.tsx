"use client";

import { Input } from "@/components/ui/input";

type MaskedSecretFieldProps = {
  value: string;
  onChange: (value: string) => void;
  maskedValue?: string | null;
  placeholder?: string;
};

export function MaskedSecretField({ value, onChange, maskedValue, placeholder }: MaskedSecretFieldProps) {
  return (
    <div className="space-y-1">
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      {maskedValue && !value ? (
        <p className="text-xs text-muted-foreground">Stored: {maskedValue}</p>
      ) : null}
    </div>
  );
}
