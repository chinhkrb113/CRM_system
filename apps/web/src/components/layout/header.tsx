import { useState } from 'react'
import { Bell, Search, User, LogOut, Languages, Settings, UserCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Breadcrumb } from './breadcrumb'
import { useAuthStore } from '@/stores/auth'
import { useTranslation } from 'react-i18next'

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { i18n, t } = useTranslation()

  const [showSearch, setShowSearch] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
      // Navigate anyway to ensure user is logged out locally
      navigate('/login')
    }
  }

  const toggleLanguage = () => {
    const next = i18n.language === 'en' ? 'vi' : 'en'
    i18n.changeLanguage(next)
  }

  return (
    <header className={`flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 ${className}`}>
      {/* Left side - Brand + Breadcrumb */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3 group select-none">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-amber-500 animate-pulse" />
          <div className="leading-tight">
            <div className="font-semibold tracking-tight group-hover:text-foreground transition-colors">
              Rocket App
            </div>
            <div className="text-[10px] text-muted-foreground">Ignite your growth</div>
          </div>
        </div>
        <Breadcrumb />
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Search */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 hover:scale-105 transition-transform"
            onClick={() => setShowSearch((v) => !v)}
          >
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
          {showSearch && (
            <div className="absolute right-0 mt-2 w-72 z-50 rounded-md border bg-popover shadow-lg p-3">
              <input
                autoFocus
                type="text"
                placeholder={t('common.searchPlaceholder', 'Type to search...')}
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                onBlur={() => setShowSearch(false)}
              />
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 relative hover:scale-105 transition-transform"
            onClick={() => setShowNotifications((v) => !v)}
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs" />
            <span className="sr-only">Notifications</span>
          </Button>
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 z-50 rounded-md border bg-popover shadow-lg">
              <div className="p-3 text-sm font-medium border-b">{t('common.notifications', 'Notifications')}</div>
              <ul className="max-h-64 overflow-auto text-sm">
                <li className="px-3 py-2 hover:bg-accent/50 cursor-pointer">{t('common.sampleNotification', 'New lead assigned to you')}</li>
                <li className="px-3 py-2 hover:bg-accent/50 cursor-pointer">{t('common.sampleNotification2', '3 tasks due today')}</li>
                <li className="px-3 py-2 hover:bg-accent/50 cursor-pointer">{t('common.sampleNotification3', 'Interview scheduled at 3 PM')}</li>
              </ul>
              <div className="p-2 text-right border-t">
                <Button variant="link" size="sm" onClick={() => setShowNotifications(false)}>
                  {t('common.close', 'Close')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Language Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:scale-105 transition-transform"
          onClick={toggleLanguage}
          title={i18n.language === 'en' ? 'Switch to Vietnamese' : 'Chuyển sang tiếng Anh'}
          aria-label="Toggle language"
        >
          <Languages className="h-4 w-4" />
          <span className="sr-only">Language</span>
        </Button>

        {/* User Info */}
        {user && (
          <div className="hidden md:flex items-center space-x-2 text-sm select-none">
            <span className="text-muted-foreground">{t('common.welcome', 'Welcome,')}</span>
            <span className="font-medium">{user.firstName} {user.lastName}</span>
          </div>
        )}

        {/* User Menu */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setShowUserMenu((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={showUserMenu}
          >
            <User className="h-4 w-4" />
            <span className="sr-only">User menu</span>
          </Button>
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 z-50 rounded-md border bg-popover shadow-lg py-2">
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent/50">
                <UserCircle2 className="h-4 w-4" /> {t('common.profile', 'Profile')}
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent/50">
                <Settings className="h-4 w-4" /> {t('common.settings', 'Settings')}
              </button>
              <div className="my-1 border-t" />
              <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10">
                <LogOut className="h-4 w-4" /> {t('common.logout', 'Logout')}
              </button>
            </div>
          )}
        </div>

        {/* Logout (keep for quick access) */}
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Logout</span>
        </Button>
      </div>
    </header>
  )
}