import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../contexts/TaskContext';
import type { TaskType, Priority } from '../contexts/TaskContext';
import { ArrowLeft, Paperclip, X, Calendar, Clock } from 'lucide-react';

const CreateTask: React.FC = () => {
  const navigate = useNavigate();
  const { users, addTask } = useTasks();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [remarks, setRemarks] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [type, setType] = useState<TaskType>('one-time');
  const [priority, setPriority] = useState<Priority>('medium');
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [attachment, setAttachment] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const employees = users.filter(u => u.role === 'employee');

  const toggleAssignee = (id: string) => {
    setAssignedTo(prev => 
      prev.includes(id) ? prev.filter(userId => userId !== id) : [...prev, id]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachment(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || assignedTo.length === 0) {
      alert("Please enter a title and select at least one assignee.");
      return;
    }

    let isoDueDate;
    if (dueDate) {
      try {
        isoDueDate = new Date(`${dueDate}T${dueTime || '00:00'}`).toISOString();
      } catch (e) {
        isoDueDate = new Date(dueDate).toISOString();
      }
    }
    
    addTask({
      title,
      description,
      remarks,
      dueDate: isoDueDate,
      type,
      priority,
      assignedTo,
      status: 'open',
      attachments: attachment ? [URL.createObjectURL(attachment)] : undefined
    });
    
    navigate('/');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back button */}
      <button 
        onClick={() => navigate(-1)} 
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6 font-medium transition-colors cursor-pointer bg-transparent border-none p-0"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      {/* Form Card */}
      <div className="bg-white p-6 md:p-8 border border-slate-200 rounded-xl shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-8 tracking-tight">Create New Task</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Core Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Task Title *
              </label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                placeholder="e.g. Set up 20 chairs in Open Space"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Description (Optional)
              </label>
              <textarea 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                rows={2}
                placeholder="Brief overview of the task..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Remarks / Instructions (Optional)
              </label>
              <textarea 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                rows={2}
                placeholder="Any special remarks or step-by-step instructions..."
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Scheduling & Priority */}
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Task Type
                  </label>
                  <select 
                    className="w-full min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                    value={type}
                    onChange={e => setType(e.target.value as TaskType)}
                  >
                    <option value="one-time">One-Time</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Priority
                  </label>
                  <select 
                    className="w-full min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                    value={priority}
                    onChange={e => setPriority(e.target.value as Priority)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
                  Due Schedule (Date & Time)
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Calendar Badge Group */}
                  <div className="relative inline-flex items-center">
                    <button
                      type="button"
                      className={`inline-flex items-center gap-2 pl-4 py-2 border rounded-full text-xs font-semibold shadow-2xs transition-all pointer-events-none ${
                        dueDate 
                          ? 'bg-blue-50 border-blue-200 text-blue-700 pr-8' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 pr-4'
                      }`}
                    >
                      <Calendar size={14} />
                      <span>{dueDate ? new Date(dueDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Set Date'}</span>
                    </button>
                    
                    {/* The native date input that actually triggers the picker */}
                    <input 
                      type="date"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                    />

                    {/* The custom clear button that overlays the transparent input on the right */}
                    {dueDate && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDueDate('');
                        }}
                        className="absolute right-2.5 z-20 font-bold text-blue-500 hover:text-blue-700 cursor-pointer flex items-center justify-center w-4 h-4 rounded-full bg-blue-100/50 hover:bg-blue-200/80"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* Clock Badge Group */}
                  <div className="relative inline-flex items-center">
                    <button
                      type="button"
                      className={`inline-flex items-center gap-2 pl-4 py-2 border rounded-full text-xs font-semibold shadow-2xs transition-all pointer-events-none ${
                        dueTime 
                          ? 'bg-amber-50 border-amber-200 text-amber-700 pr-8' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 pr-4'
                      }`}
                    >
                      <Clock size={14} />
                      <span>
                        {dueTime 
                          ? (() => {
                              const [h, m] = dueTime.split(':');
                              const hr = parseInt(h);
                              const ampm = hr >= 12 ? 'PM' : 'AM';
                              const displayHr = hr % 12 || 12;
                              return `${displayHr}:${m} ${ampm}`;
                            })() 
                          : 'Set Time'}
                      </span>
                    </button>

                    {/* The native time input that actually triggers the picker */}
                    <input 
                      type="time"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      value={dueTime}
                      onChange={e => setDueTime(e.target.value)}
                    />

                    {/* The custom clear button that overlays the transparent input on the right */}
                    {dueTime && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDueTime('');
                        }}
                        className="absolute right-2.5 z-20 font-bold text-amber-500 hover:text-amber-700 cursor-pointer flex items-center justify-center w-4 h-4 rounded-full bg-amber-100/50 hover:bg-amber-200/80"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Attach Photo / Reference
                </label>
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Paperclip size={16} />
                    {attachment ? 'Change File' : 'Upload File'}
                  </button>
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  {attachment && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg max-w-[200px]">
                      <span className="truncate">{attachment.name}</span>
                      <button 
                        type="button"
                        onClick={() => setAttachment(null)}
                        className="text-slate-400 hover:text-red-500 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Assignment */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
                Assign To *
              </label>
              <div className="space-y-2 max-h-[260px] overflow-y-auto border border-slate-200 rounded-lg p-3 bg-slate-50">
                {employees.length > 0 ? (
                  employees.map(emp => (
                    <label key={emp.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer select-none transition-colors">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-500 w-4 h-4"
                        checked={assignedTo.includes(emp.id)}
                        onChange={() => toggleAssignee(emp.id)}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700">{emp.name}</span>
                        {emp.employeeRole && <span className="text-xs text-slate-400">{emp.employeeRole}</span>}
                      </div>
                    </label>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 p-2">No team members registered yet.</p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <button 
              type="submit" 
              className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg py-3 font-semibold text-sm shadow-sm transition-colors cursor-pointer"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTask;
