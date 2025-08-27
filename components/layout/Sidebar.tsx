import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../../constants';
import { useI18n } from '../../hooks/useI18n';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

function Sidebar({ isSidebarOpen, setSidebarOpen }: { isSidebarOpen: boolean, setSidebarOpen: (isOpen: boolean) => void }): React.ReactNode {
  const { t } = useI18n();
  const location = useLocation();
  const { user } = useAuth();

  const accessibleNavItems = NAV_ITEMS.filter(item => item.roles.includes(user!.role));

  return (
    <aside className={cn(
"hidden lg:relative lg:flex flex-col border-r bg-[#0f172a] text-white font-semibold transition-all duration-300 ease-in-out",

      isSidebarOpen ? "w-64" : "w-20"
    )}>
       <Button 
            variant="ghost" 
            size="icon" 
            className="absolute -right-4 top-14 z-50 h-8 w-8 rounded-full border bg-background text-foreground hover:bg-muted"
            onClick={() => setSidebarOpen(!isSidebarOpen)}
        >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", !isSidebarOpen && "rotate-180")} />
        </Button>
      <div className={cn("flex h-16 items-center border-b px-6", !isSidebarOpen && "justify-center")}>
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
          {isSidebarOpen && <span className="">Synergy CRM</span>}
        </Link>
      </div>
      <nav className="flex-1 px-4 py-4">
        <ul className="space-y-1">
          {accessibleNavItems.map((item) => (
            <li key={item.path}>
              <Link to={item.path} className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted",
                location.pathname === item.path && "bg-muted text-primary",
                !isSidebarOpen && "justify-center"
              )}>
                <item.icon className="h-5 w-5" />
                {isSidebarOpen && <span className="truncate">{t(item.labelKey)}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;