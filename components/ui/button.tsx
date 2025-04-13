import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { MotionDiv } from "@/components/ui/motion"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm focus-visible:ring-blue-600",
        destructive: "bg-red-500 text-white hover:bg-red-600 shadow-sm focus-visible:ring-red-500",
        outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-900 shadow-sm focus-visible:ring-blue-600",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500",
        ghost: "hover:bg-gray-100 text-gray-700 hover:text-gray-900",
        link: "text-blue-600 underline-offset-4 hover:underline",
        gradient: "bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800 shadow-md",
        success: "bg-green-600 text-white hover:bg-green-700 shadow-sm focus-visible:ring-green-600",
        warning: "bg-amber-500 text-white hover:bg-amber-600 shadow-sm focus-visible:ring-amber-500",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-9 w-9",
        pill: "h-10 px-6 rounded-full",
      },
      animation: {
        none: "",
        pulse: "transition-all duration-300 transform hover:scale-105 active:scale-95",
        bounce: "transition-all duration-300 active:scale-95",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "bounce"
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, animation, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <MotionDiv
        whileTap={{ scale: animation === "none" ? 1 : 0.95 }}
        whileHover={animation === "pulse" ? { scale: 1.05 } : {}}
      >
        <Comp
          className={cn(buttonVariants({ variant, size, animation, className }))}
          ref={ref}
          {...props}
        />
      </MotionDiv>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants } 