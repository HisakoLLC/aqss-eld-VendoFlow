import type React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusBadgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors", {
  variants: {
    variant: {
      paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50",
      unpaid: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50",
      partial: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50",
      credit: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50",
      agreement: "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50",
      default: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof statusBadgeVariants> {
  status: string
}

export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  let variant: "paid" | "unpaid" | "partial" | "credit" | "agreement" | "default" = "default"

  const normalized = (status || "").toLowerCase().trim()

  if (normalized === "paid" || normalized === "fully paid") {
    variant = "paid"
  } else if (normalized === "unpaid") {
    variant = "unpaid"
  } else if (normalized === "partial" || normalized === "partially paid") {
    variant = "partial"
  } else if (normalized === "credit" || normalized === "on credit") {
    variant = "credit"
  } else if (normalized === "agreement" || normalized === "credit agreement") {
    variant = "agreement"
  }

  return (
    <div className={cn(statusBadgeVariants({ variant }), className)} {...props}>
      {status}
    </div>
  )
}
