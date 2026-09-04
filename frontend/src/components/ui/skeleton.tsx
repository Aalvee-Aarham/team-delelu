import { cn } from "cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md border border-ink/5 bg-paper-deep", className)}
      {...props}
    />
  )
}

export { Skeleton }
