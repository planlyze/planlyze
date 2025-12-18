// Permission constants
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
  VIEW_OWNER_DASHBOARD: 'view_owner_dashboard'
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
  [PERMISSIONS.VIEW_OWNER_DASHBOARD]: 'View Owner Dashboard'
};

// Check if user is an admin (admin or super_admin role)
export const isAdmin = (user) => {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'super_admin';
};

// Check if user has a specific permission
export const hasPermission = (user, permission) => {
  if (!user) return false;
  
  // Super admin or admin has all permissions
  if (isAdmin(user)) return true;
  
  // Check custom permissions object (new structure)
  if (user.permissions && typeof user.permissions === 'object') {
    for (const category of Object.values(user.permissions)) {
      if (Array.isArray(category) && category.includes(permission)) {
        return true;
      }
    }
  }
  
  // Check custom permissions array (legacy structure)
  if (Array.isArray(user.permissions) && user.permissions.includes(permission)) {
    return true;
  }
  
  return false;
};

// Check if user has any of the specified permissions
export const hasAnyPermission = (user, permissions) => {
  if (!user) return false;
  if (isAdmin(user)) return true;
  
  return permissions.some(permission => hasPermission(user, permission));
};

// Check if user has all of the specified permissions
export const hasAllPermissions = (user, permissions) => {
  if (!user) return false;
  if (isAdmin(user)) return true;
  
  return permissions.every(permission => hasPermission(user, permission));
};