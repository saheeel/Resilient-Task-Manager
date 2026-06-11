import type { Task } from "../contexts/TaskContext";

export const MATERIAL_STATUS_OPTIONS = [
  "available",
  "to_purchase",
  "ordered_pending_delivery",
  "clarification_needed",
] as const;

export type MaterialStatus = (typeof MATERIAL_STATUS_OPTIONS)[number];

export const materialStatusToneMap: Record<
  MaterialStatus,
  { badge: string; dot: string }
> = {
  available: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  to_purchase: {
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
  },
  ordered_pending_delivery: {
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  clarification_needed: {
    badge: "border-slate-200 bg-slate-100 text-slate-700",
    dot: "bg-slate-500",
  },
};

export const getTaskSortDate = (task: Task) => {
  if (task.dueDate) return new Date(task.dueDate).getTime();
  if (task.createdAt) return new Date(task.createdAt).getTime();
  return Number.MAX_SAFE_INTEGER;
};
