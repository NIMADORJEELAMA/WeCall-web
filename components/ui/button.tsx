import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] cursor-pointer",
  {
    variants: {
      variant: {
        // The "Confirm" black button from reference
        terminal:
          "bg-black text-white hover:bg-slate-800 shadow-sm border-2 border-transparent",

        // The "Cancel" white button from reference
        outline:
          "bg-white text-slate-900 border border-slate-200 hover:bg-slate-800 hover:text-white hover:border-slate-800 shadow-sm",

        // Standard destructive (red) variant
        destructive: "bg-red-600 text-white shadow-sm hover:bg-red-700",
        success:
          "bg-emerald-600 text-white shadow-md hover:bg-emerald-700 shadow-emerald-100 border-2 border-transparent",

        // A minimal ghost version of success
        successGhost:
          "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100",
        // Default shadcn/ui variants (kept for compatibility)
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/70",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        terminalGhost:
          "bg-transparent text-black border-2 border-gray-200 hover:bg-gray-200   transition-all duration-200",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // Matches the "py-3.5" or "py-6" height from your forms
        default: "h-12 px-6 py-3",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-2xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "terminal",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
