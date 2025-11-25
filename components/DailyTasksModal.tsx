
import React from 'react';
import { DailyTask } from '../types';
import { CheckCircle2, Circle, Gift, X } from 'lucide-react';

interface DailyTasksModalProps {
  tasks: DailyTask[];
  onClose: () => void;
  onClaim: (taskId: string) => void;
}

export const DailyTasksModal: React.FC<DailyTasksModalProps> = ({ tasks, onClose, onClaim }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[250] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#1e293b] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-bold text-white">Tarefas Diárias</h2>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Task List */}
        <div className="p-4 flex flex-col gap-3 overflow-y-auto">
          {tasks.map((task) => (
            <div 
              key={task.id} 
              className={`relative p-4 rounded-xl border transition-all ${
                task.completed 
                  ? task.claimed 
                    ? 'bg-emerald-900/10 border-emerald-500/20 opacity-70' 
                    : 'bg-emerald-900/30 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                  : 'bg-white/5 border-white/5'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-200 text-sm">{task.description}</h3>
                  <div className="text-xs text-gray-400 mt-1">
                    {task.type === 'play_time' 
                      ? `${Math.floor(task.current / 60)} / ${task.target} min`
                      : `${task.current} / ${task.target}`
                    }
                  </div>
                </div>
                
                {task.claimed ? (
                  <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold uppercase tracking-wider bg-emerald-500/10 px-2 py-1 rounded">
                    <CheckCircle2 className="w-4 h-4" /> Coletado
                  </div>
                ) : (
                  <button 
                    onClick={() => task.completed && onClaim(task.id)}
                    disabled={!task.completed}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${
                      task.completed
                        ? 'bg-yellow-500 text-black hover:bg-yellow-400 hover:scale-105 shadow-lg shadow-yellow-500/20'
                        : 'bg-white/5 text-white/30 cursor-not-allowed'
                    }`}
                  >
                     <Gift className="w-3 h-3" />
                     {task.completed ? 'Coletar' : `${task.xpReward} XP`}
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${task.completed ? 'bg-emerald-500' : 'bg-yellow-500'}`} 
                  style={{ width: `${Math.min(100, (task.current / (task.type === 'play_time' ? task.target * 60 : task.target)) * 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-black/20 text-center text-xs text-white/40 border-t border-white/10">
          As tarefas resetam à meia-noite.
        </div>
      </div>
    </div>
  );
};
