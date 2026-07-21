export const AREAS = ["BUSINESS", "PERSONAL"] as const;
export type Area = (typeof AREAS)[number];

export const USER_ROLES = ["SUPER_ADMIN", "USER"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PROJECT_STATUSES = [
  "PLANNED",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const HABIT_FREQUENCIES = ["DAILY", "WEEKLY", "CUSTOM"] as const;
export type HabitFrequency = (typeof HABIT_FREQUENCIES)[number];

export type SubtaskSuggestion = {
  title: string;
  description?: string;
  priority?: Priority;
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  PLANNED: "Planned",
  ACTIVE: "Active",
  ON_HOLD: "On hold",
  COMPLETED: "Completed",
};

export const DOCUMENT_CATEGORIES = [
  "LICENSE",
  "PASSPORT",
  "INSURANCE",
  "REGISTRATION",
  "VISA",
  "OTHER",
] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const DOCUMENT_CATEGORY_LABEL: Record<DocumentCategory, string> = {
  LICENSE: "License",
  PASSPORT: "Passport",
  INSURANCE: "Insurance",
  REGISTRATION: "Registration",
  VISA: "Visa",
  OTHER: "Other",
};

// A document counts as "expiring soon" inside this many days of its expiry date.
export const DOCUMENT_EXPIRY_WARNING_DAYS = 60;
