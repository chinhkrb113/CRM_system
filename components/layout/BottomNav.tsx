


import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../../constants';
import { useI18n } from '../../hooks/useI18n';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

function BottomNav(): React.ReactNode {
  const { t } = useI18n();
  const location = useLocation();
  const { user } = useAuth();

  const accessibleNavItems = NAV_ITEMS.filter(item => item.roles.includes(user!.role));
  const mobileNavItems = accessibleNavItems.slice(0, 5); // Max 5 items for bottom nav

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-40">
      <ul className="flex justify-around">
        {mobileNavItems.map((item) => (
          <li key={item.path} className="flex-1">
            <Link to={item.path} className={cn(
              "flex flex-col items-center gap-1 p-2 text-muted-foreground hover:text-primary transition-colors",
              location.pathname === item.path && "text-primary"
            )}>
              <item.icon className="h-6 w-6" />
              <span className="text-xs">{t(item.labelKey)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default BottomNav;