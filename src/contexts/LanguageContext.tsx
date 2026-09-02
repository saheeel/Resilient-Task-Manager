import React, { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Priority, Role, TaskStatus, TaskType } from './TaskContext';

export type Language = 'en' | 'de';

type TranslationLeaf = string;
type TranslationTree = {
  [key: string]: TranslationLeaf | TranslationTree;
};

interface TranslateParams {
  [key: string]: string | number;
}

interface LanguageContextType {
  language: Language;
  locale: string;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: TranslateParams) => string;
  formatDate: (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatDateTime: (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
  taskStatusLabel: (status: TaskStatus) => string;
  priorityLabel: (priority: Priority) => string;
  taskTypeLabel: (type: TaskType) => string;
  roleLabel: (role: Role) => string;
  weekdayLabel: (day: string) => string;
  shortWeekdayLabel: (day: string) => string;
  relativeDayLabel: (date: Date, today: Date) => string | null;
  monthDayOrdinalLabel: (day: string) => string;
}

const translations: Record<Language, TranslationTree> = {
  en: {
    app: {
      brand: 'Resilient Operations',
      workspace: 'Resilient Workspace',
      myWorkspace: 'My Workspace',
      adminDashboard: 'Admin Dashboard',
      currentAssignments: 'Current Assignments',
      upcomingWork: 'Upcoming Work',
      blockedTasks: 'Blocked Tasks',
      completedHistory: 'Completed History',
      systemSettings: 'System Settings',
      language: 'Language',
      english: 'English',
      german: 'German',
    },
    common: {
      back: 'Back',
      goBack: 'Go Back',
      cancel: 'Cancel',
      saveChanges: 'Save Changes',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      done: 'Done',
      active: 'Active',
      upcoming: 'Upcoming',
      noData: 'No data available.',
      yes: 'Yes',
      no: 'No',
      optional: 'Optional',
      today: 'Today',
      tomorrow: 'Tomorrow',
      yesterday: 'Yesterday',
      assigned: 'Assigned',
      assignedBy: 'Assigned by',
      due: 'Due',
      dueDate: 'Due Date',
      description: 'Description',
      comments: 'Comments',
      instructions: 'Instructions',
      remarks: 'Remarks / Instructions',
      priority: 'Priority',
      status: 'Status',
      type: 'Type',
      actions: 'Actions',
      name: 'Name',
      username: 'Username',
      password: 'Password',
      role: 'Role',
      employee: 'Employee',
      admin: 'Admin',
      superadmin: 'Super Admin',
      manager: 'Manager',
      unassigned: 'Unassigned',
      notRecorded: 'Not recorded',
      notStarted: 'Not started',
      noCommentsRecorded: 'No comments recorded',
      timeTaken: 'Time taken',
      reason: 'Reason',
      note: 'Note',
      remove: 'Remove',
      uploadFile: 'Upload File',
      changeFile: 'Change File',
      addMoreFiles: 'Add More Files',
      existingFiles: 'Existing Files',
      noTeamMembers: 'No team members registered yet.',
      taskHint: 'Open this task to see the next steps and complete it.',
      signOut: 'Sign out',
      confirmSignOut: 'Are you sure you want to log out?',
      confirmDeleteTask: 'Are you sure you want to delete this task?',
      selectLanguage: 'Select language',
      hide: 'Hide',
      show: 'Show',
      historyTomorrowNote: 'Past completed tasks move to the History tab tomorrow.',
      enableAlerts: 'Enable alerts',
      actualTimeTaken: 'Actual Time Taken',
      actualTimeTakenHint: '(Optional e.g. "45 mins", "2 hours")',
      pdfDocument: 'PDF Document',
      viewPdfDocument: 'View PDF Document',
      followUpPrefix: 'Follow-up: ',
      excelTable: 'Table',
      groupedCards: 'Cards',
      searchAllTasks: 'Search all tasks...',
      all: 'All',
    },
    nav: {
      dashboard: 'My Tasks',
      adminDashboard: 'Dashboard',
      allTasks: 'All Tasks',
      history: 'History',
      calendar: 'Calendar',
      settings: 'Settings',
    },
    calendar: {
      title: 'Calendar',
      subtitle: 'See upcoming work in a weekly scheduling view.',
      weeklyOverview: 'Weekly Overview',
      weeklyOverviewSubtitle: 'A faster way to scan this week, spot overlaps, and open tasks directly.',
      openFullCalendar: 'Open full calendar',
      scheduledThisWeek: 'Scheduled tasks',
    },
    notifications: {
      title: 'Notifications',
      allCaughtUp: "You're all caught up!",
      markAllRead: 'Mark all read',
      clearAll: 'Clear all',
      startReminder: 'Starts in 15m',
      dueReminder: 'Due in 15m',
      sameDayReminder: 'Scheduled Today',
      taskAssigned: 'New Task',
      taskCompleted: 'Completed',
      taskIssue: 'Issue Reported',
    },
    login: {
      subtitle: 'Please enter your credentials to access your dashboard.',
      invalidCredentials: 'Invalid username or password.',
      usernamePlaceholder: 'Enter username',
      passwordPlaceholder: 'Enter password',
      signIn: 'Sign In',
      authenticating: 'Authenticating...',
    },
    roles: {
      employee: 'Employee',
      admin: 'Admin',
      superadmin: 'Super Admin',
      manager: 'Manager',
    },
    status: {
      open: 'Open',
      in_progress: 'In Progress',
      completed: 'Completed',
      could_not_complete: 'Incomplete',
      blocked: 'Blocked',
    },
    priority: {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
    },
    taskType: {
      'one-time': 'One-Time',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
    },
    weekdays: {
      Monday: 'Monday',
      Tuesday: 'Tuesday',
      Wednesday: 'Wednesday',
      Thursday: 'Thursday',
      Friday: 'Friday',
      Saturday: 'Saturday',
      Sunday: 'Sunday',
    },
    weekdaysShort: {
      Monday: 'Mon',
      Tuesday: 'Tue',
      Wednesday: 'Wed',
      Thursday: 'Thu',
      Friday: 'Fri',
      Saturday: 'Sat',
      Sunday: 'Sun',
    },
    employeeDashboard: {
      welcome: 'Welcome back, {{name}}. Here is your active work.',
      sortMyWork: 'Sort by',
      originalOrder: 'Original order',
      priorityFirst: 'Priority first',
      dueDateSoon: 'Due date soon',
      byEmployee: 'Group by employee',
      allCaughtUp: 'All caught up!',
      noActiveTasks: 'No active tasks assigned to you right now.',
      issuesEmpty: 'No blocked tasks right now.',
      noUpcomingTasks: 'No upcoming work scheduled yet.',
      todayCompletedTitle: "Today's completions",
      taskDescriptionFallback: 'Tap in to see the details and finish the task.',
      dueOn: 'Due {{date}}',
    },
    manageTasks: {
      welcome: 'Welcome back, {{name}}',
      newTask: 'New Task',
      recurringSchedules: 'Recurring Tasks',
      recurringSummary: '{{running}} of {{total}} recurring tasks are currently running.',
      runningNow: 'running now',
      running: 'Running',
      paused: 'Paused',
      pauseRecurring: 'Pause',
      searchPlaceholder: 'Search tasks, descriptions, creators...',
      resumeRecurring: 'Resume',
      stopRecurring: 'Stop recurring',
      everyDay: 'Every day',
      everyDayAt: 'Every day at',
      noScheduleSet: 'No schedule set',
      completedTasks: 'Completed Tasks',
      attentionRequired: 'Attention Required',
      noIssues: 'No blocked tasks or issues.',
      activeTasks: 'Active Tasks',
      noActiveTasks: 'No active tasks right now.',
      recentlyCompleted: 'Recently Completed',
      recentTasksNote: 'Only the 5 most recently completed tasks are shown here. The rest are moved to history.',
      noCompletedTasks: 'No completed tasks yet.',
      taskTitle: 'Task',
      assignedTeamMembers: 'Assigned to',
      completedBy: 'Completed By',
      completedAt: 'Completed At',
      duration: 'Duration',
      editTask: 'Edit',
      deleteTask: 'Delete',
      markedIncompleteAt: 'Marked Incomplete At',
      assignedAt: 'Assigned At',
      noReasonProvided: 'No reason provided',
      reopenTask: 'Reactivate Task',
    },
    adminHistory: {
      title: 'Task History',
      subtitle: 'Review completed and incomplete tasks across the team.',
      empty: 'No task history yet.',
      timeline: 'Last update',
      reopen: 'Reactivate',
      filterLabel: 'Filter by date',
      clearFilter: 'Clear',
    },
    settings: {
      subtitle: 'Manage your team and operational preferences.',
      themeTitle: 'Appearance',
      themeSubtitle: 'Choose a theme or let the app follow your device setting.',
      themeSystem: 'System',
      themeLight: 'Light',
      themeDark: 'Dark',
      themeCurrentMode: 'Currently using {{mode}} mode.',
      addEmployee: 'Add Employee',
      teamDirectory: 'Team Directory',
      notSet: 'Not set',
      noTeamMembersFound: 'No team members found.',
      viewProfileHistory: 'View profile and work history',
      editEmployeeDetails: 'Edit employee details',
      alertsTitle: 'Notifications',
      alertsSubtitle: 'Enable background alerts for this installed app on this device.',
      alertsEnabled: 'Alerts are enabled on this device.',
      alertsUnavailable: 'Notifications are not supported on this device.',
      selfAssignmentEnabled: 'Self-Assignment Enabled (You can assign tasks to yourself)',
      devicePushTitle: 'Notifications',
      devicePushDiana: "(Diana's Device Mute)",
      devicePushSubtitlePlain: 'Turn ON or mute task alerts on this specific device without affecting other team members.',
    },
    addEmployee: {
      backToDashboard: 'Back to Dashboard',
      title: 'Add New Employee',
      subtitle: 'Create credentials for a new team member.',
      success: 'Employee {{name}} added successfully!',
      fullName: 'Full Name',
      fullNamePlaceholder: 'e.g. Jane Doe',
      usernamePlaceholder: 'e.g. janedoe',
      securePasswordPlaceholder: 'Enter a secure password',
      employeeRoleTitle: 'Employee Role / Title',
      employeeRolePlaceholder: 'e.g. Front Desk, Cleaning Staff, Security',
      registerEmployee: 'Register Employee',
      fillAllFields: 'Please fill out all fields.',
    },
    editEmployee: {
      employeeNotFound: 'Employee not found.',
      backToSettings: 'Back to Settings',
      title: 'Edit Employee Details',
      subtitle: 'Update professional details and credentials for {{name}}.',
      success: 'Employee details updated successfully!',
      saveChanges: 'Save Changes',
      fillRequiredFields: 'Please fill out all required fields.',
    },
    employeeHistory: {
      accessDenied: 'Access denied. Only managers can view team history profiles.',
      employeeNotFound: 'Employee profile not found.',
      backToTeamSettings: 'Back to Team Settings',
      generalStaff: 'General Staff',
      usernameLabel: 'Username',
      modifyEmployeeDetails: 'Modify Employee Details',
      totalTasks: 'Total Tasks',
      completed: 'Completed',
      incompleteIssues: 'Incomplete / Issues',
      active: 'Active',
      workHistory: 'Work History & Activity Logs',
      taskDetail: 'Task Detail',
      timelineDetails: 'Timeline Details',
      timeSpent: 'Time Spent',
      commentsExplanations: 'Comments & Explanations',
      scheduleSuffix: 'schedule',
      assigned: 'Assigned',
      started: 'Started',
      finished: 'Finished',
      reported: 'Reported',
      activeTimer: 'Active Timer',
      noAssignedTasks: 'This employee has not been assigned any tasks yet.',
    },
    completedHistory: {
      subtitle: "Browse your past completed tasks by date. Today's completions appear on your dashboard.",
      emptyTitle: 'No past completed tasks yet',
      emptySubtitle: 'Tasks you complete will appear here the next day, grouped by date.',
      tasksCount: '{{count}} task',
      tasksCount_plural: '{{count}} tasks',
      totalCompletedBeforeToday: 'Total completed (before today)',
      taskTypeSuffix: 'task',
    },
    createTask: {
      backToDashboard: 'Back to Dashboard',
      title: 'Create New Task',
      taskTitle: 'Task Title',
      taskTitlePlaceholder: 'e.g. Set up 20 chairs in Open Space',
      descriptionOptional: 'Description (Optional)',
      descriptionPlaceholder: 'Brief overview of the task...',
      remarksOptional: 'Remarks / Instructions (Optional)',
      remarksPlaceholder: 'Any special remarks or step-by-step instructions...',
      instructionsOptional: 'Instructions (Optional)',
      instructionsPlaceholder: 'Add task instructions or step-by-step notes...',
      inChargeOptional: 'Person In Charge (Optional)',
      selectInCharge: 'Select person in charge',
      materialStatusOptional: 'Materials Status (Optional)',
      clearMaterialStatus: 'Clear materials status',
      materialCommentsOptional: 'Material Comments (Optional)',
      materialCommentsPlaceholder: 'Add a note about the material status...',
      commentsOptional: 'Comments (Optional)',
      commentsPlaceholder: 'Add a short comment or context for this task...',
      taskType: 'Task Type',
      priority: 'Priority',
      dueDateTime: 'Due Date & Time',
      startDateTime: 'Start Date & Time',
      setDate: 'Set Date',
      dailyRecurring: 'Daily Recurring - Select Time',
      weeklyRecurring: 'Weekly Recurring - Select Days & Time',
      monthlyRecurring: 'Monthly Recurring - Select Day & Time',
      timeEachDay: 'Time each day',
      repeatsEveryDayAt: 'Repeats every day at {{time}}.',
      daysOfWeek: 'Days of the Week',
      selectMultiple: '(select multiple)',
      timeOnThoseDays: 'Time on those days',
      repeatsEveryDaysAt: 'Repeats every {{days}} at {{time}}.',
      dayOfMonth: 'Day of the Month',
      timeOnThatDay: 'Time on that day',
      repeatsMonthlyAt: 'Repeats on the {{day}} of each month at {{time}}.',
      attachReference: 'Attach Photo / Reference',
      assignTo: 'Assign To',
      addTask: 'Add Task',
      fillTitleAndAssignee: 'Please enter a title and select at least one assignee.',
      createFollowUp: 'Create Follow-up Task',
      linkingFollowUp: 'Linking follow-up task to previous task:',
    },
    editTask: {
      taskNotFound: 'Task not found.',
      cancelEdit: 'Cancel Edit',
      title: 'Edit Task',
    },
    taskDetail: {
      selectColleague: '-- Select a colleague --',
      taskNotFound: 'Task not found.',
      noPermission: "You don't have permission to view this task.",
      editTask: 'Edit',
      deleteTask: 'Delete',
      assignedTo: 'Assigned To',
      inCharge: 'In Charge',
      materialStatus: 'Materials',
      assignedAt: 'Assigned At',
      incompleteAt: 'Incomplete At',
      startedAt: 'Started At',
      completedAt: 'Completed At',
      completionPhotoProof: 'Completion Photo Proof',
      attachmentsReference: 'Attachments & Reference Files',
      referenceFile: 'Reference File {{index}}',
      legacyImageUnavailable: 'This photo came from an older upload and needs to be re-added.',
      attachedFile: 'Attached File',
      legacyImageShort: 'Re-upload',
      completionActions: 'Completion Actions',
      addCommentOptional: 'Add a comment (optional)',
      commentPlaceholder: 'e.g. Needs more supplies tomorrow...',
      addCompletionPhoto: 'Add Completion Photo',
      removePhoto: 'Remove Photo',
      startTask: 'Start Task',
      markCompleted: 'Mark as Completed',
      cannotComplete: 'Cannot Complete',
      explainIssue: 'Please explain why in the comment box above.',
      submitIssue: 'Submit Issue',
      provideReason: 'Please provide a reason before marking as incomplete or blocked.',
      taskTypePriority: '{{priority}} priority',
      reopenTask: 'Reactivate Task',
      updatesTitle: 'Progress Updates & Comments',
      updatesSubtitle: 'Post updates, feedback, or ongoing status remarks.',
      sendUpdate: 'Send Update',
      updatePlaceholder: 'Describe the progress made or leave a comment...',
      updatePhoto: 'Attach Photo',
      onlyInProgress: 'Updates can only be sent once the task has started.',
      noUpdates: 'No progress updates or comments posted yet.',
      posting: 'Sending...',
      uploadingMedia: 'Uploading file...',
      compressingImage: 'Optimizing image...',
      preparingUpload: 'Preparing upload server...',
      uploadProgress: 'Uploading {{fileName}} ({{percent}}%)',
      uploadInProgress: 'Upload in progress...',
      doNotCloseWindow: 'Please stay on this page until the upload completes.',
      createFollowUp: 'Create Follow-up Task',
      followUpToPrevious: 'Follow-up to previous task',
    },
    materials: {
      available: 'Materials are available',
      to_purchase: 'Materials need to be purchased',
      ordered_pending_delivery: 'Materials ordered, waiting for delivery',
      clarification_needed: 'Need to clarify which materials are required',
    },
  },
  de: {
    app: {
      brand: 'Resilient Operations',
      workspace: 'Resilient Workspace',
      myWorkspace: 'Mein Arbeitsbereich',
      adminDashboard: 'Admin-Dashboard',
      currentAssignments: 'Aktuelle Aufgaben',
      upcomingWork: 'Kommende Aufgaben',
      blockedTasks: 'Blockierte Aufgaben',
      completedHistory: 'Abgeschlossene Aufgaben',
      systemSettings: 'Systemeinstellungen',
      language: 'Sprache',
      english: 'Englisch',
      german: 'Deutsch',
    },
    common: {
      back: 'Zurück',
      goBack: 'Zurück',
      cancel: 'Abbrechen',
      saveChanges: 'Änderungen speichern',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      add: 'Hinzufügen',
      done: 'Erledigt',
      active: 'Aktiv',
      upcoming: 'Bevorstehend',
      noData: 'Keine Daten verfügbar.',
      yes: 'Ja',
      no: 'Nein',
      optional: 'Optional',
      today: 'Heute',
      tomorrow: 'Morgen',
      yesterday: 'Gestern',
      assigned: 'Zugewiesen',
      assignedBy: 'Zugewiesen von',
      due: 'Fällig',
      dueDate: 'Fälligkeit',
      description: 'Beschreibung',
      comments: 'Kommentare',
      instructions: 'Anweisungen',
      remarks: 'Hinweise / Anweisungen',
      priority: 'Priorität',
      status: 'Status',
      type: 'Typ',
      actions: 'Aktionen',
      name: 'Name',
      username: 'Benutzername',
      password: 'Passwort',
      role: 'Rolle',
      employee: 'Mitarbeiter',
      admin: 'Admin',
      superadmin: 'Superadmin',
      manager: 'Manager',
      unassigned: 'Nicht zugewiesen',
      notRecorded: 'Nicht erfasst',
      notStarted: 'Nicht gestartet',
      noCommentsRecorded: 'Keine Kommentare vorhanden',
      timeTaken: 'Benötigte Zeit',
      reason: 'Grund',
      note: 'Notiz',
      remove: 'Entfernen',
      uploadFile: 'Datei hochladen',
      changeFile: 'Datei ändern',
      addMoreFiles: 'Weitere Dateien',
      existingFiles: 'Vorhandene Dateien',
      noTeamMembers: 'Noch keine Teammitglieder angelegt.',
      taskHint: 'Öffne diese Aufgabe, um die nächsten Schritte zu sehen.',
      signOut: 'Abmelden',
      confirmSignOut: 'Möchtest du dich wirklich abmelden?',
      confirmDeleteTask: 'Möchtest du diese Aufgabe wirklich löschen?',
      selectLanguage: 'Sprache auswählen',
      hide: 'Ausblenden',
      show: 'Anzeigen',
      historyTomorrowNote: 'Frühere erledigte Aufgaben wechseln morgen in den Verlauf.',
      enableAlerts: 'Benachrichtigungen aktivieren',
      actualTimeTaken: 'Tatsächlich benötigte Zeit',
      actualTimeTakenHint: '(Optional, z.B. "45 Min", "2 Std")',
      pdfDocument: 'PDF-Dokument',
      viewPdfDocument: 'PDF-Dokument ansehen',
      followUpPrefix: 'Folgeaufgabe: ',
      excelTable: 'Tabelle',
      groupedCards: 'Karten',
      searchAllTasks: 'Alle Aufgaben durchsuchen...',
      all: 'Alle',
    },
    nav: {
      dashboard: 'Meine Aufgaben',
      adminDashboard: 'Übersicht',
      allTasks: 'Alle Aufgaben',
      history: 'Verlauf',
      calendar: 'Kalender',
      settings: 'Einstellungen',
    },
    calendar: {
      title: 'Kalender',
      subtitle: 'Sieh anstehende Aufgaben in einer wöchentlichen Planungsansicht.',
      weeklyOverview: 'Wochenübersicht',
      weeklyOverviewSubtitle: 'Ein schneller Überblick über diese Woche, Überschneidungen und direkte Sprünge in Aufgaben.',
      openFullCalendar: 'Vollen Kalender öffnen',
      scheduledThisWeek: 'Geplante Aufgaben',
    },
    notifications: {
      title: 'Benachrichtigungen',
      allCaughtUp: 'Alles erledigt!',
      markAllRead: 'Alle als gelesen markieren',
      clearAll: 'Alle löschen',
      startReminder: 'Startet in 15 Min.',
      dueReminder: 'Fällig in 15 Min.',
      sameDayReminder: 'Heute geplant',
      taskAssigned: 'Neue Aufgabe',
      taskCompleted: 'Erledigt',
      taskIssue: 'Problem gemeldet',
    },
    login: {
      subtitle: 'Bitte gib deine Zugangsdaten ein, um dein Dashboard zu öffnen.',
      invalidCredentials: 'Benutzername oder Passwort ist falsch.',
      usernamePlaceholder: 'Benutzername eingeben',
      passwordPlaceholder: 'Passwort eingeben',
      signIn: 'Anmelden',
      authenticating: 'Anmeldung läuft...',
    },
    roles: {
      employee: 'Mitarbeiter',
      admin: 'Admin',
      superadmin: 'Superadmin',
      manager: 'Manager',
    },
    status: {
      open: 'Offen',
      in_progress: 'In Arbeit',
      completed: 'Erledigt',
      could_not_complete: 'Unvollständig',
      blocked: 'Blockiert',
    },
    priority: {
      low: 'Niedrig',
      medium: 'Mittel',
      high: 'Hoch',
    },
    taskType: {
      'one-time': 'Einmalig',
      daily: 'Täglich',
      weekly: 'Wöchentlich',
      monthly: 'Monatlich',
    },
    weekdays: {
      Monday: 'Montag',
      Tuesday: 'Dienstag',
      Wednesday: 'Mittwoch',
      Thursday: 'Donnerstag',
      Friday: 'Freitag',
      Saturday: 'Samstag',
      Sunday: 'Sonntag',
    },
    weekdaysShort: {
      Monday: 'Mo',
      Tuesday: 'Di',
      Wednesday: 'Mi',
      Thursday: 'Do',
      Friday: 'Fr',
      Saturday: 'Sa',
      Sunday: 'So',
    },
    employeeDashboard: {
      welcome: 'Willkommen zurück, {{name}}. Hier ist deine aktuelle Arbeit.',
      sortMyWork: 'Meine Aufgaben sortieren',
      originalOrder: 'Ursprüngliche Reihenfolge',
      priorityFirst: 'Priorität zuerst',
      dueDateSoon: 'Fälligkeitsdatum bald',
      byEmployee: 'Nach Mitarbeiter gruppieren',
      allCaughtUp: 'Alles erledigt!',
      noActiveTasks: 'Im Moment sind dir keine aktiven Aufgaben zugewiesen.',
      issuesEmpty: 'Zurzeit gibt es keine blockierten Aufgaben.',
      noUpcomingTasks: 'Noch keine kommenden Aufgaben geplant.',
      todayCompletedTitle: 'Heute erledigt',
      taskDescriptionFallback: 'Öffne die Aufgabe, um Details zu sehen und sie abzuschließen.',
      dueOn: 'Fällig {{date}}',
    },
    manageTasks: {
      welcome: 'Willkommen zurück, {{name}}',
      newTask: 'Neue Aufgabe',
      recurringSchedules: 'Wiederkehrende Aufgaben',
      recurringSummary: '{{running}} von {{total}} wiederkehrenden Aufgaben sind aktuell aktiv.',
      runningNow: 'aktiv',
      running: 'Aktiv',
      paused: 'Pausiert',
      pauseRecurring: 'Pausieren',
      searchPlaceholder: 'Aufgaben, Beschreibungen, Ersteller durchsuchen...',
      resumeRecurring: 'Fortsetzen',
      stopRecurring: 'Wiederholung beenden',
      everyDay: 'Jeden Tag',
      everyDayAt: 'Jeden Tag um',
      noScheduleSet: 'Kein Plan hinterlegt',
      completedTasks: 'Erledigte Aufgaben',
      attentionRequired: 'Aufmerksamkeit erforderlich',
      noIssues: 'Keine blockierten Aufgaben oder Probleme.',
      activeTasks: 'Aktive Aufgaben',
      noActiveTasks: 'Zurzeit gibt es keine aktiven Aufgaben.',
      recentlyCompleted: 'Zuletzt erledigt',
      recentTasksNote: 'Hier werden nur die 5 zuletzt erledigten Aufgaben angezeigt. Der Rest wird in den Verlauf verschoben.',
      noCompletedTasks: 'Noch keine erledigten Aufgaben.',
      taskTitle: 'Aufgabe',
      assignedTeamMembers: 'Zugewiesene Teammitglieder',
      completedBy: 'Erledigt von',
      completedAt: 'Erledigt am',
      duration: 'Dauer',
      editTask: 'Bearbeiten',
      deleteTask: 'Löschen',
      markedIncompleteAt: 'Als unvollständig markiert am',
      assignedAt: 'Zugewiesen am',
      noReasonProvided: 'Kein Grund angegeben',
      reopenTask: 'Aufgabe reaktivieren',
    },
    adminHistory: {
      title: 'Aufgabenverlauf',
      subtitle: 'Sieh dir erledigte und unvollständige Aufgaben im Team an.',
      empty: 'Noch kein Aufgabenverlauf vorhanden.',
      timeline: 'Letzte Änderung',
      reopen: 'Reaktivieren',
      filterLabel: 'Nach Datum filtern',
      clearFilter: 'Zurücksetzen',
    },
    settings: {
      subtitle: 'Verwalte dein Team und operative Einstellungen.',
      themeTitle: 'Darstellung',
      themeSubtitle: 'Wähle ein Design oder nutze automatisch die Geräteeinstellung.',
      themeSystem: 'System',
      themeLight: 'Hell',
      themeDark: 'Dunkel',
      themeCurrentMode: 'Aktuell wird der {{mode}}-Modus verwendet.',
      addEmployee: 'Mitarbeiter hinzufügen',
      teamDirectory: 'Teamübersicht',
      notSet: 'Nicht gesetzt',
      noTeamMembersFound: 'Keine Teammitglieder gefunden.',
      viewProfileHistory: 'Profil und Verlauf anzeigen',
      editEmployeeDetails: 'Mitarbeiter bearbeiten',
      alertsTitle: 'Benachrichtigungen',
      alertsSubtitle: 'Aktiviere Hintergrundbenachrichtigungen für diese installierte App auf diesem Gerät.',
      alertsEnabled: 'Benachrichtigungen sind auf diesem Gerät aktiviert.',
      alertsUnavailable: 'Benachrichtigungen werden auf diesem Gerät nicht unterstützt.',
      selfAssignmentEnabled: 'Selbstzuweisung aktiviert (Du kannst dir selbst Aufgaben zuweisen)',
      devicePushTitle: 'Benachrichtigungen',
      devicePushDiana: "(Dianas Gerät stummgeschaltet)",
      devicePushSubtitlePlain: 'Aufgabenbenachrichtigungen auf diesem speziellen Gerät aktivieren oder stumm schalten, ohne andere Teammitglieder zu beeinflussen.',
    },
    addEmployee: {
      backToDashboard: 'Zurück zum Dashboard',
      title: 'Neuen Mitarbeiter anlegen',
      subtitle: 'Erstelle Zugangsdaten für ein neues Teammitglied.',
      success: 'Mitarbeiter {{name}} wurde erfolgreich angelegt!',
      fullName: 'Vollständiger Name',
      fullNamePlaceholder: 'z. B. Jane Doe',
      usernamePlaceholder: 'z. B. janedoe',
      securePasswordPlaceholder: 'Sicheres Passwort eingeben',
      employeeRoleTitle: 'Rolle / Titel des Mitarbeiters',
      employeeRolePlaceholder: 'z. B. Empfang, Reinigung, Sicherheit',
      registerEmployee: 'Mitarbeiter registrieren',
      fillAllFields: 'Bitte alle Felder ausfüllen.',
    },
    editEmployee: {
      employeeNotFound: 'Mitarbeiter wurde nicht gefunden.',
      backToSettings: 'Zurück zu den Einstellungen',
      title: 'Mitarbeiterdaten bearbeiten',
      subtitle: 'Aktualisiere die Zugangsdaten und Details für {{name}}.',
      success: 'Die Mitarbeiterdaten wurden erfolgreich aktualisiert!',
      saveChanges: 'Änderungen speichern',
      fillRequiredFields: 'Bitte alle Pflichtfelder ausfüllen.',
    },
    employeeHistory: {
      accessDenied: 'Zugriff verweigert. Nur Manager dürfen Teamverläufe ansehen.',
      employeeNotFound: 'Mitarbeiterprofil wurde nicht gefunden.',
      backToTeamSettings: 'Zurück zu den Teameinstellungen',
      generalStaff: 'Allgemeines Personal',
      usernameLabel: 'Benutzername',
      modifyEmployeeDetails: 'Mitarbeiterdaten bearbeiten',
      totalTasks: 'Aufgaben gesamt',
      completed: 'Erledigt',
      incompleteIssues: 'Unvollständig / Probleme',
      active: 'Aktiv',
      workHistory: 'Arbeitsverlauf und Aktivität',
      taskDetail: 'Aufgabendetail',
      timelineDetails: 'Zeitliche Details',
      timeSpent: 'Zeitaufwand',
      commentsExplanations: 'Kommentare und Erklärungen',
      scheduleSuffix: 'Rhythmus',
      assigned: 'Zugewiesen',
      started: 'Gestartet',
      finished: 'Beendet',
      reported: 'Gemeldet',
      activeTimer: 'Aktiver Timer',
      noAssignedTasks: 'Diesem Mitarbeiter wurden noch keine Aufgaben zugewiesen.',
    },
    completedHistory: {
      subtitle: 'Sieh dir deine früheren erledigten Aufgaben nach Datum sortiert an. Die heutigen Abschlüsse bleiben im Dashboard.',
      emptyTitle: 'Noch keine früheren erledigten Aufgaben',
      emptySubtitle: 'Erledigte Aufgaben erscheinen am nächsten Tag hier, gruppiert nach Datum.',
      tasksCount: '{{count}} Aufgabe',
      tasksCount_plural: '{{count}} Aufgaben',
      totalCompletedBeforeToday: 'Insgesamt erledigt (vor heute)',
      taskTypeSuffix: 'Aufgabe',
    },
    createTask: {
      backToDashboard: 'Zurück zum Dashboard',
      title: 'Neue Aufgabe erstellen',
      taskTitle: 'Aufgabentitel',
      taskTitlePlaceholder: 'z. B. 20 Stühle im offenen Bereich aufstellen',
      descriptionOptional: 'Beschreibung (Optional)',
      descriptionPlaceholder: 'Kurze Zusammenfassung der Aufgabe...',
      remarksOptional: 'Hinweise / Anweisungen (Optional)',
      remarksPlaceholder: 'Besondere Hinweise oder kurze Schritte...',
      instructionsOptional: 'Anweisungen (Optional)',
      instructionsPlaceholder: 'Füge Anweisungen oder kurze Schritte hinzu...',
      inChargeOptional: 'Verantwortliche Person (Optional)',
      selectInCharge: 'Verantwortliche Person auswählen',
      materialStatusOptional: 'Materialstatus (Optional)',
      clearMaterialStatus: 'Materialstatus löschen',
      materialCommentsOptional: 'Kommentar zum Materialstatus (Optional)',
      materialCommentsPlaceholder: 'Füge eine Notiz zum Materialstatus hinzu...',
      commentsOptional: 'Kommentare (Optional)',
      commentsPlaceholder: 'Kurzer Kommentar oder zusätzlicher Kontext zur Aufgabe...',
      taskType: 'Aufgabentyp',
      priority: 'Priorität',
      dueDateTime: 'Fälligkeit und Uhrzeit',
      startDateTime: 'Startdatum und Uhrzeit',
      setDate: 'Datum setzen',
      dailyRecurring: 'Tägliche Wiederholung - Uhrzeit auswählen',
      weeklyRecurring: 'Wöchentliche Wiederholung - Tage und Uhrzeit',
      monthlyRecurring: 'Monatliche Wiederholung - Tag und Uhrzeit',
      timeEachDay: 'Uhrzeit pro Tag',
      repeatsEveryDayAt: 'Wiederholt sich jeden Tag um {{time}}.',
      daysOfWeek: 'Wochentage',
      selectMultiple: '(mehrfach auswählen)',
      timeOnThoseDays: 'Uhrzeit an diesen Tagen',
      repeatsEveryDaysAt: 'Wiederholt sich jeden {{days}} um {{time}}.',
      dayOfMonth: 'Tag des Monats',
      timeOnThatDay: 'Uhrzeit an diesem Tag',
      repeatsMonthlyAt: 'Wiederholt sich am {{day}} jedes Monats um {{time}}.',
      attachReference: 'Foto / Referenz anhängen',
      assignTo: 'Zuweisen an',
      addTask: 'Aufgabe hinzufügen',
      fillTitleAndAssignee: 'Bitte einen Titel eingeben und mindestens eine Person auswählen.',
      createFollowUp: 'Folgeaufgabe erstellen',
      linkingFollowUp: 'Folgeaufgabe wird verknüpft mit vorheriger Aufgabe:',
    },
    editTask: {
      taskNotFound: 'Aufgabe wurde nicht gefunden.',
      cancelEdit: 'Bearbeiten abbrechen',
      title: 'Aufgabe bearbeiten',
    },
    taskDetail: {
      selectColleague: '-- Kollegen auswählen --',
      taskNotFound: 'Aufgabe wurde nicht gefunden.',
      noPermission: 'Du hast keine Berechtigung, diese Aufgabe anzusehen.',
      editTask: 'Bearbeiten',
      deleteTask: 'Löschen',
      assignedTo: 'Zugewiesen an',
      inCharge: 'Verantwortlich',
      materialStatus: 'Materialien',
      assignedAt: 'Zugewiesen am',
      incompleteAt: 'Unvollständig seit',
      startedAt: 'Gestartet am',
      completedAt: 'Erledigt am',
      completionPhotoProof: 'Fotobeleg zur Erledigung',
      attachmentsReference: 'Anhänge und Referenzen',
      referenceFile: 'Referenzdatei {{index}}',
      legacyImageUnavailable: 'Dieses Foto stammt aus einem älteren Upload und muss erneut hochgeladen werden.',
      attachedFile: 'Angehängte Datei',
      legacyImageShort: 'Neu hochladen',
      completionActions: 'Aktionen zum Abschluss',
      addCommentOptional: 'Kommentar hinzufügen (optional)',
      commentPlaceholder: 'z. B. Morgen werden mehr Materialien benötigt...',
      addCompletionPhoto: 'Abschlussfoto hinzufügen',
      removePhoto: 'Foto entfernen',
      startTask: 'Aufgabe starten',
      markCompleted: 'Als erledigt markieren',
      cannotComplete: 'Kann nicht erledigt werden',
      explainIssue: 'Bitte erkläre den Grund im Kommentarfeld oben.',
      submitIssue: 'Problem senden',
      provideReason: 'Bitte gib einen Grund an, bevor du die Aufgabe als unvollständig markierst.',
      taskTypePriority: '{{priority}} Priorität',
      reopenTask: 'Aufgabe reaktivieren',
      updatesTitle: 'Fortschrittsberichte & Kommentare',
      updatesSubtitle: 'Veröffentliche Berichte, Feedback oder laufende Statusanmerkungen.',
      sendUpdate: 'Update senden',
      updatePlaceholder: 'Beschreibe den Fortschritt oder hinterlasse einen Kommentar...',
      updatePhoto: 'Foto anhängen',
      onlyInProgress: 'Updates können erst gesendet werden, wenn die Aufgabe gestartet wurde.',
      noUpdates: 'Noch keine Fortschrittsberichte oder Kommentare vorhanden.',
      posting: 'Wird gesendet...',
      uploadingMedia: 'Datei wird hochgeladen...',
      compressingImage: 'Bild wird optimiert...',
      preparingUpload: 'Upload-Server wird vorbereitet...',
      uploadProgress: '{{fileName}} wird hochgeladen ({{percent}}%)',
      uploadInProgress: 'Upload läuft...',
      doNotCloseWindow: 'Bitte bleibe auf dieser Seite, bis der Upload abgeschlossen ist.',
      createFollowUp: 'Folgeaufgabe erstellen',
      followUpToPrevious: 'Folgeaufgabe von vorheriger Aufgabe',
    },
    materials: {
      available: 'Materialien sind vorhanden',
      to_purchase: 'Materialien müssen gekauft werden',
      ordered_pending_delivery: 'Materialien bestellt, warten auf Lieferung',
      clarification_needed: 'Es muss geklärt werden, welche Materialien benötigt werden',
    },
  },
};

const localeMap: Record<Language, string> = {
  en: 'en-US',
  de: 'de-DE',
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const resolveTranslation = (tree: TranslationTree, key: string): string | undefined => {
  const parts = key.split('.');
  let current: TranslationLeaf | TranslationTree | undefined = tree;

  for (const part of parts) {
    if (!current || typeof current === 'string') return undefined;
    current = current[part];
  }

  return typeof current === 'string' ? current : undefined;
};

const interpolate = (template: string, params?: TranslateParams) => {
  if (!params) return template;
  return Object.entries(params).reduce((result, [key, value]) => {
    return result.split(`{{${key}}}`).join(String(value));
  }, template);
};

const getOrdinalSuffix = (day: number) => {
  const mod10 = day % 10;
  const mod100 = day % 100;
  if (mod10 === 1 && mod100 !== 11) return 'st';
  if (mod10 === 2 && mod100 !== 12) return 'nd';
  return 'th';
};

const formatDDMMYYYY = (value: string | number | Date): string => {
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem('rtm_language');
    return stored === 'en' ? 'en' : 'de';
  });

  const locale = localeMap[language];

  const value = useMemo<LanguageContextType>(() => {
    const t = (key: string, params?: TranslateParams) => {
      const template =
        resolveTranslation(translations[language], key) ??
        resolveTranslation(translations.en, key) ??
        key;
      return interpolate(template, params);
    };

    const updateLanguage = (nextLanguage: Language) => {
      try {
        localStorage.setItem('rtm_language', nextLanguage);
      } catch {
        console.warn('Failed to save language (quota exceeded?)');
      }
      setLanguage(nextLanguage);
    };

    return {
      language,
      locale,
      setLanguage: updateLanguage,
      t,
      formatDate: (value, options) => {
        const d = new Date(value);
        if (isNaN(d.getTime())) return '';
        if (!options || Object.keys(options).length === 0 || options.dateStyle === 'short' || options.dateStyle === 'medium') {
          return formatDDMMYYYY(d);
        }
        return new Intl.DateTimeFormat(locale, options).format(d);
      },
      formatDateTime: (value) => {
        const d = new Date(value);
        if (isNaN(d.getTime())) return '';
        const dateStr = formatDDMMYYYY(d);
        const timeFormatter = new Intl.DateTimeFormat(locale, {
          hour: 'numeric',
          minute: '2-digit',
          hour12: language === 'en',
        });
        return `${dateStr}, ${timeFormatter.format(d)}`;
      },
      formatTime: (value, options) =>
        new Intl.DateTimeFormat(locale, {
          hour: '2-digit',
          minute: '2-digit',
          ...options,
        }).format(new Date(value)),
      taskStatusLabel: (status) => t(`status.${status}`),
      priorityLabel: (priority) => t(`priority.${priority}`),
      taskTypeLabel: (type) => t(`taskType.${type}`),
      roleLabel: (role) => t(`roles.${role}`),
      weekdayLabel: (day) => t(`weekdays.${day}`),
      shortWeekdayLabel: (day) => t(`weekdaysShort.${day}`),
      relativeDayLabel: (date, today) => {
        const target = new Date(date);
        const targetMidnight = new Date(target);
        targetMidnight.setHours(0, 0, 0, 0);
        const todayMidnight = new Date(today);
        todayMidnight.setHours(0, 0, 0, 0);
        const diffMs = targetMidnight.getTime() - todayMidnight.getTime();
        const diffDays = Math.round(diffMs / 86400000);

        if (diffDays === 0) return t('common.today');
        if (diffDays === 1) return t('common.tomorrow');
        if (diffDays === -1) return t('common.yesterday');
        return null;
      },
      monthDayOrdinalLabel: (day) => {
        const numericDay = Number(day);
        if (language === 'de') {
          return `${numericDay}.`;
        }
        return `${numericDay}${getOrdinalSuffix(numericDay)}`;
      },
    };
  }, [language, locale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
