import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy Gemini client helper
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// 1. AI Goal Planner endpoint
app.post('/api/plan-goal', async (req: Request, res: Response) => {
  try {
    const { goal, days = 7, dailyHours = 4, energyPeak = 'morning', context = '' } = req.body;

    if (!goal || typeof goal !== 'string') {
      return res.status(400).json({ error: 'Goal description is required' });
    }

    const ai = getGeminiClient();

    if (ai) {
      try {
        const prompt = `You are SynqAI, an elite adaptive productivity agent and project planner.
The user wants to achieve this goal:
Goal: "${goal}"
Timeline: ${days} days
Available daily time: ${dailyHours} hours per day
User energy peak: ${energyPeak} (schedule the highest priority/cognitively intensive tasks during this window)
Additional context: "${context || 'None'}"

Break down this goal into a realistic, high-impact schedule:
- 3 to 5 key progressive milestones
- 8 to 18 specific actionable daily tasks spread across the ${days} days.
- Ensure total estimated daily time does not exceed ${dailyHours * 60} minutes per day.
- Set priority to "high", "medium", or "low".
- Categorize each task (e.g. Planning, Development, Research, QA, Polish, Review).
- Assign dayNumber (between 1 and ${days}).
- Assign timeOfDay ("morning", "afternoon", "evening").
- Give 2-3 step-by-step subtasks per task.
- Provide a clear overarching AI Strategy explaining how this schedule optimizes for anti-procrastination and cognitive load.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: 'Clean polished goal title' },
                strategy: { type: Type.STRING, description: 'Executive AI strategy and pacing rationale' },
                milestones: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      day: { type: Type.INTEGER },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                    },
                    required: ['day', 'title', 'description'],
                  },
                },
                tasks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      dayNumber: { type: Type.INTEGER },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      category: { type: Type.STRING },
                      estimatedMinutes: { type: Type.INTEGER },
                      priority: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
                      timeOfDay: { type: Type.STRING, enum: ['morning', 'afternoon', 'evening'] },
                      scheduledTime: { type: Type.STRING, description: 'e.g. "09:00 AM"' },
                      subtasks: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      focusTips: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                    },
                    required: ['dayNumber', 'title', 'description', 'category', 'estimatedMinutes', 'priority', 'timeOfDay', 'subtasks'],
                  },
                },
              },
              required: ['title', 'strategy', 'milestones', 'tasks'],
            },
          },
        });

        const text = response.text?.trim();
        if (text) {
          const parsed = JSON.parse(text);
          return res.json({ success: true, source: 'gemini', plan: parsed });
        }
      } catch (err) {
        console.warn('Gemini API planning failed, utilizing intelligent local planner:', err);
      }
    }

    // Heuristic intelligent fallback planner
    const plan = generateHeuristicPlan(goal, Number(days), Number(dailyHours), energyPeak);
    return res.json({ success: true, source: 'heuristic', plan });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate plan';
    console.error('Plan generation error:', error);
    res.status(500).json({ error: message });
  }
});

// 2. Adaptive Rescheduling endpoint
app.post('/api/reschedule', async (req: Request, res: Response) => {
  try {
    const { plan, missedTaskIds = [], currentDay = 1, userNote = '' } = req.body;

    if (!plan || !Array.isArray(plan.tasks)) {
      return res.status(400).json({ error: 'Valid plan object required' });
    }

    const ai = getGeminiClient();

    if (ai) {
      try {
        const missedTasks = plan.tasks.filter((t: { id: string }) => missedTaskIds.includes(t.id));
        const futureTasks = plan.tasks.filter(
          (t: { id: string; status: string }) => !missedTaskIds.includes(t.id) && t.status !== 'completed'
        );

        const prompt = `You are SynqAI's Adaptive Rescheduling Engine.
The user fell behind on some scheduled activities for the goal: "${plan.title}".
Current Day: Day ${currentDay} out of ${plan.targetDays} days.
Daily hour budget: ${plan.dailyHours || 4} hours/day.
Missed/Unfinished Tasks to redistribute:
${JSON.stringify(missedTasks.map((t: { id: string; title: string; estimatedMinutes: number; dayNumber: number }) => ({ id: t.id, title: t.title, duration: t.estimatedMinutes, originalDay: t.dayNumber })))}

Upcoming Uncompleted Tasks:
${JSON.stringify(futureTasks.map((t: { id: string; title: string; estimatedMinutes: number; dayNumber: number; priority: string }) => ({ id: t.id, title: t.title, duration: t.estimatedMinutes, day: t.dayNumber, priority: t.priority })))}

User Reflection / Note: "${userNote || 'Fell behind schedule, need to catch up without burning out'}"

Task:
1. Re-distribute the missed tasks into the remaining days (Days ${currentDay} through ${plan.targetDays}) so the user catches up gracefully without feeling overwhelmed.
2. If necessary, adjust or streamline time blocks.
3. Provide a warm, guilt-free explanation of how the schedule was adapted and why this new distribution is optimal.
4. Output the updated task assignments for the affected and future tasks.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                explanation: { type: Type.STRING, description: 'Guilt-free AI coaching explanation' },
                changesSummary: { type: Type.STRING, description: 'Direct summary of changes made' },
                taskUpdates: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      newDayNumber: { type: Type.INTEGER },
                      newScheduledTime: { type: Type.STRING },
                      newTimeOfDay: { type: Type.STRING, enum: ['morning', 'afternoon', 'evening'] },
                      newEstimatedMinutes: { type: Type.INTEGER },
                      adjustedPriority: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
                      rescheduleReason: { type: Type.STRING },
                    },
                    required: ['id', 'newDayNumber'],
                  },
                },
              },
              required: ['explanation', 'changesSummary', 'taskUpdates'],
            },
          },
        });

        const text = response.text?.trim();
        if (text) {
          const parsed = JSON.parse(text);
          return res.json({ success: true, source: 'gemini', ...parsed });
        }
      } catch (err) {
        console.warn('Gemini rescheduling fallback triggered:', err);
      }
    }

    // Heuristic adaptive redistribution
    const result = heuristicReschedule(plan, missedTaskIds, currentDay);
    return res.json({ success: true, source: 'heuristic', ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to reschedule';
    console.error('Reschedule error:', error);
    res.status(500).json({ error: message });
  }
});

// 3. AI Distraction & Focus Coach endpoint
app.post('/api/distraction-coach', async (req: Request, res: Response) => {
  try {
    const { taskTitle = 'Active Task', obstacle = 'phone notifications and context switching' } = req.body;
    const ai = getGeminiClient();

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Provide 3 sharp, immediate behavioral nudges and 1 psychological reframe to overcome this specific distraction during a deep focus session on "${taskTitle}". Obstacle: "${obstacle}". Return JSON with "tips" (array of 3 strings) and "reframe" (string).`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                reframe: { type: Type.STRING },
                tips: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['reframe', 'tips'],
            },
          },
        });
        const text = response.text?.trim();
        if (text) return res.json(JSON.parse(text));
      } catch (e) {
        console.warn('AI coach fallback:', e);
      }
    }

    res.json({
      reframe: 'Momentum is created in the first 5 minutes. Lower the barrier to starting by committing only to the very first line or sentence.',
      tips: [
        'Move your phone completely out of arm’s reach or into another room for this session.',
        'Close all browser tabs unrelated to this exact task and use fullscreen view.',
        'Keep a scratchpad open: if a random thought emerges, write it down immediately to process later.',
      ],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Coach failed';
    res.status(500).json({ error: message });
  }
});

// Heuristic Plan Generator
function generateHeuristicPlan(goal: string, targetDays: number, dailyHours: number, energyPeak: string) {
  const days = Math.max(2, Math.min(30, targetDays));
  const hours = Math.max(1, Math.min(12, dailyHours));

  const milestonesCount = Math.max(2, Math.min(5, Math.ceil(days / 2.5)));
  const milestones = [];
  for (let i = 1; i <= milestonesCount; i++) {
    const milestoneDay = Math.min(days, Math.max(1, Math.round((i / milestonesCount) * days)));
    milestones.push({
      day: milestoneDay,
      title: i === 1 ? 'Phase 1: Blueprint & Foundation Setup' : i === milestonesCount ? 'Final Phase: Delivery, Review & Launch' : `Phase ${i}: Core Execution & Key Milestones`,
      description: `Target checkpoint on Day ${milestoneDay} ensuring project objectives stay synchronized with deadline.`,
    });
  }

  const tasks = [];
  let taskIdCounter = 1;

  const sampleCategories = ['Planning & Setup', 'Core Execution', 'Deep Work', 'Validation & QA', 'Refinement & Delivery'];

  for (let d = 1; d <= days; d++) {
    // 2 tasks per day
    const isFirst = d === 1;
    const isLast = d === days;
    const isMid = !isFirst && !isLast;

    const task1Category = isFirst ? 'Planning & Setup' : isLast ? 'Refinement & Delivery' : sampleCategories[d % sampleCategories.length];
    const task2Category = isLast ? 'Refinement & Delivery' : 'Deep Work';

    tasks.push({
      dayNumber: d,
      title: isFirst
        ? `Establish project scope & setup requirements for ${goal.slice(0, 45)}`
        : isLast
        ? `Final review, polish & submit ${goal.slice(0, 40)}`
        : `Execute core component iteration - Day ${d}`,
      description: `Structured work block on Day ${d} dedicated to pushing deliverables forward.`,
      category: task1Category,
      estimatedMinutes: Math.min(120, Math.round((hours * 60) * 0.55)),
      priority: d <= 2 ? 'high' : 'medium',
      timeOfDay: energyPeak === 'evening' ? 'evening' : 'morning',
      scheduledTime: energyPeak === 'evening' ? '06:00 PM' : '09:00 AM',
      subtasks: [
        `Review Day ${d} objectives and definition of done`,
        `Execute primary work block with zero distractions`,
        `Commit progress and verify next milestones`,
      ],
      focusTips: ['Set phone to Do Not Disturb', 'Take a 5-minute breather halfway through'],
    });

    if (hours >= 2) {
      tasks.push({
        dayNumber: d,
        title: isLast
          ? `Self-audit and final retrospective`
          : `Review, test & consolidate progress for Day ${d}`,
        description: `Secondary focus session to review dependencies and resolve blockers.`,
        category: task2Category,
        estimatedMinutes: Math.min(100, Math.round((hours * 60) * 0.45)),
        priority: isLast ? 'high' : 'low',
        timeOfDay: energyPeak === 'morning' ? 'afternoon' : 'morning',
        scheduledTime: energyPeak === 'morning' ? '02:00 PM' : '10:00 AM',
        subtasks: [
          `Test newly built components against edge cases`,
          `Update task status and prepare next day agenda`,
        ],
        focusTips: ['Use ambient audio or instrumental music to sustain flow'],
      });
    }
  }

  return {
    title: goal,
    strategy: `Balanced progressive pacing tailored to ${hours} hours/day. Front-loaded high priority milestones scheduled during your peak ${energyPeak} window with dedicated buffer time.`,
    milestones,
    tasks,
  };
}

// Heuristic Rescheduling
function heuristicReschedule(plan: any, missedTaskIds: string[], currentDay: number) {
  const targetDays = plan.targetDays || 7;
  const taskUpdates: any[] = [];
  const validMissedIds = new Set(missedTaskIds);

  let nextSlotDay = Math.min(targetDays, currentDay + 1);

  plan.tasks.forEach((t: any) => {
    if (validMissedIds.has(t.id)) {
      taskUpdates.push({
        id: t.id,
        newDayNumber: nextSlotDay,
        newScheduledTime: '09:30 AM',
        newTimeOfDay: 'morning',
        newEstimatedMinutes: Math.max(30, Math.round(t.estimatedMinutes * 0.85)), // slight compression to prevent overflow
        adjustedPriority: 'high',
        rescheduleReason: `Shifted from Day ${t.dayNumber} due to missed planned activity. Prioritized for Day ${nextSlotDay}.`,
      });
      // Alternate slotting
      if (nextSlotDay < targetDays) {
        nextSlotDay++;
      }
    }
  });

  return {
    explanation: `SynqAI redistributed ${taskUpdates.length} uncompleted task(s) across upcoming days with calibrated 15% focus compression to avoid overwhelming your daily capacity.`,
    changesSummary: `Shifted missed activities forward to Days ${Math.min(targetDays, currentDay + 1)}–${nextSlotDay}, prioritized critical paths.`,
    taskUpdates,
  };
}

// Vite / static file serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SynqAI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
