import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { Opportunity, Task } from '@/lib/types';
import { getNextActionForOpp, isOverdue } from '@/lib/utils';

interface Props {
  opportunity: Opportunity;
}

export default function TasksSection({ opportunity }: Props) {
  const { addTaskToOpp, updateTask, toggleTaskDone, deleteTask } = useAppStore();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');

  const nextAction = getNextActionForOpp(opportunity);

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    addTaskToOpp(opportunity.id, {
      title: newTaskTitle.trim(),
      due: newTaskDue || null,
      done: false,
    });
    setNewTaskTitle('');
    setNewTaskDue('');
  };

  const handleUpdateDue = (task: Task, due: string) => {
    updateTask(opportunity.id, task.id, { due: due || null });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">Tasks</h3>
        {nextAction && (
          <div className={`text-xs px-2 py-0.5 rounded ${isOverdue(nextAction) ? 'bg-red-100 text-red-700' : 'bg-muted'}`}>
            Next: {nextAction.title} {nextAction.due ? `(${nextAction.due})` : ''}
          </div>
        )}
      </div>

      <div className="space-y-2 mb-3">
        {opportunity.tasks.length === 0 && (
          <div className="text-xs text-muted-foreground">No tasks yet. Add follow-ups below.</div>
        )}
        {opportunity.tasks.map(task => (
          <div key={task.id} className="flex items-start gap-2 border rounded p-2 text-sm">
            <input 
              type="checkbox" 
              checked={task.done} 
              onChange={() => toggleTaskDone(opportunity.id, task.id)} 
              className="mt-1"
            />
            <div className="flex-1">
              <div className={task.done ? 'line-through text-muted-foreground' : ''}>{task.title}</div>
              <div className="flex gap-2 mt-1 text-xs">
                <input 
                  type="date" 
                  value={task.due || ''} 
                  onChange={(e) => handleUpdateDue(task, e.target.value)} 
                  className="border rounded px-1 py-0.5 text-xs bg-background"
                />
                {!task.done && isOverdue(task) && <span className="text-red-600">Overdue</span>}
              </div>
            </div>
            <button onClick={() => deleteTask(opportunity.id, task.id)} className="text-xs text-destructive">×</button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input 
          placeholder="New task title" 
          value={newTaskTitle} 
          onChange={e => setNewTaskTitle(e.target.value)} 
          className="flex-1 text-sm" 
          onKeyDown={e => { if (e.key === 'Enter') handleAddTask(); }}
        />
        <input 
          type="date" 
          value={newTaskDue} 
          onChange={e => setNewTaskDue(e.target.value)} 
          className="border rounded px-2 text-sm bg-background"
        />
        <Button size="sm" onClick={handleAddTask}>Add</Button>
      </div>
    </div>
  );
}
