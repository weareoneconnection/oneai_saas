// apps/web/src/components/ui/Button.tsx
import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  ...props
}: Props) {
  const base =
    "inline-flex items-center justify-center select-none rounded-lg font-semibold transition " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 " +
    "disabled:cursor-not-allowed disabled:opacity-50";

  const sizes = size === "sm" ? "h-9 px-3 text-sm" : "h-10 px-4 text-sm";

  const variants =
    variant === "primary"
      ? "bg-black text-white hover:bg-neutral-900"
      : variant === "secondary"
        ? "border border-black/15 bg-white text-black hover:bg-black/[0.04]"
        : "border border-transparent bg-transparent text-black hover:bg-black/[0.04]";

  return (
    <button
      className={`${base} ${sizes} ${variants} ${className}`.trim()}
      disabled={disabled}
      {...props}
    />
  );
}
