import * as React from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

type ButtonVariant = "primary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm shadow-primary/20",
  outline:
    "bg-card text-foreground border border-border hover:bg-black/[0.03]",
  ghost: "text-foreground hover:bg-black/[0.04]",
  danger: "bg-danger text-white hover:bg-danger/90",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3.5 text-sm gap-1.5",
  md: "h-10 px-5 text-sm gap-2",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  // Shows a spinner in place of the button's leading icon and disables it —
  // pass the pending flag from useActionState/useTransition here.
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading = false, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-full font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading && <Spinner className="size-3.5" />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
