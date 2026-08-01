import React from 'react';

const TaskSkeleton: React.FC<{ showNote?: boolean }> = ({ showNote = false }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          {/* Header Row: Title & Badge */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-5 w-1/2 max-w-sm rounded bg-slate-200"></div>
            <div className="h-5 w-20 rounded-full border border-slate-200 bg-slate-100"></div>
          </div>
          
          {/* Metadata Row: Assigned By, Assigned To, Timeline */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="h-3 w-28 rounded bg-slate-100"></div>
            <div className="h-3 w-32 rounded bg-slate-100"></div>
            <div className="h-3 w-40 rounded bg-slate-100"></div>
          </div>

          {/* Optional Note Box */}
          {showNote && (
            <div className="mt-3 h-10 w-full rounded-lg border border-slate-200 bg-slate-50"></div>
          )}
        </div>
      </div>
    </div>
  );
};

export const TaskListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <TaskSkeleton key={i} showNote={i % 2 === 0} />
      ))}
    </div>
  );
};

export default TaskSkeleton;
