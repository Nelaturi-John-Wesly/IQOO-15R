import React, { useState } from 'react';
import { Sparkles, Target, Calendar, Clock, Flame, CheckCircle2, ChevronRight, ArrowRight, BookOpen, Layers, ShieldCheck, RefreshCw } from 'lucide-react';
import { GoalPlan, Task, Milestone } from '../types';
import { QUICK_GOAL_TEMPLATES } from '../utils/sampleData';

interface GoalPlannerViewProps {
  plan: GoalPlan;
  onGenerateNewPlan: (params: { goal: string; days: number; dailyHours: number; energyPeak: 'morning' | 'afternoon' | 'evening'; context: string }) => Promise<void>;
  isGenerating: boolean;
  onSelectTaskForFocus: (task: Task) => void;
  onNavigateToSchedule: () => void;
  onToggleTaskSubstep: (taskId: string, substepId: string) => void;
}

export const GoalPlannerView: React.FC<GoalPlannerViewProps> = ({
  plan,
  onGenerateNewPlan,
  isGenerating,
  onSelectTaskForFocus,
  onNavigateToSchedule,
  onToggleTaskSubstep,
}) => {
  const [goalText, setGoalText] = useState(plan.title || 'Complete my CSE project in 7 days');
  const [days, setDays] = useState(plan.targetDays || 7);
  const [dailyHours, setDailyHours] = useState(plan.dailyHours || 4);
  const [energyPeak, setEnergyPeak] = useState<'morning' | 'afternoon' | 'evening'>(plan.energyPeak || 'morning');
  const [context, setContext] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [filterMilestone, setFilterMilestone] = useState<number | 'all'>('all');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalText.trim()) return;
    onGenerateNewPlan({
      goal: goalText,
      days,
      dailyHours,
      energyPeak,
      context,
    });
  };

  const handleApplyTemplate = (tpl: typeof QUICK_GOAL_TEMPLATES[0]) => {
    setGoalText(tpl.title);
    setDays(tpl.days);
    setDailyHours(tpl.hours);
    setEnergyPeak(tpl.energy);
    onGenerateNewPlan({
      goal: tpl.title,
      days: tpl.days,
      dailyHours: tpl.hours,
      energyPeak: tpl.energy,
      context: tpl.desc,
    });
  };

  // Group tasks by day
  const tasksByDay = plan.tasks.reduce<Record<number, Task[]>>((acc, task) => {
    acc[task.dayNumber] = acc[task.dayNumber] || [];
    acc[task.dayNumber].push(task);
    return acc;
  }, {});

  const totalEstimatedMinutes = plan.tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);

  return (
    <div className="space-y-8 pb-16">
      {/* Goal Generation Header Card */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Feature 1: AI Goal Planner
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Adaptive Goal Planner & Decomposition
            </h1>
            <p className="text-slate-600 text-sm mt-1 max-w-2xl">
              Tell SynqAI your high-level objective. The AI agent automatically analyzes constraints, estimates durations, partitions milestones, and generates a realistic action roadmap.
            </p>
          </div>

          <button
            onClick={() => setShowConfig(!showConfig)}
            className="self-start md:self-auto px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {showConfig ? 'Hide Customizer' : 'Customize Goal Parameters'}
          </button>
        </div>

        {/* Form to generate plan */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              What is your primary goal or project?
            </label>
            <div className="relative">
              <input
                id="input-goal-description"
                type="text"
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                placeholder="e.g. Complete my CSE project in 7 days"
                className="w-full pl-4 pr-32 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-slate-900 text-sm font-medium transition-all"
                disabled={isGenerating}
              />
              <button
                id="btn-generate-plan"
                type="submit"
                disabled={isGenerating || !goalText.trim()}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Synthesizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate Plan
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick template prompt buttons */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-slate-500">Quick-start templates:</span>
            <div className="flex flex-wrap gap-2">
              {QUICK_GOAL_TEMPLATES.map((tpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  disabled={isGenerating}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-indigo-50/60 hover:border-indigo-200 text-xs font-medium text-slate-700 hover:text-indigo-900 transition-all text-left"
                >
                  <span className="font-semibold">{tpl.title}</span> ({tpl.days}d · {tpl.hours}h/d)
                </button>
              ))}
            </div>
          </div>

          {/* Expandable Parameters Panel */}
          {showConfig && (
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/70 p-4 rounded-xl border">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Timeline: <strong className="text-indigo-600">{days} days</strong>
                </label>
                <input
                  type="range"
                  min={2}
                  max={21}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <span className="text-[11px] text-slate-500">Spread tasks over {days} balanced days</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Daily Available Focus: <strong className="text-indigo-600">{dailyHours} hours/day</strong>
                </label>
                <input
                  type="range"
                  min={1}
                  max={8}
                  step={0.5}
                  value={dailyHours}
                  onChange={(e) => setDailyHours(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <span className="text-[11px] text-slate-500">Total capacity: ~{Math.round(dailyHours * days)} hours</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  User Peak Energy Window
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(['morning', 'afternoon', 'evening'] as const).map((peak) => (
                    <button
                      key={peak}
                      type="button"
                      onClick={() => setEnergyPeak(peak)}
                      className={`py-1.5 px-2 text-xs font-medium rounded-lg capitalize border transition-all text-center ${
                        energyPeak === peak
                          ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {peak}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-slate-500">AI slots high-cognitive tasks here</span>
              </div>
            </div>
          )}
        </form>
      </section>

      {/* AI Strategy & Executive Pacing Card */}
      <section className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold tracking-wide uppercase">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              AI Cognitive Load & Anti-Procrastination Strategy
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight">
              {plan.title}
            </h2>
            <p className="text-indigo-100/90 text-sm leading-relaxed">
              {plan.aiStrategy}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 text-xs self-stretch md:self-auto">
            <div>
              <span className="text-indigo-200 block text-[11px]">Sprint Duration</span>
              <strong className="text-base text-white font-display font-bold">{plan.targetDays} Days</strong>
            </div>
            <div>
              <span className="text-indigo-200 block text-[11px]">Daily Allocation</span>
              <strong className="text-base text-white font-display font-bold">{plan.dailyHours} hrs/day</strong>
            </div>
            <div>
              <span className="text-indigo-200 block text-[11px]">Total Workload</span>
              <strong className="text-base text-white font-display font-bold">{Math.round(totalEstimatedMinutes / 60)} hrs total</strong>
            </div>
          </div>
        </div>
      </section>

      {/* Milestones Progression Timeline */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="font-display font-bold text-lg text-slate-900">
              Progressive Milestones ({plan.milestones.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">Checkpoint Gates</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plan.milestones.map((m, idx) => (
            <div
              key={m.id || idx}
              className={`p-4 rounded-xl border transition-all ${
                m.completed
                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                  : 'bg-slate-50/70 border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-white border border-slate-200 text-slate-700">
                  Target: Day {m.day}
                </span>
                {m.completed ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <CheckCircle2 className="w-4 h-4 fill-emerald-100" />
                    Passed
                  </span>
                ) : (
                  <span className="text-xs font-medium text-slate-400">In Progress</span>
                )}
              </div>
              <h4 className="font-semibold text-sm line-clamp-2">{m.title}</h4>
              <p className="text-xs text-slate-600 mt-1 line-clamp-3">{m.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Actionable Daily Tasks Breakdown */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-xl text-slate-900">
              Decomposed Action Plan ({plan.tasks.length} Tasks)
            </h3>
            <p className="text-xs text-slate-500">
              Small, actionable tasks scheduled into progressive daily intervals
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToSchedule}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5" />
              View on Smart Schedule
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Days Accordion / Cards */}
        <div className="space-y-6">
          {Array.from({ length: plan.targetDays }, (_, i) => i + 1).map((dayNum) => {
            const dayTasks = tasksByDay[dayNum] || [];
            if (dayTasks.length === 0) return null;

            const dayMinutes = dayTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
            const allDayDone = dayTasks.every((t) => t.status === 'completed');

            return (
              <div
                key={dayNum}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden"
              >
                {/* Day Header Bar */}
                <div className="px-5 py-3.5 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-display font-bold text-xs flex items-center justify-center shadow-xs">
                      D{dayNum}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Day {dayNum} Roadmap</h4>
                      <span className="text-xs text-slate-500">
                        {dayTasks.length} task{dayTasks.length > 1 ? 's' : ''} · Estimated {Math.round(dayMinutes / 60 * 10) / 10} hrs focus
                      </span>
                    </div>
                  </div>

                  {allDayDone ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Day Completed
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-slate-500">
                      {dayTasks.filter((t) => t.status === 'completed').length}/{dayTasks.length} Done
                    </span>
                  )}
                </div>

                {/* Day Tasks List */}
                <div className="divide-y divide-slate-100">
                  {dayTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-5 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider ${
                            task.priority === 'high'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : task.priority === 'medium'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {task.priority} priority
                          </span>

                          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
                            {task.category}
                          </span>

                          <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                            <Clock className="w-3 h-3" />
                            {task.estimatedMinutes}m ({task.timeOfDay})
                          </span>

                          {task.rescheduledCount && task.rescheduledCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              Rescheduled {task.rescheduledCount}x
                            </span>
                          ) : null}
                        </div>

                        <h5 className={`font-semibold text-base ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                          {task.title}
                        </h5>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                          {task.description}
                        </p>

                        {/* Step-by-step subtasks */}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                              Step-by-step action checkpoints:
                            </span>
                            <div className="space-y-1">
                              {task.subtasks.map((st) => (
                                <label
                                  key={st.id}
                                  className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none hover:text-slate-900"
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
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex md:flex-col items-center md:items-end gap-2 shrink-0">
                        <button
                          onClick={() => onSelectTaskForFocus(task)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1.5 border border-indigo-200"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          Focus on This
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
