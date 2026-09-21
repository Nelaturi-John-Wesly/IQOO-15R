export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'missed';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening';
export type UserPersona = 'student' | 'employee';

export interface TaskSubstep {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  goalId?: string;
  dayNumber: number; // 1 to targetDays
  dateOffset?: number;
  scheduledTime?: string; // e.g. "09:00 AM"
  timeOfDay: TimeOfDay;
  title: string;
  description: string;
  category: string;
  estimatedMinutes: number;
  priority: TaskPriority;
  status: TaskStatus;
  subtasks: TaskSubstep[];
  focusTips?: string[];
  completedAt?: string;
  originalDayNumber?: number; // for tracking reschedules
  rescheduledCount?: number;
  locationRequired?: string; // e.g. "Campus Library", "Office Desk 4B", "Remote"
  personaTag?: UserPersona;
}

export interface Milestone {
  id: string;
  day: number;
  title: string;
  description: string;
  completed: boolean;
}

export interface AdaptationLog {
  id: string;
  timestamp: string;
  reason: string;
  affectedTaskIds: string[];
  explanation: string;
  changesSummary: string;
}

export interface GoalPlan {
  id: string;
  title: string;
  persona?: UserPersona;
  targetDays: number;
  dailyHours: number;
  energyPeak: 'morning' | 'afternoon' | 'evening';
  createdAt: string;
  status: 'active' | 'completed' | 'archived';
  aiStrategy: string;
  milestones: Milestone[];
  tasks: Task[];
  adaptationHistory: AdaptationLog[];
}

export interface FocusSessionState {
  activeTaskId: string | null;
  mode: 'pomodoro' | 'short_break' | 'long_break' | 'custom';
  durationMinutes: number;
  remainingSeconds: number;
  isRunning: boolean;
  soundscape: 'none' | 'whitenoise' | 'rain' | 'binaural';
  soundscapeVolume: number; // 0 to 1
  distractionBlocks: { id: string; label: string; enabled: boolean }[];
  sessionNotes: string;
  totalFocusedMinutesToday: number;
}

export interface ProductivityStats {
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  missedTasks: number;
  totalTasks: number;
  totalFocusMinutes: number;
  streakDays: number;
  completionRate: number;
  onTrackScore: number;
}

export interface GmailSignal {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  detectedDeadline?: string;
  suggestedTaskTitle?: string;
  priority: 'urgent' | 'info';
  type: 'assignment' | 'meeting' | 'announcement';
  appliedToSchedule: boolean;
}

export interface LocationCommuteSignal {
  currentLocation: string;
  destination: string;
  commuteMinutes: number;
  distanceKm: number;
  traffic: 'light' | 'moderate' | 'heavy';
  leaveByTime: string;
  targetArrivalTime: string;
  recommendation: string;
}

export interface BehaviorLogEntry {
  id: string;
  timestamp: string;
  source: 'google_maps' | 'gmail' | 'location_sensor' | 'schedule_sync';
  title: string;
  description: string;
  impact: string;
}
