import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-[12px] border border-bone-dark bg-bone-light px-4 py-3 text-[15px] text-onyx font-sans transition-all duration-200 placeholder:text-walnut-light placeholder:italic focus:outline-none focus:ring-2 focus:ring-cedar/30 focus:border-cedar disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
