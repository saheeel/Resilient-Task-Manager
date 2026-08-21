import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../contexts/TaskContext';
import type { Task } from '../contexts/TaskContext';
import { useLanguage } from '../contexts/LanguageContext';
import StatusBadge from '../components/StatusBadge';
import { PackageCheck, UserRoundCog, ArrowDownUp, ChevronRight, User, Search, LayoutGrid, Table, PlusCircle, CheckCircle2 } from 'lucide-react';
import { materialStatusToneMap } from '../lib/taskOptions';
import { TaskListSkeleton } from '../components/TaskSkeleton';
import ExcelTaskTable from '../components/ExcelTaskTable';
import { usePersistentState } from '../hooks/usePersistentState';

const AllTasks: React.FC = () => {
  const navigate = useNavigate();
  const { tasks, currentUser, users, isLoading } = useTasks();
  const {
    t,
    formatDateTime,
    priorityLabel,
    taskTypeLabel,
  } = useLanguage();
  const [sortBy, setSortBy] = usePersistentState<'default' | 'priority' | 'dueDate' | 'employee'>('allTasks_sortBy', 'employee');
  const [viewMode, setViewMode] = usePersistentState<'grid' | 'excel'>('allTasks_viewMode', 'excel');
  const [searchQuery, setSearchQuery] = usePersistentState<string>('allTasks_searchQuery', '');
  const [collapsedSectionsArray, setCollapsedSectionsArray] = usePersistentState<string[]>('allTasks_collapsed', []);
  const collapsedSections = new Set(collapsedSectionsArray);

  const toggleSection = (sectionId: string) => {
    setCollapsedSectionsArray(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return Array.from(next);
    });
  };

  if (!currentUser) return null;

  // We only show open and in-progress tasks
  const activeTasks = tasks.filter((task) => {
    if (task.isPaused) return false;
    if (task.status === 'completed' || task.status === 'blocked' || task.status === 'could_not_complete') {
      return false;
    }
    if (task.activeFrom && new Date(task.activeFrom) > new Date()) {
      return false;
    }
    return true;
  });

  const getPriorityWeight = (priority: string) => {
    if (priority === 'high') return 3;
    if (priority === 'medium') return 2;
    return 1;
  };

  const sortTasks = (taskList: Task[]) => {
    const listCopy = [...taskList];
    if (sortBy === 'priority') {
      return listCopy.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
      });
    }
    if (sortBy === 'dueDate') {
      return listCopy.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    }
    
    // Default sorting: Pinned first, then Due Date, then Priority
    return listCopy.sort((a, b) => {
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

  const renderPriorityBadge = (priority: Task['priority']) => {
    const colorClasses = {
      high: 'text-red-700 bg-red-50 border-red-100',
      medium: 'text-amber-700 bg-amber-50 border-amber-100',
      low: 'text-slate-600 bg-slate-50 border-slate-200',
    };

    return (
      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${colorClasses[priority]}`}>
        {priorityLabel(priority)}
      </span>
    );
  };

  const taskPreview = (task: Task) => {
    const description = task.description?.trim();
    if (description) return description;
    return t('employeeDashboard.taskDescriptionFallback');
  };

  const renderTaskCard = (task: Task, keyPrefix = '') => (
    <div
      key={`${keyPrefix}${task.id}`}
      onClick={() => navigate(`/task/${task.id}`)}
      className="cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow"
    >
      <div className="flex items-start justify-between gap-3 relative">
        <div className="min-w-0 flex-1">
          <h3 className="mb-2 text-lg font-semibold text-slate-900 flex items-center gap-2">
            {task.title}
          </h3>
          <p className="line-clamp-2 text-sm leading-6 text-slate-500">{taskPreview(task)}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={task.status} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        {renderPriorityBadge(task.priority)}
        
        {task.assignedTo.length > 0 ? (
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
            {t('taskDetail.assignedTo')}: {task.assignedTo.map(id => users.find(u => u.id === id)?.name).join(', ')}
          </span>
        ) : (
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-400">
            {t('common.unassigned')}
          </span>
        )}

        {task.startDate ? (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
            {formatDateTime(task.startDate, { dateStyle: 'short', timeStyle: 'short' })} → {task.dueDate ? formatDateTime(task.dueDate, { dateStyle: 'short', timeStyle: 'short' }) : '?'}
          </span>
        ) : task.dueDate ? (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
            {t('employeeDashboard.dueOn', {
              date: formatDateTime(task.dueDate, { dateStyle: 'short', timeStyle: 'short' }),
            })}
          </span>
        ) : null}
        {task.type !== 'one-time' ? (
          <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
            {taskTypeLabel(task.type)}
          </span>
        ) : (
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500">
            {taskTypeLabel(task.type)}
          </span>
        )}
        {task.inCharge && (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium">
            <UserRoundCog size={12} />
            {t('taskDetail.inCharge')}: {task.inCharge}
          </span>
        )}
        {task.materialStatus && (
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${materialStatusToneMap[task.materialStatus].badge}`}>
            <PackageCheck size={12} />
            {t(`materials.${task.materialStatus}`)}
          </span>
        )}
      </div>
    </div>
  );

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

  const filteredActiveTasks = activeTasks.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = t.title.toLowerCase().includes(q);
    const descMatch = t.description?.toLowerCase().includes(q);
    const creatorMatch = t.createdByName?.toLowerCase().includes(q);
    const remarksMatch = t.remarks?.toLowerCase().includes(q);
    return titleMatch || descMatch || creatorMatch || remarksMatch;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 pb-32">
      <header className="mb-6 border-b border-slate-150 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{t('nav.allTasks')}</h1>
          <p className="mt-1 text-sm text-slate-500">
            View all active tasks across the organization
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Free-Text Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('common.searchAllTasks')}
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
              <label htmlFor="all-sort" className="text-slate-500 hover:text-slate-700 transition-colors" title={t('employeeDashboard.sortMyWork')}>
                <ArrowDownUp size={16} />
              </label>
              <select
                id="all-sort"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as 'default' | 'priority' | 'dueDate' | 'employee')}
                className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors focus:border-slate-400"
              >
                <option value="default">{t('employeeDashboard.originalOrder')}</option>
                <option value="priority">{t('employeeDashboard.priorityFirst')}</option>
                <option value="dueDate">{t('employeeDashboard.dueDateSoon')}</option>
                <option value="employee">{t('employeeDashboard.byEmployee')}</option>
              </select>
            </div>
          )}
        </div>
      </header>

      <div className="mb-8">
        {isLoading ? (
          <TaskListSkeleton count={5} />
        ) : viewMode === 'excel' ? (
          <ExcelTaskTable tasks={filteredActiveTasks} users={users} currentUser={currentUser} />
        ) : filteredActiveTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-12 mt-4 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mb-4 shadow-sm">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="mb-2 font-bold text-slate-800 dark:text-slate-200 text-lg">{searchQuery ? "No matching tasks" : t('employeeDashboard.allCaughtUp') || 'No tasks found'}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">{searchQuery ? "Try adjusting your search filters." : t('employeeDashboard.noActiveTasks') || 'There are no tasks available right now.'}</p>
          </div>
        ) : sortBy === 'employee' ? (
          <div className="space-y-2.5">
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
                       <div className="p-3 border border-t-0 rounded-b-lg border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/40 grid gap-2.5">
                         {userTasks.map(task => renderTaskCard(task, user.id))}
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
                    <div className="p-3 border border-t-0 rounded-b-lg border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/40 grid gap-2.5">
                      {groupedTasks['unassigned'].map(task => renderTaskCard(task, 'unassigned'))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>


        ) : (
          <div className="grid gap-3">
            {sortedActiveTasks.map((task) => renderTaskCard(task))}
          </div>
        )}
      </div>

      {/* Floating White New Task Button */}
      <button
        type="button"
        onClick={() => navigate('/create')}
        className="fixed right-4 z-[60] inline-flex items-center gap-2.5 rounded-full bg-white text-slate-900 border border-slate-200/90 dark:bg-slate-100 dark:text-slate-950 dark:border-white px-5 py-3 text-sm font-bold shadow-xl transition-all duration-200 hover:bg-slate-50 hover:scale-105 hover:shadow-2xl cursor-pointer md:right-8"
        style={{
          bottom: 'calc(max(16px, env(safe-area-inset-bottom, 16px)) + 4.75rem)'
        }}
      >
        <PlusCircle size={22} className="text-slate-900 dark:text-slate-950" />
        {t('manageTasks.newTask') || 'New Task'}
      </button>
    </div>
  );
};

export default AllTasks;

