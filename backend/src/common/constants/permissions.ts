// Permission definitions for Disha system
export enum Permission {
  // School Management
  VIEW_SCHOOLS = 'view_schools',
  CREATE_SCHOOL = 'create_school',
  EDIT_SCHOOL = 'edit_school',
  DELETE_SCHOOL = 'delete_school',
  VIEW_SCHOOL_METRICS = 'view_school_metrics',

  // Student Management
  VIEW_STUDENTS = 'view_students',
  CREATE_STUDENT = 'create_student',
  EDIT_STUDENT = 'edit_student',
  DELETE_STUDENT = 'delete_student',
  VIEW_STUDENT_DETAILS = 'view_student_details',
  MANAGE_ATTENDANCE = 'manage_attendance',
  MANAGE_ACADEMICS = 'manage_academics',

  // Assessment Management
  VIEW_ASSESSMENTS = 'view_assessments',
  CREATE_ASSESSMENT = 'create_assessment',
  EDIT_ASSESSMENT = 'edit_assessment',
  PUBLISH_ASSESSMENT = 'publish_assessment',
  SUBMIT_ASSESSMENT = 'submit_assessment',
  VIEW_RESPONSES = 'view_responses',

  // Reporting & Analytics
  VIEW_REPORTS = 'view_reports',
  EXPORT_REPORTS = 'export_reports',
  VIEW_ANALYTICS = 'view_analytics',
  VIEW_GAP_ANALYSIS = 'view_gap_analysis',

  // Audit & Compliance
  VIEW_AUDIT_LOGS = 'view_audit_logs',
  MANAGE_AUDIT = 'manage_audit',

  // Wellbeing
  VIEW_WELLBEING = 'view_wellbeing',
  MANAGE_COUNSELLOR_REFERRAL = 'manage_counsellor_referral',
  MANAGE_INTERVENTIONS = 'manage_interventions',
  MANAGE_INCIDENTS = 'manage_incidents',

  // Notifications
  SEND_NOTIFICATIONS = 'send_notifications',
  VIEW_NOTIFICATIONS = 'view_notifications',
  MANAGE_PREFERENCES = 'manage_preferences',

  // System Admin
  MANAGE_USERS = 'manage_users',
  MANAGE_ROLES = 'manage_roles',
  SYSTEM_SETTINGS = 'system_settings',
}

// Role-to-Permissions mapping
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  ryl_admin: [
    // RYL Admin has all permissions
    Permission.VIEW_SCHOOLS,
    Permission.CREATE_SCHOOL,
    Permission.EDIT_SCHOOL,
    Permission.DELETE_SCHOOL,
    Permission.VIEW_SCHOOL_METRICS,
    Permission.VIEW_STUDENTS,
    Permission.CREATE_STUDENT,
    Permission.EDIT_STUDENT,
    Permission.DELETE_STUDENT,
    Permission.VIEW_STUDENT_DETAILS,
    Permission.MANAGE_ATTENDANCE,
    Permission.MANAGE_ACADEMICS,
    Permission.VIEW_ASSESSMENTS,
    Permission.CREATE_ASSESSMENT,
    Permission.EDIT_ASSESSMENT,
    Permission.PUBLISH_ASSESSMENT,
    Permission.VIEW_RESPONSES,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_GAP_ANALYSIS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.MANAGE_AUDIT,
    Permission.VIEW_WELLBEING,
    Permission.MANAGE_COUNSELLOR_REFERRAL,
    Permission.MANAGE_INTERVENTIONS,
    Permission.MANAGE_INCIDENTS,
    Permission.SEND_NOTIFICATIONS,
    Permission.VIEW_NOTIFICATIONS,
    Permission.MANAGE_PREFERENCES,
    Permission.MANAGE_USERS,
    Permission.MANAGE_ROLES,
    Permission.SYSTEM_SETTINGS,
  ],

  school_admin: [
    // School Admin manages their school
    Permission.VIEW_SCHOOLS,
    Permission.EDIT_SCHOOL,
    Permission.VIEW_SCHOOL_METRICS,
    Permission.VIEW_STUDENTS,
    Permission.CREATE_STUDENT,
    Permission.EDIT_STUDENT,
    Permission.DELETE_STUDENT,
    Permission.VIEW_STUDENT_DETAILS,
    Permission.MANAGE_ATTENDANCE,
    Permission.MANAGE_ACADEMICS,
    Permission.VIEW_ASSESSMENTS,
    Permission.CREATE_ASSESSMENT,
    Permission.EDIT_ASSESSMENT,
    Permission.PUBLISH_ASSESSMENT,
    Permission.VIEW_RESPONSES,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_GAP_ANALYSIS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.VIEW_WELLBEING,
    Permission.MANAGE_COUNSELLOR_REFERRAL,
    Permission.MANAGE_INTERVENTIONS,
    Permission.MANAGE_INCIDENTS,
    Permission.SEND_NOTIFICATIONS,
    Permission.VIEW_NOTIFICATIONS,
  ],

  teacher: [
    // Teachers manage their classes and student data
    Permission.VIEW_SCHOOLS,
    Permission.VIEW_STUDENTS,
    Permission.VIEW_STUDENT_DETAILS,
    Permission.MANAGE_ATTENDANCE,
    Permission.MANAGE_ACADEMICS,
    Permission.VIEW_ASSESSMENTS,
    Permission.SUBMIT_ASSESSMENT,
    Permission.VIEW_RESPONSES,
    Permission.VIEW_REPORTS,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_WELLBEING,
    Permission.MANAGE_COUNSELLOR_REFERRAL,
    Permission.VIEW_NOTIFICATIONS,
    Permission.MANAGE_PREFERENCES,
  ],

  parent: [
    // Parents view their child's data only
    Permission.VIEW_STUDENT_DETAILS,
    Permission.VIEW_REPORTS,
    Permission.VIEW_NOTIFICATIONS,
    Permission.MANAGE_PREFERENCES,
    Permission.SUBMIT_ASSESSMENT,
  ],

  student: [
    // Students take assessments and view their own data
    Permission.VIEW_NOTIFICATIONS,
    Permission.SUBMIT_ASSESSMENT,
    Permission.VIEW_STUDENT_DETAILS, // Only their own
    Permission.MANAGE_PREFERENCES,
  ],
};
