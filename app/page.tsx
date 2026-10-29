'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getDashboardStats } from '@/lib/stats';
import type { DashboardStats, Client, Todo } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge, PriorityBadge } from '@/components/status-badges';
import { Users, MessageSquare, Calendar, Trophy, TrendingUp, Target, AlertTriangle, Phone, CheckSquare, Zap, Clock, ArrowRight } from 'lucide-react';
import { format, isToday, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { todosApi } from '@/lib/api';
import { toast } from 'sonner';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await getDashboardStats();
      setStats(s);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const [moving, setMoving] = useState<string | null>(null);

  async function toggleTiming(todo: Todo) {
    const newTiming = todo.timing === 'Do Now' ? 'Do Later' : 'Do Now';
    setMoving(todo.id);
    try {
      await todosApi.update(todo.id, { timing: newTiming });
      toast.success(newTiming === 'Do Now' ? 'Moved to Do Now' : 'Moved to Do Later');
      load();
    } catch (err) {
      toast.error('Failed to move todo');
    } finally {
      setMoving(null);
    }
  }

  const statCards = [
    { label: 'Clients Added', value: stats?.totalClients ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Clients Talked To', value: stats?.totalClientsContacted ?? 0, icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Replies', value: stats?.totalReplied ?? 0, icon: MessageSquare, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Meetings Scheduled', value: stats?.totalMeetingsScheduled ?? 0, icon: Calendar, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { label: 'Converted', value: stats?.totalConverted ?? 0, icon: Trophy, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Reply Rate', value: `${stats?.replyRate ?? 0}%`, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Conversion Rate', value: `${stats?.conversionRate ?? 0}%`, icon: Target, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold flex items-center gap-2">Today's Plan</h2>
          <Link href="/todos" className="text-xs text-emerald-600 hover:underline flex items-center gap-0.5">
            View all todos <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PlanColumn
            title="Do Now"
            icon={Zap}
            accent="orange"
            todos={stats?.doNowTodos ?? []}
            loading={loading}
            moving={moving}
            onToggle={toggleTiming}
            emptyText="Nothing marked 'Do Now'. Pick a todo to focus on."
          />
          <PlanColumn
            title="Do Later"
            icon={Clock}
            accent="sky"
            todos={stats?.doLaterTodos ?? []}
            loading={loading}
            moving={moving}
            onToggle={toggleTiming}
            emptyText="Nothing queued for later."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4 mb-8">
        {loading
          ? Array.from({ length: 7 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))
          : statCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.label} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', card.bg)}>
                        <Icon className={cn('w-5 h-5', card.color)} />
                      </div>
                    </div>
                    <p className="text-2xl font-bold">{card.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FollowUpCard clients={stats?.todaysFollowUps ?? []} loading={loading} title="Today's Follow-ups" icon={Phone} emptyText="No follow-ups scheduled for today." />
        <OverdueCard clients={stats?.overdueFollowUps ?? []} loading={loading} />
        <TodosCard todos={stats?.todaysTodos ?? []} loading={loading} />
      </div>
    </div>
  );
}

function FollowUpCard({ clients, loading, title, icon: Icon, emptyText }: { clients: Client[]; loading: boolean; title: string; icon: any; emptyText: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Icon className="w-4 h-4 text-emerald-600" />
          {title}
          {!loading && clients.length > 0 && (
            <span className="ml-auto text-xs font-normal text-muted-foreground">{clients.length}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : clients.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">{emptyText}</p>
        ) : (
          <div className="space-y-2">
            {clients.map((c) => (
              <Link
                key={c.id}
                href={`/clients/${c.id}`}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.phone}</p>
                </div>
                <StatusBadge status={c.status} />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OverdueCard({ clients, loading }: { clients: Client[]; loading: boolean }) {
  return (
    <Card className="border-red-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-4 h-4" />
          Overdue Follow-ups
          {!loading && clients.length > 0 && (
            <span className="ml-auto text-xs font-normal text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{clients.length}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : clients.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No overdue follow-ups. You're all caught up!</p>
        ) : (
          <div className="space-y-2">
            {clients.map((c) => (
              <Link
                key={c.id}
                href={`/clients/${c.id}`}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-red-50 transition-colors bg-red-50/50"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-xs text-red-600">
                    Due {c.next_follow_up_date ? format(new Date(c.next_follow_up_date), 'MMM d') : '—'}
                  </p>
                </div>
                <StatusBadge status={c.status} />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TodosCard({ todos, loading }: { todos: Todo[]; loading: boolean }) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-emerald-600" />
          Today's Todos
          {!loading && todos.length > 0 && (
            <span className="ml-auto text-xs font-normal text-muted-foreground">{todos.length}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : todos.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No todos due today.</p>
        ) : (
          <div className="space-y-2">
            {todos.map((t) => (
              <Link
                key={t.id}
                href="/todos"
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {t.category} {t.linked_client_id ? '· Linked client' : ''}
                  </p>
                </div>
                <PriorityBadge priority={t.priority} />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PlanColumn({
  title,
  icon: Icon,
  accent,
  todos,
  loading,
  moving,
  onToggle,
  emptyText,
}: {
  title: string;
  icon: any;
  accent: 'orange' | 'sky';
  todos: Todo[];
  loading: boolean;
  moving: string | null;
  onToggle: (todo: Todo) => void;
  emptyText: string;
}) {
  const accentClasses =
    accent === 'orange'
      ? { border: 'border-orange-200', iconColor: 'text-orange-600', badge: 'bg-orange-100 text-orange-700' }
      : { border: 'border-sky-200', iconColor: 'text-sky-600', badge: 'bg-sky-100 text-sky-700' };

  return (
    <Card className={accentClasses.border}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Icon className={cn('w-4 h-4', accentClasses.iconColor)} />
          {title}
          {!loading && todos.length > 0 && (
            <span className={cn('ml-auto text-xs font-normal px-2 py-0.5 rounded-full', accentClasses.badge)}>
              {todos.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : todos.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">{emptyText}</p>
        ) : (
          <div className="space-y-2">
            {todos.map((t) => (
              <div key={t.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 sm:gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <PriorityBadge priority={t.priority} />
                    {t.category && <span className="max-w-[7rem] truncate text-xs text-muted-foreground">{t.category}</span>}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-auto min-h-7 shrink-0 px-2 py-1 text-xs"
                  disabled={moving === t.id}
                  onClick={() => onToggle(t)}
                >
                  {title === 'Do Now' ? 'Move to Later' : 'Do Now'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
