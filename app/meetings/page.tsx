'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { meetingsApi } from '@/lib/api';
import { MEETING_STATUSES, type MeetingWithClient } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { MeetingStatusBadge } from '@/components/status-badges';
import { MeetingFormDialog } from '@/components/meeting-form-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Calendar, Video, Phone, MapPin, Clock } from 'lucide-react';
import { format, isPast, isToday, isFuture } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<MeetingWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [editMeeting, setEditMeeting] = useState<MeetingWithClient | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await meetingsApi.list({ status: statusFilter });
      setMeetings(data);
    } catch (err) {
      toast.error('Failed to load meetings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await meetingsApi.remove(deleteId);
      toast.success('Meeting deleted');
      setMeetings((prev) => prev.filter((m) => m.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      toast.error('Failed to delete meeting');
    } finally {
      setDeleting(false);
    }
  }

  const modeIcon = (mode: string | null) => {
    if (mode === 'Call') return Phone;
    if (mode === 'Online') return Video;
    return MapPin;
  };

  const upcoming = meetings.filter((m) => isFuture(new Date(m.date)) && (m.status === 'Scheduled' || m.status === 'Rescheduled'));
  const today = meetings.filter((m) => isToday(new Date(m.date)) && (m.status === 'Scheduled' || m.status === 'Rescheduled'));
  const past = meetings.filter((m) => isPast(new Date(m.date)) && !isToday(new Date(m.date)));

  const sections = [
    { label: 'Today', items: today },
    { label: 'Upcoming', items: upcoming },
    { label: 'Past', items: past },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-3 sm:items-center sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meetings</h1>
          <p className="text-sm text-muted-foreground mt-1">{meetings.length} total</p>
        </div>
        <Button onClick={() => { setEditMeeting(null); setAddOpen(true); }} className="shrink-0">
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Schedule</span>
        </Button>
      </div>

      <div className="mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-48 w-full">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {MEETING_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : meetings.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {statusFilter !== 'all' ? 'No meetings match this filter.' : 'No meetings scheduled yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {sections.map((section) => {
            if (section.items.length === 0) return null;
            return (
              <div key={section.label}>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                  {section.label} <span className="text-muted-foreground/60 normal-case">({section.items.length})</span>
                </h2>
                <div className="space-y-3">
                  {section.items.map((m) => {
                    const ModeIcon = modeIcon(m.mode);
                    const isUpcoming = isFuture(new Date(m.date)) || isToday(new Date(m.date));
                    return (
                      <Card key={m.id} className="group hover:shadow-md transition-shadow">
                        <CardContent className="pt-5">
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div className={cn(
                              'w-12 h-12 rounded-lg flex flex-col items-center justify-center shrink-0',
                              isUpcoming && m.status === 'Scheduled' ? 'bg-violet-50 text-violet-600' : 'bg-muted text-muted-foreground'
                            )}>
                              <span className="text-base font-bold leading-none">{format(new Date(m.date), 'd')}</span>
                              <span className="text-[10px] uppercase">{format(new Date(m.date), 'MMM')}</span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                {m.clients ? (
                                  <Link href={`/clients/${m.clients.id}`} className="font-semibold hover:text-emerald-600 transition-colors">
                                    {m.clients.name}
                                  </Link>
                                ) : (
                                  <span className="font-semibold text-muted-foreground">No client linked</span>
                                )}
                                <MeetingStatusBadge status={m.status} />
                              </div>

                              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {format(new Date(m.date), 'h:mm a')}
                                </span>
                                {m.mode && (
                                  <span className="flex items-center gap-1">
                                    <ModeIcon className="w-3 h-3" />
                                    {m.mode}
                                  </span>
                                )}
                              </div>

                              {m.agenda && <p className="text-sm mt-2">{m.agenda}</p>}
                              {m.outcome_notes && <p className="text-xs text-muted-foreground mt-1 italic">{m.outcome_notes}</p>}
                            </div>

                            <div className="flex items-center gap-0.5 shrink-0">
                              <Button variant="ghost" size="icon" className="h-8 w-8 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={() => { setEditMeeting(m); setAddOpen(true); }}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={() => setDeleteId(m.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <MeetingFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        meeting={editMeeting}
        onSaved={() => {
          load();
          setEditMeeting(null);
        }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this meeting?</AlertDialogTitle>
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
