import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-md border border-border bg-white px-3 text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
