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
      description: 'Description',
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
      confirmDeleteTask: 'Are you sure you want to delete this task?',
      selectLanguage: 'Select language',
      hide: 'Hide',
      show: 'Show',
      historyTomorrowNote: 'Past completed tasks move to the History tab tomorrow.',
      enableAlerts: 'Enable alerts',
    },
    nav: {
      dashboard: 'Dashboard',
      history: 'History',
      settings: 'Settings',
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
      sortMyWork: 'Sort my work',
      originalOrder: 'Original Order',
      priorityFirst: 'Priority First',
      dueDateSoon: 'Due Date Soon',
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
      noCompletedTasks: 'No completed tasks yet.',
      taskTitle: 'Task',
      assignedTeamMembers: 'Assigned Team Members',
      completedBy: 'Completed By',
      completedAt: 'Completed At',
      duration: 'Duration',
      editTask: 'Edit Task',
      deleteTask: 'Delete Task',
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
      taskType: 'Task Type',
      priority: 'Priority',
      dueDateTime: 'Due Date & Time',
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
    },
    editTask: {
      taskNotFound: 'Task not found.',
      cancelEdit: 'Cancel Edit',
      title: 'Edit Task',
    },
    taskDetail: {
      taskNotFound: 'Task not found.',
      noPermission: "You don't have permission to view this task.",
      editTask: 'Edit Task',
      deleteTask: 'Delete Task',
      assignedTo: 'Assigned To',
      assignedAt: 'Assigned At',
      incompleteAt: 'Incomplete At',
      startedAt: 'Started At',
      completedAt: 'Completed At',
      completionPhotoProof: 'Completion Photo Proof',
      attachmentsReference: 'Attachments & Reference Files',
      referenceFile: 'Reference File {{index}}',
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
      back: 'Zuruck',
      goBack: 'Zuruck',
      cancel: 'Abbrechen',
      saveChanges: 'Anderungen speichern',
      delete: 'Loschen',
      edit: 'Bearbeiten',
      add: 'Hinzufugen',
      done: 'Erledigt',
      active: 'Aktiv',
      upcoming: 'Bevorstehend',
      noData: 'Keine Daten verfugbar.',
      yes: 'Ja',
      no: 'Nein',
      optional: 'Optional',
      today: 'Heute',
      tomorrow: 'Morgen',
      yesterday: 'Gestern',
      assigned: 'Zugewiesen',
      assignedBy: 'Zugewiesen von',
      due: 'Fallig',
      description: 'Beschreibung',
      remarks: 'Hinweise / Anweisungen',
      priority: 'Prioritat',
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
      timeTaken: 'Benotigte Zeit',
      reason: 'Grund',
      note: 'Notiz',
      remove: 'Entfernen',
      uploadFile: 'Datei hochladen',
      changeFile: 'Datei andern',
      addMoreFiles: 'Weitere Dateien',
      existingFiles: 'Vorhandene Dateien',
      noTeamMembers: 'Noch keine Teammitglieder angelegt.',
      taskHint: 'Offne diese Aufgabe, um die nachsten Schritte zu sehen.',
      signOut: 'Abmelden',
      confirmDeleteTask: 'Mochtest du diese Aufgabe wirklich loschen?',
      selectLanguage: 'Sprache auswahlen',
      hide: 'Ausblenden',
      show: 'Anzeigen',
      historyTomorrowNote: 'Fruhere erledigte Aufgaben wechseln morgen in den Verlauf.',
      enableAlerts: 'Benachrichtigungen aktivieren',
    },
    nav: {
      dashboard: 'Dashboard',
      history: 'Verlauf',
      settings: 'Einstellungen',
    },
    login: {
      subtitle: 'Bitte gib deine Zugangsdaten ein, um dein Dashboard zu offnen.',
      invalidCredentials: 'Benutzername oder Passwort ist falsch.',
      usernamePlaceholder: 'Benutzername eingeben',
      passwordPlaceholder: 'Passwort eingeben',
      signIn: 'Anmelden',
      authenticating: 'Anmeldung lauft...',
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
      could_not_complete: 'Unvollstandig',
      blocked: 'Blockiert',
    },
    priority: {
      low: 'Niedrig',
      medium: 'Mittel',
      high: 'Hoch',
    },
    taskType: {
      'one-time': 'Einmalig',
      daily: 'Taglich',
      weekly: 'Wochentlich',
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
      welcome: 'Willkommen zuruck, {{name}}. Hier ist deine aktuelle Arbeit.',
      sortMyWork: 'Meine Aufgaben sortieren',
      originalOrder: 'Ursprungliche Reihenfolge',
      priorityFirst: 'Prioritat zuerst',
      dueDateSoon: 'Falligkeit zuerst',
      allCaughtUp: 'Alles erledigt!',
      noActiveTasks: 'Im Moment sind dir keine aktiven Aufgaben zugewiesen.',
      issuesEmpty: 'Zurzeit gibt es keine blockierten Aufgaben.',
      noUpcomingTasks: 'Noch keine kommenden Aufgaben geplant.',
      todayCompletedTitle: 'Heute erledigt',
      taskDescriptionFallback: 'Offne die Aufgabe, um Details zu sehen und sie abzuschliessen.',
      dueOn: 'Fallig {{date}}',
    },
    manageTasks: {
      welcome: 'Willkommen zuruck, {{name}}',
      newTask: 'Neue Aufgabe',
      recurringSchedules: 'Wiederkehrende Aufgaben',
      recurringSummary: '{{running}} von {{total}} wiederkehrenden Aufgaben sind aktuell aktiv.',
      runningNow: 'aktiv',
      running: 'Aktiv',
      paused: 'Pausiert',
      pauseRecurring: 'Pausieren',
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
      noCompletedTasks: 'Noch keine erledigten Aufgaben.',
      taskTitle: 'Aufgabe',
      assignedTeamMembers: 'Zugewiesene Teammitglieder',
      completedBy: 'Erledigt von',
      completedAt: 'Erledigt am',
      duration: 'Dauer',
      editTask: 'Aufgabe bearbeiten',
      deleteTask: 'Aufgabe loschen',
      markedIncompleteAt: 'Als unvollstandig markiert am',
      assignedAt: 'Zugewiesen am',
      noReasonProvided: 'Kein Grund angegeben',
      reopenTask: 'Aufgabe reaktivieren',
    },
    adminHistory: {
      title: 'Aufgabenverlauf',
      subtitle: 'Sieh dir erledigte und unvollstandige Aufgaben im Team an.',
      empty: 'Noch kein Aufgabenverlauf vorhanden.',
      timeline: 'Letzte Anderung',
      reopen: 'Reaktivieren',
      filterLabel: 'Nach Datum filtern',
      clearFilter: 'Zurucksetzen',
    },
    settings: {
      subtitle: 'Verwalte dein Team und operative Einstellungen.',
      addEmployee: 'Mitarbeiter hinzufugen',
      teamDirectory: 'Teamubersicht',
      notSet: 'Nicht gesetzt',
      noTeamMembersFound: 'Keine Teammitglieder gefunden.',
      viewProfileHistory: 'Profil und Verlauf anzeigen',
      editEmployeeDetails: 'Mitarbeiter bearbeiten',
      alertsTitle: 'Benachrichtigungen',
      alertsSubtitle: 'Aktiviere Hintergrundbenachrichtigungen fur diese installierte App auf diesem Gerat.',
      alertsEnabled: 'Benachrichtigungen sind auf diesem Gerat aktiviert.',
      alertsUnavailable: 'Benachrichtigungen werden auf diesem Gerat nicht unterstutzt.',
    },
    addEmployee: {
      backToDashboard: 'Zuruck zum Dashboard',
      title: 'Neuen Mitarbeiter anlegen',
      subtitle: 'Erstelle Zugangsdaten fur ein neues Teammitglied.',
      success: 'Mitarbeiter {{name}} wurde erfolgreich angelegt!',
      fullName: 'Vollstandiger Name',
      fullNamePlaceholder: 'z. B. Jane Doe',
      usernamePlaceholder: 'z. B. janedoe',
      securePasswordPlaceholder: 'Sicheres Passwort eingeben',
      employeeRoleTitle: 'Rolle / Titel des Mitarbeiters',
      employeeRolePlaceholder: 'z. B. Empfang, Reinigung, Sicherheit',
      registerEmployee: 'Mitarbeiter registrieren',
      fillAllFields: 'Bitte alle Felder ausfullen.',
    },
    editEmployee: {
      employeeNotFound: 'Mitarbeiter wurde nicht gefunden.',
      backToSettings: 'Zuruck zu den Einstellungen',
      title: 'Mitarbeiterdaten bearbeiten',
      subtitle: 'Aktualisiere die Zugangsdaten und Details fur {{name}}.',
      success: 'Die Mitarbeiterdaten wurden erfolgreich aktualisiert!',
      saveChanges: 'Anderungen speichern',
      fillRequiredFields: 'Bitte alle Pflichtfelder ausfullen.',
    },
    employeeHistory: {
      accessDenied: 'Zugriff verweigert. Nur Manager durfen Teamverlaufe ansehen.',
      employeeNotFound: 'Mitarbeiterprofil wurde nicht gefunden.',
      backToTeamSettings: 'Zuruck zu den Teameinstellungen',
      generalStaff: 'Allgemeines Personal',
      usernameLabel: 'Benutzername',
      modifyEmployeeDetails: 'Mitarbeiterdaten bearbeiten',
      totalTasks: 'Aufgaben gesamt',
      completed: 'Erledigt',
      incompleteIssues: 'Unvollstandig / Probleme',
      active: 'Aktiv',
      workHistory: 'Arbeitsverlauf und Aktivitat',
      taskDetail: 'Aufgabendetail',
      timelineDetails: 'Zeitliche Details',
      timeSpent: 'Zeitaufwand',
      commentsExplanations: 'Kommentare und Erklarungen',
      scheduleSuffix: 'Rhythmus',
      assigned: 'Zugewiesen',
      started: 'Gestartet',
      finished: 'Beendet',
      reported: 'Gemeldet',
      activeTimer: 'Aktiver Timer',
      noAssignedTasks: 'Diesem Mitarbeiter wurden noch keine Aufgaben zugewiesen.',
    },
    completedHistory: {
      subtitle: 'Sieh dir deine fruher erledigten Aufgaben nach Datum sortiert an. Die heutigen Abschlusse bleiben im Dashboard.',
      emptyTitle: 'Noch keine fruher erledigten Aufgaben',
      emptySubtitle: 'Erledigte Aufgaben erscheinen am nachsten Tag hier, gruppiert nach Datum.',
      tasksCount: '{{count}} Aufgabe',
      tasksCount_plural: '{{count}} Aufgaben',
      totalCompletedBeforeToday: 'Insgesamt erledigt (vor heute)',
      taskTypeSuffix: 'Aufgabe',
    },
    createTask: {
      backToDashboard: 'Zuruck zum Dashboard',
      title: 'Neue Aufgabe erstellen',
      taskTitle: 'Aufgabentitel',
      taskTitlePlaceholder: 'z. B. 20 Stuhle im offenen Bereich aufstellen',
      descriptionOptional: 'Beschreibung (Optional)',
      descriptionPlaceholder: 'Kurze Zusammenfassung der Aufgabe...',
      remarksOptional: 'Hinweise / Anweisungen (Optional)',
      remarksPlaceholder: 'Besondere Hinweise oder kurze Schritte...',
      taskType: 'Aufgabentyp',
      priority: 'Prioritat',
      dueDateTime: 'Falligkeit und Uhrzeit',
      setDate: 'Datum setzen',
      dailyRecurring: 'Tagliche Wiederholung - Uhrzeit auswahlen',
      weeklyRecurring: 'Wochentliche Wiederholung - Tage und Uhrzeit',
      monthlyRecurring: 'Monatliche Wiederholung - Tag und Uhrzeit',
      timeEachDay: 'Uhrzeit pro Tag',
      repeatsEveryDayAt: 'Wiederholt sich jeden Tag um {{time}}.',
      daysOfWeek: 'Wochentage',
      selectMultiple: '(mehrfach auswahlen)',
      timeOnThoseDays: 'Uhrzeit an diesen Tagen',
      repeatsEveryDaysAt: 'Wiederholt sich jeden {{days}} um {{time}}.',
      dayOfMonth: 'Tag des Monats',
      timeOnThatDay: 'Uhrzeit an diesem Tag',
      repeatsMonthlyAt: 'Wiederholt sich am {{day}} jedes Monats um {{time}}.',
      attachReference: 'Foto / Referenz anhangen',
      assignTo: 'Zuweisen an',
      addTask: 'Aufgabe hinzufugen',
      fillTitleAndAssignee: 'Bitte einen Titel eingeben und mindestens eine Person auswahlen.',
    },
    editTask: {
      taskNotFound: 'Aufgabe wurde nicht gefunden.',
      cancelEdit: 'Bearbeiten abbrechen',
      title: 'Aufgabe bearbeiten',
    },
    taskDetail: {
      taskNotFound: 'Aufgabe wurde nicht gefunden.',
      noPermission: 'Du hast keine Berechtigung, diese Aufgabe anzusehen.',
      editTask: 'Aufgabe bearbeiten',
      deleteTask: 'Aufgabe loschen',
      assignedTo: 'Zugewiesen an',
      assignedAt: 'Zugewiesen am',
      incompleteAt: 'Unvollstandig seit',
      startedAt: 'Gestartet am',
      completedAt: 'Erledigt am',
      completionPhotoProof: 'Fotobeleg zur Erledigung',
      attachmentsReference: 'Anhange und Referenzen',
      referenceFile: 'Referenzdatei {{index}}',
      completionActions: 'Aktionen zum Abschluss',
      addCommentOptional: 'Kommentar hinzufugen (optional)',
      commentPlaceholder: 'z. B. Morgen werden mehr Materialien benotigt...',
      addCompletionPhoto: 'Abschlussfoto hinzufugen',
      removePhoto: 'Foto entfernen',
      startTask: 'Aufgabe starten',
      markCompleted: 'Als erledigt markieren',
      cannotComplete: 'Kann nicht erledigt werden',
      explainIssue: 'Bitte erklare den Grund im Kommentarfeld oben.',
      submitIssue: 'Problem senden',
      provideReason: 'Bitte gib einen Grund an, bevor du die Aufgabe als unvollstandig markierst.',
      taskTypePriority: '{{priority}} Prioritat',
      reopenTask: 'Aufgabe reaktivieren',
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
    return result.replaceAll(`{{${key}}}`, String(value));
  }, template);
};

const getOrdinalSuffix = (day: number) => {
  const mod10 = day % 10;
  const mod100 = day % 100;
  if (mod10 === 1 && mod100 !== 11) return 'st';
  if (mod10 === 2 && mod100 !== 12) return 'nd';
  if (mod10 === 3 && mod100 !== 13) return 'rd';
  return 'th';
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem('rtm_language');
    return stored === 'de' ? 'de' : 'en';
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
      localStorage.setItem('rtm_language', nextLanguage);
      setLanguage(nextLanguage);
    };

    return {
      language,
      locale,
      setLanguage: updateLanguage,
      t,
      formatDate: (value, options) =>
        new Intl.DateTimeFormat(locale, options).format(new Date(value)),
      formatDateTime: (value, options) =>
        new Intl.DateTimeFormat(locale, {
          dateStyle: 'medium',
          timeStyle: 'short',
          ...options,
        }).format(new Date(value)),
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
