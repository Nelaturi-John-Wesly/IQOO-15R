import React, { useState, useEffect } from 'react';
import { GoalPlan, Task, TaskStatus, ProductivityStats, AdaptationLog, UserPersona, GmailSignal, LocationCommuteSignal, BehaviorLogEntry } from './types';
import { INITIAL_GOAL_PLAN, INITIAL_EMPLOYEE_GOAL_PLAN, SAMPLE_GMAIL_SIGNALS, SAMPLE_LOCATION_COMMUTE, SAMPLE_BEHAVIOR_LOGS } from './utils/sampleData';
import { Navbar } from './components/Navbar';
import { RemindersBanner } from './components/RemindersBanner';
import { GoalPlannerView } from './components/GoalPlannerView';
import { SmartScheduleView } from './components/SmartScheduleView';
import { BehaviorSyncView } from './components/BehaviorSyncView';
import { FocusModeView } from './components/FocusModeView';
import { AdaptiveReschedulerView } from './components/AdaptiveReschedulerView';
import { ProductivityDashboard } from './components/ProductivityDashboard';
import { PersonaGuideModal } from './components/PersonaGuideModal';
import { TaskEditModal } from './components/TaskEditModal';

const STORAGE_KEY = 'synqai_active_plan_v2';
const PERSONA_STORAGE_KEY = 'synqai_persona_v2';
const FOCUS_STORAGE_KEY = 'synqai_focus_minutes_v1';
const GMAIL_SIGNALS_KEY = 'synqai_gmail_signals_v1';
const COMMUTE_KEY = 'synqai_commute_v1';
const BEHAVIOR_KEY = 'synqai_behavior_logs_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'planner' | 'schedule' | 'behavior' | 'focus' | 'adaptive' | 'dashboard'>('schedule');
  const [currentDay, setCurrentDay] = useState<number>(3);
  const [activeTaskId, setActiveTaskId] = useState<string | null>('task-3-1');
  const [totalFocusMinutes, setTotalFocusMinutes] = useState<number>(() => {
    const saved = localStorage.getItem(FOCUS_STORAGE_KEY);
    return saved ? Number(saved) : 145;
  });
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // User Persona: Student vs. Employee
  const [persona, setPersona] = useState<UserPersona>(() => {
    const saved = localStorage.getItem(PERSONA_STORAGE_KEY);
    return (saved === 'employee' || saved === 'student') ? saved : 'student';
  });

  // Modal dialog states
  const [isPersonaGuideOpen, setIsPersonaGuideOpen] = useState(false);
  const [isTaskEditOpen, setIsTaskEditOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskEditDay, setTaskEditDay] = useState<number>(currentDay);

  // Behavior signals state
  const [gmailSignals, setGmailSignals] = useState<GmailSignal[]>(() => {
    const saved = localStorage.getItem(GMAIL_SIGNALS_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return SAMPLE_GMAIL_SIGNALS;
  });

  const [commuteSignal, setCommuteSignal] = useState<LocationCommuteSignal>(() => {
    const saved = localStorage.getItem(COMMUTE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return SAMPLE_LOCATION_COMMUTE;
  });

  const [behaviorLogs, setBehaviorLogs] = useState<BehaviorLogEntry[]>(() => {
    const saved = localStorage.getItem(BEHAVIOR_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return SAMPLE_BEHAVIOR_LOGS;
  });

  // Load plan from localStorage or persona sample
  const [plan, setPlan] = useState<GoalPlan>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved plan:', e);
      }
    }
    return INITIAL_GOAL_PLAN;
  });

  // Check health and Gemini key availability
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.hasGeminiKey) setHasGeminiKey(true);
      })
      .catch((e) => console.log('Health check note:', e));
  }, []);

  // Persist plan changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  }, [plan]);

  // Persist persona
  useEffect(() => {
    localStorage.setItem(PERSONA_STORAGE_KEY, persona);
  }, [persona]);

  // Persist focus minutes
  useEffect(() => {
    localStorage.setItem(FOCUS_STORAGE_KEY, String(totalFocusMinutes));
  }, [totalFocusMinutes]);

  // Persist behavior signals
  useEffect(() => {
    localStorage.setItem(GMAIL_SIGNALS_KEY, JSON.stringify(gmailSignals));
  }, [gmailSignals]);

  useEffect(() => {
    localStorage.setItem(COMMUTE_KEY, JSON.stringify(commuteSignal));
  }, [commuteSignal]);

  useEffect(() => {
    localStorage.setItem(BEHAVIOR_KEY, JSON.stringify(behaviorLogs));
  }, [behaviorLogs]);

  // Compute Productivity Statistics
  const completedTasks = plan.tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = plan.tasks.filter((t) => t.status === 'in_progress').length;
  const missedTasks = plan.tasks.filter((t) => t.status === 'missed').length;
  const pendingTasks = plan.tasks.filter((t) => t.status === 'pending').length;
  const totalTasks = plan.tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const onTrackScore = Math.max(50, Math.min(98, 100 - missedTasks * 8 + (completedTasks >= 3 ? 6 : 0)));

  const stats: ProductivityStats = {
    completedTasks,
    pendingTasks,
    inProgressTasks,
    missedTasks,
    totalTasks,
    totalFocusMinutes,
    streakDays: 3,
    completionRate,
    onTrackScore,
  };

  // Toggle or switch Persona
  const handleTogglePersona = () => {
    const nextPersona: UserPersona = persona === 'student' ? 'employee' : 'student';
    handleSelectPersona(nextPersona);
  };

  const handleSelectPersona = (newPersona: UserPersona) => {
    setPersona(newPersona);
    if (newPersona === 'employee' && plan.id === 'goal-cse-project-7d') {
      setPlan(INITIAL_EMPLOYEE_GOAL_PLAN);
      setCurrentDay(3);
      if (INITIAL_EMPLOYEE_GOAL_PLAN.tasks[0]) {
        setActiveTaskId(INITIAL_EMPLOYEE_GOAL_PLAN.tasks[0].id);
      }
    } else if (newPersona === 'student' && plan.id === 'goal-enterprise-sprint') {
      setPlan(INITIAL_GOAL_PLAN);
      setCurrentDay(3);
      if (INITIAL_GOAL_PLAN.tasks[0]) {
        setActiveTaskId(INITIAL_GOAL_PLAN.tasks[0].id);
      }
    } else {
      setPlan((prev) => ({ ...prev, persona: newPersona }));
    }

    // Update commute defaults
    if (newPersona === 'student') {
      setCommuteSignal({
        currentLocation: 'Campus Dorm (North Hall)',
        destination: 'Campus Engineering Lab 3',
        commuteMinutes: 12,
        distanceKm: 1.2,
        traffic: 'light',
        leaveByTime: '08:42 AM',
        targetArrivalTime: '08:55 AM',
        recommendation: 'Walking transit to Campus Lab is 12 mins. Leave by 08:42 AM to arrive for your 09:00 AM lecture calmly.',
      });
    } else {
      setCommuteSignal({
        currentLocation: 'Home / Residence (North District)',
        destination: 'Corporate HQ / Client Hub (Tech Park)',
        commuteMinutes: 34,
        distanceKm: 16.2,
        traffic: 'moderate',
        leaveByTime: '08:16 AM',
        targetArrivalTime: '08:55 AM',
        recommendation: 'Highway traffic is moderate (+7 mins). Leave by 08:16 AM for your 09:00 AM team standup and focus sprint.',
      });
    }

    setBehaviorLogs((prev) => [
      {
        id: `bl-${Date.now()}`,
        timestamp: 'Just now',
        source: 'schedule_sync',
        title: `Persona Switched: ${newPersona === 'student' ? 'Student & Academic' : 'Employee & Professional'}`,
        description: `Workspace customized with ${newPersona} schedules, editability, and location checkpoints.`,
        impact: `Loaded ${newPersona}-specific timing reminders and behavior sync rules.`,
      },
      ...prev,
    ]);
  };

  // Generate new plan via AI API
  const handleGenerateNewPlan = async (params: {
    goal: string;
    days: number;
    dailyHours: number;
    energyPeak: 'morning' | 'afternoon' | 'evening';
    context: string;
  }) => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/plan-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, persona }),
      });
      const data = await res.json();
      if (data.success && data.plan) {
        const rawPlan = data.plan;
        const newGoalId = `goal-${Date.now()}`;

        // Normalize milestones with IDs
        const milestones = (rawPlan.milestones || []).map((m: any, idx: number) => ({
          id: `m-${idx + 1}`,
          day: Number(m.day) || Math.min(params.days, idx + 1),
          title: m.title || `Phase ${idx + 1}`,
          description: m.description || '',
          completed: false,
        }));

        // Normalize tasks with IDs and subtasks
        const tasks: Task[] = (rawPlan.tasks || []).map((t: any, idx: number) => ({
          id: `task-${Date.now()}-${idx + 1}`,
          goalId: newGoalId,
          dayNumber: Math.max(1, Math.min(params.days, Number(t.dayNumber) || 1)),
          timeOfDay: (t.timeOfDay as Task['timeOfDay']) || 'morning',
          scheduledTime: t.scheduledTime || (t.timeOfDay === 'morning' ? '09:00 AM' : t.timeOfDay === 'afternoon' ? '02:00 PM' : '07:00 PM'),
          title: t.title,
          description: t.description,
          category: t.category || (persona === 'student' ? 'Academics & Study' : 'Sprint Task'),
          estimatedMinutes: Number(t.estimatedMinutes) || 60,
          priority: (t.priority as Task['priority']) || 'medium',
          status: 'pending',
          personaTag: persona,
          locationRequired: t.locationRequired || (persona === 'student' ? 'Campus Library' : 'Office Desk'),
          subtasks: Array.isArray(t.subtasks)
            ? t.subtasks.map((st: string, sIdx: number) => ({
                id: `st-${idx}-${sIdx}`,
                title: typeof st === 'string' ? st : (st as any).title || 'Action step',
                completed: false,
              }))
            : [
                { id: `st-${idx}-1`, title: 'Clarify deliverables and scope', completed: false },
                { id: `st-${idx}-2`, title: 'Execute primary focus block', completed: false },
              ],
          focusTips: t.focusTips || [],
        }));

        const newPlan: GoalPlan = {
          id: newGoalId,
          title: rawPlan.title || params.goal,
          persona,
          targetDays: params.days,
          dailyHours: params.dailyHours,
          energyPeak: params.energyPeak,
          createdAt: new Date().toISOString(),
          status: 'active',
          aiStrategy: rawPlan.strategy || `Paced progressive distribution aligned with your ${params.energyPeak} energy window.`,
          milestones,
          tasks,
          adaptationHistory: [
            {
              id: `adapt-gen-${Date.now()}`,
              timestamp: new Date().toISOString(),
              reason: `${persona === 'student' ? 'Student Study' : 'Employee Sprint'} Synthesis`,
              affectedTaskIds: tasks.slice(0, 3).map((t) => t.id),
              explanation: `Decomposed goal into customizable schedule for ${persona}. Feel free to edit timings or adjust tasks.`,
              changesSummary: `Divided goal into ${tasks.length} structured action blocks across ${params.days} days.`,
            },
          ],
        };

        setPlan(newPlan);
        setCurrentDay(1);
        if (tasks[0]) setActiveTaskId(tasks[0].id);
        setActiveTab('schedule');
      }
    } catch (err) {
      console.error('Failed to generate plan:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Update single task status
  const handleUpdateTaskStatus = (taskId: string, status: TaskStatus) => {
    setPlan((prev) => {
      const updatedTasks = prev.tasks.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            status,
            completedAt: status === 'completed' ? new Date().toISOString() : undefined,
          };
        }
        return t;
      });

      // Also check if any milestone day is now complete
      const updatedMilestones = prev.milestones.map((m) => {
        const tasksForMilestone = updatedTasks.filter((t) => t.dayNumber <= m.day);
        const allCompleted = tasksForMilestone.length > 0 && tasksForMilestone.every((t) => t.status === 'completed');
        return {
          ...m,
          completed: allCompleted,
        };
      });

      return {
        ...prev,
        tasks: updatedTasks,
        milestones: updatedMilestones,
      };
    });
  };

  // Save (Create or Edit) Task in schedule
  const handleSaveTask = (savedTask: Task) => {
    setPlan((prev) => {
      const exists = prev.tasks.some((t) => t.id === savedTask.id);
      const updatedTasks = exists
        ? prev.tasks.map((t) => (t.id === savedTask.id ? savedTask : t))
        : [...prev.tasks, savedTask].sort((a, b) => {
            if (a.dayNumber !== b.dayNumber) return a.dayNumber - b.dayNumber;
            return (a.scheduledTime || '').localeCompare(b.scheduledTime || '');
          });

      return {
        ...prev,
        tasks: updatedTasks,
      };
    });

    setBehaviorLogs((prev) => [
      {
        id: `bl-${Date.now()}`,
        timestamp: 'Just now',
        source: 'schedule_sync',
        title: `Schedule Updated: ${savedTask.title}`,
        description: `Scheduled on Day ${savedTask.dayNumber} at ${savedTask.scheduledTime} (${savedTask.estimatedMinutes}m).`,
        impact: `Updated Day ${savedTask.dayNumber} focus schedule and timings.`,
      },
      ...prev,
    ]);
  };

  // Delete task from schedule
  const handleDeleteTask = (taskId: string) => {
    setPlan((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
    }));

    setBehaviorLogs((prev) => [
      {
        id: `bl-${Date.now()}`,
        timestamp: 'Just now',
        source: 'schedule_sync',
        title: 'Task Removed from Schedule',
        description: `User cleared task checkpoint to adjust focus bandwidth.`,
        impact: 'Freed up focus minutes for the day.',
      },
      ...prev,
    ]);
  };

  // Apply Gmail signal into schedule
  const handleApplyGmailToSchedule = (signal: GmailSignal) => {
    setGmailSignals((prev) =>
      prev.map((s) => (s.id === signal.id ? { ...s, appliedToSchedule: true } : s))
    );

    const targetDayNumber = currentDay;
    const newTask: Task = {
      id: `task-gmail-${Date.now()}`,
      goalId: plan.id,
      dayNumber: targetDayNumber,
      scheduledTime: signal.detectedDeadline ? signal.detectedDeadline.split(',')[1]?.trim() || '02:30 PM' : '02:30 PM',
      timeOfDay: 'afternoon',
      title: signal.suggestedTaskTitle || signal.subject,
      description: `Synced from Gmail (${signal.from}): "${signal.snippet}"`,
      category: signal.type === 'assignment' ? 'Assignment / Academic' : 'Meeting / Review',
      estimatedMinutes: 60,
      priority: signal.priority === 'urgent' ? 'high' : 'medium',
      status: 'pending',
      locationRequired: persona === 'student' ? 'Campus Lab / Library' : 'Office Meeting Room',
      personaTag: persona,
      subtasks: [
        { id: `st-gm-1`, title: 'Review email criteria and attachments', completed: false },
        { id: `st-gm-2`, title: 'Submit deliverable before deadline', completed: false },
      ],
    };

    handleSaveTask(newTask);
    alert(`Added "${newTask.title}" to Day ${targetDayNumber} schedule!`);
  };

  // Open Edit Task modal
  const handleOpenEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskEditDay(task.dayNumber);
    setIsTaskEditOpen(true);
  };

  // Open Add Task modal
  const handleOpenAddNewTask = (dayNumber: number) => {
    setEditingTask(null);
    setTaskEditDay(dayNumber);
    setIsTaskEditOpen(true);
  };

  // Select task and jump to Focus Mode
  const handleSelectTaskForFocus = (task: Task) => {
    setActiveTaskId(task.id);
    if (task.status === 'pending') {
      handleUpdateTaskStatus(task.id, 'in_progress');
    }
    setActiveTab('focus');
  };

  // Quick focus from navbar
  const handleQuickFocus = () => {
    const activeOrPending =
      plan.tasks.find((t) => t.status === 'in_progress') ||
      plan.tasks.find((t) => t.dayNumber === currentDay && t.status !== 'completed') ||
      plan.tasks.find((t) => t.status === 'pending') ||
      plan.tasks[0];

    if (activeOrPending) {
      setActiveTaskId(activeOrPending.id);
    }
    setActiveTab('focus');
  };

  // Toggle subtask step
  const handleToggleTaskSubstep = (taskId: string, substepId: string) => {
    setPlan((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            subtasks: t.subtasks.map((st) =>
              st.id === substepId ? { ...st, completed: !st.completed } : st
            ),
          };
        }
        return t;
      }),
    }));
  };

  // Mark task as missed and jump to adaptive rescheduler
  const handleMarkTaskMissed = (taskId: string) => {
    handleUpdateTaskStatus(taskId, 'missed');
  };

  // Apply rescheduled plan
  const handleApplyRescheduledPlan = (updatedTasks: Task[], adaptationLog: AdaptationLog) => {
    setPlan((prev) => ({
      ...prev,
      tasks: updatedTasks,
      adaptationHistory: [adaptationLog, ...(prev.adaptationHistory || [])],
    }));
    setActiveTab('schedule');
  };

  // Log completed focus minutes
  const handleLogFocusMinutes = (minutes: number) => {
    setTotalFocusMinutes((prev) => prev + minutes);
  };

  // Add behavior log entry
  const handleAddBehaviorLog = (entry: Omit<BehaviorLogEntry, 'id' | 'timestamp'>) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setBehaviorLogs((prev) => [
      {
        id: `bl-${Date.now()}`,
        timestamp: now,
        ...entry,
      },
      ...prev,
    ]);
  };

  const hasPendingSignals = gmailSignals.some((g) => !g.appliedToSchedule && g.priority === 'urgent');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top sticky Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
        activeGoalTitle={plan.title}
        hasGeminiKey={hasGeminiKey}
        onQuickFocus={handleQuickFocus}
        persona={persona}
        onTogglePersona={handleTogglePersona}
        onOpenPersonaGuide={() => setIsPersonaGuideOpen(true)}
        hasPendingSignals={hasPendingSignals}
      />

      {/* Proactive Alert Banner (Gmail + Commute + Missed Tasks) */}
      <RemindersBanner
        plan={plan}
        currentDay={currentDay}
        commuteSignal={commuteSignal}
        gmailSignals={gmailSignals}
        onOpenReschedule={() => setActiveTab('adaptive')}
        onStartTaskFocus={handleSelectTaskForFocus}
        onNavigateToBehavior={() => setActiveTab('behavior')}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'planner' && (
          <GoalPlannerView
            plan={plan}
            onGenerateNewPlan={handleGenerateNewPlan}
            isGenerating={isGenerating}
            onSelectTaskForFocus={handleSelectTaskForFocus}
            onNavigateToSchedule={() => setActiveTab('schedule')}
            onToggleTaskSubstep={handleToggleTaskSubstep}
          />
        )}

        {activeTab === 'schedule' && (
          <SmartScheduleView
            plan={plan}
            currentDay={currentDay}
            persona={persona}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onSelectTaskForFocus={handleSelectTaskForFocus}
            onOpenReschedule={() => setActiveTab('adaptive')}
            onToggleTaskSubstep={handleToggleTaskSubstep}
            onEditTask={handleOpenEditTask}
            onAddNewTask={handleOpenAddNewTask}
            onOpenPersonaGuide={() => setIsPersonaGuideOpen(true)}
          />
        )}

        {activeTab === 'behavior' && (
          <BehaviorSyncView
            persona={persona}
            onSelectPersona={handleSelectPersona}
            plan={plan}
            gmailSignals={gmailSignals}
            commuteSignal={commuteSignal}
            behaviorLogs={behaviorLogs}
            onApplyGmailToSchedule={handleApplyGmailToSchedule}
            onUpdateCommute={setCommuteSignal}
            onAddBehaviorLog={handleAddBehaviorLog}
            onOpenPersonaGuide={() => setIsPersonaGuideOpen(true)}
            onNavigateToSchedule={() => setActiveTab('schedule')}
          />
        )}

        {activeTab === 'focus' && (
          <FocusModeView
            tasks={plan.tasks}
            activeTaskId={activeTaskId}
            onSelectTask={(id) => setActiveTaskId(id)}
            onCompleteTask={(id) => handleUpdateTaskStatus(id, 'completed')}
            onLogFocusMinutes={handleLogFocusMinutes}
            onToggleTaskSubstep={handleToggleTaskSubstep}
          />
        )}

        {activeTab === 'adaptive' && (
          <AdaptiveReschedulerView
            plan={plan}
            currentDay={currentDay}
            onApplyRescheduledPlan={handleApplyRescheduledPlan}
            onMarkTaskMissed={handleMarkTaskMissed}
          />
        )}

        {activeTab === 'dashboard' && (
          <ProductivityDashboard
            plan={plan}
            stats={stats}
            currentDay={currentDay}
            onNavigateToSchedule={() => setActiveTab('schedule')}
            onStartFocus={handleQuickFocus}
          />
        )}
      </main>

      {/* Role / Persona Guide Modal */}
      <PersonaGuideModal
        isOpen={isPersonaGuideOpen}
        onClose={() => setIsPersonaGuideOpen(false)}
        currentPersona={persona}
        onSelectPersona={handleSelectPersona}
      />

      {/* Schedule Task Create & Edit Modal */}
      <TaskEditModal
        isOpen={isTaskEditOpen}
        onClose={() => setIsTaskEditOpen(false)}
        task={editingTask}
        targetDays={plan.targetDays}
        currentDay={taskEditDay}
        persona={persona}
        onSaveTask={handleSaveTask}
        onDeleteTask={handleDeleteTask}
      />
    </div>
  );
}
