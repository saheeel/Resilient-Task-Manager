import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { MaterialStatus } from '../lib/taskOptions';
import { calculateNextOccurrence } from '../lib/recurrence';
import { compressImageFile } from '../lib/fileDataUrl';

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
  proofPhotoUrls?: string[];
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
  activeFrom?: string;
  nextOccurrence?: string;
}

interface TaskContextType {
  tasks: Task[];
  users: User[];
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isLoading: boolean;
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
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
  uploadFile: (file: File, onProgress?: (progress: number, stage: string) => void) => Promise<string>;
}

export const TaskContext = createContext<TaskContextType | undefined>(undefined);

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
  const cutoffDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 15);
    return d.toISOString();
  }, []);
  const dbTasksRaw = useQuery(api.tasks.list, { cutoffDate });
  
  const seedUsers = useMutation(api.users.seed);
  const seedTasks = useMutation(api.tasks.seed);

  const dbAddTask = useMutation(api.tasks.create);
  const dbRolloverRecurringTask = useMutation(api.tasks.rolloverRecurringTask);
  const dbUpdateTask = useMutation(api.tasks.update).withOptimisticUpdate(
    (localStore, args) => {
      const { id, ...updates } = args;
      const currentTasks = localStore.getQuery(api.tasks.list, { cutoffDate });
      if (currentTasks !== undefined) {
        localStore.setQuery(api.tasks.list, { cutoffDate }, currentTasks.map((task: any) => {
          if (task._id === id) {
            return { ...task, ...updates };
          }
          return task;
        }));
      }
    }
  );
  const dbRemoveTask = useMutation(api.tasks.remove);

  const dbAddUser = useMutation(api.users.create);
  const dbUpdateUser = useMutation(api.users.update);
  const dbRemoveUser = useMutation(api.users.remove);
  const dbAddTaskUpdate = useMutation(api.taskUpdates.create);
  const syncSuperAdminAllowlist = useMutation(api.users.syncSuperAdminAllowlist);
  // @ts-ignore - files api is generated dynamically by Convex
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  
  const sendPushNotification = useAction(api.pushActions.sendNotification);
  const notifyAdmins = useAction(api.pushActions.notifyAdmins);
  const [cachedUsersRaw, setCachedUsersRaw] = useState<any[] | undefined>(() => readCachedCollection(USERS_CACHE_KEY));
  const [cachedTasksRaw, setCachedTasksRaw] = useState<any[] | undefined>(() => readCachedCollection(TASKS_CACHE_KEY));
  const isBackendConnected = dbUsersRaw !== undefined && dbTasksRaw !== undefined;

  // Trigger Convex Auto-Seeding ONLY if database tables are completely empty
  useEffect(() => {
    if (dbUsersRaw && dbUsersRaw.length === 0) {
      seedUsers().then(() => {
        syncSuperAdminAllowlist();
      });
    }
    if (dbTasksRaw && dbTasksRaw.length === 0) {
      seedTasks();
    }
  }, [dbUsersRaw, dbTasksRaw, seedUsers, seedTasks, syncSuperAdminAllowlist]);

  // Session state for tracking active logged-in user profile
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('rtm_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleSetCurrentUser = (user: User | null) => {
    try {
      if (user) {
        localStorage.setItem('rtm_current_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('rtm_current_user');
      }
    } catch (err) {
      console.warn('Failed to save user to localStorage:', err);
    }
    setCurrentUser(user);
  };

  useEffect(() => {
    if (dbUsersRaw === undefined) return;
    const usersSnapshot = dbUsersRaw as any[];
    setCachedUsersRaw(usersSnapshot);
    try {
      localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(usersSnapshot));
    } catch (err) {
      console.warn('Failed to cache users (quota exceeded?):', err);
    }
  }, [dbUsersRaw]);

  useEffect(() => {
    if (dbTasksRaw === undefined) return;
    const tasksSnapshot = dbTasksRaw as any[];
    setCachedTasksRaw(tasksSnapshot);
    try {
      localStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(tasksSnapshot));
    } catch (err) {
      console.warn('Failed to cache tasks (quota exceeded?):', err);
    }
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
      assignedTo: t.assignedTo || [],
      assignedById: t.assignedById,
      assignedByName: t.assignedByName,
      dueDate: t.dueDate,
      remarks: t.remarks,
      inCharge: t.inCharge,
      materialStatus: t.materialStatus as MaterialStatus | undefined,
      attachments: t.attachments || [],
      completedAt: t.completedAt,
      completionComment: t.completionComment,
      blockReason: t.blockReason,
      proofPhotoUrl: t.proofPhotoUrl,
      proofPhotoUrls: t.proofPhotoUrls || [],
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
      activeFrom: t.activeFrom,
      nextOccurrence: t.nextOccurrence,
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

  const addTask = async (taskData: Omit<Task, 'id'>) => {
    const assignmentMetadata = currentUser && currentUser.role !== 'employee'
      ? {
          assignedById: currentUser.id,
          assignedByName: currentUser.name,
        }
      : {
          assignedById: taskData.assignedById,
          assignedByName: taskData.assignedByName,
        };

    let nextOccur = taskData.nextOccurrence;
    if (taskData.type !== 'one-time' && !nextOccur) {
      nextOccur = calculateNextOccurrence(taskData.type, taskData.recurringDay, taskData.recurringTime, new Date());
    }

    await dbAddTask({
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
      activeFrom: taskData.activeFrom,
      nextOccurrence: nextOccur,
    }).then(() => {
      // Loop through assignees and fire off background Web Push notifications (excluding creator)
      taskData.assignedTo.forEach((userId) => {
        if (currentUser && userId === currentUser.id) return;
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
    const task = mappedDbTasks.find(t => t.id === taskId);
    if (!task) return;

    if (status === 'completed' && task.type !== 'one-time') {
      // It's a recurring task being completed. Change this instance to one-time.
      dbUpdateTask({
        id: taskId as any,
        status,
        type: 'one-time',
        ...details,
      });

      // Spawn the next instance
      const baseDate = task.nextOccurrence ? new Date(task.nextOccurrence) : new Date();
      const nextOccur = calculateNextOccurrence(task.type, task.recurringDay, task.recurringTime, baseDate);
      if (nextOccur) {
        addTask({
          ...task,
          status: 'open',
          activeFrom: task.nextOccurrence || new Date().toISOString(),
          nextOccurrence: nextOccur,
          completedAt: undefined,
          completionComment: undefined,
          proofPhotoUrls: undefined,
          startedAt: undefined,
        });
      }
    } else {
      dbUpdateTask({
        id: taskId as any,
        status,
        ...details,
      });
    }

    // Fire push notification to assigner AND assigned team members when a task is completed (excluding self)
    if (status === 'completed' && currentUser) {
      const completedTask = mappedDbTasks.find(t => t.id === taskId);
      if (completedTask) {
        const recipientIds = new Set<string>();
        if (completedTask.assignedById) recipientIds.add(completedTask.assignedById);
        if (Array.isArray(completedTask.assignedTo)) {
          completedTask.assignedTo.forEach((id: string) => recipientIds.add(id));
        }
        recipientIds.delete(currentUser.id);

        if (recipientIds.size > 0) {
          recipientIds.forEach((userId) => {
            sendPushNotification({
              userId,
              title: "✅ Task Completed",
              body: `${currentUser.name} completed: ${completedTask.title}`,
              url: `/task/${taskId}`,
            }).catch(err => console.error(err));
          });
        } else {
          notifyAdmins({
            taskTitle: completedTask.title,
            employeeName: currentUser.name,
            taskId,
            excludeUserId: currentUser.id,
          }).catch((err: any) => console.error('Admin notification error:', err));
        }
      }
    }

    // Fire push notification when a task issue is reported (excluding self)
    if ((status === 'could_not_complete' || status === 'blocked') && currentUser) {
      const issueTask = mappedDbTasks.find(t => t.id === taskId);
      if (issueTask) {
        if (issueTask.assignedById && issueTask.assignedById !== currentUser.id) {
          sendPushNotification({
            userId: issueTask.assignedById,
            title: "⚠️ Task Issue Reported",
            body: `${currentUser.name} reported an issue: ${issueTask.title}`,
            url: `/task/${taskId}`,
          }).catch(err => console.error(err));
        } else if (!issueTask.assignedById) {
          notifyAdmins({
            taskTitle: issueTask.title,
            employeeName: currentUser.name,
            taskId,
            excludeUserId: currentUser.id,
          }).catch((err: any) => console.error('Admin notification error:', err));
        }
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

  useEffect(() => {
    // Auto-rollover expired recurring tasks
    if (mappedDbTasks) {
      const now = new Date();
      mappedDbTasks.forEach((task) => {
        if (
          task.status === 'open' &&
          task.type !== 'one-time' &&
          task.nextOccurrence &&
          new Date(task.nextOccurrence) < now
        ) {
          const nextNext = calculateNextOccurrence(task.type, task.recurringDay, task.recurringTime, new Date(task.nextOccurrence));
          if (nextNext) {
            dbRolloverRecurringTask({
              id: task.id as any,
              newActiveFrom: task.nextOccurrence,
              newNextOccurrence: nextNext,
            }).catch(console.error);
          }
        }
      });
    }
  }, [currentUser, mappedDbUsers, mappedDbTasks]);

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

    // Fire push notification to both assigner AND assigned team members (excluding self)
    const recipientIds = new Set<string>();
    if (task.assignedById) recipientIds.add(task.assignedById);
    if (Array.isArray(task.assignedTo)) {
      task.assignedTo.forEach((id: string) => recipientIds.add(id));
    }
    recipientIds.delete(currentUser.id);

    if (recipientIds.size > 0) {
      recipientIds.forEach((userId) => {
        sendPushNotification({
          userId,
          title: `💬 Update on: ${task.title}`,
          body: `${currentUser.name}: "${text}"`,
          url: `/task/${taskId}`
        }).catch((err) => console.error("Push notification error:", err));
      });
    } else {
      notifyAdmins({
        taskTitle: task.title,
        employeeName: currentUser.name,
        taskId: task.id,
        excludeUserId: currentUser.id,
      }).catch((err) => console.error("Admin notification trigger error:", err));
    }
  };


  return (
    <TaskContext.Provider value={{ 
      tasks: mappedDbTasks, 
      users: mappedDbUsers, 
      currentUser, 
      setCurrentUser: handleSetCurrentUser, 
      isLoading: dbTasksRaw === undefined && !cachedTasksRaw,
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
      uploadFile: async (file: File, onProgress?: (progress: number, stage: string) => void) => {
        let fileToUpload: Blob | File = file;
        const shouldCompress =
          file.type.startsWith('image/') &&
          file.type !== 'image/gif' &&
          file.type !== 'image/svg+xml';

        if (shouldCompress) {
          try {
            onProgress?.(10, 'compressing');
            fileToUpload = await compressImageFile(file);
            onProgress?.(30, 'compressing');
          } catch (err) {
            console.warn("Image compression fallback to raw file:", err);
          }
        }

        onProgress?.(35, 'preparing');
        const postUrl = await generateUploadUrl();
        onProgress?.(45, 'uploading');

        return new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", postUrl);
          xhr.setRequestHeader("Content-Type", fileToUpload.type || file.type || "image/jpeg");

          if (xhr.upload) {
            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                const networkPercent = (event.loaded / event.total) * 50;
                const totalPercent = Math.round(45 + networkPercent);
                onProgress?.(totalPercent, 'uploading');
              }
            };
          }

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                if (response.storageId) {
                  onProgress?.(100, 'done');
                  resolve(response.storageId);
                } else {
                  reject(new Error("Failed to upload file to Convex Storage: invalid response"));
                }
              } catch (e) {
                reject(new Error("Failed to parse Convex Storage upload response"));
              }
            } else {
              reject(new Error(`Failed to upload file to Convex Storage (HTTP ${xhr.status})`));
            }
          };

          xhr.onerror = () => {
            reject(new Error("Network error during file upload"));
          };

          xhr.onabort = () => {
            reject(new Error("File upload aborted"));
          };

          xhr.send(fileToUpload);
        });
      }
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
