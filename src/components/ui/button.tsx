
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 active:scale-[0.96] active:shadow-inner-lg",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-md-strong hover:bg-primary/90 hover:shadow-lg-strong hover:-translate-y-0.5",
        destructive:
          "bg-destructive text-destructive-foreground shadow-md-strong hover:bg-destructive/90 hover:shadow-lg-strong hover:-translate-y-0.5",
        outline:
          "border border-input bg-background shadow-subtle hover:bg-accent hover:text-accent-foreground hover:shadow-md-strong hover:-translate-y-0.5",
        secondary:
          "bg-secondary text-secondary-foreground shadow-subtle hover:bg-secondary/80 hover:shadow-md-strong hover:-translate-y-0.5",
        ghost: "hover:bg-accent hover:text-accent-foreground active:bg-accent/90", // Softer active state for ghost
        link: "text-primary underline-offset-4 hover:underline active:text-primary/80",
      },
      size: {
        default: "h-11 px-6 py-2.5", // Slightly more padding
        sm: "h-10 rounded-lg px-4 text-xs", // Defined sm size
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
