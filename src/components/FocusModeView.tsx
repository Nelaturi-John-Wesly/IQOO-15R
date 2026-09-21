import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Shield, CheckCircle2, Sparkles, MessageSquare, Plus, Check, Clock, Headphones, Zap } from 'lucide-react';
import { Task, FocusSessionState } from '../types';
import { focusAudio } from '../utils/audio';

interface FocusModeViewProps {
  tasks: Task[];
  activeTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  onCompleteTask: (taskId: string) => void;
  onLogFocusMinutes: (minutes: number) => void;
  onToggleTaskSubstep: (taskId: string, substepId: string) => void;
}

export const FocusModeView: React.FC<FocusModeViewProps> = ({
  tasks,
  activeTaskId,
  onSelectTask,
  onCompleteTask,
  onLogFocusMinutes,
  onToggleTaskSubstep,
}) => {
  // Find current active task or fallback to first pending
  const currentTask = tasks.find((t) => t.id === activeTaskId) || tasks.find((t) => t.status === 'in_progress' || t.status === 'pending') || tasks[0];

  // Focus Timer States
  const [timerMode, setTimerMode] = useState<'pomodoro' | 'deep' | 'short_break' | 'long_break'>('pomodoro');
  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Audio Ambient States
  const [soundscape, setSoundscape] = useState<'none' | 'whitenoise' | 'rain' | 'binaural'>('none');
  const [volume, setVolume] = useState<number>(0.6);

  // Distraction Checklist
  const [distractionItems, setDistractionItems] = useState([
    { id: 'd-1', label: 'Put phone into another room or on Do Not Disturb', checked: true },
    { id: 'd-2', label: 'Close all tabs unrelated to this exact task', checked: true },
    { id: 'd-3', label: 'Full screen browser view enabled', checked: false },
    { id: 'd-4', label: 'Single-task commitment: No multitasking for this block', checked: true },
  ]);

  // AI Distraction Coach
  const [obstacleInput, setObstacleInput] = useState('');
  const [coachResponse, setCoachResponse] = useState<{ reframe: string; tips: string[] } | null>(null);
  const [isCoaching, setIsCoaching] = useState(false);

  // Completed session notification
  const [sessionCompletedNotice, setSessionCompletedNotice] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer Tick
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            focusAudio.stop();
            setSoundscape('none');
            setSessionCompletedNotice(true);
            onLogFocusMinutes(durationMinutes);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, durationMinutes, onLogFocusMinutes]);

  // Soundscape handler
  const handleToggleSound = (mode: 'none' | 'whitenoise' | 'rain' | 'binaural') => {
    if (soundscape === mode) {
      focusAudio.stop();
      setSoundscape('none');
    } else {
      focusAudio.play(mode, volume);
      setSoundscape(mode);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    focusAudio.setVolume(newVol);
  };

  // Set preset modes
  const handleSelectMode = (mode: 'pomodoro' | 'deep' | 'short_break' | 'long_break') => {
    setIsRunning(false);
    setTimerMode(mode);
    let mins = 25;
    if (mode === 'pomodoro') mins = 25;
    if (mode === 'deep') mins = 50;
    if (mode === 'short_break') mins = 5;
    if (mode === 'long_break') mins = 15;
    setDurationMinutes(mins);
    setTimeLeft(mins * 60);
    setSessionCompletedNotice(false);
  };

  const handleAddFiveMinutes = () => {
    setTimeLeft((prev) => prev + 300);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setTimeLeft(durationMinutes * 60);
    setSessionCompletedNotice(false);
  };

  const toggleDistractionItem = (id: string) => {
    setDistractionItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleAskCoach = async (presetObstacle?: string) => {
    const obstacle = presetObstacle || obstacleInput || 'Digital notifications and wandering focus';
    setIsCoaching(true);
    try {
      const res = await fetch('/api/distraction-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskTitle: currentTask?.title || 'Current Focus Sprint',
          obstacle,
        }),
      });
      const data = await res.json();
      setCoachResponse(data);
    } catch (e) {
      console.warn('Coach request failed:', e);
    } finally {
      setIsCoaching(false);
    }
  };

  // Formatting minutes and seconds
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  const totalSecs = durationMinutes * 60;
  const progressPercent = Math.max(0, Math.min(100, ((totalSecs - timeLeft) / totalSecs) * 100));

  return (
    <div className="space-y-8 pb-16">
      {/* Header section */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-2">
              <Zap className="w-3.5 h-3.5" />
              Feature 5: Deep Focus Room
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Distraction-Free Focus Mode
            </h1>
            <p className="text-slate-600 text-sm mt-1 max-w-2xl">
              Immerse yourself into deep execution with zero digital friction, ambient soundscapes, anti-distraction guardrails, and real-time task checkpoints.
            </p>
          </div>

          {/* Task selector dropdown */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label className="text-xs font-semibold text-slate-500">Active Task:</label>
            <select
              value={currentTask?.id || ''}
              onChange={(e) => onSelectTask(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-200 max-w-xs truncate"
            >
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  Day {t.dayNumber}: {t.title} ({t.estimatedMinutes}m)
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Main Focus Room Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Center Stage: Timer & Soundscape */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 flex flex-col items-center text-center space-y-6">
          {/* Active Task Badge */}
          {currentTask && (
            <div className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-left flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600">
                  Day {currentTask.dayNumber} Focus Sprint · {currentTask.category}
                </span>
                <h3 className="font-semibold text-slate-900 text-sm sm:text-base mt-0.5">
                  {currentTask.title}
                </h3>
              </div>
              <button
                onClick={() => onCompleteTask(currentTask.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all border border-emerald-200 shrink-0 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Mark Done
              </button>
            </div>
          )}

          {/* Mode Selector Chips */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-medium">
            <button
              onClick={() => handleSelectMode('pomodoro')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                timerMode === 'pomodoro'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pomodoro (25m)
            </button>
            <button
              onClick={() => handleSelectMode('deep')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                timerMode === 'deep'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Deep Sprint (50m)
            </button>
            <button
              onClick={() => handleSelectMode('short_break')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                timerMode === 'short_break'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Short Break (5m)
            </button>
            <button
              onClick={() => handleSelectMode('long_break')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                timerMode === 'long_break'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Long Break (15m)
            </button>
          </div>

          {/* Circular Countdown Timer */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center my-2">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="44"
                className="stroke-slate-100"
                strokeWidth="6"
                fill="transparent"
              />
              {/* Animated progress ring */}
              <circle
                cx="50"
                cy="50"
                r="44"
                className="stroke-indigo-600 transition-all duration-1000 ease-linear"
                strokeWidth="6"
                strokeDasharray="276.46"
                strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Center Time Display */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="font-display font-bold text-5xl sm:text-6xl text-slate-900 tracking-tight">
                {timeFormatted}
              </span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">
                {isRunning ? 'Focus In Session' : timeLeft === 0 ? 'Block Completed!' : 'Ready'}
              </span>
            </div>
          </div>

          {/* Completed Session Celebration */}
          {sessionCompletedNotice && (
            <div className="w-full p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs text-left flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <strong className="font-bold">Great work! Focus sprint completed.</strong>
                  <p className="text-emerald-700 mt-0.5">{durationMinutes} minutes logged to your daily productivity score.</p>
                </div>
              </div>
              <button
                onClick={() => setSessionCompletedNotice(false)}
                className="px-3 py-1 bg-emerald-600 text-white font-semibold rounded-lg shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Primary Timer Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`px-7 py-3 rounded-xl font-bold text-sm text-white transition-all shadow-md flex items-center gap-2 ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" /> Start Focus
                </>
              )}
            </button>

            <button
              onClick={handleResetTimer}
              className="p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={handleAddFiveMinutes}
              className="px-3 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
              title="Add 5 minutes"
            >
              +5m
            </button>
          </div>

          {/* Web Audio Ambient Soundscapes Section */}
          <div className="w-full pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Headphones className="w-4 h-4 text-indigo-600" />
                Ambient Soundscape Synthesizer
              </div>
              {soundscape !== 'none' && (
                <span className="text-[11px] font-semibold text-indigo-600 animate-pulse">
                  Sound Active
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handleToggleSound('rain')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  soundscape === 'rain'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                🌧️ Gentle Rain
              </button>

              <button
                onClick={() => handleToggleSound('whitenoise')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  soundscape === 'whitenoise'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                📻 Pink Noise
              </button>

              <button
                onClick={() => handleToggleSound('binaural')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  soundscape === 'binaural'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                🧠 40Hz Binaural
              </button>

              <button
                onClick={() => handleToggleSound('none')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  soundscape === 'none'
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <VolumeX className="w-3.5 h-3.5" /> Mute
              </button>
            </div>

            {/* Volume control */}
            {soundscape !== 'none' && (
              <div className="mt-3 flex items-center gap-3 text-xs text-slate-600">
                <Volume2 className="w-4 h-4 text-slate-400" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <span className="w-8 text-right font-medium">{Math.round(volume * 100)}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Distraction Blockers & AI Coach */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Task Checkpoints */}
          {currentTask && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
              <h3 className="font-display font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                Task Milestone Checkpoints
              </h3>

              {currentTask.subtasks && currentTask.subtasks.length > 0 ? (
                <div className="space-y-2">
                  {currentTask.subtasks.map((st) => (
                    <label
                      key={st.id}
                      className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={st.completed}
                        onChange={() => onToggleTaskSubstep(currentTask.id, st.id)}
                        className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span className={`text-xs ${st.completed ? 'line-through text-slate-400' : 'text-slate-800 font-medium'}`}>
                        {st.title}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No subtasks defined. Focus purely on the main objective.</p>
              )}
            </div>
          )}

          {/* Distraction Management Checklist */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                Distraction Blocker Checklist
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                {distractionItems.filter((i) => i.checked).length}/{distractionItems.length} active
              </span>
            </div>

            <div className="space-y-2">
              {distractionItems.map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer select-none hover:text-slate-900"
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleDistractionItem(item.id)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* AI Distraction Coach */}
          <div className="bg-gradient-to-br from-indigo-50/70 to-slate-50 rounded-2xl border border-indigo-100 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-indigo-600 text-white">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                SynqAI Anti-Distraction Coach
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              Feeling an urge to check notifications or stuck in procrastination? Ask SynqAI for an instant psychological reframe.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={obstacleInput}
                onChange={(e) => setObstacleInput(e.target.value)}
                placeholder="e.g. Urge to check social media"
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-indigo-200"
              />
              <button
                onClick={() => handleAskCoach()}
                disabled={isCoaching}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 shrink-0"
              >
                {isCoaching ? 'Thinking...' : 'Coach Me'}
              </button>
            </div>

            {/* Quick Distraction Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                'Mind wandering',
                'Stuck on hard code/logic',
                'Tired & low energy',
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleAskCoach(chip)}
                  disabled={isCoaching}
                  className="px-2 py-0.5 rounded-md text-[10px] bg-white border border-slate-200 text-slate-600 hover:text-indigo-700 hover:border-indigo-300 transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Coach Response Card */}
            {coachResponse && (
              <div className="mt-3 p-3.5 rounded-xl bg-white border border-indigo-200 shadow-2xs space-y-2 text-xs">
                <div className="text-indigo-950 font-medium italic">
                  "{coachResponse.reframe}"
                </div>
                <div className="space-y-1 pt-1 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Immediate Action Tactics:
                  </span>
                  {coachResponse.tips.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-slate-700">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
