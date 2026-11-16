import {
  Bot,
  Compass,
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
    id: "bots",
    label: "Bots",
    icon: Bot,
    items: [{ label: "My Bots", href: "/bots", icon: Bot }],
  },
  {
    id: "discover",
    label: "Discover",
    icon: Compass,
    items: [
      { label: "Discover", href: "/discover", icon: Sparkles },
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
      { label: "Profile", href: "/profile", icon: User },
    ],
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
