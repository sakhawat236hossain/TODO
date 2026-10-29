'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, CheckSquare, Calendar, Bird, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/todos', label: 'Todos', icon: CheckSquare },
  { href: '/goals', label: 'Goals', icon: ClipboardList },
  { href: '/meetings', label: 'Meetings', icon: Calendar },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <>
      <header className="md:hidden flex items-center gap-2 px-4 h-14 border-b border-border bg-card sticky top-0 z-40">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 text-white">
          <Bird className="w-4 h-4" />
        </div>
        <span className="font-bold text-foreground">ClientNest</span>
      </header>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 flex h-[calc(4rem+env(safe-area-inset-bottom))] items-start justify-around border-t border-border bg-card px-1 pt-1 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-1.5 rounded-lg text-[10px] font-medium transition-colors sm:text-xs',
                active ? 'text-emerald-600' : 'text-muted-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
