import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Users,
  Calendar,
  UserCheck,
  ClipboardList,
  Briefcase,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Home,
  Settings,
  User2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  className?: string
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'Leads',
    href: '/leads',
    icon: Users,
  },
  {
    name: 'Appointments',
    href: '/appointments',
    icon: Calendar,
  },
  {
    name: 'Teams',
    href: '/teams',
    icon: UserCheck,
  },
  {
    name: 'Tasks',
    href: '/tasks',
    icon: ClipboardList,
  },
  {
    name: 'Training Tasks',
    href: '/training-tasks',
    icon: ClipboardList,
  },
  {
    name: 'Student Profile',
    href: '/student-profile',
    icon: User2,
  },
  {
    name: 'Jobs',
    href: '/jobs',
    icon: Briefcase,
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  return (
    <aside className={cn('relative z-10 border-r bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60', className)}>
      {/* Collapse Button */}
      <div className="absolute -right-3 top-16">
        <Button
          variant="secondary"
          size="icon"
          className="h-6 w-6 rounded-full shadow hover:scale-105 transition-transform"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <div className={cn('flex h-screen flex-col py-4', collapsed ? 'w-16' : 'w-60 transition-[width] duration-200') }>
        {/* App Title */}
        <div className={cn('px-4 pb-4 text-sm font-semibold tracking-tight text-muted-foreground', collapsed && 'text-center')}>Rocket App</div>

        {/* Nav Items */}
        <nav className="flex-1 space-y-1 px-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const active = location.pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200',
                  active
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'text-muted-foreground hover:bg-blue-600 hover:text-white'
                )}
                title={item.name}
              >
                <Icon className="h-4 w-4" />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Banners/Ads placeholder */}
        <div className={cn('px-3 pb-4', collapsed && 'hidden')}> 
          <div className="rounded-lg border p-3 text-xs text-muted-foreground bg-gradient-to-br from-amber-50 to-rose-50 dark:from-amber-950/40 dark:to-rose-950/40">
            <div className="font-semibold text-foreground mb-1">Rocket App</div>
            <div>Boost your CRM productivity with AI-powered insights.</div>
          </div>
        </div>
      </div>
    </aside>
  )
}