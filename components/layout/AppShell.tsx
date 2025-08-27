
import React from 'react';
import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

function AppShell({ children }: { children: React.ReactNode }): React.ReactNode {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-muted/40 text-foreground">
      <Sidebar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-col flex-1">
        <Header onMenuClick={() => setSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

export default AppShell;