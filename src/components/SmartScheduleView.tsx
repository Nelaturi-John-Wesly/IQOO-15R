import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  RotateCcw,
  Filter,
  ChevronLeft,
  ChevronRight,
  Sun,
  Sunset,
  Moon,
  Sparkles,
  Check,
  Plus,
  Edit3,
  MapPin,
  Tag,
  GraduationCap,
  Briefcase
} from 'lucide-react';
import { GoalPlan, Task, TaskStatus, TimeOfDay, UserPersona } from '../types';

interface SmartScheduleViewProps {
  plan: GoalPlan;
  currentDay: number;
  persona: UserPersona;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  onSelectTaskForFocus: (task: Task) => void;
  onOpenReschedule: (missedTaskId?: string) => void;
  onToggleTaskSubstep: (taskId: string, substepId: string) => void;
  onEditTask: (task: Task) => void;
  onAddNewTask: (dayNumber: number) => void;
  onOpenPersonaGuide: () => void;
}

export const SmartScheduleView: React.FC<SmartScheduleViewProps> = ({
  plan,
  currentDay,
  persona,
  onUpdateTaskStatus,
  onSelectTaskForFocus,
  onOpenReschedule,
  onToggleTaskSubstep,
  onEditTask,
  onAddNewTask,
  onOpenPersonaGuide,
}) => {
  const [selectedDay, setSelectedDay] = useState<number>(currentDay || 1);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'missed'>('all');

  // Filter tasks for selected day
  const dayTasks = plan.tasks.filter((t) => t.dayNumber === selectedDay);
  const filteredTasks = dayTasks.filter((t) => {
    if (statusFilter === 'pending') return t.status === 'pending' || t.status === 'in_progress';
    if (statusFilter === 'missed') return t.status === 'missed';
    return true;
  });

  const missedInPlan = plan.tasks.filter((t) => t.status === 'missed');
  const dayTotalMinutes = dayTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const dailyCapacityMinutes = (plan.dailyHours || 4) * 60;
  const capacityPercent = Math.min(100, Math.round((dayTotalMinutes / dailyCapacityMinutes) * 100));

  const morningTasks = filteredTasks.filter((t) => t.timeOfDay === 'morning');
  const afternoonTasks = filteredTasks.filter((t) => t.timeOfDay === 'afternoon');
  const eveningTasks = filteredTasks.filter((t) => t.timeOfDay === 'evening');

  return (
    <div className="space-y-8 pb-16">
      {/* Schedule Top Header */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
                <Calendar className="w-3.5 h-3.5" />
                Adaptive Timeline & Full Schedule Customization
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                persona === 'student' ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'
              }`}>
                {persona === 'student' ? <GraduationCap className="w-3.5 h-3.5" /> : <Briefcase className="w-3.5 h-3.5" />}
                {persona === 'student' ? 'Student Timetable' : 'Employee Work Sprint'}
              </span>
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              {plan.title}
            </h1>
            <p className="text-slate-600 text-sm mt-1 max-w-3xl">
              {persona === 'student'
                ? 'Your student study roadmap. Feel free to edit timings, add lecture blocks, or adjust assignments as professors announce changes.'
                : 'Your employee work sprint. Adjust tasks, rebalance focus blocks around corporate meetings, and customize deliverables.'}
            </p>
          </div>

          {/* Action CTAs: Add custom task + Reschedule */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onAddNewTask(selectedDay)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record / Add Task (Day {selectedDay})</span>
            </button>

            {missedInPlan.length > 0 && (
              <button
                onClick={() => onOpenReschedule()}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Rebalance {missedInPlan.length} Missed</span>
              </button>
            )}

            <button
              onClick={onOpenPersonaGuide}
              className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
            >
              Role Guide
            </button>
          </div>
        </div>

        {/* Day Selector Pills Slider */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between gap-2 overflow-x-auto pb-2">
          <div className="flex items-center gap-2">
            {Array.from({ length: plan.targetDays }, (_, i) => i + 1).map((d) => {
              const dTasks = plan.tasks.filter((t) => t.dayNumber === d);
              const hasMissed = dTasks.some((t) => t.status === 'missed');
              const isAllDone = dTasks.length > 0 && dTasks.every((t) => t.status === 'completed');
              const isToday = d === currentDay;

              return (
                <button
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all relative flex flex-col items-center gap-0.5 min-w-[76px] border ${
                    selectedDay === d
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <span className="text-[10px] opacity-80 uppercase tracking-wider">
                    {isToday ? 'Today' : `Day`}
                  </span>
                  <span className="font-display font-bold text-sm">Day {d}</span>

                  {/* Status dot */}
                  {hasMissed ? (
                    <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1.5 right-1.5 ring-2 ring-white" title="Has missed tasks" />
                  ) : isAllDone ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-1.5 right-1.5 ring-2 ring-white" title="Completed" />
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Filter dropdown / pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs shrink-0">
            {(['all', 'pending', 'missed'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1 rounded-lg capitalize font-medium transition-all ${
                  statusFilter === filter
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Daily Capacity & Summary Meter */}
      <section className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-lg text-slate-900">
              Day {selectedDay} Schedule Overview
            </h2>
            {selectedDay === currentDay && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700">
                Active Today
              </span>
            )}
            <button
              onClick={() => onAddNewTask(selectedDay)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 ml-2 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add Activity
            </button>
          </div>
          <p className="text-xs text-slate-600">
            {dayTasks.length} scheduled task blocks · Total duration: {Math.round(dayTotalMinutes / 60 * 10) / 10} hours
          </p>
        </div>

        {/* Capacity Bar */}
        <div className="sm:w-64 space-y-1.5">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-600">Daily Focus Budget</span>
            <span className="font-semibold text-slate-900">
              {Math.round(dayTotalMinutes / 60 * 10) / 10} / {plan.dailyHours} hrs ({capacityPercent}%)
            </span>
          </div>
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                capacityPercent > 100
                  ? 'bg-amber-500'
                  : capacityPercent >= 80
                  ? 'bg-indigo-600'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, capacityPercent)}%` }}
            />
          </div>
        </div>
      </section>

      {/* Time Slots (Morning, Afternoon, Evening) */}
      <div className="space-y-6">
        {/* Morning Slot */}
        <TimeSlotBlock
          title="Morning Block"
          timeRange="08:30 AM – 12:30 PM"
          icon={<Sun className="w-4 h-4 text-amber-500" />}
          badge={plan.energyPeak === 'morning' ? 'Peak Energy Window' : undefined}
          tasks={morningTasks}
          onUpdateTaskStatus={onUpdateTaskStatus}
          onSelectTaskForFocus={onSelectTaskForFocus}
          onOpenReschedule={onOpenReschedule}
          onToggleTaskSubstep={onToggleTaskSubstep}
          onEditTask={onEditTask}
        />

        {/* Afternoon Slot */}
        <TimeSlotBlock
          title="Afternoon Block"
          timeRange="01:30 PM – 05:30 PM"
          icon={<Sunset className="w-4 h-4 text-orange-500" />}
          badge={plan.energyPeak === 'afternoon' ? 'Peak Energy Window' : undefined}
          tasks={afternoonTasks}
          onUpdateTaskStatus={onUpdateTaskStatus}
          onSelectTaskForFocus={onSelectTaskForFocus}
          onOpenReschedule={onOpenReschedule}
          onToggleTaskSubstep={onToggleTaskSubstep}
          onEditTask={onEditTask}
        />

        {/* Evening Slot */}
        <TimeSlotBlock
          title="Evening Block"
          timeRange="06:30 PM – 09:30 PM"
          icon={<Moon className="w-4 h-4 text-indigo-400" />}
          badge={plan.energyPeak === 'evening' ? 'Peak Energy Window' : undefined}
          tasks={eveningTasks}
          onUpdateTaskStatus={onUpdateTaskStatus}
          onSelectTaskForFocus={onSelectTaskForFocus}
          onOpenReschedule={onOpenReschedule}
          onToggleTaskSubstep={onToggleTaskSubstep}
          onEditTask={onEditTask}
        />

        {/* Empty state if no tasks on day */}
        {dayTasks.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-3">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="font-display font-bold text-base text-slate-800">
              No tasks scheduled for Day {selectedDay}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Students and employees can record custom assignments, lectures, client meetings, or work sprints here.
            </p>
            <button
              onClick={() => onAddNewTask(selectedDay)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl inline-flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Task to Day {selectedDay}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface TimeSlotBlockProps {
  title: string;
  timeRange: string;
  icon: React.ReactNode;
  badge?: string;
  tasks: Task[];
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  onSelectTaskForFocus: (task: Task) => void;
  onOpenReschedule: (missedTaskId?: string) => void;
  onToggleTaskSubstep: (taskId: string, substepId: string) => void;
  onEditTask: (task: Task) => void;
}

const TimeSlotBlock: React.FC<TimeSlotBlockProps> = ({
  title,
  timeRange,
  icon,
  badge,
  tasks,
  onUpdateTaskStatus,
  onSelectTaskForFocus,
  onOpenReschedule,
  onToggleTaskSubstep,
  onEditTask,
}) => {
  if (tasks.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Time Slot Header */}
      <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-white shadow-2xs border border-slate-200">
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              {title}
              {badge && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-700 tracking-wide uppercase">
                  {badge}
                </span>
              )}
            </h3>
            <span className="text-xs text-slate-500">{timeRange}</span>
          </div>
        </div>

        <span className="text-xs font-semibold text-slate-600">
          {tasks.length} activity{tasks.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Task List */}
      <div className="divide-y divide-slate-100">
        {tasks.map((task) => {
          const isMissed = task.status === 'missed';
          const isDone = task.status === 'completed';
          const isInProgress = task.status === 'in_progress';

          return (
            <div
              key={task.id}
              className={`p-5 transition-all flex flex-col md:flex-row md:items-start justify-between gap-4 ${
                isMissed
                  ? 'bg-amber-50/40 border-l-4 border-l-amber-500'
                  : isDone
                  ? 'bg-slate-50/40 opacity-75'
                  : isInProgress
                  ? 'bg-indigo-50/30 border-l-4 border-l-indigo-600'
                  : 'hover:bg-slate-50/40'
              }`}
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    {task.scheduledTime || '09:00 AM'}
                  </span>

                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    task.priority === 'high'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : task.priority === 'medium'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {task.priority}
                  </span>

                  <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
                    {task.category}
                  </span>

                  {task.locationRequired && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100 font-medium">
                      <MapPin className="w-3 h-3 text-sky-600" />
                      {task.locationRequired}
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    {task.estimatedMinutes}m
                  </span>

                  {/* Status Badge */}
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                    isDone
                      ? 'bg-emerald-100 text-emerald-800'
                      : isMissed
                      ? 'bg-amber-100 text-amber-900'
                      : isInProgress
                      ? 'bg-indigo-100 text-indigo-800 animate-pulse'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <h4 className={`font-semibold text-base ${isDone ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                    {task.title}
                  </h4>

                  {/* Quick Edit button */}
                  <button
                    onClick={() => onEditTask(task)}
                    className="p-1 text-slate-400 hover:text-indigo-600 rounded-md transition-colors"
                    title="Edit task & adjust timing"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {task.description}
                </p>

                {/* Subtask Checkpoints */}
                {task.subtasks && task.subtasks.length > 0 && (
                  <div className="pt-2 space-y-1">
                    {task.subtasks.map((st) => (
                      <label
                        key={st.id}
                        className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900"
                      >
                        <input
                          type="checkbox"
                          checked={st.completed}
                          onChange={() => onToggleTaskSubstep(task.id, st.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                        />
                        <span className={st.completed ? 'line-through text-slate-400' : ''}>
                          {st.title}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Missed Task Warning & Auto-reschedule trigger */}
                {isMissed && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-100/70 border border-amber-200/80 text-amber-900 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>This planned activity was missed. SynqAI can reallocate it into future days.</span>
                    </div>
                    <button
                      onClick={() => onOpenReschedule(task.id)}
                      className="px-3 py-1 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold shrink-0 shadow-xs flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Rebalance
                    </button>
                  </div>
                )}
              </div>

              {/* Status Actions Dropdown / Buttons */}
              <div className="flex flex-wrap md:flex-col items-center md:items-end gap-2 shrink-0">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onEditTask(task)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1"
                    title="Edit task timings & details"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </button>

                  <button
                    onClick={() => onSelectTaskForFocus(task)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    Focus Room
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-[11px] font-medium">
                  <button
                    onClick={() => onUpdateTaskStatus(task.id, 'completed')}
                    className={`px-2 py-0.5 rounded transition-all ${isDone ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
                    title="Mark Completed"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => onUpdateTaskStatus(task.id, 'in_progress')}
                    className={`px-2 py-0.5 rounded transition-all ${isInProgress ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
                    title="Mark In Progress"
                  >
                    Active
                  </button>
                  <button
                    onClick={() => onUpdateTaskStatus(task.id, 'missed')}
                    className={`px-2 py-0.5 rounded transition-all ${isMissed ? 'bg-amber-600 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
                    title="Mark Missed"
                  >
                    Missed
                  </button>
                  <button
                    onClick={() => onUpdateTaskStatus(task.id, 'pending')}
                    className={`px-2 py-0.5 rounded transition-all ${task.status === 'pending' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
                    title="Mark Pending"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
