import { cn } from '@/lib/utils';
import { STATUS_STYLES, MEETING_STATUS_STYLES, TODO_STATUS_STYLES, PRIORITY_STYLES, TIMING_STYLES } from '@/lib/constants';

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        STATUS_STYLES[status as keyof typeof STATUS_STYLES] ?? 'bg-slate-100 text-slate-700 border-slate-200',
        className
      )}
    >
      {status}
    </span>
  );
}

export function MeetingStatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        MEETING_STATUS_STYLES[status as keyof typeof MEETING_STATUS_STYLES] ?? 'bg-slate-100 text-slate-700 border-slate-200',
        className
      )}
    >
      {status}
    </span>
  );
}

export function TodoStatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        TODO_STATUS_STYLES[status as keyof typeof TODO_STATUS_STYLES] ?? 'bg-slate-100 text-slate-700 border-slate-200',
        className
      )}
    >
      {status}
    </span>
  );
}

export function PriorityBadge({ priority, className }: { priority: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        PRIORITY_STYLES[priority as keyof typeof PRIORITY_STYLES] ?? 'bg-slate-100 text-slate-700 border-slate-200',
        className
      )}
    >
      {priority}
    </span>
  );
}

export function TimingBadge({ timing, className }: { timing: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        TIMING_STYLES[timing as keyof typeof TIMING_STYLES] ?? 'bg-slate-100 text-slate-700 border-slate-200',
        className
      )}
    >
      {timing}
    </span>
  );
}
