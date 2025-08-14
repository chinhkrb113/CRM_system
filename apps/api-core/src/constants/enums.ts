// Enum constants for SQLite compatibility
export const UserRole = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  SALES: 'SALES',
  SUPPORT: 'SUPPORT'
} as const;

export const LeadStatus = {
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  QUALIFIED: 'QUALIFIED',
  PROPOSAL: 'PROPOSAL',
  NEGOTIATION: 'NEGOTIATION',
  CLOSED_WON: 'CLOSED_WON',
  CLOSED_LOST: 'CLOSED_LOST'
} as const;

export const LeadSource = {
  WEBSITE: 'WEBSITE',
  SOCIAL_MEDIA: 'SOCIAL_MEDIA',
  REFERRAL: 'REFERRAL',
  COLD_CALL: 'COLD_CALL',
  EMAIL_CAMPAIGN: 'EMAIL_CAMPAIGN',
  OTHER: 'OTHER'
} as const;

export const InteractionType = {
  CALL: 'CALL',
  EMAIL: 'EMAIL',
  MEETING: 'MEETING',
  NOTE: 'NOTE',
  SMS: 'SMS'
} as const;

export const AppointmentStatus = {
  SCHEDULED: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW'
} as const;

export const PaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
} as const;

// Type definitions
export type UserRoleType = typeof UserRole[keyof typeof UserRole];
export type LeadStatusType = typeof LeadStatus[keyof typeof LeadStatus];
export type LeadSourceType = typeof LeadSource[keyof typeof LeadSource];
export type InteractionTypeType = typeof InteractionType[keyof typeof InteractionType];
export type AppointmentStatusType = typeof AppointmentStatus[keyof typeof AppointmentStatus];
export type PaymentStatusType = typeof PaymentStatus[keyof typeof PaymentStatus];