import React, { useState } from 'react';
import { RotateCcw, AlertCircle, ArrowRight, CheckCircle2, Sparkles, ShieldAlert, History, Zap, Check, CornerDownRight } from 'lucide-react';
import { GoalPlan, Task, AdaptationLog } from '../types';

interface AdaptiveReschedulerViewProps {
  plan: GoalPlan;
  currentDay: number;
  onApplyRescheduledPlan: (updatedTasks: Task[], adaptationLog: AdaptationLog) => void;
  onMarkTaskMissed: (taskId: string) => void;
}

export const AdaptiveReschedulerView: React.FC<AdaptiveReschedulerViewProps> = ({
  plan,
  currentDay,
  onApplyRescheduledPlan,
  onMarkTaskMissed,
}) => {
  const [selectedMissedIds, setSelectedMissedIds] = useState<string[]>(() => {
    return plan.tasks.filter((t) => t.status === 'missed').map((t) => t.id);
  });
  const [userNote, setUserNote] = useState('Underestimated task complexity and ran out of time today');
  const [isAdapting, setIsAdapting] = useState(false);
  const [adaptationResult, setAdaptationResult] = useState<{
    explanation: string;
    changesSummary: string;
    taskUpdates: Array<{
      id: string;
      newDayNumber: number;
      newScheduledTime?: string;
      newTimeOfDay?: 'morning' | 'afternoon' | 'evening';
      newEstimatedMinutes?: number;
      adjustedPriority?: string;
      rescheduleReason?: string;
    }>;
  } | null>(null);

  const toggleSelectTask = (taskId: string) => {
    setSelectedMissedIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  // Quick simulate helper
  const handleSimulateMissed = (taskId: string) => {
    onMarkTaskMissed(taskId);
    if (!selectedMissedIds.includes(taskId)) {
      setSelectedMissedIds((prev) => [...prev, taskId]);
    }
  };

  const handleRunAdaptiveEngine = async () => {
    if (selectedMissedIds.length === 0) return;
    setIsAdapting(true);
    try {
      const res = await fetch('/api/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          missedTaskIds: selectedMissedIds,
          currentDay,
          userNote,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAdaptationResult({
          explanation: data.explanation,
          changesSummary: data.changesSummary,
          taskUpdates: data.taskUpdates,
        });
      }
    } catch (err) {
      console.error('Failed to adapt plan:', err);
    } finally {
      setIsAdapting(false);
    }
  };

  const handleApplyChanges = () => {
    if (!adaptationResult) return;

    const updatesMap = new Map(adaptationResult.taskUpdates.map((u) => [u.id, u]));

    const newTasks: Task[] = plan.tasks.map((task) => {
      const update = updatesMap.get(task.id);
      if (update) {
        return {
          ...task,
          dayNumber: update.newDayNumber,
          scheduledTime: update.newScheduledTime || task.scheduledTime,
          timeOfDay: update.newTimeOfDay || task.timeOfDay,
          estimatedMinutes: update.newEstimatedMinutes || task.estimatedMinutes,
          priority: (update.adjustedPriority as Task['priority']) || task.priority,
          status: 'pending', // reset from missed to pending on new day
          rescheduledCount: (task.rescheduledCount || 0) + 1,
          originalDayNumber: task.originalDayNumber || task.dayNumber,
        };
      }
      return task;
    });

    const newLog: AdaptationLog = {
      id: `adapt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      reason: userNote || 'Task missed on Day ' + currentDay,
      affectedTaskIds: adaptationResult.taskUpdates.map((u) => u.id),
      explanation: adaptationResult.explanation,
      changesSummary: adaptationResult.changesSummary,
    };

    onApplyRescheduledPlan(newTasks, newLog);
    setAdaptationResult(null);
    setSelectedMissedIds([]);
  };

  // Unfinished tasks eligible for rescheduling
  const pendingOrMissedTasks = plan.tasks.filter((t) => t.status !== 'completed');

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner Header */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-7">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold mb-2">
            <RotateCcw className="w-3.5 h-3.5" />
            Feature 4: Adaptive Rescheduling Engine
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Guilt-Free Plan Adaptation
          </h1>
          <p className="text-slate-600 text-sm mt-1 max-w-2xl">
            Life happens, priorities shift, and tasks run over. SynqAI does not punish you—it dynamically recalibrates downstream days, compresses scope where possible, and restores momentum.
          </p>
        </div>
      </section>

      {/* Interactive Rescheduling Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Select Missed Tasks & Context */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Select Missed or Delayed Tasks
              </h2>
              <span className="text-xs font-medium text-slate-500">
                {selectedMissedIds.length} task{selectedMissedIds.length !== 1 ? 's' : ''} selected
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Check any tasks that were not completed as planned. You can also click the quick simulate buttons to test how SynqAI handles sudden delays:
            </p>

            {/* Quick Simulate Buttons */}
            <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Quick Test Scenarios:
              </span>
              <div className="flex flex-wrap gap-2">
                {pendingOrMissedTasks.slice(0, 3).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSimulateMissed(t.id)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-amber-300 text-amber-900 hover:bg-amber-50 transition-colors shadow-2xs"
                  >
                    Simulate Miss: "{t.title.slice(0, 24)}..."
                  </button>
                ))}
              </div>
            </div>

            {/* Task list with checkboxes */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {pendingOrMissedTasks.map((t) => {
                const isSelected = selectedMissedIds.includes(t.id);
                const isMissedStatus = t.status === 'missed';

                return (
                  <label
                    key={t.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50/70 border-amber-300 text-amber-950'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectTask(t.id)}
                      className="mt-1 rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          Day {t.dayNumber}
                        </span>
                        <span className="text-xs text-slate-500">{t.estimatedMinutes}m</span>
                        {isMissedStatus && (
                          <span className="text-[10px] font-bold text-amber-700 uppercase">
                            (Currently Missed)
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-xs sm:text-sm mt-0.5 truncate">
                        {t.title}
                      </h4>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* User reflection / note */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Context / Reason for Delay (Optional)
              </label>
              <input
                type="text"
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
                placeholder="e.g. Bug took longer to fix, felt burnt out"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-200 text-slate-800"
              />
            </div>

            {/* Run button */}
            <button
              id="btn-run-adaptive"
              onClick={handleRunAdaptiveEngine}
              disabled={isAdapting || selectedMissedIds.length === 0}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              {isAdapting ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  Calculating Rebalanced Plan...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  Run SynqAI Adaptive Rebalance ({selectedMissedIds.length} tasks)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Rebalance Results & Diff Comparison */}
        <div className="lg:col-span-6 space-y-6">
          {adaptationResult ? (
            <div className="bg-white rounded-2xl border-2 border-indigo-500 shadow-md p-5 sm:p-6 space-y-5">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-indigo-600 text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-base text-slate-900">
                  SynqAI Adaptive Solution
                </h3>
              </div>

              {/* Guilt-free Explanation */}
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-950 text-xs sm:text-sm leading-relaxed">
                <strong>AI Adjustment Rationale:</strong>
                <p className="mt-1 text-slate-700">{adaptationResult.explanation}</p>
              </div>

              {/* Changes summary */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Rebalance Actions Taken:
                </span>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {adaptationResult.changesSummary}
                </p>
              </div>

              {/* Tasks Reallocated Diff */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Rescheduled Work Breakdown:
                </span>
                <div className="space-y-2">
                  {adaptationResult.taskUpdates.map((update) => {
                    const originalTask = plan.tasks.find((t) => t.id === update.id);
                    if (!originalTask) return null;

                    return (
                      <div
                        key={update.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-1"
                      >
                        <div className="font-semibold text-slate-900">{originalTask.title}</div>
                        <div className="flex items-center gap-2 text-slate-600 font-medium">
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px]">
                            Day {originalTask.dayNumber}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Day {update.newDayNumber} ({update.newTimeOfDay || 'morning'})
                          </span>
                        </div>
                        {update.rescheduleReason && (
                          <div className="text-[11px] text-slate-500 italic">
                            Reason: {update.rescheduleReason}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Apply Button */}
              <button
                id="btn-apply-adaptive-plan"
                onClick={handleApplyChanges}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <Check className="w-4 h-4" />
                Apply Rebalanced Plan to Main Schedule
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-3 flex flex-col items-center justify-center min-h-[340px]">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-slate-800 text-base">
                Adaptive Rebalancing Ready
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Select one or more unfinished tasks on the left, or use the quick test simulate buttons, then trigger the engine to preview dynamic redistribution.
              </p>
            </div>
          )}

          {/* Adaptation History Log */}
          {plan.adaptationHistory && plan.adaptationHistory.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <History className="w-4 h-4 text-slate-500" />
                <h3 className="font-display font-bold text-sm text-slate-900">
                  Adaptation Log History
                </h3>
              </div>

              <div className="space-y-2.5">
                {plan.adaptationHistory.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-700">{log.reason}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-600">{log.explanation}</p>
                    <div className="text-[11px] text-indigo-700 font-medium">{log.changesSummary}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
