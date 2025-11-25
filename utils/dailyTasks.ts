
import { DailyTask, TaskType } from '../types';

const TASKS_KEY = 'solitaire_pro_daily_tasks';
const LAST_LOGIN_KEY = 'solitaire_pro_last_login';

const TASK_TEMPLATES: { type: TaskType; description: string; targets: number[]; xp: number[] }[] = [
  { 
    type: 'win_game', 
    description: 'Vença partidas', 
    targets: [1, 2, 3], 
    xp: [100, 250, 500] 
  },
  { 
    type: 'play_moves', 
    description: 'Faça movimentos', 
    targets: [50, 100, 200], 
    xp: [50, 100, 200] 
  },
  { 
    type: 'play_time', 
    description: 'Jogue por minutos', 
    targets: [5, 15, 30], // stored as minutes, tracked as seconds usually, will convert
    xp: [50, 150, 300] 
  },
  { 
    type: 'foundation_drops', 
    description: 'Mova cartas para a Fundação', 
    targets: [10, 25, 52], 
    xp: [75, 150, 400] 
  }
];

export const getDailyTasks = (): DailyTask[] => {
  const today = new Date().toLocaleDateString();
  const lastLogin = localStorage.getItem(LAST_LOGIN_KEY);
  const storedTasksStr = localStorage.getItem(TASKS_KEY);

  // If new day, generate new tasks
  if (lastLogin !== today) {
    const newTasks = generateDailyTasks();
    localStorage.setItem(TASKS_KEY, JSON.stringify(newTasks));
    localStorage.setItem(LAST_LOGIN_KEY, today);
    return newTasks;
  }

  // Return stored tasks
  if (storedTasksStr) {
    return JSON.parse(storedTasksStr);
  }

  // Fallback (shouldn't happen if logic above works, but for safety)
  const newTasks = generateDailyTasks();
  localStorage.setItem(TASKS_KEY, JSON.stringify(newTasks));
  localStorage.setItem(LAST_LOGIN_KEY, today);
  return newTasks;
};

export const saveDailyTasks = (tasks: DailyTask[]) => {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
};

const generateDailyTasks = (): DailyTask[] => {
  const tasks: DailyTask[] = [];
  // Pick 3 random distinct tasks
  const shuffledTemplates = [...TASK_TEMPLATES].sort(() => 0.5 - Math.random());
  const selectedTemplates = shuffledTemplates.slice(0, 3);

  selectedTemplates.forEach((template, index) => {
    // Pick a difficulty tier (0 = easy, 1 = medium, 2 = hard)
    const tier = Math.floor(Math.random() * 3);
    
    tasks.push({
      id: `task-${Date.now()}-${index}`,
      type: template.type,
      description: template.description,
      target: template.targets[tier],
      current: 0,
      xpReward: template.xp[tier],
      completed: false,
      claimed: false
    });
  });

  return tasks;
};

export const checkTaskCompletion = (tasks: DailyTask[]): DailyTask[] => {
  return tasks.map(task => {
    if (!task.completed && task.current >= task.target) {
      return { ...task, current: task.target, completed: true };
    }
    return task;
  });
};
