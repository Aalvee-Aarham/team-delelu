import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-45 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-ink bg-[var(--brand-amber)] text-ink hover:bg-[color-mix(in_srgb,var(--brand-amber)_86%,var(--ink))]",
        primary:
          "border-primary bg-primary text-primary-foreground hover:bg-[color-mix(in_srgb,var(--primary)_88%,var(--ink))]",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-accent aria-expanded:bg-accent",
        outline:
          "border-ink/20 bg-card text-foreground hover:border-ink/45 hover:bg-paper aria-expanded:border-ink/45",
        ghost:
          "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground aria-expanded:bg-accent",
        destructive:
          "border-destructive bg-destructive text-destructive-foreground hover:bg-[color-mix(in_srgb,var(--destructive)_86%,var(--ink))]",
        link: "border-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 gap-2 px-3.5",
        xs: "h-6 gap-1 rounded-sm px-2 text-[11px] [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-3 text-[13px] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-2 px-5",
        icon: "size-9",
        "icon-xs": "size-6 rounded-sm [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
