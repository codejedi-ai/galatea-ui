import { cn } from "@/lib/utils"

interface PanelToggleIconProps {
  /** Panel is open. The chevron points left to collapse and right to expand. */
  open: boolean
  className?: string
}

/**
 * Rounded square with a vertical divider that runs past the top and bottom
 * edges, so each junction is a cross. The chevron sits in the wide pane,
 * matching PanelLeftClose / PanelLeftOpen.
 */
export function PanelToggleIcon({ open, className }: PanelToggleIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("overflow-visible", className)}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 -1v26" />
      {open ? <path d="m16 15-3-3 3-3" /> : <path d="m14 9 3 3-3 3" />}
    </svg>
  )
}
