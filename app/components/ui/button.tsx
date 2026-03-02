import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-[11px] font-bold uppercase tracking-[1.5px] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none",
  {
    variants: {
      variant: {
        default: "bg-cedar text-bone hover:bg-cedar-light hover:scale-[1.02] shadow-[0_1px_3px_rgba(22,25,16,0.06)] active:scale-95",
        outline: "border border-cedar bg-transparent text-cedar hover:bg-cedar/5 hover:scale-[1.02]",
        ghost: "text-moss hover:text-cedar hover:bg-bone-muted/50",
      },
      size: {
        default: "h-11 px-7 py-3",
        sm: "h-9 px-4 py-2 text-[9px]",
        lg: "h-14 px-8 py-4",
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
