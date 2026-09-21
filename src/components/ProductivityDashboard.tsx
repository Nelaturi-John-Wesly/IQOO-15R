import React from 'react';
import { Activity, CheckCircle2, Clock, Flame, AlertCircle, ArrowUpRight, TrendingUp, Sparkles, Target, Zap, ShieldCheck } from 'lucide-react';
import { GoalPlan, ProductivityStats } from '../types';

interface ProductivityDashboardProps {
  plan: GoalPlan;
  stats: ProductivityStats;
  currentDay: number;
  onNavigateToSchedule: () => void;
  onStartFocus: () => void;
}

export const ProductivityDashboard: React.FC<ProductivityDashboardProps> = ({
  plan,
  stats,
  currentDay,
  onNavigateToSchedule,
  onStartFocus,
}) => {
  // Compute daily workload breakdown
  const dailyBreakdown = Array.from({ length: plan.targetDays }, (_, i) => {
    const day = i + 1;
    const tasks = plan.tasks.filter((t) => t.dayNumber === day);
    const completedTasks = tasks.filter((t) => t.status === 'completed');
    const totalMinutes = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
    const completedMinutes = completedTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
    return {
      day,
      totalCount: tasks.length,
      completedCount: completedTasks.length,
      totalMinutes,
      completedMinutes,
      isCurrent: day === currentDay,
    };
  });

  const milestonesDone = plan.milestones.filter((m) => m.completed).length;

  return (
    <div className="space-y-8 pb-16">
      {/* Dashboard Top Header */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
              <Activity className="w-3.5 h-3.5" />
              Feature 6: Productivity Dashboard
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Productivity & Execution Metrics
            </h1>
            <p className="text-slate-600 text-sm mt-1 max-w-2xl">
              Live telemetry tracking completed milestones, pending deliverables, accumulated deep focus minutes, and velocity pacing.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onStartFocus}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs"
            >
              <Clock className="w-4 h-4" />
              Enter Focus Session
            </button>
          </div>
        </div>
      </section>

      {/* 6 Key Telemetry Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Metric 1: Completed Tasks */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <span className="font-display font-bold text-2xl sm:text-3xl text-slate-900">
              {stats.completedTasks}
            </span>
            <span className="text-slate-400 text-xs ml-1">/ {stats.totalTasks}</span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 mt-1">
            {stats.completionRate}% completion
          </span>
        </div>

        {/* Metric 2: Pending Work */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Pending Work</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <span className="font-display font-bold text-2xl sm:text-3xl text-slate-900">
              {stats.pendingTasks + stats.inProgressTasks}
            </span>
            <span className="text-slate-400 text-xs ml-1">tasks</span>
          </div>
          <span className="text-[11px] font-medium text-slate-500 mt-1">
            {stats.inProgressTasks} active now
          </span>
        </div>

        {/* Metric 3: Missed Tasks */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Missed / Overdue</span>
            <AlertCircle className={`w-4 h-4 ${stats.missedTasks > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
          </div>
          <div>
            <span className={`font-display font-bold text-2xl sm:text-3xl ${stats.missedTasks > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {stats.missedTasks}
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-500 mt-1">
            {stats.missedTasks > 0 ? 'Adaptive ready' : 'Zero overdue'}
          </span>
        </div>

        {/* Metric 4: Total Focus Logged */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Focus</span>
            <Zap className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <span className="font-display font-bold text-2xl sm:text-3xl text-slate-900">
              {stats.totalFocusMinutes}
            </span>
            <span className="text-slate-400 text-xs ml-1">min</span>
          </div>
          <span className="text-[11px] font-semibold text-indigo-700 mt-1">
            ~{Math.round(stats.totalFocusMinutes / 60 * 10) / 10} hrs deep work
          </span>
        </div>

        {/* Metric 5: Streak Counter */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Day Streak</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <span className="font-display font-bold text-2xl sm:text-3xl text-slate-900">
              {stats.streakDays}
            </span>
            <span className="text-slate-400 text-xs ml-1">days</span>
          </div>
          <span className="text-[11px] font-semibold text-orange-600 mt-1">
            Active habit chain
          </span>
        </div>

        {/* Metric 6: On-Track Health Score */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Pacing Health</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <span className="font-display font-bold text-2xl sm:text-3xl text-emerald-600">
              {stats.onTrackScore}%
            </span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 mt-1">
            High confidence
          </span>
        </div>
      </div>

      {/* Main Charts & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Daily Workload & Completion Histogram */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-base text-slate-900">
                Daily Focus Distribution & Progress
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Total planned focus minutes vs completed execution per sprint day
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-600">
              {plan.targetDays}-Day Scope
            </span>
          </div>

          {/* Custom responsive visual bar chart */}
          <div className="space-y-3 pt-2">
            {dailyBreakdown.map((item) => {
              const maxMinutes = Math.max(120, (plan.dailyHours || 4) * 60);
              const barWidth = Math.min(100, Math.round((item.totalMinutes / maxMinutes) * 100));
              const completedWidth = item.totalMinutes > 0 ? Math.round((item.completedMinutes / item.totalMinutes) * 100) : 0;

              return (
                <div key={item.day} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      Day {item.day}
                      {item.isCurrent && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-100 text-indigo-700 font-bold">
                          Today
                        </span>
                      )}
                    </span>
                    <span className="text-slate-500 font-medium">
                      {item.completedCount}/{item.totalCount} tasks ({item.completedMinutes}/{item.totalMinutes}m)
                    </span>
                  </div>

                  <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${(barWidth * completedWidth) / 100}%` }}
                      title={`Completed: ${item.completedMinutes}m`}
                    />
                    <div
                      className="h-full bg-indigo-200 transition-all"
                      style={{ width: `${barWidth - (barWidth * completedWidth) / 100}%` }}
                      title={`Pending: ${item.totalMinutes - item.completedMinutes}m`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Completed Execution
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-indigo-200"></span> Scheduled Focus Buffer
            </span>
          </div>
        </div>

        {/* Right: Milestone Checkpoints & AI Agent Velocity Insight */}
        <div className="lg:col-span-4 space-y-6">
          {/* Milestone Progress Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-600" />
                Milestone Gates
              </h2>
              <span className="text-xs font-semibold text-slate-700">
                {milestonesDone}/{plan.milestones.length}
              </span>
            </div>

            <div className="space-y-3">
              {plan.milestones.map((m, idx) => (
                <div
                  key={m.id || idx}
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    m.completed
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                      : 'bg-slate-50/70 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>{m.title}</span>
                    {m.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="text-[10px] text-slate-400 uppercase font-bold">D{m.day}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{m.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Performance Evaluation & Next Best Action */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-sky-400" />
              SynqAI Agent Synthesis
            </div>
            <h3 className="font-display font-bold text-base text-white">
              Velocity Diagnosis: On Pace
            </h3>
            <p className="text-xs text-indigo-100/90 leading-relaxed">
              You have completed {stats.completedTasks} tasks across Day 1–2 on schedule. Day {currentDay} currently has an in-progress focus sprint. Scheduling remains balanced within the {plan.dailyHours} hour/day threshold.
            </p>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-indigo-200">Optimal next slot:</span>
              <span className="font-semibold text-white">Morning Focus Sprint</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
