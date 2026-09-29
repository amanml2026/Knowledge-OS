import { Link, useLocation } from 'react-router-dom';
import { Home, Share2, BookOpen, PenTool, LayoutDashboard, Search, Beaker, Settings, TrendingUp } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function Sidebar() {
  const location = useLocation();
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Knowledge', path: '/knowledge', icon: Share2 },
    { name: 'Learn', path: '/learn', icon: BookOpen },
    { name: 'Practice', path: '/practice', icon: PenTool },
    { name: 'Search', path: '/search', icon: Search },
    { name: 'Research', path: '/research', icon: Beaker },
    { name: 'Progress', path: '/progress', icon: TrendingUp },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-surface border-r border-gray-800 flex flex-col h-full">
      <div className="p-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
            <span className="text-white text-xs font-black">K</span>
          </div>
          Knowledge OS
        </h1>
        <p className="text-xs text-textMuted mt-1">Don't just learn. Understand.</p>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={twMerge(
                clsx(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-textMuted hover:bg-white/5 hover:text-white"
                )
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 m-4 bg-white/5 rounded-xl border border-white/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent"></div>
          <div>
            <p className="text-sm font-medium text-white">Student</p>
            <p className="text-xs text-textMuted">Level 12</p>
          </div>
        </div>
        <div className="w-full bg-black/50 rounded-full h-1.5 mt-2">
          <div className="bg-primary h-1.5 rounded-full" style={{ width: '45%' }}></div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
