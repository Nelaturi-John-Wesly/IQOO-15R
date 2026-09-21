import React, { useState } from 'react';
import {
  AlertCircle,
  Clock,
  Bell,
  ChevronRight,
  X,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  MapPin,
  Mail,
  Navigation
} from 'lucide-react';
import { GoalPlan, Task, LocationCommuteSignal, GmailSignal } from '../types';

interface RemindersBannerProps {
  plan: GoalPlan;
  currentDay: number;
  commuteSignal?: LocationCommuteSignal;
  gmailSignals?: GmailSignal[];
  onOpenReschedule: () => void;
  onStartTaskFocus: (task: Task) => void;
  onNavigateToBehavior?: () => void;
}

export const RemindersBanner: React.FC<RemindersBannerProps> = ({
  plan,
  currentDay,
  commuteSignal,
  gmailSignals = [],
  onOpenReschedule,
  onStartTaskFocus,
  onNavigateToBehavior,
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  // Check signals
  const urgentEmail = gmailSignals.find((g) => !g.appliedToSchedule && g.priority === 'urgent');
  const missedTasks = plan.tasks.filter((t) => t.status === 'missed');
  const todayTasks = plan.tasks.filter((t) => t.dayNumber === currentDay && t.status !== 'completed');
  const activeTask = plan.tasks.find((t) => t.status === 'in_progress') || todayTasks[0];

  return (
    <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-sky-50 border-b border-indigo-100/80 px-4 py-2 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-slate-700">
          {/* Priority 1: Urgent Gmail Signal */}
          {urgentEmail ? (
            <>
              <span className="flex-shrink-0 p-1 rounded-md bg-rose-100 text-rose-800">
                <Mail className="w-4 h-4" />
              </span>
              <span>
                <strong className="font-semibold text-rose-900">Gmail Alert:</strong>{' '}
                {urgentEmail.subject} · <span className="font-medium text-slate-900">Due: {urgentEmail.detectedDeadline}</span>
              </span>
            </>
          ) : missedTasks.length > 0 ? (
            <>
              <span className="flex-shrink-0 p-1 rounded-md bg-amber-100 text-amber-800">
                <AlertCircle className="w-4 h-4" />
              </span>
              <span>
                <strong className="font-semibold text-amber-900">Schedule Alert:</strong>{' '}
                {missedTasks.length} task{missedTasks.length > 1 ? 's are' : ' is'} marked as missed. SynqAI can rebalance remaining work into upcoming days.
              </span>
            </>
          ) : commuteSignal ? (
            <>
              <span className="flex-shrink-0 p-1 rounded-md bg-sky-100 text-sky-800">
                <MapPin className="w-4 h-4" />
              </span>
              <span>
                <strong className="font-semibold text-sky-900">Google Maps Departure Timing:</strong>{' '}
                Leave by <strong className="text-indigo-700 font-bold">{commuteSignal.leaveByTime}</strong> for {commuteSignal.destination} ({commuteSignal.commuteMinutes}m transit, {commuteSignal.traffic} traffic).
              </span>
            </>
          ) : activeTask ? (
            <>
              <span className="flex-shrink-0 p-1 rounded-md bg-indigo-100 text-indigo-700">
                <Bell className="w-4 h-4" />
              </span>
              <span>
                <strong className="font-semibold text-slate-900">Next Focus Item:</strong>{' '}
                Day {activeTask.dayNumber}: <span className="font-medium text-indigo-700">"{activeTask.title}"</span> at {activeTask.scheduledTime || '09:00 AM'}.
              </span>
            </>
          ) : (
            <>
              <span className="flex-shrink-0 p-1 rounded-md bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <span>
                <strong className="font-semibold text-emerald-900">All Caught Up:</strong> You are fully on track with the adaptive schedule for Day {currentDay}!
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          {urgentEmail && onNavigateToBehavior ? (
            <button
              onClick={onNavigateToBehavior}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-xs"
            >
              <Mail className="w-3.5 h-3.5" />
              Review & Sync Email
            </button>
          ) : missedTasks.length > 0 ? (
            <button
              id="btn-banner-reschedule"
              onClick={onOpenReschedule}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Auto-Reschedule Now
            </button>
          ) : commuteSignal && onNavigateToBehavior ? (
            <button
              onClick={onNavigateToBehavior}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 transition-colors shadow-xs"
            >
              <Navigation className="w-3.5 h-3.5" />
              Commute Details
            </button>
          ) : activeTask ? (
            <button
              id="btn-banner-focus"
              onClick={() => onStartTaskFocus(activeTask)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
            >
              <Clock className="w-3.5 h-3.5" />
              Start Focus Session
            </button>
          ) : null}

          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
