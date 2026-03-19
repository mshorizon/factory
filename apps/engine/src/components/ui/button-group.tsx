import * as React from "react"

import { cn } from "@/lib/utils"

const ButtonGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex items-center rounded-md border border-border shadow-sm",
      "[&>*:not(:first-child):not(:last-child)]:rounded-none",
      "[&>*:first-child]:rounded-r-none [&>*:first-child]:border-r-0",
      "[&>*:last-child]:rounded-l-none [&>*:last-child]:border-l-0",
      "[&>*:not(:first-child):not(:last-child)]:border-x-0",
      "[&>button]:border-0 [&>a]:border-0 [&>span]:border-0",
      className
    )}
    {...props}
  />
))
ButtonGroup.displayName = "ButtonGroup"

const ButtonGroupText = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "inline-flex items-center gap-1.5 px-3 text-sm text-muted-foreground",
      className
    )}
    {...props}
  />
))
ButtonGroupText.displayName = "ButtonGroupText"

const ButtonGroupSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("w-px self-stretch bg-border", className)}
    {...props}
  />
))
ButtonGroupSeparator.displayName = "ButtonGroupSeparator"

export { ButtonGroup, ButtonGroupText, ButtonGroupSeparator }
