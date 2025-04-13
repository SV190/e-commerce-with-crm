import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium text-gray-700 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      variant: {
        default: "",
        error: "text-red-500",
        success: "text-green-500",
        warning: "text-amber-500"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
)

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {}

const Label = React.forwardRef<
  HTMLLabelElement,
  LabelProps
>(({ className, variant, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(labelVariants({ variant, className }))}
    {...props}
  />
))
Label.displayName = "Label"

export { Label, labelVariants } 