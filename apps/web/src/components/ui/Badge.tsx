// apps/web/src/components/ui/Badge.tsx
import React from "react";

export function Badge({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`inline-flex items-center rounded-md border border-black/10 bg-black/[0.03] px-2 py-1 text-xs font-medium text-black/65 ${className}`}
      {...props}
    />
  );
}
