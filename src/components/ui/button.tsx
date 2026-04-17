import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-border bg-transparent hover:bg-secondary hover:border-primary/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-secondary hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 bg-[length:200%_100%] text-primary-foreground font-semibold shadow-[0_8px_24px_-6px_hsl(20_85%_55%/0.45)] hover:bg-[position:100%_0] hover:shadow-[0_12px_36px_-8px_hsl(20_85%_55%/0.6)] transform hover:scale-[1.03]",
        heroOutline: "rounded-full border-[1.5px] border-amber-500/50 bg-amber-500/5 backdrop-blur-sm text-foreground font-semibold hover:bg-gradient-to-r hover:from-amber-500/15 hover:via-amber-400/10 hover:to-orange-500/15 hover:border-amber-400 hover:shadow-[0_8px_24px_-8px_hsl(20_85%_55%/0.4)]",
      },
      size: {
        default: "h-10 px-6 py-2 rounded-sm",
        sm: "h-9 rounded-sm px-4",
        lg: "h-12 rounded-sm px-8 text-base",
        xl: "h-14 rounded-sm px-10 text-base tracking-wide",
        icon: "h-10 w-10 rounded-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
