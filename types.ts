
export enum LeadTier { 
  HIGH = 'HIGH', 
  MEDIUM = 'MEDIUM', 
  LOW = 'LOW' 
}

export enum LeadStatus { 
  NEW = 'NEW', 
  WORKING = 'WORKING', 
  QUALIFIED = 'QUALIFIED', 
  UNQUALIFIED = 'UNQUALIFIED'
}

export enum LeadClassification {
  STUDENT = 'STUDENT',
  INTERN = 'INTERN',
  ENTERPRISE = 'ENTERPRISE',
  LECTURER = 'LECTURER',
  UNIVERSITY = 'UNIVERSITY',
  PARTNER = 'PARTNER',
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dob?: string;
  gender?: 'Male' | 'Female' | 'Other';
  contactAddress?: string;
  nationalId?: string;
  nationalIdPhotoUrl?: string;
  idIssueDate?: string;
  idIssuePlace?: string;
  permanentAddress?: string;
  source: string;
  assignee?: {
    name: string;
    avatarUrl: string;
  };
  tier: LeadTier;
  status: LeadStatus;
  score?: number;
  createdAt: string;
  updatedAt?: string;
  classification?: LeadClassification;
  demographics?: {
    age: number;
    location: string;
    education: string;
  };
  webBehaviors?: {
    pagesVisited: number;
    timeOnSiteMinutes: number;
    formSubmissions: number;
    clickedAds: boolean;
  };
  lastMessage?: string;
  aiAnalysis?: {
    score: number; // The 0-1 score from AI
    topFeatures: { feature: string; impact: 'positive' | 'negative' }[];
  };
}

export enum StudentStatus {
  ACTIVE = 'Active',
  PAUSED = 'Paused',
  GRADUATED = 'Graduated',
}

export interface Student {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  course: string;
  progress: number;
  status: StudentStatus;
  createdAt: string;
  updatedAt?: string;
  skills: string[];
  teamIds?: string[];
  skillMap?: { [key: string]: number }; // Added for Phase 3
  dob?: string;
  gender?: 'Male' | 'Female' | 'Other';
  phone?: string;
  contactAddress?: string;
  permanentAddress?: string;
  nationalId?: string;
  nationalIdPhotoUrl?: string;
  idIssueDate?: string;
  idIssuePlace?: string;
  aiAssessed?: boolean;
  score?: number;
  schoolName?: string;
}

export enum TaskStatus {
    COMPLETED = 'Completed',
    IN_PROGRESS = 'In Progress',
    PENDING = 'Pending',
}

export interface Task {
    id: string;
    studentId: string;
    title: string;
    status: TaskStatus;
    dueDate: string;
    score?: number; // Added for Phase 3
    relatedSkills?: string[]; // Added for Phase 3
    teamId?: string;
}

export interface TeamTask extends Task {
  studentName: string;
  studentAvatarUrl: string;
}

export interface UpdateTaskData {
    title?: string;
    dueDate?: string;
    status?: TaskStatus;
}


export interface AnomalyAlert {
  id: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  timestamp: string;
  acknowledged: boolean;
  link?: string; // Added for Phase 3
}

export interface KpiData {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: React.ReactNode;
}

export interface NavItem {
  path: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
  roles: UserRole[]; // Added for RBAC
}

export interface ParsedJd {
  skills: string[];
  softSkills: string[];
  experienceYears: {
    min?: number;
    max?: number;
  };
  hiddenRequirements: string[];
}

export interface MatchingCandidate extends Student {
  matchScore: number;
  matchingSkills: string[];
}

export enum UserRole {
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
  MENTOR = 'MENTOR',
  STUDENT = 'STUDENT',
  EMPLOYEE = 'EMPLOYEE',
  COMPANY_USER = 'COMPANY_USER',
  SCHOOL = 'SCHOOL',
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  role: UserRole;
  dob?: string;
  gender?: 'Male' | 'Female' | 'Other';
  phone?: string;
  contactAddress?: string;
  permanentAddress?: string;
  nationalId?: string;
  nationalIdPhotoUrl?: string;
  idIssueDate?: string;
  idIssuePlace?: string;
  companyName?: string;
  schoolName?: string;
  createdAt: string;
  updatedAt?: string;
}

export type TeamStatus = 'Planning' | 'In Progress' | 'Completed';

export interface Team {
  id: string;
  name: string;
  mentor: string;
  leader: Student;
  members: Student[];
  project: string;
  projectDescription: string;
  status: TeamStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface JobPosting {
  id: string;
  title: string;
  companyName: string;
  status: 'Open' | 'Closed' | 'Interviewing';
  createdAt: string;
  updatedAt?: string;
  matchCount: number;
  description: string;
}

// Added for Phase 3
export enum InterviewStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  COMPLETED = 'COMPLETED',
}

export enum JobApplicationStatus {
  PENDING = 'PENDING',
  MENTOR_REVIEW = 'MENTOR_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  applicantId: string;
  applicantName: string;
  applicantType: 'STUDENT' | 'EMPLOYEE';
  status: JobApplicationStatus;
  appliedAt: string;
  mentorId?: string; // Required for student applications
  mentorName?: string;
  mentorApprovalAt?: string;
  rejectionReason?: string;
  coverLetter?: string;
  resumeUrl?: string;
}

// Added for Phase 3
export interface Interview {
  id: string;
  jobId: string;
  jobTitle: string;
  candidateId: string;
  candidateName: string;
  companyName: string;
  scheduledTime: string;
  location: string;
  status: InterviewStatus;
  interviewer?: string;
  evaluation?: string;
  declineReason?: string;
}

export interface CreateInterviewData {
  jobId: string;
  candidateId: string;
  interviewerId: string;
  scheduledAt: string;
  location: string;
  notes?: string;
}

export interface Notification {
  id: string;
  userId: string;
  titleKey: string;
  messageKey: string;
  messageParams?: Record<string, string | number>;
  timestamp: string;
  isRead: boolean;
  link?: string;
  interviewId?: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  contactEmail: string;
  createdAt: string;
  updatedAt?: string;
}

export interface School {
  id: string;
  name: string;
  address: string;
  contactEmail: string;
  createdAt: string;
  updatedAt?: string;
  phone?: string;
  studentCount?: number;
}


// Added for Phase 3
export type SkillMap = { skill: string; score: number }[];
