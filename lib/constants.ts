import { ClientStatus, MeetingStatus, TodoPriority, TodoStatus, TodoTiming } from './types';

export const STATUS_STYLES: Record<ClientStatus, string> = {
  'Not Contacted': 'bg-slate-100 text-slate-700 border-slate-200',
  Contacted: 'bg-blue-100 text-blue-700 border-blue-200',
  Replied: 'bg-amber-100 text-amber-800 border-amber-200',
  'No Response': 'bg-gray-200 text-gray-600 border-gray-300',
  'Meeting Scheduled': 'bg-violet-100 text-violet-700 border-violet-200',
  'Meeting Done': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  Converted: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Rejected: 'bg-red-100 text-red-700 border-red-200',
  'On Hold': 'bg-orange-100 text-orange-700 border-orange-200',
};

export const MEETING_STATUS_STYLES: Record<MeetingStatus, string> = {
  Scheduled: 'bg-violet-100 text-violet-700 border-violet-200',
  Done: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-red-100 text-red-700 border-red-200',
  Rescheduled: 'bg-amber-100 text-amber-700 border-amber-200',
};

export const TODO_STATUS_STYLES: Record<TodoStatus, string> = {
  Pending: 'bg-slate-100 text-slate-700 border-slate-200',
  'In Progress': 'bg-blue-100 text-blue-700 border-blue-200',
  Done: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export const PRIORITY_STYLES: Record<TodoPriority, string> = {
  Low: 'bg-slate-100 text-slate-600 border-slate-200',
  Medium: 'bg-amber-100 text-amber-700 border-amber-200',
  High: 'bg-red-100 text-red-700 border-red-200',
};

export const PRIORITY_DOT: Record<TodoPriority, string> = {
  Low: 'bg-slate-400',
  Medium: 'bg-amber-500',
  High: 'bg-red-500',
};

export const TIMING_STYLES: Record<TodoTiming, string> = {
  'Do Now': 'bg-orange-100 text-orange-700 border-orange-200',
  'Do Later': 'bg-sky-100 text-sky-700 border-sky-200',
};
