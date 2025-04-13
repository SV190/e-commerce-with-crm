import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full transition-all duration-200 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-white border border-gray-300 rounded-lg hover:border-gray-400 focus:border-blue-500 focus:ring focus:ring-blue-200",
        ghost: "border-none shadow-none bg-transparent",
        filled: "bg-gray-100 border border-gray-100 rounded-lg focus:bg-white focus:border-blue-500",
        outline: "bg-transparent border border-gray-300 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200",
        underlined: "border-b border-gray-300 rounded-none px-0 hover:border-gray-400 focus:border-blue-500 focus:ring-0",
        glass: "bg-white/40 backdrop-blur-sm border border-white/30 rounded-lg hover:bg-white/50 focus:bg-white/70 focus:border-blue-400",
      },
      inputSize: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 py-1 text-xs",
        lg: "h-12 px-5 py-3 text-base",
      }
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default"
    }
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, inputSize, label, error, type, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(inputVariants({ variant, inputSize, className }))}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-500 mt-1">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants } 