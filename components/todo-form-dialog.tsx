'use client';

import { useState, useEffect } from 'react';
import { clientsApi, todosApi } from '@/lib/api';
import { TODO_STATUSES, TODO_PRIORITIES, TODO_CATEGORIES, TODO_TIMINGS, type Todo, type Client, type TodoStatus, type TodoPriority, type TodoTiming } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Zap, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TodoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todo?: Todo | null;
  presetClientId?: string | null;
  clients?: Client[];
  onSaved?: (todo: Todo) => void;
}

function toLocalInput(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function TodoFormDialog({
  open,
  onOpenChange,
  todo,
  presetClientId,
  clients: propClients,
  onSaved,
}: TodoFormDialogProps) {
  const isEdit = !!todo;
  const [saving, setSaving] = useState(false);
  const [clientList, setClientList] = useState<Client[]>(propClients ?? []);
  const [form, setForm] = useState(() => ({
    title: todo?.title ?? '',
    description: todo?.description ?? '',
    linked_client_id: todo?.linked_client_id ?? presetClientId ?? '',
    due_date: toLocalInput(todo?.due_date ?? null),
    priority: (todo?.priority ?? 'Medium') as TodoPriority,
    status: (todo?.status ?? 'Pending') as TodoStatus,
    category: todo?.category ?? 'General',
    timing: (todo?.timing ?? 'Do Later') as TodoTiming,
  }));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && !propClients && clientList.length === 0) {
      clientsApi.list().then((data) => setClientList(data)).catch(() => {});
    }
  }, [open, propClients, clientList.length]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    setError(null);
    setSaving(true);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      linked_client_id: form.linked_client_id || null,
      due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
      priority: form.priority,
      status: form.status,
      category: form.category,
      timing: form.timing,
    };

    try {
      let result: Todo;
      if (isEdit && todo) {
        result = await todosApi.update(todo.id, payload);
        toast.success('Todo updated');
      } else {
        result = await todosApi.create(payload);
        toast.success('Todo added');
      }
      onSaved?.(result);
      onOpenChange(false);
    } catch (err) {
      toast.error(isEdit ? 'Failed to update todo' : 'Failed to add todo');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Todo' : 'Add New Todo'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tf-title">Title *</Label>
            <Input
              id="tf-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Follow up with John about proposal"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>When will you do this?</Label>
            <div className="grid grid-cols-2 gap-2">
              {TODO_TIMINGS.map((t) => {
                const active = form.timing === t;
                const Icon = t === 'Do Now' ? Zap : Clock;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, timing: t })}
                    className={cn(
                      'flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? t === 'Do Now'
                          ? 'bg-orange-100 border-orange-300 text-orange-700'
                          : 'bg-sky-100 border-sky-300 text-sky-700'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tf-desc">Description</Label>
            <Textarea
              id="tf-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="More details..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="tf-client">Linked Client</Label>
              <Select
                value={form.linked_client_id || 'none'}
                onValueChange={(v) => setForm({ ...form, linked_client_id: v === 'none' ? '' : v })}
              >
                <SelectTrigger id="tf-client">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {clientList.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tf-due">Due Date</Label>
              <Input
                id="tf-due"
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="tf-priority">Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as TodoPriority })}>
                <SelectTrigger id="tf-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TODO_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tf-status">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as TodoStatus })}>
                <SelectTrigger id="tf-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TODO_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tf-category">Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger id="tf-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TODO_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Add Todo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
