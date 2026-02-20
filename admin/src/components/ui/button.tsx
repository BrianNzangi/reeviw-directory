import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "danger" | "ghost";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition disabled:opacity-50",
          variant === "default" && "bg-primary text-white hover:opacity-90",
          variant === "secondary" && "bg-muted text-foreground hover:bg-muted/80",
          variant === "danger" && "bg-danger text-white hover:opacity-90",
          variant === "ghost" && "bg-transparent text-foreground hover:bg-muted",
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
