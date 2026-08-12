import React, { useState, useMemo } from 'react';
import type { Task, User } from '../contexts/TaskContext';
import StatusBadge from './StatusBadge';
import { 
  ChevronDown, ChevronRight, Calendar, User as UserIcon, 
  Paperclip, FileText, CheckCircle, Clock, ShieldAlert, ArrowUpDown, Tag, ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ExcelTaskTableProps {
  tasks: Task[];
  users: User[];
  currentUser?: User | null;
  onStatusChange?: (taskId: string, newStatus: any, details?: any) => void;
}

type SortField = 'title' | 'dueDate' | 'priority' | 'status' | 'creator' | 'assignee';
type SortOrder = 'asc' | 'desc';

export const isTaskDeadlineApproaching = (dueDateStr?: string): { isApproaching: boolean; isOverdue: boolean } => {
  if (!dueDateStr) return { isApproaching: false, isOverdue: false };
  const now = new Date();
  const due = new Date(dueDateStr);
  const diffMs = due.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffMs < 0) {
    return { isApproaching: false, isOverdue: true };
  }
  if (diffHours <= 24) {
    return { isApproaching: true, isOverdue: false };
  }
  return { isApproaching: false, isOverdue: false };
};

const ExcelTaskTable: React.FC<ExcelTaskTableProps> = ({ tasks, users }) => {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  // Header filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTitle, setSearchTitle] = useState<string>('');

  const getUserName = (id: string) => {
    const u = users.find(user => user.id === id);
    return u ? u.name : 'Unassigned';
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedTasks = useMemo(() => {
    return tasks
      .filter(t => {
        if (statusFilter !== 'all' && t.status !== statusFilter) return false;
        if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
        if (searchTitle.trim()) {
          const q = searchTitle.toLowerCase();
          const titleMatch = t.title.toLowerCase().includes(q);
          const descMatch = t.description?.toLowerCase().includes(q);
          const creatorMatch = t.createdByName?.toLowerCase().includes(q);
          if (!titleMatch && !descMatch && !creatorMatch) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA: any = '';
        let valB: any = '';

        if (sortField === 'title') {
          valA = a.title.toLowerCase();
          valB = b.title.toLowerCase();
        } else if (sortField === 'dueDate') {
          valA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          valB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        } else if (sortField === 'priority') {
          const pMap = { high: 3, medium: 2, low: 1 };
          valA = pMap[a.priority as keyof typeof pMap] || 0;
          valB = pMap[b.priority as keyof typeof pMap] || 0;
        } else if (sortField === 'status') {
          valA = a.status;
          valB = b.status;
        } else if (sortField === 'creator') {
          valA = (a.createdByName || '').toLowerCase();
          valB = (b.createdByName || '').toLowerCase();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [tasks, statusFilter, priorityFilter, searchTitle, sortField, sortOrder]);

  const toggleExpand = (id: string) => {
    setExpandedTaskId(expandedTaskId === id ? null : id);
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden backdrop-blur-md">
      {/* Header Filter Controls Bar */}
      <div className="p-4 bg-slate-950/60 border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Quick filter table..."
            value={searchTitle}
            onChange={(e) => setSearchTitle(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter tasks by status"
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="could_not_complete">Could Not Complete</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              aria-label="Filter tasks by priority"
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Excel Compact Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 select-none">
            <tr>
              <th className="p-3 w-8 text-center"></th>
              <th 
                className="p-3 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center gap-1">
                  Task Title
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="p-3">Status</th>
              <th 
                className="p-3 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('priority')}
              >
                <div className="flex items-center gap-1">
                  Priority
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th 
                className="p-3 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('creator')}
              >
                <div className="flex items-center gap-1">
                  Created By
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="p-3">Assigned To</th>
              <th 
                className="p-3 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('dueDate')}
              >
                <div className="flex items-center gap-1">
                  Due Date
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="p-3 text-right">Actual Duration</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredAndSortedTasks.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-500 italic">
                  No matching tasks found.
                </td>
              </tr>
            ) : (
              filteredAndSortedTasks.map((task) => {
                const isExpanded = expandedTaskId === task.id;
                const { isApproaching, isOverdue } = isTaskDeadlineApproaching(task.dueDate);
                const isCompleted = task.status === 'completed';

                return (
                  <React.Fragment key={task.id}>
                    <tr 
                      className={`hover:bg-slate-800/50 transition-colors ${
                        isOverdue && !isCompleted ? 'bg-rose-950/20 border-l-4 border-l-rose-500' :
                        isApproaching && !isCompleted ? 'bg-amber-950/20 border-l-4 border-l-amber-500' : ''
                      }`}
                    >
                      {/* Expand Chevron */}
                      <td className="p-3 text-center cursor-pointer" onClick={() => toggleExpand(task.id)}>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-indigo-400 mx-auto" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-500 hover:text-slate-300 mx-auto" />
                        )}
                      </td>

                      {/* Title & Self-Assigned Badge */}
                      <td className="p-3 font-medium text-slate-100 min-w-[220px]">
                        <div className="flex items-center gap-2">
                          <Link 
                            to={`/task/${task.id}`} 
                            className="hover:text-indigo-400 transition-colors line-clamp-1"
                          >
                            {task.title}
                          </Link>
                          {task.isSelfAssigned && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                              <Tag className="w-2.5 h-2.5" /> Self-Assigned
                            </span>
                          )}
                          {task.attachments && task.attachments.length > 0 && (
                            <span className="inline-flex items-center text-slate-400" title={`${task.attachments.length} attachment(s)`}>
                              <Paperclip className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="p-3 whitespace-nowrap">
                        <StatusBadge status={task.status} />
                      </td>

                      {/* Priority */}
                      <td className="p-3 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          task.priority === 'high' ? 'bg-rose-950/80 text-rose-400 border border-rose-800/40' :
                          task.priority === 'medium' ? 'bg-amber-950/80 text-amber-400 border border-amber-800/40' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {task.priority}
                        </span>
                      </td>

                      {/* Creator */}
                      <td className="p-3 whitespace-nowrap text-slate-400">
                        <div className="flex items-center gap-1">
                          <UserIcon className="w-3 h-3 text-slate-500" />
                          <span>{task.createdByName || task.assignedByName || 'System'}</span>
                        </div>
                      </td>

                      {/* Assignees */}
                      <td className="p-3 whitespace-nowrap text-slate-300">
                        {task.assignedTo && task.assignedTo.length > 0 ? (
                          <span>{task.assignedTo.map(id => getUserName(id)).join(', ')}</span>
                        ) : (
                          <span className="text-slate-500 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Due Date */}
                      <td className="p-3 whitespace-nowrap text-slate-300">
                        {task.dueDate ? (
                          <div className={`flex items-center gap-1.5 ${
                            isOverdue && !isCompleted ? 'text-rose-400 font-semibold' :
                            isApproaching && !isCompleted ? 'text-amber-400 font-semibold' : 'text-slate-300'
                          }`}>
                            <Calendar className="w-3 h-3 opacity-70" />
                            {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        ) : (
                          <span className="text-slate-600 italic">No Due Date</span>
                        )}
                      </td>

                      {/* Actual Duration */}
                      <td className="p-3 text-right whitespace-nowrap">
                        {task.actualDuration ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                            <Clock className="w-3 h-3 text-emerald-400" /> {task.actualDuration}
                          </span>
                        ) : (
                          <span className="text-slate-600 font-mono text-[10px]">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <Link 
                          to={`/task/${task.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 transition-all text-[11px] font-medium"
                        >
                          Details <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>

                    {/* Inline Expandable Row Dropdown Menu */}
                    {isExpanded && (
                      <tr className="bg-slate-950/90 border-b border-slate-800/80">
                        <td colSpan={9} className="p-4 pl-12 text-slate-300">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/90 p-4 rounded-xl border border-slate-800/60">
                            
                            {/* Column 1: Description & Remarks */}
                            <div className="space-y-2 md:col-span-2">
                              <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5" /> Description & Details
                              </h4>
                              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/50 p-3 rounded-lg border border-slate-800/40">
                                {task.description || "No description provided."}
                              </p>
                              
                              {task.remarks && (
                                <div className="mt-2 text-xs">
                                  <span className="font-semibold text-slate-400">Remarks:</span>
                                  <span className="text-slate-300 ml-1.5">{task.remarks}</span>
                                </div>
                              )}

                              {task.completionComment && (
                                <div className="mt-2 text-xs bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-800/40">
                                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                                    <CheckCircle className="w-3.5 h-3.5" /> Completion Comment:
                                  </span>
                                  <p className="text-slate-200 mt-1">{task.completionComment}</p>
                                </div>
                              )}

                              {task.blockReason && (
                                <div className="mt-2 text-xs bg-rose-950/30 p-2.5 rounded-lg border border-rose-800/40">
                                  <span className="font-semibold text-rose-400 flex items-center gap-1">
                                    <ShieldAlert className="w-3.5 h-3.5" /> Incomplete / Block Reason:
                                  </span>
                                  <p className="text-slate-200 mt-1">{task.blockReason}</p>
                                </div>
                              )}
                            </div>

                            {/* Column 2: Attachments, Proof Photos & PDF View */}
                            <div className="space-y-3">
                              <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Paperclip className="w-3.5 h-3.5" /> Attachments & Proofs
                              </h4>

                              {task.attachments && task.attachments.length > 0 ? (
                                <div className="space-y-1.5">
                                  {task.attachments.map((url, idx) => {
                                    const isPdf = url.toLowerCase().includes('.pdf') || url.includes('application/pdf');
                                    return (
                                      <a
                                        key={idx}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/40 transition-colors text-xs text-indigo-300"
                                      >
                                        {isPdf ? (
                                          <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 font-bold text-[10px]">PDF</span>
                                        ) : (
                                          <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                                        )}
                                        <span className="truncate flex-1">Attachment #{idx + 1}</span>
                                        <ExternalLink className="w-3 h-3 text-slate-500" />
                                      </a>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-500 italic">No attachments added.</p>
                              )}

                              {/* Proof Photos */}
                              {((task.proofPhotoUrls && task.proofPhotoUrls.length > 0) || task.proofPhotoUrl) && (
                                <div>
                                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Proof Photos:</span>
                                  <div className="flex flex-wrap gap-2">
                                    {[...(task.proofPhotoUrls || []), ...(task.proofPhotoUrl ? [task.proofPhotoUrl] : [])].map((imgUrl, i) => (
                                      <a key={i} href={imgUrl} target="_blank" rel="noopener noreferrer">
                                        <img 
                                          src={imgUrl} 
                                          alt={`Proof ${i}`} 
                                          className="w-12 h-12 object-cover rounded-lg border border-slate-700 hover:opacity-80 transition-opacity" 
                                        />
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExcelTaskTable;
