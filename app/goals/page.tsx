'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Check, Circle, ClipboardList, Loader2, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { dailyPlanApi } from '@/lib/api';
import type { DailyPlan, DailyTask } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

function todayKey() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export default function GoalsPage() {
  const date = todayKey();
  const [plan, setPlan] = useState<DailyPlan>({ date, notes: '', tasks: [] });
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [workingTaskId, setWorkingTaskId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPlan(await dailyPlanApi.get(date));
    } catch (error) {
      console.error(error);
      toast.error('Could not load today’s plan');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  async function addTask(event: FormEvent) {
    event.preventDefault();
    if (!newTask.trim()) return;
    setAdding(true);
    try {
      const task = await dailyPlanApi.addTask(date, newTask);
      setPlan((current) => ({ ...current, tasks: [...current.tasks, task] }));
      setNewTask('');
    } catch (error) {
      console.error(error);
      toast.error('Could not add the task');
    } finally {
      setAdding(false);
    }
  }

  async function toggleTask(task: DailyTask) {
    setWorkingTaskId(task.id);
    try {
      const updated = await dailyPlanApi.toggleTask(date, task.id, !task.completed);
      setPlan((current) => ({ ...current, tasks: current.tasks.map((item) => item.id === task.id ? updated : item) }));
    } catch (error) {
      console.error(error);
      toast.error('Could not update the task');
    } finally {
      setWorkingTaskId(null);
    }
  }

  async function deleteTask(task: DailyTask) {
    setWorkingTaskId(task.id);
    try {
      await dailyPlanApi.removeTask(date, task.id);
      setPlan((current) => ({ ...current, tasks: current.tasks.filter((item) => item.id !== task.id) }));
    } catch (error) {
      console.error(error);
      toast.error('Could not remove the task');
    } finally {
      setWorkingTaskId(null);
    }
  }

  async function saveNotes() {
    setSavingNotes(true);
    try {
      await dailyPlanApi.updateNotes(date, plan.notes);
      toast.success('Notes saved');
    } catch (error) {
      console.error(error);
      toast.error('Could not save notes');
    } finally {
      setSavingNotes(false);
    }
  }

  const completeCount = plan.tasks.filter((task) => task.completed).length;
  const progress = plan.tasks.length ? Math.round((completeCount / plan.tasks.length) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-7">
        <div className="flex items-center gap-2 text-emerald-700 mb-2"><ClipboardList className="w-5 h-5" /><span className="text-sm font-semibold">Daily execution</span></div>
        <h1 className="text-2xl font-bold tracking-tight">Today&apos;s Goals & Notes</h1>
        <p className="text-sm text-muted-foreground mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')} — add the work you will complete, then tick it off.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div><CardTitle className="text-lg">Today&apos;s checklist</CardTitle><CardDescription>Every change saves to MongoDB.</CardDescription></div>
              <div className="text-right"><p className="text-lg font-bold text-emerald-700">{completeCount}/{plan.tasks.length}</p><p className="text-xs text-muted-foreground">completed</p></div>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-emerald-600 transition-all" style={{ width: `${progress}%` }} /></div>
          </CardHeader>
          <CardContent>
            <form onSubmit={addTask} className="flex gap-2 mb-5">
              <Input value={newTask} onChange={(event) => setNewTask(event.target.value)} placeholder="e.g. Send proposal to Acme" disabled={loading || adding} />
              <Button type="submit" disabled={!newTask.trim() || adding}>{adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}<span className="sr-only">Add task</span></Button>
            </form>
            {loading ? <p className="text-sm text-muted-foreground py-8 text-center">Loading today&apos;s goals…</p> : plan.tasks.length === 0 ? <div className="py-10 text-center text-muted-foreground"><Circle className="w-8 h-8 mx-auto mb-3 opacity-50" /><p className="text-sm">No goals yet. Add your first priority above.</p></div> : <div className="space-y-2">
              {plan.tasks.map((task) => <div key={task.id} className="group flex items-center gap-3 rounded-lg border p-3">
                <Checkbox checked={task.completed} disabled={workingTaskId === task.id} onCheckedChange={() => toggleTask(task)} aria-label={`Mark ${task.title} as ${task.completed ? 'incomplete' : 'complete'}`} />
                <span className={`min-w-0 flex-1 break-words text-sm ${task.completed ? 'line-through text-muted-foreground' : 'font-medium'}`}>{task.title}</span>
                {task.completed && <Check className="w-4 h-4 text-emerald-600" />}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteTask(task)} disabled={workingTaskId === task.id} aria-label={`Delete ${task.title}`}><Trash2 className="w-4 h-4" /></Button>
              </div>)}
            </div>}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 h-fit">
          <CardHeader><CardTitle className="text-lg">Daily notes</CardTitle><CardDescription>Calls, decisions, blockers, and follow-up context.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <Textarea value={plan.notes} onChange={(event) => setPlan((current) => ({ ...current, notes: event.target.value }))} placeholder="What is important today? What happened in client calls?" rows={12} disabled={loading} />
            <Button className="w-full" onClick={saveNotes} disabled={loading || savingNotes}>{savingNotes && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{savingNotes ? 'Saving…' : 'Save notes'}</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
