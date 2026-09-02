import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks, type Task } from '../contexts/TaskContext';
import StatusBadge from '../components/StatusBadge';
import { PlusCircle, Edit, Trash2, PackageCheck, UserRoundCog, ArrowDownUp, ChevronRight, ChevronDown, ChevronUp, AlertTriangle, User, Search, LayoutGrid, Table, CheckCircle2, Repeat } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { materialStatusToneMap } from '../lib/taskOptions';
import { TaskListSkeleton } from '../components/TaskSkeleton';
import ExcelTaskTable from '../components/ExcelTaskTable';
import { usePersistentState } from '../hooks/usePersistentState';

const ManageTasks: React.FC = () => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = usePersistentState<'default' | 'employee' | 'dueDate' | 'priority' | 'frequency'>('manageTasks_sortBy', 'employee');
  const [employeeFilter, setEmployeeFilter] = usePersistentState<string>('manageTasks_employeeFilter', 'all');
  const [typeFilter, setTypeFilter] = usePersistentState<string>('manageTasks_typeFilter', 'all');
  const [viewMode, setViewMode] = usePersistentState<'grid' | 'excel'>('manageTasks_viewMode', 'excel');
  const [searchQuery, setSearchQuery] = usePersistentState<string>('manageTasks_searchQuery', '');
  const [collapsedSectionsArray, setCollapsedSectionsArray] = usePersistentState<string[]>('manageTasks_collapsed', []);
  const [isIssuesCollapsed, setIsIssuesCollapsed] = usePersistentState<boolean>('manageTasks_issues_collapsed', false);
  const [processingTasks, setProcessingTasks] = useState<Set<string>>(new Set());
  const collapsedSections = new Set(collapsedSectionsArray);
  const { tasks, users, currentUser, deleteTask, updateTaskStatus, isLoading } = useTasks();
  const { t, formatDateTime, formatTime, taskTypeLabel, weekdayLabel, monthDayOrdinalLabel } = useLanguage();

  const toggleSection = (sectionId: string) => {
    setCollapsedSectionsArray(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return Array.from(next);
    });
  };

  if (!currentUser) return null;

  const filteredTasks = tasks.filter(t => {
    if (employeeFilter !== 'all') {
      if (employeeFilter === 'unassigned') {
        if (t.assignedTo.length > 0) return false;
      } else if (!t.assignedTo.includes(employeeFilter)) {
        return false;
      }
    }
    if (typeFilter !== 'all') {
      if (typeFilter === 'recurring' && t.type === 'one-time') return false;
      if (typeFilter === 'one-time' && t.type !== 'one-time') return false;
      if (typeFilter === 'daily' && t.type !== 'daily') return false;
      if (typeFilter === 'weekly' && t.type !== 'weekly') return false;
      if (typeFilter === 'monthly' && t.type !== 'monthly') return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = t.title.toLowerCase().includes(q);
    const descMatch = t.description?.toLowerCase().includes(q);
    const creatorMatch = t.createdByName?.toLowerCase().includes(q);
    const remarksMatch = t.remarks?.toLowerCase().includes(q);
    return titleMatch || descMatch || creatorMatch || remarksMatch;
  });

  const issues = filteredTasks.filter(t => t.status === 'could_not_complete' || t.status === 'blocked');
  const activeTasks = filteredTasks.filter((t) => {
    if (t.status !== 'open' && t.status !== 'in_progress') return false;
    if (t.activeFrom && new Date(t.activeFrom) > new Date()) return false;
    return true;
  });

  const getPriorityWeight = (priority: string) => {
    if (priority === 'high') return 3;
    if (priority === 'medium') return 2;
    return 1;
  };

  const getFrequencyWeight = (type: string) => {
    if (type === 'daily') return 1;
    if (type === 'weekly') return 2;
    if (type === 'monthly') return 3;
    return 4; // one-time
  };

  const sortTasks = (taskList: Task[]) => {
    return [...taskList].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      if (sortBy === 'priority') {
        return getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
      }
      if (sortBy === 'frequency') {
        const diff = getFrequencyWeight(a.type) - getFrequencyWeight(b.type);
        if (diff !== 0) return diff;
        return getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
      }
      if (sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }

      if (a.dueDate && b.dueDate) {
        const timeDiff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        if (timeDiff !== 0) return timeDiff;
      } else if (a.dueDate) {
        return -1;
      } else if (b.dueDate) {
        return 1;
      }

      return getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
    });
  };

  const handleQuickComplete = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    e.preventDefault();
    setProcessingTasks(prev => new Set(prev).add(task.id));
    try {
      updateTaskStatus(task.id, 'completed', {
        completedAt: new Date().toISOString(),
        completionComment: 'Quick check-off',
      });
    } catch (err) {
      console.error("Failed to quick complete task:", err);
    } finally {
      setTimeout(() => {
        setProcessingTasks(prev => {
          const next = new Set(prev);
          next.delete(task.id);
          return next;
        });
      }, 400);
    }
  };

  const sortedActiveTasks = sortTasks(activeTasks);
  const recurringTasks = tasks.filter((task) => task.type !== 'one-time');

  const groupedTasks: Record<string, Task[]> = {};
  if (sortBy === 'employee') {
    users.forEach(u => {
      groupedTasks[u.id] = [];
    });
    groupedTasks['unassigned'] = [];

    sortedActiveTasks.forEach(task => {
      if (task.assignedTo.length === 0) {
        groupedTasks['unassigned'].push(task);
      } else {
        task.assignedTo.forEach(id => {
          if (groupedTasks[id]) {
            groupedTasks[id].push(task);
          }
        });
      }
    });
  }


  const formatRecurringTime = (time?: string) => {
    if (!time) return '';
    return formatTime(`1970-01-01T${time}:00`);
  };

  const recurringScheduleLabel = (task: Task) => {
    if (task.type === 'daily') {
      return task.recurringTime ? `${t('manageTasks.everyDayAt')} ${formatRecurringTime(task.recurringTime)}` : t('manageTasks.everyDay');
    }
    if (task.type === 'weekly') {
      const days = task.recurringDay
        ? task.recurringDay.split(',').map((day: string) => weekdayLabel(day.trim())).join(', ')
        : t('manageTasks.noScheduleSet');
      return task.recurringTime
        ? `${days} • ${formatRecurringTime(task.recurringTime)}`
        : days;
    }
    if (task.type === 'monthly') {
      const day = task.recurringDay ? monthDayOrdinalLabel(task.recurringDay) : t('manageTasks.noScheduleSet');
      return task.recurringTime
        ? `${day} • ${formatRecurringTime(task.recurringTime)}`
        : day;
    }
    return '';
  };


  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Attention Required Collapsible Accordion Section */}
      {issues.length > 0 && (
        <div className="mb-6 rounded-2xl border border-rose-500/30 dark:border-rose-500/25 bg-rose-500/[0.03] dark:bg-rose-950/20 overflow-hidden shadow-xs transition-all">
          <button
            type="button"
            onClick={() => setIsIssuesCollapsed(!isIssuesCollapsed)}
            className="w-full flex items-center justify-between p-3.5 sm:px-4 text-left cursor-pointer border-none bg-transparent hover:bg-rose-500/[0.06] dark:hover:bg-rose-950/40 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle size={15} />
              </div>
              <span className="font-bold text-slate-900 dark:text-rose-100 text-sm sm:text-base tracking-tight">
                {t('manageTasks.attentionRequired')}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 font-semibold border border-rose-500/20">
                {issues.length}
              </span>
            </div>

            <div className="flex items-center gap-2 text-rose-600/70 dark:text-rose-300/70 hover:text-rose-700 dark:hover:text-rose-200 text-xs font-medium transition-colors">
              <span>{isIssuesCollapsed ? (t('common.show') || 'Show') : (t('common.hide') || 'Hide')}</span>
              {isIssuesCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
            </div>
          </button>

          {!isIssuesCollapsed && (
            <div className="p-3.5 sm:p-4 pt-0 flex flex-col gap-2.5 border-t border-rose-500/15 dark:border-rose-900/30 mt-1">
              {issues.map(task => (
                <div 
                  key={task.id} 
                  className="bg-white dark:bg-slate-900/95 hover:bg-rose-50/40 dark:hover:bg-slate-900 border border-rose-500/20 dark:border-rose-900/40 hover:border-rose-500/40 rounded-xl p-3 sm:p-3.5 cursor-pointer transition-colors shadow-2xs"
                  onClick={() => navigate(`/task/${task.id}`)}
                >
                  <div className="flex justify-between items-start gap-3">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">{task.title}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <StatusBadge status={task.status} />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/task/${task.id}/edit`);
                        }}
                        className="p-1 text-slate-400 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors border-none bg-transparent cursor-pointer"
                        title={t('manageTasks.editTask')}
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(t('common.confirmDeleteTask'))) {
                            deleteTask(task.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors border-none bg-transparent cursor-pointer"
                        title={t('manageTasks.deleteTask')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-2 p-2 rounded-lg bg-rose-500/[0.06] dark:bg-rose-950/30 border border-rose-500/20 dark:border-rose-900/40 text-xs text-slate-800 dark:text-slate-200 font-medium">
                    <span className="font-bold text-rose-600 dark:text-rose-400">{t('common.reason')}:</span> {task.blockReason || t('manageTasks.noReasonProvided')}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    {task.assignedByName && (
                      <div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{t('common.assignedBy')}:</span> {task.assignedByName}
                      </div>
                    )}
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{t('taskDetail.assignedTo')}:</span>{' '}
                      {task.assignedTo.length > 0 
                        ? task.assignedTo.map(id => users.find(u => u.id === id)?.name).join(', ')
                        : t('common.unassigned')}
                    </div>
                    {task.markedIssueAt && (
                      <div className="text-rose-600 dark:text-rose-400">
                        • {formatDateTime(task.markedIssueAt, { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active Tasks Bar */}
      <div>
        {/* Top Header Row: Title & Search & View Mode */}
        <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-lg tracking-tight">
              {t('manageTasks.activeTasks')}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
              {filteredTasks.length}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Free-Text Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t('manageTasks.searchPlaceholder') || "Search tasks..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="inline-flex items-center p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('excel')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all border-none cursor-pointer ${
                  viewMode === 'excel'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-transparent'
                }`}
              >
                <Table size={13} /> <span>{t('common.excelTable')}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all border-none cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-transparent'
                }`}
              >
                <LayoutGrid size={13} /> <span>{t('common.groupedCards')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter & Sort Controls Row */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          {/* Segmented Filter for All vs Recurring vs One-Time */}
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {t('employeeDashboard.allTasksTab') || 'All Tasks'}
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('recurring')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                typeFilter === 'recurring'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Repeat size={13} />
              <span>{t('employeeDashboard.recurringTab') || 'Recurring Routines'}</span>
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('one-time')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                typeFilter === 'one-time'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {t('employeeDashboard.oneTimeTab') || 'One-Time Tasks'}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter by Employee */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 shadow-2xs">
              <User size={14} className="text-slate-400" />
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="border-none bg-transparent py-0.5 text-xs font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                title="Filter by employee"
              >
                <option value="all" className="dark:bg-slate-800">{t('common.allEmployees') || 'All Employees'}</option>
                <option value="unassigned" className="dark:bg-slate-800">{t('common.unassigned')}</option>
                {users.map(u => (
                  <option key={u.id} value={u.id} className="dark:bg-slate-800">{u.name}</option>
                ))}
              </select>
            </div>

            {/* Sort selector for Grid view */}
            {viewMode === 'grid' && (
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 shadow-2xs">
                <ArrowDownUp size={14} className="text-slate-400" />
                <select
                  id="admin-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'default' | 'employee' | 'dueDate' | 'priority' | 'frequency')}
                  className="border-none bg-transparent py-0.5 text-xs font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                >
                  <option value="employee" className="dark:bg-slate-800">{t('employeeDashboard.byEmployee')}</option>
                  <option value="default" className="dark:bg-slate-800">{t('employeeDashboard.originalOrder')}</option>
                  <option value="dueDate" className="dark:bg-slate-800">{t('employeeDashboard.dueDateSoon')}</option>
                  <option value="priority" className="dark:bg-slate-800">{t('employeeDashboard.priorityFirst')}</option>
                  <option value="frequency" className="dark:bg-slate-800">{t('employeeDashboard.frequency') || 'Frequency (Daily/Weekly/Monthly)'}</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="mt-8">
            <TaskListSkeleton count={5} />
          </div>
        ) : activeTasks.length === 0 && issues.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-12 mt-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4 shadow-sm">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="mb-2 font-bold text-slate-800 dark:text-slate-200 text-lg">
              {searchQuery ? t('employeeDashboard.noTasksFound') || 'No tasks found' : t('employeeDashboard.allCaughtUp') || 'All caught up!'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              {searchQuery ? 'Try adjusting your search filters.' : 'The team has no active tasks at the moment.'}
            </p>
          </div>
        ) : viewMode === 'excel' ? (
          <div className="mt-4">
            <ExcelTaskTable tasks={activeTasks} users={users} currentUser={currentUser} />
          </div>
        ) : sortBy === 'employee' ? (
          <div className="space-y-2.5 mt-6">
            {users.filter(u => u.name.toLowerCase() !== 'saheel').map(user => {
               const userTasks = groupedTasks[user.id];
               if (!userTasks || userTasks.length === 0) return null;
               const isCollapsed = collapsedSections.has(user.id);
               return (
                 <div key={user.id} className="overflow-hidden">
                   <button
                     onClick={() => toggleSection(user.id)}
                     className={`accordion-header-btn w-full flex items-center justify-between px-3.5 py-2.5 text-left cursor-pointer border shadow-xs ${
                       !isCollapsed ? 'rounded-t-lg rounded-b-none border-b-0' : 'rounded-lg'
                     }`}
                   >
                     <div className="flex items-center gap-2.5">
                       <div className="w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                         {user.name.split(' ').map(n => n[0]).join('')}
                       </div>
                       <span className="font-semibold text-sm tracking-tight">{user.name}</span>
                       {isCollapsed && (
                         <span className="accordion-count-badge inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold">
                           {userTasks.length} {userTasks.length === 1 ? 'task' : 'tasks'}
                         </span>
                       )}
                     </div>
                     <div className={`text-slate-400 transition-transform duration-200 ${!isCollapsed ? 'rotate-90' : ''}`}>
                       <ChevronRight size={16} />
                     </div>
                   </button>

                   <div className={`accordion-wrapper ${!isCollapsed ? 'open' : ''}`}>
                     <div className="accordion-inner">
                       <div className="bg-white dark:bg-slate-900 border border-t-0 rounded-b-lg border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                         <div className="overflow-x-auto">
                           <table className="w-full min-w-[600px] border-collapse text-left text-sm">
                             <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-600 font-semibold">
                               <tr>
                                 <th className="px-5 py-3">{t('manageTasks.taskTitle')}</th>
                                 <th className="px-5 py-3">{t('manageTasks.assignedTeamMembers')}</th>
                                 <th className="px-5 py-3 w-[130px] whitespace-nowrap">{t('common.status')}</th>
                                 <th className="px-5 py-3 text-right">{t('common.actions')}</th>
                               </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-100">
                               {userTasks.map(task => (
                                 <tr 
                                   key={`${user.id}-${task.id}`} 
                                   className="hover:bg-slate-50 cursor-pointer transition-colors" 
                                   onClick={() => navigate(`/task/${task.id}`)}
                                 >
                                   <td className="px-5 py-3.5 font-medium text-slate-900 align-top">
                                     <div className="flex flex-col gap-2.5">
                                       <span className="text-base leading-snug">{task.title}</span>
                                       <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                         {task.type !== 'one-time' ? (
                                           <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
                                             {taskTypeLabel(task.type)}
                                           </span>
                                         ) : null}
                                         {task.isPaused ? (
                                           <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                                             {t('manageTasks.paused')}
                                           </span>
                                         ) : null}
                                       {task.inCharge ? (
                                         <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium">
                                           <UserRoundCog size={12} />
                                           {t('taskDetail.inCharge')}: {task.inCharge}
                                         </span>
                                       ) : null}
                                       {task.materialStatus ? (
                                         <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium ${materialStatusToneMap[task.materialStatus].badge}`}>
                                           <PackageCheck size={12} />
                                           {t(`materials.${task.materialStatus}`)}
                                         </span>
                                       ) : null}
                                       </div>
                                     </div>
                                   </td>
                                   <td className="px-5 py-3.5 align-top text-slate-600">
                                     {task.assignedTo.length > 0 
                                       ? task.assignedTo.map(id => users.find(u => u.id === id)?.name?.split(' ')[0] || 'Unknown').join(', ')
                                       : t('common.unassigned')}
                                   </td>
                                   <td className="px-5 py-3.5 w-[130px] whitespace-nowrap align-top">
                                     <StatusBadge status={task.status} />
                                   </td>
                                   <td className="px-5 py-3.5 text-right">
                                     <div className="flex justify-end items-center gap-1.5">
                                       {task.type !== 'one-time' && (
                                         <button 
                                           type="button"
                                           onClick={(e) => handleQuickComplete(e, task)}
                                           disabled={processingTasks.has(task.id)}
                                           className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors border-none bg-transparent cursor-pointer disabled:opacity-50"
                                           title={t('employeeDashboard.quickComplete') || 'Quick Check-off (Done)'}
                                         >
                                           <CheckCircle2 size={16} />
                                         </button>
                                       )}
                                       <button 
                                         onClick={(e) => {
                                           e.stopPropagation();
                                           navigate(`/task/${task.id}/edit`);
                                         }}
                                         className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors border-none bg-transparent cursor-pointer"
                                         title={t('manageTasks.editTask')}
                                       >
                                         <Edit size={16} />
                                       </button>
                                       <button 
                                         onClick={(e) => {
                                           e.stopPropagation();
                                           if (confirm(t('common.confirmDeleteTask'))) {
                                             deleteTask(task.id);
                                           }
                                         }}
                                         className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded transition-colors border-none bg-transparent cursor-pointer"
                                         title={t('manageTasks.deleteTask')}
                                       >
                                         <Trash2 size={16} />
                                       </button>
                                     </div>
                                   </td>
                                 </tr>
                               ))}
                             </tbody>
                           </table>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
               );
            })}
            
            {groupedTasks['unassigned']?.length > 0 && (
              <div key="unassigned" className="overflow-hidden">
                <button
                  onClick={() => toggleSection('unassigned')}
                  className={`accordion-header-btn w-full flex items-center justify-between px-3.5 py-2.5 text-left cursor-pointer border shadow-xs ${
                    !collapsedSections.has('unassigned') ? 'rounded-t-lg rounded-b-none border-b-0' : 'rounded-lg'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                      <User size={12} />
                    </div>
                    <span className="font-semibold text-sm tracking-tight">{t('common.unassigned')}</span>
                    {collapsedSections.has('unassigned') && (
                      <span className="accordion-count-badge inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold">
                        {groupedTasks['unassigned'].length} {groupedTasks['unassigned'].length === 1 ? 'task' : 'tasks'}
                      </span>
                    )}
                  </div>
                  <div className={`text-slate-400 transition-transform duration-200 ${!collapsedSections.has('unassigned') ? 'rotate-90' : ''}`}>
                    <ChevronRight size={16} />
                  </div>
                </button>

                <div className={`accordion-wrapper ${!collapsedSections.has('unassigned') ? 'open' : ''}`}>
                  <div className="accordion-inner">
                    <div className="bg-white dark:bg-slate-900 border border-t-0 rounded-b-lg border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px] border-collapse text-left text-sm">
                          <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-600 font-semibold">
                            <tr>
                              <th className="px-5 py-3">{t('manageTasks.taskTitle')}</th>
                              <th className="px-5 py-3">{t('manageTasks.assignedTeamMembers')}</th>
                              <th className="px-5 py-3 w-[130px] whitespace-nowrap">{t('common.status')}</th>
                              <th className="px-5 py-3 text-right">{t('common.actions')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {groupedTasks['unassigned'].map(task => (
                              <tr 
                                key={`unassigned-${task.id}`} 
                                className="hover:bg-slate-50 cursor-pointer transition-colors" 
                                onClick={() => navigate(`/task/${task.id}`)}
                              >
                                <td className="px-5 py-3.5 font-medium text-slate-900 align-top">
                                  <div className="flex flex-col gap-2.5">
                                    <span className="text-base leading-snug">{task.title}</span>
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                      {task.type !== 'one-time' ? (
                                        <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
                                          {taskTypeLabel(task.type)}
                                        </span>
                                      ) : null}
                                      {task.isPaused ? (
                                        <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                                          {t('manageTasks.paused')}
                                        </span>
                                      ) : null}
                                    {task.inCharge ? (
                                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium">
                                        <UserRoundCog size={12} />
                                        {t('taskDetail.inCharge')}: {task.inCharge}
                                      </span>
                                    ) : null}
                                    {task.materialStatus ? (
                                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium ${materialStatusToneMap[task.materialStatus].badge}`}>
                                        <PackageCheck size={12} />
                                        {t(`materials.${task.materialStatus}`)}
                                      </span>
                                    ) : null}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5 align-top text-slate-600">
                                  {task.assignedTo.length > 0 
                                    ? task.assignedTo.map(id => users.find(u => u.id === id)?.name?.split(' ')[0] || 'Unknown').join(', ')
                                    : t('common.unassigned')}
                                </td>
                                <td className="px-5 py-3.5 w-[130px] whitespace-nowrap align-top">
                                  <StatusBadge status={task.status} />
                                </td>
                                <td className="px-5 py-3.5 text-right">
                                  <div className="flex justify-end items-center gap-1.5">
                                    {task.type !== 'one-time' && (
                                      <button 
                                        type="button"
                                        onClick={(e) => handleQuickComplete(e, task)}
                                        disabled={processingTasks.has(task.id)}
                                        className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors border-none bg-transparent cursor-pointer disabled:opacity-50"
                                        title={t('employeeDashboard.quickComplete') || 'Quick Check-off (Done)'}
                                      >
                                        <CheckCircle2 size={16} />
                                      </button>
                                    )}
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/task/${task.id}/edit`);
                                      }}
                                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors border-none bg-transparent cursor-pointer"
                                      title={t('manageTasks.editTask')}
                                    >
                                      <Edit size={16} />
                                    </button>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(t('common.confirmDeleteTask'))) {
                                          deleteTask(task.id);
                                        }
                                      }}
                                      className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded transition-colors border-none bg-transparent cursor-pointer"
                                      title={t('manageTasks.deleteTask')}
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>



        ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          {activeTasks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-5 py-3">{t('manageTasks.taskTitle')}</th>
                    <th className="px-5 py-3">{t('manageTasks.assignedTeamMembers')}</th>
                    <th className="px-5 py-3 w-[130px] whitespace-nowrap">{t('common.status')}</th>
                    <th className="px-5 py-3 text-right">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeTasks.map(task => (
                    <tr 
                      key={task.id} 
                      className="hover:bg-slate-50 cursor-pointer transition-colors" 
                      onClick={() => navigate(`/task/${task.id}`)}
                    >
                      <td className="px-5 py-3.5 font-medium text-slate-900 align-top">
                        <div className="flex flex-col gap-2.5">
                          <span className="text-base leading-snug">{task.title}</span>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            {task.type !== 'one-time' ? (
                              <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
                                {taskTypeLabel(task.type)}
                              </span>
                            ) : null}
                            {task.isPaused ? (
                              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                                {t('manageTasks.paused')}
                              </span>
                            ) : null}
                          {task.inCharge ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium">
                              <UserRoundCog size={12} />
                              {t('taskDetail.inCharge')}: {task.inCharge}
                            </span>
                          ) : null}
                          {task.materialStatus ? (
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium ${materialStatusToneMap[task.materialStatus].badge}`}>
                              <PackageCheck size={12} />
                              {t(`materials.${task.materialStatus}`)}
                            </span>
                          ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 align-top text-slate-600">
                        {task.assignedTo.length > 0 
                          ? task.assignedTo.map(id => users.find(u => u.id === id)?.name?.split(' ')[0] || 'Unknown').join(', ')
                          : t('common.unassigned')}
                      </td>
                      <td className="px-5 py-3.5 w-[130px] whitespace-nowrap align-top">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          {task.type !== 'one-time' && (
                            <button 
                              type="button"
                              onClick={(e) => handleQuickComplete(e, task)}
                              disabled={processingTasks.has(task.id)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors border-none bg-transparent cursor-pointer disabled:opacity-50"
                              title={t('employeeDashboard.quickComplete') || 'Quick Check-off (Done)'}
                            >
                              <CheckCircle2 size={16} />
                            </button>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/task/${task.id}/edit`);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors border-none bg-transparent cursor-pointer"
                            title={t('manageTasks.editTask')}
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(t('common.confirmDeleteTask'))) {
                                deleteTask(task.id);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded transition-colors border-none bg-transparent cursor-pointer"
                            title={t('manageTasks.deleteTask')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-6 text-center text-sm text-slate-500">{t('manageTasks.noActiveTasks')}</p>
          )}
        </div>
        )}
      </div>

      {recurringTasks.length > 0 && (
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">{t('manageTasks.recurringSchedules')}</h2>
            </div>
          </div>

          <div className="grid gap-3">
            {recurringTasks.map((task) => (
              <div
                key={task.id}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300"
                onClick={() => navigate(`/task/${task.id}`)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-900">{task.title}</h3>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide border ${
                        task.isPaused 
                          ? 'border-amber-200 bg-amber-50 text-amber-700' 
                          : 'border-slate-200 bg-slate-100 text-slate-700'
                      }`}>
                        {task.isPaused ? t('manageTasks.paused') : t('manageTasks.running')}
                      </span>
                    </div>
                    <p className="mt-2.5 text-sm font-medium text-slate-700">{recurringScheduleLabel(task)}</p>
                    <p className="mt-2 text-xs text-slate-500 font-medium">
                      {task.assignedTo.length > 0
                        ? task.assignedTo.map((id: string) => users.find(u => u.id === id)?.name?.split(' ')[0] || 'Unknown').join(', ')
                        : t('common.unassigned')}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                    {taskTypeLabel(task.type)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}



      <button
        type="button"
        onClick={() => navigate('/create')}
        className="fixed right-4 z-[60] inline-flex items-center gap-2.5 rounded-full bg-white text-slate-900 border border-slate-200/90 dark:bg-slate-100 dark:text-slate-950 dark:border-white px-5 py-3 text-sm font-bold shadow-xl transition-all duration-200 hover:bg-slate-50 hover:scale-105 hover:shadow-2xl cursor-pointer md:right-8"
        style={{
          bottom: 'calc(max(16px, env(safe-area-inset-bottom, 16px)) + 4.75rem)'
        }}
      >
        <PlusCircle size={22} className="text-slate-900 dark:text-slate-950" />
        {t('manageTasks.newTask')}
      </button>
    </div>
  );
};

export default ManageTasks;
