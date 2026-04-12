"use client";

import { type ComponentProps, forwardRef, useState } from "react";
import { cn } from "@/lib/utils";

export const Avatar = forwardRef<HTMLSpanElement, ComponentProps<"span">>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn("relative inline-flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted", className)}
      {...props}
    />
  ),
);
Avatar.displayName = "Avatar";

export const AvatarImage = forwardRef<HTMLImageElement, ComponentProps<"img">>(
  ({ className, onError, src, ...props }, ref) => {
    const [failed, setFailed] = useState(false);
    if (!src || failed) return null;

    return (
      <img
        ref={ref}
        src={src}
        className={cn("h-full w-full object-cover", className)}
        onError={(event) => {
          setFailed(true);
          onError?.(event);
        }}
        {...props}
      />
    );
  },
);
AvatarImage.displayName = "AvatarImage";

export const AvatarFallback = forwardRef<HTMLSpanElement, ComponentProps<"span">>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "absolute inset-0 flex items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground",
        className,
      )}
      {...props}
    />
  ),
);
AvatarFallback.displayName = "AvatarFallback";

export const AvatarBadge = forwardRef<HTMLSpanElement, ComponentProps<"span">>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500",
        className,
      )}
      {...props}
    />
  ),
);
AvatarBadge.displayName = "AvatarBadge";

export const AvatarGroup = forwardRef<HTMLDivElement, ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center -space-x-2", className)} {...props} />
  ),
);
AvatarGroup.displayName = "AvatarGroup";

export const AvatarGroupCount = forwardRef<HTMLSpanElement, ComponentProps<"span">>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold text-secondary",
        className,
      )}
      {...props}
    />
  ),
);
AvatarGroupCount.displayName = "AvatarGroupCount";

