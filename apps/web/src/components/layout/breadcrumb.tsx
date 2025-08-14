import { ChevronRight, Home } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface BreadcrumbProps {
  className?: string
}

const routeNames: Record<string, string> = {
  '/': 'Home',
  '/dashboard': 'Dashboard',
  '/leads': 'Leads',
  '/appointments': 'Appointments',
  '/teams': 'Teams',
  '/tasks': 'Tasks',
  '/jobs': 'Jobs',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
}

export function Breadcrumb({ className }: BreadcrumbProps) {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter((x) => x)

  return (
    <nav className={cn('flex items-center space-x-1 text-sm text-muted-foreground', className)}>
      <Link
        to="/dashboard"
        className="flex items-center hover:text-foreground transition-colors duration-200"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {pathnames.map((pathname, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`
        const isLast = index === pathnames.length - 1
        const displayName = routeNames[routeTo] || pathname.charAt(0).toUpperCase() + pathname.slice(1)

        return (
          <div key={routeTo} className="flex items-center space-x-1">
            <ChevronRight className="h-4 w-4 text-muted-foreground/80" />
            {isLast ? (
              <span className="font-medium text-foreground">{displayName}</span>
            ) : (
              <Link
                to={routeTo}
                className="hover:text-foreground transition-colors duration-200"
              >
                {displayName}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}