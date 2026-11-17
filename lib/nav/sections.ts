import {
  Compass,
  Globe,
  HeartHandshake,
  KeyRound,
  LayoutDashboard,
  MessageCircle,
  MessageSquare,
  Mic,
  Plug,
  Settings,
  Sparkles,
  User,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

export interface NavSection {
  id: string
  label: string
  icon: LucideIcon
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    id: "companion",
    label: "Companion",
    icon: HeartHandshake,
    items: [
      { label: "Chat", href: "/companion", icon: MessageCircle },
      { label: "Voice", href: "/voice", icon: Mic },
    ],
  },
  {
    id: "discover",
    label: "Discover",
    icon: Compass,
    items: [{ label: "Discover", href: "/discover", icon: Sparkles }],
  },
  {
    id: "profile",
    label: "Profile",
    icon: User,
    items: [{ label: "Profile", href: "/profile", icon: User }],
  },
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Data residency", href: "/dashboard/data-residency", icon: Globe },
    ],
  },
  {
    id: "messages",
    label: "Messages",
    icon: MessageSquare,
    items: [{ label: "Messages", href: "/dashboard/messages", icon: MessageSquare }],
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    items: [
      { label: "Overview", href: "/settings", icon: Settings },
      { label: "Integrations", href: "/settings/integrations", icon: KeyRound },
      { label: "Agents", href: "/settings/agents", icon: Plug },
    ],
  },
  {
    id: "plugins",
    label: "Plugins",
    icon: Plug,
    items: [{ label: "Plugins", href: "/plugins", icon: Plug }],
  },
]

function normalize(pathname: string | null | undefined): string {
  if (!pathname) return ""
  const p = pathname.split(/[?#]/)[0]
  return p.length > 1 ? p.replace(/\/+$/, "") : p
}

export function getActiveItem(
  pathname: string | null | undefined,
): { section: NavSection; item: NavItem } | null {
  const path = normalize(pathname)
  if (!path) return null
  let best: { section: NavSection; item: NavItem } | null = null
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (path === item.href || path.startsWith(item.href + "/")) {
        if (!best || item.href.length > best.item.href.length) best = { section, item }
      }
    }
  }
  return best
}

export function getActiveSection(pathname: string | null | undefined): NavSection | null {
  return getActiveItem(pathname)?.section ?? null
}
