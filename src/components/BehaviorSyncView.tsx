import React, { useState } from 'react';
import {
  MapPin,
  Mail,
  Navigation,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Plus,
  RefreshCw,
  Bell,
  ArrowRight,
  ShieldCheck,
  Compass,
  GraduationCap,
  Briefcase,
  Check,
  ExternalLink,
  Volume2
} from 'lucide-react';
import {
  UserPersona,
  Task,
  GmailSignal,
  LocationCommuteSignal,
  BehaviorLogEntry,
  GoalPlan
} from '../types';
import { PERSONA_CONFIGS } from '../utils/sampleData';
import { focusAudio } from '../utils/audio';

interface BehaviorSyncViewProps {
  persona: UserPersona;
  onSelectPersona: (p: UserPersona) => void;
  plan: GoalPlan;
  gmailSignals: GmailSignal[];
  commuteSignal: LocationCommuteSignal;
  behaviorLogs: BehaviorLogEntry[];
  onApplyGmailToSchedule: (signal: GmailSignal) => void;
  onUpdateCommute: (updated: LocationCommuteSignal) => void;
  onAddBehaviorLog: (entry: Omit<BehaviorLogEntry, 'id' | 'timestamp'>) => void;
  onOpenPersonaGuide: () => void;
  onNavigateToSchedule: () => void;
}

export const BehaviorSyncView: React.FC<BehaviorSyncViewProps> = ({
  persona,
  onSelectPersona,
  plan,
  gmailSignals,
  commuteSignal,
  behaviorLogs,
  onApplyGmailToSchedule,
  onUpdateCommute,
  onAddBehaviorLog,
  onOpenPersonaGuide,
  onNavigateToSchedule,
}) => {
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsStatusText, setGpsStatusText] = useState<string | null>(null);

  // Email scanner input
  const [customEmailFrom, setCustomEmailFrom] = useState('');
  const [customEmailSubject, setCustomEmailSubject] = useState('');
  const [customEmailSnippet, setCustomEmailSnippet] = useState('');
  const [showAddEmailModal, setShowAddEmailModal] = useState(false);

  // Custom behavior entry
  const [newLogTitle, setNewLogTitle] = useState('');
  const [newLogDesc, setNewLogDesc] = useState('');
  const [newLogSource, setNewLogSource] = useState<'google_maps' | 'gmail' | 'location_sensor' | 'schedule_sync'>('google_maps');

  // Alarm sound test
  const [playingTestChime, setPlayingTestChime] = useState(false);

  const personaConfig = PERSONA_CONFIGS[persona];

  // Live HTML5 Geolocation Trigger
  const handleDetectLiveLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatusText('Geolocation not supported in browser environment');
      return;
    }

    setGpsStatusText('Detecting real-time coordinates...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsActive(true);
        const lat = pos.coords.latitude.toFixed(4);
        const lon = pos.coords.longitude.toFixed(4);
        setGpsStatusText(`GPS Locked: Lat ${lat}, Lon ${lon}`);

        // Update commute with detected location
        const detectedName = persona === 'student' ? `Current Location (${lat}, ${lon}) - Near Dorms` : `Current Location (${lat}, ${lon}) - Metro Suburbs`;
        onUpdateCommute({
          ...commuteSignal,
          currentLocation: detectedName,
        });

        onAddBehaviorLog({
          source: 'location_sensor',
          title: `GPS Sensor Check-in: ${detectedName}`,
          description: `Location coordinates recorded. Proximity to target workspace evaluated.`,
          impact: 'Updated commute buffer and timing reminder calculations.',
        });
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setGpsStatusText('Location access fallback to registered Home/Dorm address.');
      }
    );
  };

  // Test Timing Alert Chime
  const handleTestChime = () => {
    setPlayingTestChime(true);
    focusAudio.play('binaural', 0.4);
    setTimeout(() => {
      focusAudio.stop();
      setPlayingTestChime(false);
    }, 1800);
  };

  // Add custom email signal
  const handleAddEmailSignal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmailSubject) return;

    const newSignal: GmailSignal = {
      id: `gm-${Date.now()}`,
      from: customEmailFrom || (persona === 'student' ? 'faculty.advising@university.edu' : 'lead.architect@company.com'),
      subject: customEmailSubject,
      snippet: customEmailSnippet || 'Urgent timing update extracted from message body.',
      date: 'Just now',
      detectedDeadline: 'Today, 05:00 PM',
      suggestedTaskTitle: customEmailSubject,
      priority: 'urgent',
      type: persona === 'student' ? 'assignment' : 'meeting',
      appliedToSchedule: false,
    };

    onApplyGmailToSchedule(newSignal);
    setShowAddEmailModal(false);
    setCustomEmailFrom('');
    setCustomEmailSubject('');
    setCustomEmailSnippet('');

    onAddBehaviorLog({
      source: 'gmail',
      title: `Gmail Signal Synced: ${customEmailSubject}`,
      description: `Extracted deadline and added alert to today's schedule.`,
      impact: 'Inserted task timing checkpoint into schedule.',
    });
  };

  // Add custom behavior log
  const handleAddCustomLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogTitle) return;

    onAddBehaviorLog({
      source: newLogSource,
      title: newLogTitle,
      description: newLogDesc || 'User recorded daily routine checkpoint.',
      impact: 'Learned timing patterns applied to future predictive scheduling.',
    });

    setNewLogTitle('');
    setNewLogDesc('');
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header & Persona Selector */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold mb-2">
              <Compass className="w-3.5 h-3.5" />
              Daily Behavior, Google Maps & Gmail Timing Sync
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Behavior Signals & Timing Reminders
            </h1>
            <p className="text-slate-600 text-sm mt-1 max-w-3xl">
              SynqAI syncs your daily behavior—including Google Maps commute telemetry and Gmail notifications—to intelligently remind you of timings and keep your custom schedule on track.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Persona Switcher Buttons */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => onSelectPersona('student')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  persona === 'student'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Student
              </button>
              <button
                onClick={() => onSelectPersona('employee')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  persona === 'employee'
                    ? 'bg-white text-sky-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                Employee
              </button>
            </div>

            <button
              onClick={onOpenPersonaGuide}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1"
            >
              Role Guide
            </button>
          </div>
        </div>
      </section>

      {/* Role Context Ribbon */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-slate-50 to-sky-50 border border-indigo-100/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white shadow-2xs text-indigo-600 border border-slate-200/80">
            {persona === 'student' ? <GraduationCap className="w-5 h-5" /> : <Briefcase className="w-5 h-5 text-sky-600" />}
          </div>
          <div>
            <div className="font-bold text-slate-900">
              Active Persona: {personaConfig.name} ({personaConfig.roleTag})
            </div>
            <p className="text-slate-600 mt-0.5 max-w-2xl">
              {persona === 'student'
                ? 'Recording study timetable, campus lab sessions, and Gmail assignments with transit alerts to campus.'
                : 'Recording enterprise sprints, standup meetings, and manager directives with traffic-aware office commute alarms.'}
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToSchedule}
          className="px-3.5 py-1.5 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold rounded-xl shrink-0 transition-colors shadow-2xs flex items-center gap-1.5"
        >
          View & Edit Full Schedule
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid: Google Maps / Location Commute & Gmail Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Google Maps & Location Timing Alert Engine */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-base text-slate-900">
                    Google Maps & Location Intelligence
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Calculates commute transit & triggers timely departure reminders
                  </p>
                </div>
              </div>

              <button
                onClick={handleDetectLiveLocation}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors flex items-center gap-1"
                title="Query browser GPS position"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Live GPS
              </button>
            </div>

            {/* GPS Status Pill */}
            {gpsStatusText && (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
                <Navigation className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span>{gpsStatusText}</span>
              </div>
            )}

            {/* Commute Route Card */}
            <div className="bg-gradient-to-br from-sky-50/70 to-indigo-50/40 rounded-xl p-4 border border-sky-100 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
                    Daily Route Monitored
                  </span>
                  <div className="text-xs font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                    <span>{commuteSignal.currentLocation}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span>{commuteSignal.destination}</span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                  {commuteSignal.traffic} traffic
                </span>
              </div>

              {/* Timing metrics row */}
              <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-sky-100/80">
                <div className="bg-white/80 p-2 rounded-lg border border-sky-100">
                  <div className="text-[10px] text-slate-500 font-medium">Distance</div>
                  <div className="font-display font-bold text-sm text-slate-900">
                    {commuteSignal.distanceKm} km
                  </div>
                </div>

                <div className="bg-white/80 p-2 rounded-lg border border-sky-100">
                  <div className="text-[10px] text-slate-500 font-medium">Transit Time</div>
                  <div className="font-display font-bold text-sm text-slate-900">
                    {commuteSignal.commuteMinutes} mins
                  </div>
                </div>

                <div className="bg-amber-50 p-2 rounded-lg border border-amber-200">
                  <div className="text-[10px] text-amber-800 font-bold uppercase">Leave By</div>
                  <div className="font-display font-bold text-sm text-amber-900">
                    {commuteSignal.leaveByTime}
                  </div>
                </div>
              </div>

              {/* Dynamic Recommendation Banner */}
              <div className="p-3 bg-white rounded-xl border border-sky-200/80 text-xs text-slate-700 space-y-1">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-indigo-600" />
                  SynqAI Timing Recommendation:
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  {commuteSignal.recommendation}
                </p>
              </div>

              {/* Sound Test Button */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={handleTestChime}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  {playingTestChime ? 'Playing Audio Chime...' : 'Test Timing Alarm Chime'}
                </button>

                <span className="text-[10px] text-slate-400 font-medium">
                  Auto-alert enabled for Day {plan.tasks[0]?.dayNumber || 1}
                </span>
              </div>
            </div>

            {/* Quick Destination Presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Switch Destination Focus Hub:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {personaConfig.typicalLocations.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => {
                      onUpdateCommute({
                        ...commuteSignal,
                        destination: loc,
                        recommendation: `Commute recalculated for ${loc}. Leave by 08:25 AM to maintain optimal buffer.`,
                      });
                      onAddBehaviorLog({
                        source: 'google_maps',
                        title: `Destination Updated: ${loc}`,
                        description: `User selected ${loc} as the primary focus hub.`,
                        impact: 'Adjusted scheduled arrival buffer.',
                      });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      commuteSignal.destination === loc
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Daily Behavior Logging Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                Recorded Behavior Timeline
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                {behaviorLogs.length} events logged
              </span>
            </div>

            <div className="space-y-3">
              {behaviorLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-900 flex items-center gap-1.5">
                      {log.source === 'google_maps' && <MapPin className="w-3.5 h-3.5 text-sky-600" />}
                      {log.source === 'gmail' && <Mail className="w-3.5 h-3.5 text-indigo-600" />}
                      {log.source === 'location_sensor' && <Navigation className="w-3.5 h-3.5 text-emerald-600" />}
                      {log.source === 'schedule_sync' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                      {log.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {log.timestamp}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{log.description}</p>
                  <div className="text-[10px] font-medium text-indigo-700">
                    Impact: {log.impact}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Record Custom Habit/Behavior */}
            <form onSubmit={handleAddCustomLog} className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Record Daily Habit / Routine Event:
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLogTitle}
                  onChange={(e) => setNewLogTitle(e.target.value)}
                  placeholder={persona === 'student' ? 'e.g. Arrived at Library 3rd Floor quiet pod' : 'e.g. Commute delayed by 15 mins due to rain'}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition-colors shrink-0"
                >
                  Record
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Google Gmail Deadline Signals & Auto-Sync */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-base text-slate-900">
                    Gmail Signals & Auto-Schedule
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Scans emails for dates, deliverables, and schedule changes
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAddEmailModal(!showAddEmailModal)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Simulate Email
              </button>
            </div>

            {/* Email simulation form if toggled */}
            {showAddEmailModal && (
              <form onSubmit={handleAddEmailSignal} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <span className="font-bold text-slate-800 block">
                  Simulate Incoming Email Notification:
                </span>
                <input
                  type="text"
                  value={customEmailFrom}
                  onChange={(e) => setCustomEmailFrom(e.target.value)}
                  placeholder={persona === 'student' ? 'From: prof.smith@cs.univ.edu' : 'From: director.clark@company.com'}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
                <input
                  type="text"
                  required
                  value={customEmailSubject}
                  onChange={(e) => setCustomEmailSubject(e.target.value)}
                  placeholder="Subject (e.g. Lab Deadline postponed by 2 hours)"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
                <textarea
                  rows={2}
                  value={customEmailSnippet}
                  onChange={(e) => setCustomEmailSnippet(e.target.value)}
                  placeholder="Email body snippet..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddEmailModal(false)}
                    className="px-3 py-1 text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-indigo-600 text-white font-semibold rounded-lg"
                  >
                    Add Signal
                  </button>
                </div>
              </form>
            )}

            {/* List of Gmail Signals */}
            <div className="space-y-3">
              {gmailSignals.map((signal) => (
                <div
                  key={signal.id}
                  className={`p-4 rounded-xl border transition-all space-y-2.5 ${
                    signal.appliedToSchedule
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-white border-slate-200 shadow-2xs hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {signal.type}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium truncate">
                          {signal.from}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm mt-1">
                        {signal.subject}
                      </h4>
                    </div>

                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                      {signal.date}
                    </span>
                  </div>

                  <p className="text-slate-600 text-xs leading-relaxed">
                    {signal.snippet}
                  </p>

                  {/* Detected deadline banner */}
                  {signal.detectedDeadline && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-indigo-50/70 border border-indigo-100 text-xs">
                      <div className="flex items-center gap-1.5 text-indigo-900 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Detected Deadline: {signal.detectedDeadline}</span>
                      </div>

                      {signal.appliedToSchedule ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Synced to Schedule
                        </span>
                      ) : (
                        <button
                          onClick={() => onApplyGmailToSchedule(signal)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                          Sync to Schedule
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* How Daily Behavior Shapes Your Timings */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-sky-400" />
              Continuous Predictive Scheduling
            </div>
            <h3 className="font-display font-bold text-base text-white">
              Why SynqAI Tracks Location & Email Habits
            </h3>
            <p className="text-xs text-indigo-100/90 leading-relaxed">
              Traditional calendar apps only store static appointments. SynqAI actively bridges the gap between your real life (e.g. transit delays, sudden emails, fatigue) and your scheduled goals.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="font-bold text-sky-300 block mb-0.5">For Students:</span>
                <span className="text-[11px] text-indigo-100">Prevents missing lecture slots, tracks library study blocks, and alerts when homework links are sent.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="font-bold text-indigo-300 block mb-0.5">For Employees:</span>
                <span className="text-[11px] text-indigo-100">Guards deep work against meeting creep, alerts when traffic threatens client meetings, and reschedules missed tasks gracefully.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
