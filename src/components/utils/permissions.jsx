// Permission constants - must match backend PERMISSIONS in seed.py
export const PERMISSIONS = {
  // Payment permissions
  VIEW_PAYMENTS: 'view_payments',
  MANAGE_PAYMENTS: 'manage_payments',
  
  // User permissions
  VIEW_USERS: 'view_users',
  MANAGE_USERS: 'manage_users',
  
  // Credit permissions
  VIEW_CREDITS: 'view_credits',
  MANAGE_CREDITS: 'manage_credits',
  
  // Settings permissions
  VIEW_SETTINGS: 'view_settings',
  MANAGE_SETTINGS: 'manage_settings',
  
  // Role permissions
  MANAGE_ROLES: 'manage_roles',
  
  // Dashboard permissions
  VIEW_OWNER_DASHBOARD: 'view_owner_dashboard',
  
  // Analysis permissions
  VIEW_ANALYSES: 'view_analyses',
  MANAGE_ANALYSES: 'manage_analyses',
  
  // Notification permissions
  VIEW_NOTIFICATIONS: 'view_notifications',
  MANAGE_NOTIFICATIONS: 'manage_notifications',
  
  // Email template permissions
  VIEW_EMAIL_TEMPLATES: 'view_email_templates',
  MANAGE_EMAIL_TEMPLATES: 'manage_email_templates',
  
  // Audit log permissions
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  
  // Discount permissions
  VIEW_DISCOUNTS: 'view_discounts',
  MANAGE_DISCOUNTS: 'manage_discounts',
};

// Predefined role templates
export const ROLE_TEMPLATES = {
  FINANCE_MANAGER: {
    name: 'Finance Manager',
    description: 'Can view and manage payment requests and credit transactions',
    permissions: [
      PERMISSIONS.VIEW_PAYMENTS,
      PERMISSIONS.MANAGE_PAYMENTS,
      PERMISSIONS.VIEW_CREDITS,
      PERMISSIONS.MANAGE_CREDITS
    ]
  },
  OPERATIONS_MANAGER: {
    name: 'Operations Manager',
    description: 'Can manage users, settings, and handle payment operations',
    permissions: [
      PERMISSIONS.VIEW_PAYMENTS,
      PERMISSIONS.MANAGE_PAYMENTS,
      PERMISSIONS.VIEW_USERS,
      PERMISSIONS.MANAGE_USERS,
      PERMISSIONS.VIEW_CREDITS,
      PERMISSIONS.MANAGE_CREDITS,
      PERMISSIONS.VIEW_SETTINGS,
      PERMISSIONS.MANAGE_SETTINGS,
      PERMISSIONS.VIEW_OWNER_DASHBOARD
    ]
  }
};

// Permission labels for UI
export const PERMISSION_LABELS = {
  [PERMISSIONS.VIEW_PAYMENTS]: 'View Payments',
  [PERMISSIONS.MANAGE_PAYMENTS]: 'Manage Payments',
  [PERMISSIONS.VIEW_USERS]: 'View Users',
  [PERMISSIONS.MANAGE_USERS]: 'Manage Users',
  [PERMISSIONS.VIEW_CREDITS]: 'View Credits',
  [PERMISSIONS.MANAGE_CREDITS]: 'Manage Credits',
  [PERMISSIONS.VIEW_SETTINGS]: 'View Settings',
  [PERMISSIONS.MANAGE_SETTINGS]: 'Manage Settings',
  [PERMISSIONS.MANAGE_ROLES]: 'Manage Roles & Permissions',
  [PERMISSIONS.VIEW_OWNER_DASHBOARD]: 'View Owner Dashboard',
  [PERMISSIONS.VIEW_ANALYSES]: 'View All Analyses',
  [PERMISSIONS.MANAGE_ANALYSES]: 'Manage Analyses',
  [PERMISSIONS.VIEW_NOTIFICATIONS]: 'View Notifications',
  [PERMISSIONS.MANAGE_NOTIFICATIONS]: 'Send Notifications',
  [PERMISSIONS.VIEW_EMAIL_TEMPLATES]: 'View Email Templates',
  [PERMISSIONS.MANAGE_EMAIL_TEMPLATES]: 'Manage Email Templates',
  [PERMISSIONS.VIEW_AUDIT_LOGS]: 'View Audit Logs',
  [PERMISSIONS.VIEW_DISCOUNTS]: 'View Discount Codes',
  [PERMISSIONS.MANAGE_DISCOUNTS]: 'Manage Discount Codes',
};

// Check if user is an admin (admin or super_admin role) - kept for backwards compatibility
export const isAdmin = (user) => {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'super_admin';
};

// Check if user has a specific permission by checking their permissions array
export const hasPermission = (user, permission) => {
  if (!user) return false;
  
  // Admin/super_admin bypass - always have all permissions (backwards compatibility)
  if (user.role === 'admin' || user.role === 'super_admin') {
    return true;
  }
  
  // Check permissions array (flat structure from backend)
  if (Array.isArray(user.permissions)) {
    return user.permissions.includes(permission);
  }
  
  // Check permissions object (nested structure - legacy support)
  if (user.permissions && typeof user.permissions === 'object' && !Array.isArray(user.permissions)) {
    for (const category of Object.values(user.permissions)) {
      if (Array.isArray(category) && category.includes(permission)) {
        return true;
      }
    }
  }
  
  return false;
};

// Check if user has any of the specified permissions
export const hasAnyPermission = (user, permissions) => {
  if (!user) return false;
  return permissions.some(permission => hasPermission(user, permission));
};

// Check if user has all of the specified permissions
export const hasAllPermissions = (user, permissions) => {
  if (!user) return false;
  return permissions.every(permission => hasPermission(user, permission));
};

// Check if user can access admin features (has any admin-level permission)
export const canAccessAdmin = (user) => {
  if (!user) return false;
  
  // Admin/super_admin bypass - always have admin access (backwards compatibility)
  if (user.role === 'admin' || user.role === 'super_admin') {
    return true;
  }
  
  const adminPermissions = [
    PERMISSIONS.VIEW_OWNER_DASHBOARD,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.VIEW_CREDITS,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.VIEW_EMAIL_TEMPLATES,
    PERMISSIONS.VIEW_DISCOUNTS,
    PERMISSIONS.MANAGE_ROLES,
  ];
  
  return hasAnyPermission(user, adminPermissions);
};