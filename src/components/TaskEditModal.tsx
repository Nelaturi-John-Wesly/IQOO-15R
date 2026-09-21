import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Tag,
  AlertCircle,
  Plus,
  Trash2,
  Check,
  X,
  Edit3
} from 'lucide-react';
import { Task, TaskPriority, TimeOfDay, UserPersona } from '../types';

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null; // null if creating a new task
  targetDays: number;
  currentDay: number;
  persona: UserPersona;
  onSaveTask: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  isOpen,
  onClose,
  task,
  targetDays,
  currentDay,
  persona,
  onSaveTask,
  onDeleteTask,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dayNumber, setDayNumber] = useState<number>(currentDay);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');
  const [scheduledTime, setScheduledTime] = useState('09:00 AM');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(60);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState('Academics');
  const [locationRequired, setLocationRequired] = useState('');
  const [subtasks, setSubtasks] = useState<Array<{ id: string; title: string; completed: boolean }>>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setDayNumber(task.dayNumber);
      setTimeOfDay(task.timeOfDay);
      setScheduledTime(task.scheduledTime || '09:00 AM');
      setEstimatedMinutes(task.estimatedMinutes);
      setPriority(task.priority);
      setCategory(task.category);
      setLocationRequired(task.locationRequired || '');
      setSubtasks(task.subtasks || []);
    } else {
      // Defaults for brand new task
      setTitle('');
      setDescription('');
      setDayNumber(currentDay);
      setTimeOfDay('morning');
      setScheduledTime('09:00 AM');
      setEstimatedMinutes(60);
      setPriority('medium');
      setCategory(persona === 'student' ? 'Class / Study' : 'Work Sprint');
      setLocationRequired(persona === 'student' ? 'Campus Library' : 'Office Desk');
      setSubtasks([
        { id: `st-${Date.now()}-1`, title: 'Prepare material & clarify goal', completed: false },
        { id: `st-${Date.now()}-2`, title: 'Execute focus block without distraction', completed: false },
      ]);
    }
  }, [task, isOpen, currentDay, persona]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      { id: `st-${Date.now()}`, title: newSubtaskTitle.trim(), completed: false },
    ]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((st) => st.id !== id));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const updatedTask: Task = {
      id: task?.id || `custom-task-${Date.now()}`,
      goalId: task?.goalId,
      dayNumber: Number(dayNumber) || 1,
      timeOfDay,
      scheduledTime: scheduledTime || (timeOfDay === 'morning' ? '09:00 AM' : timeOfDay === 'afternoon' ? '02:00 PM' : '07:00 PM'),
      title: title.trim(),
      description: description.trim() || 'Custom user scheduled focus item.',
      category: category.trim() || 'General Execution',
      estimatedMinutes: Number(estimatedMinutes) || 45,
      priority,
      status: task?.status || 'pending',
      locationRequired: locationRequired.trim() || undefined,
      personaTag: persona,
      subtasks,
      focusTips: task?.focusTips || ['Maintain single-task focus throughout this scheduled block.'],
    };

    onSaveTask(updatedTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900">
                {task ? 'Edit Scheduled Activity' : 'Record New Custom Task / Activity'}
              </h2>
              <p className="text-xs text-slate-500">
                Tailor your timings, location checkpoints, and deliverables exactly as needed.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={persona === 'student' ? 'e.g. CSE 401 Lab Assignment or Lecture Prep' : 'e.g. Client Architecture Review or Code PR'}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-200 text-slate-800"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Objective & Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context, rubric criteria, or meeting agenda..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-200 text-slate-800"
            />
          </div>

          {/* Timing Grid: Day, Time of Day, Exact Time, Duration */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-indigo-600" />
                Day #
              </label>
              <select
                value={dayNumber}
                onChange={(e) => setDayNumber(Number(e.target.value))}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
              >
                {Array.from({ length: targetDays }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Day {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-600" />
                Period
              </label>
              <select
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value as TimeOfDay)}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
              >
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Scheduled Time
              </label>
              <input
                type="text"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                placeholder="09:00 AM"
                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Duration (min)
              </label>
              <input
                type="number"
                min={15}
                max={360}
                step={15}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
              />
            </div>
          </div>

          {/* Category, Priority & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-500" />
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder={persona === 'student' ? 'Academics / Lab' : 'Engineering / Standup'}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-sky-600" />
                Location / Hub
              </label>
              <input
                type="text"
                value={locationRequired}
                onChange={(e) => setLocationRequired(e.target.value)}
                placeholder={persona === 'student' ? 'Campus Lab 3' : 'Office Room 4B'}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>

          {/* Subtasks Checkpoints */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block font-semibold text-slate-700">
              Subtask Checkpoints ({subtasks.length})
            </label>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-xs"
                >
                  <span className="text-slate-800 font-medium truncate">{st.title}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(st.id)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Add subtask step (e.g. Read chapter 4, push Git branch)"
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {task && onDeleteTask ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this scheduled task?')) {
                    onDeleteTask(task.id);
                    onClose();
                  }
                }}
                className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-semibold text-xs transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                {task ? 'Update Schedule' : 'Save to Schedule'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
