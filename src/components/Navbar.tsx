import React from 'react';
import {
  Sparkles,
  Calendar,
  Target,
  Clock,
  Activity,
  RotateCcw,
  Zap,
  MapPin,
  Mail,
  GraduationCap,
  Briefcase,
  Compass,
  Bell
} from 'lucide-react';
import { ProductivityStats, UserPersona } from '../types';

interface NavbarProps {
  activeTab: 'planner' | 'schedule' | 'behavior' | 'focus' | 'adaptive' | 'dashboard';
  setActiveTab: (tab: 'planner' | 'schedule' | 'behavior' | 'focus' | 'adaptive' | 'dashboard') => void;
  stats: ProductivityStats;
  activeGoalTitle: string;
  hasGeminiKey: boolean;
  onQuickFocus: () => void;
  isFocusRunning?: boolean;
  persona: UserPersona;
  onTogglePersona: () => void;
  onOpenPersonaGuide: () => void;
  hasPendingSignals?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  stats,
  activeGoalTitle,
  hasGeminiKey,
  onQuickFocus,
  isFocusRunning,
  persona,
  onTogglePersona,
  onOpenPersonaGuide,
  hasPendingSignals,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo, Brand & Persona Toggle */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
              <Zap className="w-5 h-5 fill-white/20 stroke-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-lg sm:text-xl tracking-tight text-slate-900">
                  SynqAI
                </span>

                {/* Interactive Persona Badge */}
                <button
                  onClick={onTogglePersona}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    persona === 'student'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
                  }`}
                  title="Click to switch between Student & Employee workflows"
                >
                  {persona === 'student' ? (
                    <GraduationCap className="w-3.5 h-3.5" />
                  ) : (
                    <Briefcase className="w-3.5 h-3.5" />
                  )}
                  <span className="capitalize">{persona}</span>
                  <span className="text-[10px] text-slate-400">⇄</span>
                </button>

                {hasGeminiKey && (
                  <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200/60">
                    <Sparkles className="w-3 h-3 text-sky-500" />
                    Gemini 3.8
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-[180px] sm:max-w-xs" title={activeGoalTitle}>
                Goal: <span className="font-medium text-slate-700">{activeGoalTitle}</span>
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden lg:flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/60 text-xs font-medium">
            <button
              id="nav-tab-planner"
              onClick={() => setActiveTab('planner')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'planner'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              Goal Planner
            </button>

            <button
              id="nav-tab-schedule"
              onClick={() => setActiveTab('schedule')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'schedule'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Schedule & Timings
              {stats.missedTasks > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500" title={`${stats.missedTasks} missed tasks`} />
              )}
            </button>

            {/* Behavior & Reminders Tab */}
            <button
              id="nav-tab-behavior"
              onClick={() => setActiveTab('behavior')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all relative ${
                activeTab === 'behavior'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-sky-600" />
              Maps, Gmail & Behavior
              {hasPendingSignals && (
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
              )}
            </button>

            <button
              id="nav-tab-focus"
              onClick={() => setActiveTab('focus')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'focus'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Focus Room
              {isFocusRunning && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              )}
            </button>

            <button
              id="nav-tab-adaptive"
              onClick={() => setActiveTab('adaptive')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'adaptive'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Adaptive Engine
            </button>

            <button
              id="nav-tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Analytics
            </button>
          </nav>

          {/* Right Action: Quick Focus & Role Guide */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenPersonaGuide}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
              title="Learn how students and employees utilize SynqAI"
            >
              <Compass className="w-3.5 h-3.5 text-indigo-600" />
              Role Guide
            </button>

            <button
              id="btn-quick-focus"
              onClick={onQuickFocus}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs ${
                isFocusRunning
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{isFocusRunning ? 'In Session...' : 'Focus Room'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="lg:hidden flex items-center justify-around py-2 border-t border-slate-100 text-[11px] font-medium text-slate-600 overflow-x-auto">
          <button
            onClick={() => setActiveTab('planner')}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg shrink-0 ${activeTab === 'planner' ? 'text-indigo-600 font-semibold' : ''}`}
          >
            <Target className="w-4 h-4" />
            <span>Plan</span>
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg shrink-0 ${activeTab === 'schedule' ? 'text-indigo-600 font-semibold' : ''}`}
          >
            <Calendar className="w-4 h-4" />
            <span>Schedule</span>
          </button>
          <button
            onClick={() => setActiveTab('behavior')}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg shrink-0 ${activeTab === 'behavior' ? 'text-indigo-600 font-semibold' : ''}`}
          >
            <MapPin className="w-4 h-4 text-sky-600" />
            <span>Behavior</span>
          </button>
          <button
            onClick={() => setActiveTab('focus')}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg shrink-0 ${activeTab === 'focus' ? 'text-indigo-600 font-semibold' : ''}`}
          >
            <Clock className="w-4 h-4" />
            <span>Focus</span>
          </button>
          <button
            onClick={() => setActiveTab('adaptive')}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg shrink-0 ${activeTab === 'adaptive' ? 'text-indigo-600 font-semibold' : ''}`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Adapt</span>
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg shrink-0 ${activeTab === 'dashboard' ? 'text-indigo-600 font-semibold' : ''}`}
          >
            <Activity className="w-4 h-4" />
            <span>Stats</span>
          </button>
        </div>
      </div>
    </header>
  );
};
