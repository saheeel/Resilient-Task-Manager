import React from 'react';

const TaskSkeleton: React.FC = () => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 animate-pulse">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          {/* Header Row */}
          <div className="flex items-center gap-2">
            <div className="h-5 w-3/4 rounded bg-slate-200"></div>
            <div className="h-5 w-16 rounded-full bg-slate-100"></div>
          </div>
          
          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-4 w-24 rounded bg-slate-100"></div>
            <div className="h-4 w-32 rounded bg-slate-100"></div>
            <div className="h-4 w-20 rounded bg-slate-100"></div>
          </div>
          
          {/* Action Row */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex -space-x-2">
              <div className="h-8 w-8 rounded-full border-2 border-white bg-slate-200"></div>
              <div className="h-8 w-8 rounded-full border-2 border-white bg-slate-200"></div>
            </div>
            <div className="h-8 w-24 rounded-lg bg-slate-100"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TaskListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <TaskSkeleton key={i} />
      ))}
    </div>
  );
};

export default TaskSkeleton;
