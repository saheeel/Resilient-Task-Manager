import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { MaterialStatus } from '../lib/taskOptions';

export type Role = 'employee' | 'admin' | 'superadmin' | 'manager';
export type TaskType = 'daily' | 'weekly' | 'monthly' | 'one-time';
export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'could_not_complete' | 'blocked';
export type Priority = 'low' | 'medium' | 'high';

export interface User {
  id: string;
  name: string;
  role: Role;
  email?: string;
  avatarUrl?: string;
  username?: string;
  password?: string;
  employeeRole?: string;
  authUserId?: string;
  authType?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  priority: Priority;
  assignedTo: string[]; // Array of User IDs
  assignedById?: string;
  assignedByName?: string;
  dueDate?: string; // ISO date string
  remarks?: string;
  inCharge?: string;
  materialStatus?: MaterialStatus;
  attachments?: string[]; 
  
  completedAt?: string;
  completionComment?: string;
  blockReason?: string; 
  proofPhotoUrl?: string; 
  createdAt?: string; // ISO date string when assigned
  markedIssueAt?: string; // ISO date string when reported as issue/incomplete
  startedAt?: string; // ISO date string when employee clicks 'Start Task'
  recurringDay?: string; // Day name for weekly ("Monday"), day number for monthly ("15")
  recurringTime?: string; // Time string in HH:MM format ("09:00")
  isPaused?: boolean;
  pausedAt?: string;
  pinned?: boolean;
  pendingTransferTo?: string;
  pendingTransferFrom?: string;
  pendingTransferComment?: string;
  transferResult?: string;
  transferResultSeen?: boolean;
}

interface TaskContextType {
  tasks: Task[];
  users: User[];
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus, details?: Partial<Task>) => void;
  addUser: (name: string, role: Role, username?: string, password?: string, employeeRole?: string) => User;
  addAdminUser: (name: string, email?: string, role?: Extract<Role, 'admin' | 'superadmin'>) => Promise<string>;
  updateAdminUser: (userId: string, updates: { name: string; password?: string }) => Promise<void>;
  deleteUserAccount: (userId: string) => Promise<void>;
  editTask: (taskId: string, updatedFields: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  updateUser: (userId: string, updatedFields: Partial<User>) => void;
  logout: () => void;
  addTaskUpdate: (taskId: string, text: string, photoUrl?: string) => Promise<void>;
  isBackendConnected: boolean;
  sendPushNotification: (args: { userId: string; title: string; body: string; url?: string }) => Promise<null>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const isAdminRole = (role?: Role | string | null) => role === 'admin' || role === 'superadmin' || role === 'manager';

const USERS_CACHE_KEY = 'rtm_cached_users';
const TASKS_CACHE_KEY = 'rtm_cached_tasks';

const readCachedCollection = (key: string) => {
  try {
    const rawValue = localStorage.getItem(key);
    if (!rawValue) return undefined;
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
};

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Convex Queries and Mutations
  const dbUsersRaw = useQuery(api.users.list);
  const dbTasksRaw = useQuery(api.tasks.list);
  
  const seedUsers = useMutation(api.users.seed);
  const seedTasks = useMutation(api.tasks.seed);

  const dbAddTask = useMutation(api.tasks.create);
  const dbUpdateTask = useMutation(api.tasks.update);
  const dbRemoveTask = useMutation(api.tasks.remove);

  const dbAddUser = useMutation(api.users.create);
  const dbUpdateUser = useMutation(api.users.update);
  const dbRemoveUser = useMutation(api.users.remove);
  const dbAddTaskUpdate = useMutation(api.taskUpdates.create);
  const syncSuperAdminAllowlist = useMutation(api.users.syncSuperAdminAllowlist);
  
  const sendPushNotification = useAction(api.pushActions.sendNotification);
  const notifyAdmins = useAction(api.pushActions.notifyAdmins);
  const [cachedUsersRaw, setCachedUsersRaw] = useState<any[] | undefined>(() => readCachedCollection(USERS_CACHE_KEY));
  const [cachedTasksRaw, setCachedTasksRaw] = useState<any[] | undefined>(() => readCachedCollection(TASKS_CACHE_KEY));
  const isBackendConnected = dbUsersRaw !== undefined && dbTasksRaw !== undefined;

  // Trigger Convex Auto-Seeding if table is empty
  useEffect(() => {
    seedUsers().then(() => {
      seedTasks();
      syncSuperAdminAllowlist();
    });
  }, [seedUsers, seedTasks, syncSuperAdminAllowlist]);

  // Session state for tracking active logged-in user profile
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('rtm_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleSetCurrentUser = (user: User | null) => {
    if (user) {
      localStorage.setItem('rtm_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('rtm_current_user');
    }
    setCurrentUser(user);
  };

  useEffect(() => {
    if (dbUsersRaw === undefined) return;
    const usersSnapshot = dbUsersRaw as any[];
    setCachedUsersRaw(usersSnapshot);
    localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(usersSnapshot));
  }, [dbUsersRaw]);

  useEffect(() => {
    if (dbTasksRaw === undefined) return;
    const tasksSnapshot = dbTasksRaw as any[];
    setCachedTasksRaw(tasksSnapshot);
    localStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(tasksSnapshot));
  }, [dbTasksRaw]);

  // Map Convex database users to type-safe User objects
  const mappedDbUsers = useMemo(() => {
    const userSource = (dbUsersRaw as any[] | undefined) ?? cachedUsersRaw;
    if (!userSource) return [];
    return userSource.map((u: any) => ({
      id: u._id,
      name: u.name,
      role: u.role as Role,
      email: u.email,
      avatarUrl: u.avatarUrl,
      username: u.username,
      password: u.password,
      employeeRole: u.employeeRole,
      authUserId: u.authUserId,
      authType: u.authType,
    }));
  }, [dbUsersRaw, cachedUsersRaw]);

  // Keep currentUser synced with database record, and auto-update ID if database is reseeded
  useEffect(() => {
    if (!currentUser || mappedDbUsers.length === 0) return;
    const latestUserRecord = mappedDbUsers.find(
      u => u.id === currentUser.id || (u.username && u.username === currentUser.username)
    );
    if (latestUserRecord) {
      if (latestUserRecord.id !== currentUser.id || latestUserRecord.role !== currentUser.role) {
        handleSetCurrentUser(latestUserRecord);
        console.log("Synchronized session for user:", latestUserRecord.name);
      }
    }
  }, [mappedDbUsers, currentUser]);

  // Map Convex database tasks to type-safe Task objects
  const mappedDbTasks = useMemo(() => {
    const taskSource = (dbTasksRaw as any[] | undefined) ?? cachedTasksRaw;
    if (!taskSource) return [];
    return taskSource.map((t: any) => ({
      id: t._id,
      title: t.title,
      description: t.description,
      type: t.type as TaskType,
      status: t.status as TaskStatus,
      priority: t.priority as Priority,
      assignedTo: t.assignedTo,
      assignedById: t.assignedById,
      assignedByName: t.assignedByName,
      dueDate: t.dueDate,
      remarks: t.remarks,
      inCharge: t.inCharge,
      materialStatus: t.materialStatus as MaterialStatus | undefined,
      attachments: t.attachments,
      completedAt: t.completedAt,
      completionComment: t.completionComment,
      blockReason: t.blockReason,
      proofPhotoUrl: t.proofPhotoUrl,
      createdAt: t.createdAt,
      markedIssueAt: t.markedIssueAt,
      startedAt: t.startedAt,
      recurringDay: t.recurringDay,
      recurringTime: t.recurringTime,
      isPaused: t.isPaused,
      pausedAt: t.pausedAt,
      pinned: t.pinned,
      pendingTransferTo: t.pendingTransferTo,
      pendingTransferFrom: t.pendingTransferFrom,
      pendingTransferComment: t.pendingTransferComment,
      transferResult: t.transferResult,
      transferResultSeen: t.transferResultSeen,
    }));
  }, [dbTasksRaw, cachedTasksRaw]);

  const createTemporaryEmail = (name: string) => {
    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "") || "user";
    const usedEmails = new Set(
      mappedDbUsers
        .map((user) => user.email?.trim().toLowerCase())
        .filter(Boolean) as string[]
    );

    let candidate = `${slug}@temp.resilient.local`;
    let counter = 2;
    while (usedEmails.has(candidate)) {
      candidate = `${slug}.${counter}@temp.resilient.local`;
      counter += 1;
    }

    return candidate;
  };

  const addTask = (taskData: Omit<Task, 'id'>) => {
    const assignmentMetadata = currentUser && currentUser.role !== 'employee'
      ? {
          assignedById: currentUser.id,
          assignedByName: currentUser.name,
        }
      : {
          assignedById: taskData.assignedById,
          assignedByName: taskData.assignedByName,
        };

    dbAddTask({
      title: taskData.title,
      description: taskData.description,
      type: taskData.type,
      status: taskData.status,
      priority: taskData.priority,
      assignedTo: taskData.assignedTo,
      assignedById: assignmentMetadata.assignedById,
      assignedByName: assignmentMetadata.assignedByName,
      dueDate: taskData.dueDate,
      remarks: taskData.remarks,
      inCharge: taskData.inCharge,
      materialStatus: taskData.materialStatus,
      attachments: taskData.attachments,
      recurringDay: taskData.recurringDay,
      recurringTime: taskData.recurringTime,
      isPaused: taskData.isPaused,
      pausedAt: taskData.pausedAt,
      pinned: taskData.pinned,
    }).then(() => {
      // Loop through assignees and fire off background Web Push notifications
      taskData.assignedTo.forEach((userId) => {
        sendPushNotification({
          userId,
          title: "New Task Assigned! 🚀",
          body: `${taskData.title}\nPriority: ${taskData.priority.toUpperCase()}${assignmentMetadata.assignedByName ? `\nAssigned by: ${assignmentMetadata.assignedByName}` : ''}`,
          url: "/"
        }).catch((err) => console.error("Push notification action trigger error:", err));
      });
    });
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus, details?: Partial<Task>) => {
    dbUpdateTask({
      id: taskId as any,
      status,
      ...details,
    });

    // Fire push notification to all admin-side users when an employee completes a task
    if (status === 'completed' && currentUser && currentUser.role === 'employee') {
      const completedTask = mappedDbTasks.find(t => t.id === taskId);
      if (completedTask) {
        notifyAdmins({
          taskTitle: completedTask.title,
          employeeName: currentUser.name,
          taskId,
        }).catch((err: any) => console.error('Admin notification error:', err));
      }
    }
  };

  const addUser = (name: string, role: Role, username?: string, password?: string, employeeRole?: string) => {
    const tempId = `temp_${Date.now()}`;
    const email = role === 'employee' ? undefined : createTemporaryEmail(name);
    dbAddUser({
      name,
      role,
      email,
      username,
      password,
      employeeRole,
      authType: 'local',
    });
    return { id: tempId, name, role, email, username, password, employeeRole, authType: 'local' };
  };

  const addAdminUser = async (name: string, email?: string, role: Extract<Role, 'admin' | 'superadmin'> = 'admin') => {
    const resolvedEmail = email?.trim().toLowerCase() || createTemporaryEmail(name);
    await dbAddUser({
      name,
      role,
      email: resolvedEmail,
      password: '1234',
      authType: 'local',
    });
    return resolvedEmail;
  };

  const updateAdminUser = async (userId: string, updates: { name: string; password?: string }) => {
    const targetUser = mappedDbUsers.find((user) => user.id === userId);

    if (!targetUser) {
      throw new Error('Admin account not found.');
    }

    const nextPassword = updates.password?.trim() || targetUser.password;

    await dbUpdateUser({
      id: userId as any,
      name: updates.name,
      password: nextPassword,
    });

    if (currentUser && currentUser.id === userId) {
      const updatedUser = { ...currentUser, name: updates.name, password: nextPassword };
      handleSetCurrentUser(updatedUser);
    }
  };

  const editTask = (taskId: string, updatedFields: Partial<Task>) => {
    const { id, ...fields } = updatedFields;
    const assignmentMetadata = currentUser && currentUser.role !== 'employee'
      ? {
          assignedById: currentUser.id,
          assignedByName: currentUser.name,
        }
      : {};

    dbUpdateTask({
      id: taskId as any,
      ...assignmentMetadata,
      ...fields,
    });
  };

  const deleteTask = (taskId: string) => {
    dbRemoveTask({ id: taskId as any });
  };

  const updateUser = (userId: string, updatedFields: Partial<User>) => {
    const { id, ...fields } = updatedFields;
    dbUpdateUser({
      id: userId as any,
      ...fields,
    });
    if (currentUser && currentUser.id === userId) {
      const updatedUser = { ...currentUser, ...updatedFields };
      handleSetCurrentUser(updatedUser);
    }
  };

  const deleteUserAccount = async (userId: string) => {
    await dbRemoveUser({ id: userId as any });
    if (currentUser?.id === userId) {
      handleSetCurrentUser(null);
    }
  };

  const logout = () => {
    handleSetCurrentUser(null);
  };

  const addTaskUpdate = async (taskId: string, text: string, photoUrl?: string) => {
    if (!currentUser) return;
    
    await dbAddTaskUpdate({
      taskId,
      userId: currentUser.id,
      userName: currentUser.name,
      text,
      photoUrl,
      createdAt: new Date().toISOString(),
    });

    const task = mappedDbTasks.find(t => t.id === taskId);
    if (!task) return;

    if (isAdminRole(currentUser.role)) {
      // Admin commented, notify all assignees
      task.assignedTo.forEach((userId: string) => {
        if (userId !== currentUser.id) {
          sendPushNotification({
            userId,
            title: `💬 Comment from Admin: ${currentUser.name}`,
            body: `"${text}"\nTask: ${task.title}`,
            url: `/task/${taskId}`
          }).catch((err) => console.error("Push notification action trigger error:", err));
        }
      });
    } else {
      // Employee commented, notify assigner (or admins if not assigned by a specific admin)
      if (task.assignedById) {
        sendPushNotification({
          userId: task.assignedById,
          title: `💬 Update from ${currentUser.name}`,
          body: `"${text}"\nTask: ${task.title}`,
          url: `/task/${taskId}`
        }).catch((err) => console.error("Push notification action trigger error:", err));
      } else {
        notifyAdmins({
          taskTitle: task.title,
          employeeName: currentUser.name,
          taskId: task.id,
        }).catch((err) => console.error("Admin notification trigger error:", err));
      }
    }
  };

  return (
    <TaskContext.Provider value={{ 
      tasks: mappedDbTasks, 
      users: mappedDbUsers, 
      currentUser, 
      setCurrentUser: handleSetCurrentUser, 
      addTask, 
      updateTaskStatus,
      addUser,
      addAdminUser,
      updateAdminUser,
      deleteUserAccount,
      editTask,
      deleteTask,
      updateUser,
      logout,
      addTaskUpdate,
      isBackendConnected,
      sendPushNotification,
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
