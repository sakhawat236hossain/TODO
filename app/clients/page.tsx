'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { clientsApi } from '@/lib/api';
import { CLIENT_STATUSES, type Client } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/status-badges';
import { ClientFormDialog } from '@/components/client-form-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Trash2, Phone, ExternalLink, Users, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await clientsApi.list({ status: statusFilter, search: search.trim() });
      setClients(data);
    } catch (err) {
      toast.error('Failed to load clients');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    const t = setTimeout(() => load(), 250);
    return () => clearTimeout(t);
  }, [load]);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await clientsApi.remove(deleteId);
      toast.success('Client deleted');
      setClients((prev) => prev.filter((c) => c.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      toast.error('Failed to delete client');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-3 sm:items-center sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {clients.length} {clients.length === 1 ? 'client' : 'clients'} tracked
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="shrink-0">
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Add Client</span>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or source..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-48 w-full">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {CLIENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {search || statusFilter !== 'all'
                ? 'No clients match your filters.'
                : 'No clients yet. Add your first client to get started.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((c) => (
            <Card key={c.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <Link href={`/clients/${c.id}`} className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate hover:text-emerald-600 transition-colors">{c.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {c.phone}
                    </p>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.preventDefault();
                      setDeleteId(c.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <a
                    href={`tel:${c.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-border text-muted-foreground hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                  >
                    <Phone className="w-3 h-3" /> Call
                  </a>
                  {c.whatsapp_number && (
                    <a
                      href={`https://wa.me/${c.whatsapp_number.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors"
                    >
                      <MessageCircle className="w-3 h-3" /> WhatsApp
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <StatusBadge status={c.status} />
                  {c.source && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md truncate max-w-[140px]">
                      {c.source}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="min-w-0">
                    Next follow-up:{' '}
                    {c.next_follow_up_date ? (
                      <span className={new Date(c.next_follow_up_date) < new Date(new Date().setHours(0,0,0,0)) ? 'text-red-600 font-medium' : ''}>
                        {format(new Date(c.next_follow_up_date), 'MMM d, yyyy')}
                      </span>
                    ) : (
                      '—'
                    )}
                  </span>
                  <Link href={`/clients/${c.id}`} className="text-emerald-600 hover:underline inline-flex items-center gap-0.5">
                    View <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ClientFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSaved={(c) => setClients((prev) => [c, ...prev])}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this client?</AlertDialogTitle>
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
