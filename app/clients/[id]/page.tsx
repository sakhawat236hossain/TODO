'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { clientsApi, meetingsApi, todosApi } from '@/lib/api';
import { CLIENT_STATUSES, type Client, type Meeting, type Todo } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge, MeetingStatusBadge, PriorityBadge, TodoStatusBadge } from '@/components/status-badges';
import { ClientFormDialog } from '@/components/client-form-dialog';
import { MeetingFormDialog } from '@/components/meeting-form-dialog';
import { TodoFormDialog } from '@/components/todo-form-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Pencil, Trash2, Plus, Phone, Facebook, Link2, FileText, Calendar, CheckSquare, DollarSign, Briefcase, MapPin, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [todoOpen, setTodoOpen] = useState(false);
  const [editMeeting, setEditMeeting] = useState<Meeting | null>(null);
  const [editTodo, setEditTodo] = useState<Todo | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [clientData, meetingsData, todosData] = await Promise.all([
        clientsApi.get(id),
        meetingsApi.list({ clientId: id }),
        todosApi.list({ clientId: id }),
      ]);
      setClient(clientData);
      setMeetings(meetingsData);
      setTodos(todosData);
    } catch (err) {
      toast.error('Client not found');
      router.push('/clients');
      return;
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function quickStatus(status: string) {
    if (!client) return;
    setUpdatingStatus(true);
    try {
      const updated = await clientsApi.update(client.id, { status: status as any });
      setClient(updated);
      toast.success(`Marked as ${status}`);
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleDelete() {
    if (!client) return;
    setDeleting(true);
    try {
      await clientsApi.remove(client.id);
      toast.success('Client deleted');
      router.push('/clients');
    } catch (err) {
      toast.error('Failed to delete client');
    } finally {
      setDeleting(false);
    }
  }

  async function deleteMeeting(mid: string) {
    try {
      await meetingsApi.remove(mid);
      setMeetings((prev) => prev.filter((m) => m.id !== mid));
      toast.success('Meeting deleted');
    } catch (err) {
      toast.error('Failed to delete meeting');
    }
  }

  async function deleteTodo(tid: string) {
    try {
      await todosApi.remove(tid);
      setTodos((prev) => prev.filter((t) => t.id !== tid));
      toast.success('Todo deleted');
    } catch (err) {
      toast.error('Failed to delete todo');
    }
  }

  if (loading || !client) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-40 w-full mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const quickStatuses = ['Replied', 'Meeting Scheduled', 'Meeting Done', 'Converted', 'Rejected', 'On Hold'];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <Link href="/clients" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Clients
      </Link>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col items-start gap-4 mb-4 sm:flex-row sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
                <StatusBadge status={client.status} />
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> {client.phone}
              </p>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
              <a
                href={`tel:${client.phone}`}
                className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                <Phone className="w-4 h-4" /> Call
              </a>
              {client.whatsapp_number && (
                <a
                  href={`https://wa.me/${client.whatsapp_number.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              )}
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="w-4 h-4 mr-1" /> Edit
              </Button>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            {client.source && (
              <InfoItem icon={MapPin} label="Source" value={client.source} />
            )}
            {client.whatsapp_number && (
              <InfoItem icon={MessageCircle} label="WhatsApp" value={client.whatsapp_number} />
            )}
            {client.project_type && (
              <InfoItem icon={Briefcase} label="Project Type" value={client.project_type} />
            )}
            {client.budget && (
              <InfoItem icon={DollarSign} label="Budget" value={client.budget} />
            )}
            {client.facebook_id && (
              <InfoItem icon={Facebook} label="Facebook" value={client.facebook_id} />
            )}
            {client.post_link && (
              <a
                href={client.post_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 text-sm hover:text-emerald-600"
              >
                <Link2 className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Post Link</p>
                  <p className="truncate underline">{client.post_link}</p>
                </div>
              </a>
            )}
            {client.contacted_date && (
              <InfoItem icon={Calendar} label="Contacted" value={format(new Date(client.contacted_date), 'MMM d, yyyy')} />
            )}
            {client.last_follow_up_date && (
              <InfoItem icon={Calendar} label="Last Follow-up" value={format(new Date(client.last_follow_up_date), 'MMM d, yyyy')} />
            )}
            {client.next_follow_up_date && (
              <InfoItem
                icon={Calendar}
                label="Next Follow-up"
                value={format(new Date(client.next_follow_up_date), 'MMM d, yyyy')}
                highlight={new Date(client.next_follow_up_date) < new Date(new Date().setHours(0,0,0,0))}
              />
            )}
          </div>

          {client.notes && (
            <div className="mt-4 p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Notes
              </p>
              <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Quick Status Update</p>
            <div className="flex items-center gap-2 flex-wrap">
              {quickStatuses.map((s) => (
                <Button
                  key={s}
                  variant={client.status === s ? 'default' : 'outline'}
                  size="sm"
                  disabled={updatingStatus}
                  onClick={() => quickStatus(s)}
                  className={cn(client.status === s && 'bg-emerald-600 hover:bg-emerald-700')}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-600" />
              Meetings
              <Button size="sm" variant="ghost" className="ml-auto" onClick={() => { setEditMeeting(null); setMeetingOpen(true); }}>
                <Plus className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {meetings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No meetings scheduled.</p>
            ) : (
              <div className="space-y-2">
                {meetings.map((m) => (
                  <div key={m.id} className="p-3 rounded-lg border border-border group">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-medium">{format(new Date(m.date), 'MMM d, yyyy · h:mm a')}</p>
                      <div className="flex items-center gap-1">
                        <MeetingStatusBadge status={m.status} />
                        <Button variant="ghost" size="icon" className="h-7 w-7 sm:opacity-0 sm:group-hover:opacity-100" onClick={() => { setEditMeeting(m); setMeetingOpen(true); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100" onClick={() => deleteMeeting(m.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    {m.mode && <p className="text-xs text-muted-foreground">Mode: {m.mode}</p>}
                    {m.agenda && <p className="text-xs mt-1">{m.agenda}</p>}
                    {m.outcome_notes && <p className="text-xs text-muted-foreground mt-1 italic">{m.outcome_notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              Linked Todos
              <Button size="sm" variant="ghost" className="ml-auto" onClick={() => { setEditTodo(null); setTodoOpen(true); }}>
                <Plus className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todos.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No linked todos.</p>
            ) : (
              <div className="space-y-2">
                {todos.map((t) => (
                  <div key={t.id} className="p-3 rounded-lg border border-border group">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-medium">{t.title}</p>
                      <div className="flex items-center gap-1">
                        <PriorityBadge priority={t.priority} />
                        <Button variant="ghost" size="icon" className="h-7 w-7 sm:opacity-0 sm:group-hover:opacity-100" onClick={() => { setEditTodo(t); setTodoOpen(true); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100" onClick={() => deleteTodo(t.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <TodoStatusBadge status={t.status} />
                      {t.category && <span>· {t.category}</span>}
                      {t.due_date && <span>· Due {format(new Date(t.due_date), 'MMM d')}</span>}
                    </div>
                    {t.description && <p className="text-xs text-muted-foreground mt-1">{t.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ClientFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        client={client}
        onSaved={(c) => setClient(c)}
      />
      <MeetingFormDialog
        open={meetingOpen}
        onOpenChange={setMeetingOpen}
        meeting={editMeeting}
        presetClientId={client.id}
        onSaved={(m) => {
          if (editMeeting) {
            setMeetings((prev) => prev.map((x) => (x.id === m.id ? m : x)));
          } else {
            setMeetings((prev) => [...prev, m].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
          }
        }}
      />
      <TodoFormDialog
        open={todoOpen}
        onOpenChange={setTodoOpen}
        todo={editTodo}
        presetClientId={client.id}
        onSaved={(t) => {
          if (editTodo) {
            setTodos((prev) => prev.map((x) => (x.id === t.id ? t : x)));
          } else {
            setTodos((prev) => [t, ...prev]);
          }
        }}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {client.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the client and all their linked meetings. This action cannot be undone.
            </AlertDialogDescription>
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

function InfoItem({ icon: Icon, label, value, highlight }: { icon: any; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn('truncate', highlight && 'text-red-600 font-medium')}>{value}</p>
      </div>
    </div>
  );
}
