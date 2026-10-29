export const CLIENT_STATUSES = [
  'Not Contacted',
  'Contacted',
  'Replied',
  'No Response',
  'Meeting Scheduled',
  'Meeting Done',
  'Converted',
  'Rejected',
  'On Hold',
] as const;

export const MEETING_STATUSES = ['Scheduled', 'Done', 'Cancelled', 'Rescheduled'] as const;
export const MEETING_MODES = ['Call', 'In-Person', 'Online'] as const;

export const TODO_STATUSES = ['Pending', 'In Progress', 'Done'] as const;
export const TODO_PRIORITIES = ['Low', 'Medium', 'High'] as const;
export const TODO_CATEGORIES = ['Follow-up Call', 'Meeting Prep', 'Client Work', 'General'] as const;
export const TODO_TIMINGS = ['Do Now', 'Do Later'] as const;

export type ClientStatus = (typeof CLIENT_STATUSES)[number];
export type MeetingStatus = (typeof MEETING_STATUSES)[number];
export type MeetingMode = (typeof MEETING_MODES)[number];
export type TodoStatus = (typeof TODO_STATUSES)[number];
export type TodoPriority = (typeof TODO_PRIORITIES)[number];
export type TodoCategory = (typeof TODO_CATEGORIES)[number];
export type TodoTiming = (typeof TODO_TIMINGS)[number];

export interface Client {
  id: string;
  name: string;
  phone: string;
  whatsapp_number: string | null;
  facebook_id: string | null;
  source: string | null;
  post_link: string | null;
  status: ClientStatus;
  project_type: string | null;
  budget: string | null;
  notes: string | null;
  contacted_date: string | null;
  last_follow_up_date: string | null;
  next_follow_up_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Meeting {
  id: string;
  client_id: string | null;
  date: string;
  mode: MeetingMode | null;
  agenda: string | null;
  outcome_notes: string | null;
  status: MeetingStatus;
  created_at: string;
  updated_at: string;
}

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  linked_client_id: string | null;
  due_date: string | null;
  priority: TodoPriority;
  status: TodoStatus;
  category: string | null;
  timing: TodoTiming;
  created_at: string;
  updated_at: string;
}

export interface ClientWithRelations extends Client {
  meetings?: Meeting[];
  todos?: Todo[];
}

export interface MeetingWithClient extends Meeting {
  clients?: Pick<Client, 'id' | 'name' | 'phone'> | null;
}

export interface TodoWithClient extends Todo {
  clients?: Pick<Client, 'id' | 'name'> | null;
}

export interface DashboardStats {
  totalClients: number;
  totalClientsContacted: number;
  totalReplied: number;
  totalMeetingsScheduled: number;
  totalConverted: number;
  replyRate: number;
  conversionRate: number;
  todaysFollowUps: Client[];
  todaysTodos: Todo[];
  overdueFollowUps: Client[];
  doNowTodos: Todo[];
  doLaterTodos: Todo[];
}

export interface DailyTask {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
  completed_at: string | null;
}

export interface DailyPlan {
  date: string;
  notes: string;
  tasks: DailyTask[];
  created_at?: string;
  updated_at?: string;
}
