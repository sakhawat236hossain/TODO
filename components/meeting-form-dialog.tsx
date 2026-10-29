'use client';

import { useState, useEffect } from 'react';
import { clientsApi, meetingsApi } from '@/lib/api';
import { MEETING_STATUSES, MEETING_MODES, type Meeting, type Client, type MeetingStatus, type MeetingMode } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface MeetingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting?: Meeting | null;
  presetClientId?: string | null;
  clients?: Client[];
  onSaved?: (meeting: Meeting) => void;
}

function toLocalInput(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function MeetingFormDialog({
  open,
  onOpenChange,
  meeting,
  presetClientId,
  clients: propClients,
  onSaved,
}: MeetingFormDialogProps) {
  const isEdit = !!meeting;
  const [saving, setSaving] = useState(false);
  const [clientList, setClientList] = useState<Client[]>(propClients ?? []);
  const [form, setForm] = useState(() => ({
    client_id: meeting?.client_id ?? presetClientId ?? '',
    date: toLocalInput(meeting?.date ?? null) || toLocalInput(new Date().toISOString()),
    mode: (meeting?.mode ?? 'Call') as MeetingMode,
    agenda: meeting?.agenda ?? '',
    outcome_notes: meeting?.outcome_notes ?? '',
    status: (meeting?.status ?? 'Scheduled') as MeetingStatus,
  }));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && !propClients && clientList.length === 0) {
      clientsApi.list().then((data) => setClientList(data)).catch(() => {});
    }
  }, [open, propClients, clientList.length]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.client_id) {
      setError('Please select a client');
      return;
    }
    if (!form.date) {
      setError('Date is required');
      return;
    }
    setError(null);
    setSaving(true);

    const payload = {
      client_id: form.client_id || null,
      date: new Date(form.date).toISOString(),
      mode: form.mode,
      agenda: form.agenda.trim() || null,
      outcome_notes: form.outcome_notes.trim() || null,
      status: form.status,
    };

    try {
      let result: Meeting;
      if (isEdit && meeting) {
        result = await meetingsApi.update(meeting.id, payload);
        toast.success('Meeting updated');
      } else {
        result = await meetingsApi.create(payload);
        toast.success('Meeting scheduled');
      }
      onSaved?.(result);
      onOpenChange(false);
    } catch (err) {
      toast.error(isEdit ? 'Failed to update meeting' : 'Failed to schedule meeting');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Meeting' : 'Schedule Meeting'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="mf-client">Client *</Label>
            <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
              <SelectTrigger id="mf-client">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clientList.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="mf-date">Date & Time *</Label>
              <Input
                id="mf-date"
                type="datetime-local"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mf-mode">Mode</Label>
              <Select value={form.mode} onValueChange={(v) => setForm({ ...form, mode: v as MeetingMode })}>
                <SelectTrigger id="mf-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEETING_MODES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mf-status">Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as MeetingStatus })}>
              <SelectTrigger id="mf-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEETING_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mf-agenda">Agenda</Label>
            <Textarea
              id="mf-agenda"
              value={form.agenda}
              onChange={(e) => setForm({ ...form, agenda: e.target.value })}
              placeholder="What will be discussed..."
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mf-outcome">Outcome Notes</Label>
            <Textarea
              id="mf-outcome"
              value={form.outcome_notes}
              onChange={(e) => setForm({ ...form, outcome_notes: e.target.value })}
              placeholder="Notes from the meeting..."
              rows={2}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Schedule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
