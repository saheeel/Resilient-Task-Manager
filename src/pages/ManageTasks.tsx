import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks, type Task } from '../contexts/TaskContext';
import StatusBadge from '../components/StatusBadge';
import { PlusCircle, Edit, Trash2, PackageCheck, UserRoundCog, ArrowDownUp, ChevronRight, User, Search, LayoutGrid, Table } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { materialStatusToneMap } from '../lib/taskOptions';
import { TaskListSkeleton } from '../components/TaskSkeleton';
import ExcelTaskTable from '../components/ExcelTaskTable';
import { usePersistentState } from '../hooks/usePersistentState';

const ManageTasks: React.FC = () => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = usePersistentState<'default' | 'employee'>('manageTasks_sortBy', 'employee');
  const [viewMode, setViewMode] = usePersistentState<'grid' | 'excel'>('manageTasks_viewMode', 'excel');
  const [searchQuery, setSearchQuery] = usePersistentState<string>('manageTasks_searchQuery', '');
  const [collapsedSectionsArray, setCollapsedSectionsArray] = usePersistentState<string[]>('manageTasks_collapsed', []);
  const collapsedSections = new Set(collapsedSectionsArray);
  const { tasks, users, currentUser, deleteTask, isLoading } = useTasks();
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

  const sortTasks = (taskList: Task[]) => {
    return [...taskList].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

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

  const sortedActiveTasks = sortTasks(activeTasks);
  const completedTasks = tasks.filter(t => t.status === 'completed');
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
      {/* Attention Required Section */}
      {issues.length > 0 && (
        <div className="mb-8">
          <h2 className="font-bold text-slate-900 dark:text-slate-100 text-lg mb-3 tracking-tight">{t('manageTasks.attentionRequired')}</h2>
          <div className="flex flex-col gap-3">
            {issues.map(task => (
              <div 
                key={task.id} 
                className="bg-red-50 dark:bg-rose-950/60 hover:bg-red-100/80 dark:hover:bg-rose-900/60 border-2 border-red-300 dark:border-rose-700/80 rounded-xl p-4 cursor-pointer transition-colors shadow-xs"
                onClick={() => navigate(`/task/${task.id}`)}
              >
                <div className="flex justify-between items-start gap-4">
                  <span className="font-bold text-slate-900 dark:text-rose-100 text-sm sm:text-base leading-snug">{task.title}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={task.status} />
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/task/${task.id}/edit`);
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors border-none bg-transparent cursor-pointer"
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
                      className="p-1.5 text-slate-400 hover:text-red-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors border-none bg-transparent cursor-pointer"
                      title={t('manageTasks.deleteTask')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="mt-2.5 p-2.5 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-red-200 dark:border-rose-800/80 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium shadow-xs">
                  <span className="font-bold text-red-600 dark:text-rose-400">{t('common.reason')}:</span> {task.blockReason || t('manageTasks.noReasonProvided')}
                </div>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs text-slate-600 dark:text-slate-300 font-normal">
                  {task.assignedByName && (
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{t('common.assignedBy')}:</span>
                      <span>{task.assignedByName}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{t('taskDetail.assignedTo')}:</span>
                    <span>
                      {task.assignedTo.length > 0 
                        ? task.assignedTo.map(id => users.find(u => u.id === id)?.name).join(', ')
                        : t('common.unassigned')}
                    </span>
                  </div>
                  {task.createdAt && (
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">• {t('manageTasks.assignedAt')}:</span>
                      <span>{formatDateTime(task.createdAt, { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                  )}
                  {task.markedIssueAt && (
                    <div className="flex items-center gap-1 text-red-800 dark:text-rose-200 font-semibold bg-red-100 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-red-200 dark:border-rose-800/60">
                      <span>• {t('manageTasks.markedIncompleteAt')}:</span>
                      <span>{formatDateTime(task.markedIssueAt, { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Tasks Bar */}
      <div>
        <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <h2 className="font-bold text-slate-900 dark:text-slate-100 text-lg tracking-tight flex items-center gap-2">
            {t('manageTasks.activeTasks')}
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
              {filteredTasks.length}
            </span>
          </h2>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Free-Text Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t('manageTasks.searchPlaceholder') || "Search tasks..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
              <button
                onClick={() => setViewMode('excel')}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all border-none cursor-pointer ${
                  viewMode === 'excel'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-transparent'
                }`}
              >
                <Table className="w-3.5 h-3.5" /> {t('common.excelTable')}
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all border-none cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-transparent'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> {t('common.groupedCards')}
              </button>
            </div>

            {viewMode === 'grid' && (
              <div className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 shadow-xs">
                <label htmlFor="admin-sort" className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors" title={t('employeeDashboard.sortMyWork')}>
                  <ArrowDownUp size={16} />
                </label>
                <select
                  id="admin-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'default' | 'employee')}
                  className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors focus:border-slate-400"
                >
                  <option value="default">{t('employeeDashboard.originalOrder')}</option>
                  <option value="employee">{t('employeeDashboard.byEmployee')}</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="mt-8">
            <TaskListSkeleton count={5} />
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
                                     <div className="flex justify-end gap-2">
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
                                  <div className="flex justify-end gap-2">
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
                        <div className="flex justify-end gap-2">
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
