'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, CheckSquare, Calendar, Bird, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/todos', label: 'Todos', icon: CheckSquare },
  { href: '/goals', label: "Today's Goals", icon: ClipboardList },
  { href: '/meetings', label: 'Meetings', icon: Calendar },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-border bg-card">
      <div className="flex items-center gap-2 px-6 h-16 border-b border-border">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-600 text-white">
          <Bird className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">ClientNest</h1>
          <p className="text-xs text-muted-foreground">CRM & Task Tracker</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className={cn('w-4 h-4', active ? 'text-emerald-600' : 'text-muted-foreground')} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-4 border-t border-border">
        <p className="text-xs text-muted-foreground">Solo workspace</p>
        <p className="text-xs text-muted-foreground mt-1">No login required</p>
      </div>
    </aside>
  );
}
