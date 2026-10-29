'use client';

import { useState } from 'react';
import { clientsApi } from '@/lib/api';
import { CLIENT_STATUSES, type Client, type ClientStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSaved?: (client: Client) => void;
}

function toLocalInput(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function ClientFormDialog({ open, onOpenChange, client, onSaved }: ClientFormDialogProps) {
  const isEdit = !!client;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => ({
    name: client?.name ?? '',
    phone: client?.phone ?? '',
    whatsapp_number: client?.whatsapp_number ?? '',
    facebook_id: client?.facebook_id ?? '',
    source: client?.source ?? '',
    post_link: client?.post_link ?? '',
    status: (client?.status ?? 'Not Contacted') as ClientStatus,
    project_type: client?.project_type ?? '',
    budget: client?.budget ?? '',
    notes: client?.notes ?? '',
    contacted_date: toLocalInput(client?.contacted_date ?? null),
    last_follow_up_date: toLocalInput(client?.last_follow_up_date ?? null),
    next_follow_up_date: toLocalInput(client?.next_follow_up_date ?? null),
  }));
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      whatsapp_number: form.whatsapp_number.trim() || null,
      facebook_id: form.facebook_id.trim() || null,
      source: form.source.trim() || null,
      post_link: form.post_link.trim() || null,
      status: form.status,
      project_type: form.project_type.trim() || null,
      budget: form.budget.trim() || null,
      notes: form.notes.trim() || null,
      contacted_date: form.contacted_date ? new Date(form.contacted_date).toISOString() : null,
      last_follow_up_date: form.last_follow_up_date ? new Date(form.last_follow_up_date).toISOString() : null,
      next_follow_up_date: form.next_follow_up_date ? new Date(form.next_follow_up_date).toISOString() : null,
    };

    try {
      let result: Client;
      if (isEdit && client) {
        result = await clientsApi.update(client.id, payload);
        toast.success('Client updated');
      } else {
        result = await clientsApi.create(payload);
        toast.success('Client added');
      }
      onSaved?.(result);
      onOpenChange(false);
    } catch (err) {
      toast.error(isEdit ? 'Failed to update client' : 'Failed to add client');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Client' : 'Add New Client'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cf-name">Name *</Label>
              <Input
                id="cf-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Doe"
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cf-phone">Phone *</Label>
              <Input
                id="cf-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+880..."
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="cf-whatsapp">WhatsApp Number</Label>
                {form.phone.trim() && form.whatsapp_number !== form.phone && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, whatsapp_number: form.phone })}
                    className="text-xs text-emerald-600 hover:underline"
                  >
                    Same as phone
                  </button>
                )}
              </div>
              <Input
                id="cf-whatsapp"
                value={form.whatsapp_number}
                onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                placeholder="+880..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cf-fb">Facebook ID / Profile Link</Label>
              <Input
                id="cf-fb"
                value={form.facebook_id}
                onChange={(e) => setForm({ ...form, facebook_id: e.target.value })}
                placeholder="facebook.com/..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cf-source">Source</Label>
              <Input
                id="cf-source"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                placeholder="Facebook Group - Dhaka Web Devs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cf-postlink">Post / Job Link</Label>
              <Input
                id="cf-postlink"
                value={form.post_link}
                onChange={(e) => setForm({ ...form, post_link: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cf-status">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ClientStatus })}>
                <SelectTrigger id="cf-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLIENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cf-projecttype">Project Type</Label>
              <Input
                id="cf-projecttype"
                value={form.project_type}
                onChange={(e) => setForm({ ...form, project_type: e.target.value })}
                placeholder="E-commerce site"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cf-budget">Budget</Label>
              <Input
                id="cf-budget"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                placeholder="$500 - $1000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cf-contacted">Contacted Date</Label>
              <Input
                id="cf-contacted"
                type="date"
                value={form.contacted_date}
                onChange={(e) => setForm({ ...form, contacted_date: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cf-lastfu">Last Follow-up</Label>
              <Input
                id="cf-lastfu"
                type="date"
                value={form.last_follow_up_date}
                onChange={(e) => setForm({ ...form, last_follow_up_date: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cf-nextfu">Next Follow-up</Label>
              <Input
                id="cf-nextfu"
                type="date"
                value={form.next_follow_up_date}
                onChange={(e) => setForm({ ...form, next_follow_up_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cf-notes">Notes</Label>
            <Textarea
              id="cf-notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Project discussion summary..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Add Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
