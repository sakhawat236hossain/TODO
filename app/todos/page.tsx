'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { todosApi } from '@/lib/api';
import { TODO_STATUSES, TODO_PRIORITIES, TODO_CATEGORIES, TODO_TIMINGS, type Todo, type TodoWithClient } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { PriorityBadge, TimingBadge } from '@/components/status-badges';
import { PRIORITY_DOT } from '@/lib/constants';
import { TodoFormDialog } from '@/components/todo-form-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, CheckSquare, Calendar, Zap, Clock } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function TodosPage() {
  const [todos, setTodos] = useState<TodoWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [timingFilter, setTimingFilter] = useState<string>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [editTodo, setEditTodo] = useState<Todo | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [moving, setMoving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await todosApi.list({ priority: priorityFilter, category: categoryFilter, timing: timingFilter });
      setTodos(data);
    } catch (err) {
      toast.error('Failed to load todos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [priorityFilter, categoryFilter, timingFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function moveStatus(todo: Todo, newStatus: string) {
    setMoving(todo.id);
    try {
      await todosApi.update(todo.id, { status: newStatus as any });
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, status: newStatus as any } : t)));
      toast.success(`Moved to ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setMoving(null);
    }
  }

  async function toggleTiming(todo: Todo) {
    const newTiming = todo.timing === 'Do Now' ? 'Do Later' : 'Do Now';
    setMoving(todo.id);
    try {
      await todosApi.update(todo.id, { timing: newTiming });
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, timing: newTiming } : t)));
      toast.success(newTiming === 'Do Now' ? 'Moved to Do Now' : 'Moved to Do Later');
    } catch (err) {
      toast.error('Failed to move todo');
    } finally {
      setMoving(null);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await todosApi.remove(deleteId);
      toast.success('Todo deleted');
      setTodos((prev) => prev.filter((t) => t.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      toast.error('Failed to delete todo');
    } finally {
      setDeleting(false);
    }
  }

  const columns = TODO_STATUSES;

  const filteredByStatus = (status: string) => todos.filter((t) => t.status === status);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-3 sm:items-center sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Todos</h1>
          <p className="text-sm text-muted-foreground mt-1">{todos.length} total</p>
        </div>
        <Button onClick={() => { setEditTodo(null); setAddOpen(true); }} className="shrink-0">
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Add Todo</span>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="sm:w-48 w-full">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {TODO_PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="sm:w-48 w-full">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {TODO_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={timingFilter} onValueChange={setTimingFilter}>
          <SelectTrigger className="sm:w-48 w-full">
            <SelectValue placeholder="Filter by timing" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Now &amp; Later</SelectItem>
            {TODO_TIMINGS.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((col) => {
            const items = filteredByStatus(col);
            return (
              <div key={col} className="flex flex-col">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <span className={cn('w-2 h-2 rounded-full', col === 'Pending' ? 'bg-slate-400' : col === 'In Progress' ? 'bg-blue-500' : 'bg-emerald-500')} />
                    {col}
                  </h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{items.length}</span>
                </div>
                <div className="flex-1 space-y-3 min-h-[100px]">
                  {items.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-6 text-center">
                      <p className="text-xs text-muted-foreground">No items</p>
                    </div>
                  ) : (
                    items.map((t) => {
                      const overdue = t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)) && t.status !== 'Done';
                      return (
                        <Card key={t.id} className="group hover:shadow-md transition-shadow">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={cn('w-2 h-2 rounded-full shrink-0', PRIORITY_DOT[t.priority])} />
                                <p className="text-sm font-medium break-words">{t.title}</p>
                              </div>
                              <div className="flex items-center gap-0.5 shrink-0">
                                <Button variant="ghost" size="icon" className="h-7 w-7 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={() => { setEditTodo(t); setAddOpen(true); }}>
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={() => setDeleteId(t.id)}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>

                            {t.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{t.description}</p>}

                            <div className="flex items-center gap-2 flex-wrap mb-3">
                              <PriorityBadge priority={t.priority} />
                              <TimingBadge timing={t.timing} />
                              {t.category && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{t.category}</span>}
                              {t.clients && (
                                <Link href={`/clients/${t.clients.id}`} className="text-xs text-emerald-600 hover:underline">
                                  {t.clients.name}
                                </Link>
                              )}
                            </div>

                            {t.due_date && (
                              <p className={cn('text-xs flex items-center gap-1 mb-3', overdue ? 'text-red-600 font-medium' : 'text-muted-foreground')}>
                                <Calendar className="w-3 h-3" />
                                {overdue ? 'Overdue: ' : 'Due: '}
                                {format(new Date(t.due_date), 'MMM d')}
                              </p>
                            )}

                            <div className="flex items-center gap-1.5 pt-2 border-t border-border flex-wrap">
                              <span className="text-xs text-muted-foreground mr-1">Move to:</span>
                              {TODO_STATUSES.filter((s) => s !== t.status).map((s) => (
                                <Button
                                  key={s}
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs px-2"
                                  disabled={moving === t.id}
                                  onClick={() => moveStatus(t, s)}
                                >
                                  {s === 'Done' ? <CheckSquare className="w-3 h-3 mr-1" /> : null}
                                  {s}
                                </Button>
                              ))}
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs px-2 ml-auto"
                                disabled={moving === t.id}
                                onClick={() => toggleTiming(t)}
                              >
                                {t.timing === 'Do Now' ? <Clock className="w-3 h-3 mr-1" /> : <Zap className="w-3 h-3 mr-1" />}
                                {t.timing === 'Do Now' ? 'Do Later' : 'Do Now'}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TodoFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        todo={editTodo}
        onSaved={(t) => {
          if (editTodo) {
            setTodos((prev) => prev.map((x) => (x.id === t.id ? { ...x, ...t } : x)));
          } else {
            load();
          }
          setEditTodo(null);
        }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this todo?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
