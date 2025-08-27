
import React from 'react';
import { NavItem, UserRole } from './types';
import { LayoutDashboard, Users, GraduationCap, Briefcase, Settings, Building, Group, BarChart3, Handshake, Building2, UserCog, Calendar, ListChecks, School } from 'lucide-react';

export const USER_ROLES: UserRole[] = Object.values(UserRole);

export const NAV_ITEMS: NavItem[] = [
  { path: '/', labelKey: 'dashboard', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.MENTOR, UserRole.SCHOOL] },
  
  // Acquisition
  { path: '/acquisition/leads', labelKey: 'leads', icon: Users, roles: [UserRole.ADMIN, UserRole.AGENT] },
  { path: '/acquisition/claim-leads', labelKey: 'claimLeads', icon: Handshake, roles: [UserRole.AGENT] },

  // Learning
  { path: '/learning/students', labelKey: 'students', icon: GraduationCap, roles: [UserRole.ADMIN, UserRole.MENTOR, UserRole.SCHOOL] },
  { path: '/learning/teams', labelKey: 'teams', icon: Group, roles: [UserRole.ADMIN] },
  { path: '/learning/my-teams', labelKey: 'myTeams', icon: Group, roles: [UserRole.STUDENT, UserRole.MENTOR] },
  { path: '/learning/job-applications', labelKey: 'jobApplications', icon: Briefcase, roles: [UserRole.MENTOR] },

  // Admin Management
  { path: '/admin/companies', labelKey: 'companies', icon: Building2, roles: [UserRole.ADMIN] },
  { path: '/admin/agents', labelKey: 'agents', icon: UserCog, roles: [UserRole.ADMIN] },
  { path: '/admin/schools', labelKey: 'schools', icon: School, roles: [UserRole.ADMIN] },


  // Enterprise
  { path: '/enterprise/jobs', labelKey: 'jobs', icon: Building, roles: [UserRole.ADMIN, UserRole.COMPANY_USER] },
  { path: '/enterprise/interviews', labelKey: 'interviews', icon: Calendar, roles: [UserRole.COMPANY_USER] },
  { path: '/enterprise/interview-list', labelKey: 'interviewList', icon: ListChecks, roles: [UserRole.COMPANY_USER] },
  { path: '/enterprise/student-directory', labelKey: 'studentDirectory', icon: Users, roles: [UserRole.COMPANY_USER] },
  { path: '/enterprise/applications-management', labelKey: 'applicationsManagement', icon: Users, roles: [UserRole.COMPANY_USER] },
  { path: '/enterprise/all-jobs', labelKey: 'allJobs', icon: Briefcase, roles: [UserRole.STUDENT, UserRole.EMPLOYEE] },
  { path: '/enterprise/my-applications', labelKey: 'myApplications', icon: ListChecks, roles: [UserRole.STUDENT, UserRole.EMPLOYEE] },
  { path: '/learning/my-interviews', labelKey: 'myInterviews', icon: Calendar, roles: [UserRole.STUDENT, UserRole.EMPLOYEE] },
  
  // Ops
  { path: '/ops/dashboard', labelKey: 'opsDashboard', icon: BarChart3, roles: [UserRole.ADMIN] },
  { path: '/ops/settings', labelKey: 'settings', icon: Settings, roles: [UserRole.ADMIN] },
];
