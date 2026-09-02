import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../contexts/TaskContext';
import type { Task } from '../contexts/TaskContext';
import { useLanguage } from '../contexts/LanguageContext';
import StatusBadge from '../components/StatusBadge';
import { TaskListSkeleton } from '../components/TaskSkeleton';
import { usePersistentState } from '../hooks/usePersistentState';

import { Pin, MoreVertical, ArrowDownUp, CheckCircle2, Repeat, CalendarClock, PlusCircle, Check, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

const EmployeeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { tasks, currentUser, editTask, users, addTaskUpdate, sendPushNotification, isLoading, updateTaskStatus } = useTasks();
  const {
    t,
    formatDateTime,
    formatTime,
    priorityLabel,
    taskTypeLabel,
    relativeDayLabel,
  } = useLanguage();
  const [sortBy, setSortBy] = usePersistentState<'default' | 'priority' | 'dueDate' | 'frequency'>('employeeDashboard_sortBy', 'default');
  const [taskTypeFilter, setTaskTypeFilter] = usePersistentState<'all' | 'recurring' | 'one-time'>('employeeDashboard_typeFilter', 'all');
  const [showTodayCompleted, setShowTodayCompleted] = usePersistentState('employeeDashboard_showToday', true);
  const [isIssuesCollapsed, setIsIssuesCollapsed] = usePersistentState<boolean>('employeeDashboard_issues_collapsed', false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [processingTasks, setProcessingTasks] = useState<Set<string>>(new Set());

  React.useEffect(() => {
    const closeMenu = () => setOpenMenuId(null);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, []);

  if (!currentUser) return null;

  const myTasks = tasks.filter((task) => task.assignedTo.includes(currentUser.id));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const activeTasks = myTasks.filter((task) => {
    if (task.isPaused) return false;
    if (task.status === 'completed' || task.status === 'blocked' || task.status === 'could_not_complete') {
      return false;
    }
    if (task.activeFrom && new Date(task.activeFrom) > new Date()) {
      return false;
    }
    if (task.status === 'in_progress') return true;
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      if (dueDate.getTime() > today.getTime()) return false;
    }
    return true;
  });

  const upcomingTasks = myTasks.filter((task) => {
    if (task.isPaused) return false;
    if (task.status !== 'open' || !task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() > today.getTime();
  });

  const issueTasks = myTasks.filter((task) => !task.isPaused && (task.status === 'blocked' || task.status === 'could_not_complete'));

  const todayCompleted = myTasks.filter((task) => {
    if (task.status !== 'completed' || !task.completedAt) return false;
    const completedDate = new Date(task.completedAt);
    return completedDate >= today && completedDate <= todayEnd;
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
    let listCopy = [...taskList];
    if (taskTypeFilter === 'recurring') {
      listCopy = listCopy.filter(t => t.type !== 'one-time');
    } else if (taskTypeFilter === 'one-time') {
      listCopy = listCopy.filter(t => t.type === 'one-time');
    }

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
    if (sortBy === 'frequency') {
      return listCopy.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        const diff = getFrequencyWeight(a.type) - getFrequencyWeight(b.type);
        if (diff !== 0) return diff;
        return getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
      });
    }
    
    // Default sorting: Due Date first, then Priority
    return listCopy.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      
      // Sort by Due Date
      if (a.dueDate && b.dueDate) {
         const timeDiff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
         if (timeDiff !== 0) return timeDiff;
      } else if (a.dueDate) {
         return -1;
      } else if (b.dueDate) {
         return 1;
      }
      
      // If Due Dates are the same (or both null), sort by Priority
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
  const sortedUpcomingTasks = sortTasks(upcomingTasks);

  const pendingTransfers = tasks.filter(task => task.pendingTransferTo === currentUser.id && !processingTasks.has(task.id));
  const transferResults = tasks.filter(task => task.pendingTransferFrom === currentUser.id && task.transferResult && !task.transferResultSeen && !processingTasks.has(task.id));
  const outgoingTransfers = tasks.filter(task => task.pendingTransferFrom === currentUser.id && task.pendingTransferTo && !processingTasks.has(task.id));

  const handleDismissTransferResult = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setProcessingTasks(prev => new Set(prev).add(task.id));
    editTask(task.id, {
      transferResultSeen: true,
      pendingTransferFrom: "",
      transferResult: "",
    });
  };

  const handleTransferAccept = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setProcessingTasks(prev => new Set(prev).add(task.id));
    const newAssignedTo = task.assignedTo.filter(id => id !== task.pendingTransferFrom);
    if (!newAssignedTo.includes(currentUser.id)) {
      newAssignedTo.push(currentUser.id);
    }
    editTask(task.id, {
      assignedTo: newAssignedTo,
      pendingTransferTo: "",
      pendingTransferComment: "",
      transferResult: "accepted",
      transferResultSeen: false,
    });
    
    // Log history
    const previousAssignee = users.find(u => u.id === task.pendingTransferFrom);
    if (previousAssignee) {
      addTaskUpdate(task.id, `Task transferred from ${previousAssignee.name} to ${currentUser.name}.`);
      sendPushNotification({
        userId: previousAssignee.id,
        title: "✅ Transfer Accepted",
        body: `${currentUser.name} accepted your transfer for: ${task.title}`,
        url: `/task/${task.id}`
      }).catch(err => console.error(err));
    }
  };

  const handleTransferDecline = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setProcessingTasks(prev => new Set(prev).add(task.id));
    editTask(task.id, {
      pendingTransferTo: "",
      pendingTransferComment: "",
      transferResult: "declined",
      transferResultSeen: false,
    });
    
    // Log history    
    const previousAssignee = users.find(u => u.id === task.pendingTransferFrom);
    if (previousAssignee) {
      addTaskUpdate(task.id, `${currentUser.name} declined the transfer request from ${previousAssignee.name}.`);
      sendPushNotification({
        userId: previousAssignee.id,
        title: "❌ Transfer Declined",
        body: `${currentUser.name} declined your transfer for: ${task.title}`,
        url: `/task/${task.id}`
      }).catch(err => console.error(err));
    }
  };

  const handleTransferCancel = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setProcessingTasks(prev => new Set(prev).add(task.id));
    editTask(task.id, {
      pendingTransferTo: "",
      pendingTransferFrom: "",
      pendingTransferComment: "",
    });
  };


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

  const upcomingDueLabel = (task: Task) => {
    if (!task.dueDate) return '';
    
    if (task.startDate) {
      return `${formatDateTime(task.startDate, { dateStyle: 'short', timeStyle: 'short' })} → ${formatDateTime(task.dueDate, { dateStyle: 'short', timeStyle: 'short' })}`;
    }

    const dueDate = new Date(task.dueDate);
    const relativeLabel = relativeDayLabel(dueDate, today);
    const diffMs = dueDate.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / 86400000);

    if (diffDays === 0) return `${relativeLabel} - ${formatTime(dueDate)}`;
    if (diffDays === 1 || diffDays === -1) {
      return `${relativeLabel} - ${formatDateTime(dueDate, { dateStyle: 'short', timeStyle: 'short' })}`;
    }

    if (diffDays >= -6 && diffDays <= 6) {
      return `${relativeLabel} - ${formatDateTime(dueDate, { dateStyle: 'short', timeStyle: 'short' })}`;
    }

    return `${diffDays}d - ${formatDateTime(dueDate, { dateStyle: 'short', timeStyle: 'short' })}`;
  };

  const handlePinClick = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    e.preventDefault();
    editTask(task.id, { pinned: !task.pinned });
    setOpenMenuId(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 pb-32">
      <header className="mb-8 border-b border-slate-150 dark:border-slate-800 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{t('app.myWorkspace')}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t('employeeDashboard.welcome', { name: (currentUser.name || 'User').split(' ')[0] })}
        </p>
      </header>

      {/* Filter Tabs & Sorting */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        {/* Segmented Filter for All vs Recurring vs One-Time */}
        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
          <button
            type="button"
            onClick={() => setTaskTypeFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              taskTypeFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {t('employeeDashboard.allTasksTab') || 'All Tasks'}
          </button>
          <button
            type="button"
            onClick={() => setTaskTypeFilter('recurring')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              taskTypeFilter === 'recurring'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Repeat size={13} />
            <span>{t('employeeDashboard.recurringTab') || 'Recurring Routines'}</span>
          </button>
          <button
            type="button"
            onClick={() => setTaskTypeFilter('one-time')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              taskTypeFilter === 'one-time'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {t('employeeDashboard.oneTimeTab') || 'One-Time Tasks'}
          </button>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 shadow-2xs">
          <label htmlFor="employee-sort" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors" title={t('employeeDashboard.sortMyWork')}>
            <ArrowDownUp size={15} />
          </label>
          <select
            id="employee-sort"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as 'default' | 'priority' | 'dueDate' | 'frequency')}
            className="border-none bg-transparent py-0.5 text-xs font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
          >
            <option value="default" className="dark:bg-slate-800">{t('employeeDashboard.originalOrder')}</option>
            <option value="dueDate" className="dark:bg-slate-800">{t('employeeDashboard.dueDateSoon')}</option>
            <option value="priority" className="dark:bg-slate-800">{t('employeeDashboard.priorityFirst')}</option>
            <option value="frequency" className="dark:bg-slate-800">{t('employeeDashboard.frequency') || 'Frequency (Daily/Weekly/Monthly)'}</option>
          </select>
        </div>
      </div>

      {transferResults.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">Transfer Updates</h2>
          <div className="flex flex-col gap-3">
            {transferResults.map((task) => (
              <div
                key={`result-${task.id}`}
                className={`flex items-center justify-between rounded-xl border p-4 shadow-sm transition-colors cursor-pointer ${task.transferResult === 'accepted' ? 'border-green-200 dark:border-emerald-800/80 bg-green-50 dark:bg-emerald-950/40 hover:bg-green-100/60' : 'border-red-200 dark:border-rose-800/80 bg-red-50 dark:bg-rose-950/40 hover:bg-red-100/60'}`}
                onClick={() => navigate(`/task/${task.id}`)}
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Transfer {task.transferResult === 'accepted' ? 'Accepted' : 'Declined'}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Your request to transfer <span className="font-bold">"{task.title}"</span> was {task.transferResult}.
                  </p>
                </div>
                <button
                  onClick={(e) => handleDismissTransferResult(e, task)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${task.transferResult === 'accepted' ? 'bg-white dark:bg-slate-900 text-green-700 dark:text-emerald-300 border-green-300 dark:border-emerald-700 hover:bg-green-50' : 'bg-white dark:bg-slate-900 text-red-700 dark:text-rose-300 border-red-300 dark:border-rose-700 hover:bg-red-50'}`}
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingTransfers.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">Pending Transfers <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">{pendingTransfers.length}</span></h2>
          <div className="flex flex-col gap-3">
            {pendingTransfers.map((task) => (
              <div
                key={task.id}
                className="cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-sm"
                onClick={() => navigate(`/task/${task.id}`)}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex-1">{task.title}</span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300"><span className="font-bold text-slate-900 dark:text-slate-100">{users.find(u => u.id === task.pendingTransferFrom)?.name}</span> has requested to transfer this task to you.</p>
                {task.pendingTransferComment && <p className="mt-2 text-xs italic text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2 rounded border border-slate-200 dark:border-slate-700">"{task.pendingTransferComment}"</p>}
                
                <div className="flex gap-3 mt-4 items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400 italic">Click card to view details</span>
                  <div className="flex gap-2">
                    <button onClick={(e) => handleTransferDecline(e, task)} className="px-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg cursor-pointer transition-colors whitespace-nowrap shadow-sm">Decline</button>
                    <button onClick={(e) => handleTransferAccept(e, task)} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors whitespace-nowrap shadow-sm">Accept Task</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {outgoingTransfers.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">Outgoing Requests</h2>
          <div className="flex flex-col gap-3">
            {outgoingTransfers.map((task) => (
              <div
                key={`outgoing-${task.id}`}
                className="cursor-pointer flex items-center justify-between rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 p-3 shadow-sm transition-colors hover:bg-amber-100/60"
                onClick={() => navigate(`/task/${task.id}`)}
              >
                <div>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 block mb-0.5">{task.title}</span>
                  <p className="text-xs text-slate-700 dark:text-slate-300">Requested transfer to <span className="font-bold">{users.find(u => u.id === task.pendingTransferTo)?.name}</span> <span className="italic text-slate-500 dark:text-slate-400 ml-1">(Waiting...)</span></p>
                </div>
                
                <button onClick={(e) => handleTransferCancel(e, task)} className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg cursor-pointer transition-colors whitespace-nowrap shadow-sm">Cancel</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blocked / Issue Tasks Collapsible Accordion */}
      {issueTasks.length > 0 && (
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
                {t('app.blockedTasks')}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 font-semibold border border-rose-500/20">
                {issueTasks.length}
              </span>
            </div>

            <div className="flex items-center gap-2 text-rose-600/70 dark:text-rose-300/70 hover:text-rose-700 dark:hover:text-rose-200 text-xs font-medium transition-colors">
              <span>{isIssuesCollapsed ? (t('common.show') || 'Show') : (t('common.hide') || 'Hide')}</span>
              {isIssuesCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
            </div>
          </button>

          {!isIssuesCollapsed && (
            <div className="p-3.5 sm:p-4 pt-0 flex flex-col gap-2.5 border-t border-rose-500/15 dark:border-rose-900/30 mt-1">
              {issueTasks.map((task) => (
                <div
                  key={task.id}
                  className="cursor-pointer rounded-xl border border-rose-500/20 dark:border-rose-900/40 hover:border-rose-500/40 bg-white dark:bg-slate-900/95 p-3 sm:p-3.5 transition-all hover:bg-rose-50/40 dark:hover:bg-slate-900 shadow-2xs"
                  onClick={() => navigate(`/task/${task.id}`)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{task.title}</span>
                    <StatusBadge status={task.status} />
                  </div>
                  <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">{taskPreview(task)}</p>
                  {task.blockReason && (
                    <div className="mt-2 rounded-lg border border-rose-500/20 dark:border-rose-900/40 bg-rose-500/[0.06] dark:bg-rose-950/30 px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200">
                      <span className="font-bold text-rose-600 dark:text-rose-400">{t('common.reason')}:</span> {task.blockReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mb-8">
        <h2 className="mb-3 text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">{t('app.currentAssignments')}</h2>
        {isLoading ? (
          <TaskListSkeleton count={4} />
        ) : sortedActiveTasks.length > 0 ? (
          <div className="grid gap-3">
            {sortedActiveTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => navigate(`/task/${task.id}`)}
                className="group cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:shadow"
              >
                <div className="flex items-start gap-3.5 relative">
                  {/* Left-hand interactive check circle for recurring routines */}
                  {task.type !== 'one-time' && (
                    <button
                      type="button"
                      onClick={(e) => handleQuickComplete(e, task)}
                      disabled={processingTasks.has(task.id)}
                      title={t('employeeDashboard.quickComplete') || 'Als erledigt abhaken'}
                      className="mt-0.5 shrink-0 w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-500 dark:hover:border-emerald-400 bg-slate-50/50 dark:bg-slate-800 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-110 active:scale-95 disabled:opacity-50 group/check"
                    >
                      <Check
                        size={13}
                        className="stroke-[3] text-transparent group-hover/check:text-emerald-500 dark:group-hover/check:text-emerald-400 transition-colors"
                      />
                    </button>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        {task.pinned && <Pin size={14} className="text-blue-600 dark:text-blue-400 shrink-0" fill="currentColor" />}
                        {task.title}
                      </h3>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={task.status} />
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setOpenMenuId(openMenuId === task.id ? null : task.id);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border-none bg-transparent"
                          >
                            <MoreVertical size={16} />
                          </button>
                          {openMenuId === task.id && (
                            <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-150 dark:border-slate-700 py-1.5 z-20 overflow-hidden">
                              <button
                                onClick={(e) => handlePinClick(e, task)}
                                className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer border-none bg-transparent"
                              >
                                <Pin size={14} className={task.pinned ? 'text-blue-600' : 'text-slate-400'} fill={task.pinned ? "currentColor" : "none"} />
                                {task.pinned ? 'Unpin task' : 'Pin task'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{taskPreview(task)}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  {renderPriorityBadge(task.priority)}
                  
                  {task.createdByName && (
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
                      {t('common.assignedBy')}: {task.createdByName}
                    </span>
                  )}
                  
                  {task.dueDate ? (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                      {t('employeeDashboard.dueOn', {
                        date: formatDateTime(task.dueDate, { dateStyle: 'short', timeStyle: 'short' }),
                      })}
                    </span>
                  ) : (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-400">
                      No due date
                    </span>
                  )}
                  {task.type !== 'one-time' ? (
                    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
                      {taskTypeLabel(task.type)}
                    </span>
                  ) : (
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500">
                      {taskTypeLabel(task.type)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-10 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4 shadow-sm">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="mb-2 font-bold text-slate-800 dark:text-slate-200 text-base">{t('employeeDashboard.allCaughtUp')}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">{t('employeeDashboard.noActiveTasks')}</p>
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="mb-3 text-base font-bold tracking-tight text-slate-900">{t('app.upcomingWork')}</h2>
        {sortedUpcomingTasks.length > 0 ? (
          <div className="grid gap-3">
            {sortedUpcomingTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => navigate(`/task/${task.id}`)}
                className="cursor-pointer rounded-xl border border-slate-200 border-l-4 border-l-indigo-400 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow"
              >
                <div className="flex items-start justify-between gap-3 relative">
                  <div className="min-w-0 flex-1">
                    <h3 className="mb-2 text-base font-semibold text-slate-900 flex items-center gap-2">
                      {task.pinned && <Pin size={14} className="text-blue-600 shrink-0" fill="currentColor" />}
                      {task.title}
                    </h3>
                    <p className="line-clamp-2 text-sm leading-6 text-slate-500">{taskPreview(task)}</p>
                  </div>
                  <div className="relative flex items-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setOpenMenuId(openMenuId === task.id ? null : task.id);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer border-none bg-transparent"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openMenuId === task.id && (
                      <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-slate-150 py-1.5 z-20 overflow-hidden">
                        <button
                          onClick={(e) => handlePinClick(e, task)}
                          className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer border-none bg-transparent"
                        >
                          <Pin size={14} className={task.pinned ? 'text-blue-600' : 'text-slate-400'} fill={task.pinned ? "currentColor" : "none"} />
                          {task.pinned ? 'Unpin task' : 'Pin task'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  {renderPriorityBadge(task.priority)}
                  {task.assignedTo && task.assignedTo.length > 0 ? (
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
                      {t('taskDetail.assignedTo')}: {task.assignedTo.map(id => users.find(u => u.id === id)?.name).join(', ')}
                    </span>
                  ) : (
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-400">
                      {t('common.unassigned')}
                    </span>
                  )}
                  {task.assignedByName && (
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500">
                      {t('common.assignedBy')}: {task.assignedByName}
                    </span>
                  )}
                  {task.dueDate && (
                    <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                      {upcomingDueLabel(task)}
                    </span>
                  )}
                  {task.type !== 'one-time' ? (
                    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
                      {taskTypeLabel(task.type)}
                    </span>
                  ) : (
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500">
                      {taskTypeLabel(task.type)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-8 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 rounded-full flex items-center justify-center mb-3">
              <CalendarClock size={24} />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('employeeDashboard.noUpcomingTasks')}</p>
          </div>
        )}
      </div>

      {todayCompleted.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowTodayCompleted((value) => !value)}
            className="mb-3 flex w-full items-center justify-between border-none bg-transparent p-0 text-left cursor-pointer"
          >
            <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-slate-900">
              {t('employeeDashboard.todayCompletedTitle')}
              <span className="employee-completed-count inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold">
                {todayCompleted.length}
              </span>
            </h2>
            <span className="text-xs font-medium text-slate-400 transition-colors hover:text-slate-600">
              {showTodayCompleted ? t('common.hide') : t('common.show')}
            </span>
          </button>

          {showTodayCompleted && (
            <div className="grid gap-2">
              {todayCompleted.map((task) => (
                <div
                  key={task.id}
                  onClick={() => navigate(`/task/${task.id}`)}
                  className="employee-completed-card flex items-center justify-between gap-4 rounded-xl p-4 cursor-pointer transition-colors"
                >
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-slate-700 line-through decoration-slate-400/70">
                      {task.title}
                    </span>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500">
                      {task.completedAt && <span>{formatTime(task.completedAt)}</span>}
                      {task.actualDuration && (
                        <span className="employee-completed-badge rounded px-2 py-0.5 font-semibold">
                          {t('common.timeTaken')}: {task.actualDuration}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="employee-completed-status shrink-0 text-xs font-semibold">{t('common.done')}</span>
                </div>
              ))}
            </div>
          )}

          <p className="mt-3 text-center text-xs text-slate-400">
            {t('common.historyTomorrowNote')}
          </p>
        </div>
      )}

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

export default EmployeeDashboard;
