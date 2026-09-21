import React, { useState } from 'react';
import {
  GraduationCap,
  Briefcase,
  MapPin,
  Mail,
  Navigation,
  Calendar,
  Clock,
  Edit3,
  Sparkles,
  ArrowRight,
  Compass,
  CheckCircle2
} from 'lucide-react';
import { UserPersona } from '../types';
import { PERSONA_CONFIGS } from '../utils/sampleData';

interface PersonaGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPersona: UserPersona;
  onSelectPersona: (persona: UserPersona) => void;
}

export const PersonaGuideModal: React.FC<PersonaGuideModalProps> = ({
  isOpen,
  onClose,
  currentPersona,
  onSelectPersona,
}) => {
  const [activeView, setActiveView] = useState<UserPersona>(currentPersona);

  if (!isOpen) return null;

  const activeConfig = PERSONA_CONFIGS[activeView];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 mb-1">
              <Compass className="w-3.5 h-3.5" />
              Role-Based Tailoring & Daily Behavior Sync
            </div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900">
              How Students & Employees Utilize SynqAI
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Persona toggle */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveView('student')}
            className={`py-3 px-4 rounded-lg flex items-center justify-center gap-2.5 font-semibold text-xs sm:text-sm transition-all ${
              activeView === 'student'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            Student Workspace
          </button>

          <button
            onClick={() => setActiveView('employee')}
            className={`py-3 px-4 rounded-lg flex items-center justify-center gap-2.5 font-semibold text-xs sm:text-sm transition-all ${
              activeView === 'employee'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4 text-sky-600" />
            Employee Workspace
          </button>
        </div>

        {/* Persona Details */}
        <div className="space-y-4 text-sm">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="text-xs uppercase font-bold text-indigo-600 tracking-wider">
              {activeConfig.roleTag}
            </div>
            <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
              {activeConfig.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Daily Needs */}
            <div className="p-4 rounded-xl border border-slate-200 space-y-2.5 bg-white">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 text-indigo-700">
                <Calendar className="w-3.5 h-3.5" />
                Custom Schedules & Full Editability
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {activeConfig.keyNeeds.map((need, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-indigo-600 font-bold shrink-0">✓</span>
                    <span>{need}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Behavior & AI Sync */}
            <div className="p-4 rounded-xl border border-slate-200 space-y-2.5 bg-white">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 text-emerald-700">
                <Sparkles className="w-3.5 h-3.5" />
                Behavior Tracking & Reminders
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {activeConfig.howSynqAIHelps.map((help, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold shrink-0">•</span>
                    <span>{help}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Daily signals preview */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200/70 text-xs space-y-2">
            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-600" />
              Google Maps & Location Intelligence:
            </div>
            <p className="text-slate-600 leading-relaxed">
              SynqAI calculates commute durations between <strong>{activeConfig.typicalLocations[0]}</strong> and <strong>{activeConfig.typicalLocations[1]}</strong>, proactively ringing alarms when traffic is congested to protect your arrival punctuality.
            </p>
            <div className="font-semibold text-slate-900 flex items-center gap-1.5 pt-1">
              <Mail className="w-3.5 h-3.5 text-indigo-600" />
              Gmail Deadline & Meeting Extraction:
            </div>
            <p className="text-slate-600 leading-relaxed">
              Scans incoming signals from <strong>{activeConfig.sampleEmailSources.join(', ')}</strong>, auto-extracting dates and offering 1-click integration into your daily schedule.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onSelectPersona(activeView);
              onClose();
            }}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            Activate {activeConfig.name} Workspace
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
