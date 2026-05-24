/**
 * useStaffPermissions — RBAC permission hook
 * Fetches current user's staff role & permissions from backend.
 * Classic admins (role=admin on UserAccount) get ALL permissions.
 */
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCustomAuth } from '@/lib/CustomAuthContext';

const ALL_PERMISSIONS = [
  'manage_users', 'manage_challenges', 'manage_payouts', 'manage_kyc',
  'manage_risk', 'manage_affiliates', 'manage_support', 'manage_notifications',
  'manage_settings', 'manage_payments', 'manage_coupons', 'manage_staff', 'manage_audit_logs'
];

let _cache = null;
let _cacheEmail = null;

export function useStaffPermissions() {
  const { user } = useCustomAuth();
  const [permissions, setPermissions] = useState([]);
  const [staffRole, setStaffRole] = useState(null);
  const [isClassicAdmin, setIsClassicAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    // Return cached result for same user
    if (_cacheEmail === user.email && _cache) {
      setPermissions(_cache.permissions);
      setStaffRole(_cache.staffRole);
      setIsClassicAdmin(_cache.isClassicAdmin);
      setLoading(false);
      return;
    }

    // Classic admin shortcut — check role from user object
    if (user.role === 'admin') {
      const result = { permissions: ALL_PERMISSIONS, staffRole: 'admin', isClassicAdmin: true };
      _cache = result;
      _cacheEmail = user.email;
      setPermissions(ALL_PERMISSIONS);
      setStaffRole('admin');
      setIsClassicAdmin(true);
      setLoading(false);
      return;
    }

    // Fetch from backend for staff members
    base44.functions.invoke('staffManagement', { action: 'get_my_permissions' })
      .then(res => {
        const data = res.data;
        const result = {
          permissions: data.permissions || [],
          staffRole: data.role || 'none',
          isClassicAdmin: data.is_classic_admin || false,
        };
        _cache = result;
        _cacheEmail = user.email;
        setPermissions(result.permissions);
        setStaffRole(result.staffRole);
        setIsClassicAdmin(result.isClassicAdmin);
      })
      .catch(() => {
        setPermissions([]);
        setStaffRole(null);
      })
      .finally(() => setLoading(false));
  }, [user?.email]);

  const hasPermission = (permission) => {
    if (isClassicAdmin) return true;
    return permissions.includes(permission);
  };

  const hasAnyPermission = (...perms) => perms.some(p => hasPermission(p));

  const isAdminLevel = isClassicAdmin || ['owner', 'super_admin', 'admin'].includes(staffRole);

  return { permissions, staffRole, isClassicAdmin, isAdminLevel, hasPermission, hasAnyPermission, loading };
}

// Clear cache on logout
export function clearPermissionsCache() {
  _cache = null;
  _cacheEmail = null;
}