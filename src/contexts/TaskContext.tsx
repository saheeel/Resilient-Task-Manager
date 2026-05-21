import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

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
}

interface TaskContextType {
  tasks: Task[];
  users: User[];
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus, details?: Partial<Task>) => void;
  addUser: (name: string, role: Role, username?: string, password?: string, employeeRole?: string) => User;
  addAdminUser: (name: string, email: string, role?: Extract<Role, 'admin' | 'superadmin'>) => Promise<void>;
  updateAdminUser: (userId: string, updates: { name: string; password?: string }) => Promise<void>;
  editTask: (taskId: string, updatedFields: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  updateUser: (userId: string, updatedFields: Partial<User>) => void;
  logout: () => void;
  isBackendConnected: boolean;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const isAdminRole = (role?: Role | string | null) => role === 'admin' || role === 'superadmin' || role === 'manager';

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
  const syncSuperAdminAllowlist = useMutation(api.users.syncSuperAdminAllowlist);
  
  const sendPushNotification = useAction(api.pushActions.sendNotification);
  const notifyAdmins = useAction(api.pushActions.notifyAdmins);

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

  // Map Convex database users to type-safe User objects
  const mappedDbUsers = useMemo(() => {
    if (!dbUsersRaw) return [];
    return (dbUsersRaw as any[]).map((u: any) => ({
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
  }, [dbUsersRaw]);

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
    if (!dbTasksRaw) return [];
    return (dbTasksRaw as any[]).map((t: any) => ({
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
    }));
  }, [dbTasksRaw]);

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
      attachments: taskData.attachments,
      recurringDay: taskData.recurringDay,
      recurringTime: taskData.recurringTime,
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
    dbAddUser({
      name,
      role,
      username,
      password,
      employeeRole,
      authType: 'local',
    });
    return { id: tempId, name, role, username, password, employeeRole, authType: 'local' };
  };

  const addAdminUser = async (name: string, email: string, role: Extract<Role, 'admin' | 'superadmin'> = 'admin') => {
    await dbAddUser({
      name,
      role,
      email,
      password: '1234',
      authType: 'local',
    });
  };

  const updateAdminUser = async (userId: string, updates: { name: string; password?: string }) => {
    const targetUser = mappedDbUsers.find((user) => user.id === userId);

    if (!targetUser) {
      throw new Error('Admin account not found.');
    }

    await dbUpdateUser({
      id: userId as any,
      name: updates.name,
      password: updates.password?.trim() || targetUser.password,
    });
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

  const logout = () => {
    handleSetCurrentUser(null);
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
      editTask,
      deleteTask,
      updateUser,
      logout,
      isBackendConnected: true
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
