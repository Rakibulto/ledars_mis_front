'use client';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useGetEmployee } from 'src/actions/employees';

import { SplashScreen } from 'src/components/loading-screen';

import { useAuthContext } from '../hooks';

// ----------------------------------------------------------------------

export function PermissionBasedGuard({ children, requiredPermission, allowSupervisor = false }) {
  const router = useRouter();
  const { user, loading } = useAuthContext();
  const [isChecking, setIsChecking] = useState(true);

  const { employee } = useGetEmployee(
    (user?.role === 'Employee' || user?.role === 'Supervisor') && user?.id ? user.id : null
  );

  const canShowWebLogin =
    user?.role === 'Employee' || user?.role === 'Supervisor' ? !!employee?.allow_web_login : true;

  useEffect(() => {
    if (!loading) {
      const hasRequiredPermission = () => {
        // If user is Admin grant all permissions
        if (user?.role?.toLowerCase() === 'admin') return true;

        // Allow Supervisor to access if allowSupervisor is true
        if (allowSupervisor && user?.role?.toLowerCase() === 'supervisor') {
          return true;
        }

        if (!user?.user_permissions_list) return false;

        // If requiredPermission is an array, check if user has any of these permissions
        if (Array.isArray(requiredPermission)) {
          return requiredPermission.some((permission) =>
            user.user_permissions_list.some((p) => p.codename === permission)
          );
        }

        // If it's a single permission string
        return user.user_permissions_list.some((p) => p.codename === requiredPermission);
      };

      if (!user) {
        router.push(paths.auth.jwt.signIn);
        return;
      }

      if ((requiredPermission || allowSupervisor || canShowWebLogin) && !hasRequiredPermission()) {
        router.push(paths.page403);
        return;
      }

      setIsChecking(false);
    }
  }, [user, loading, requiredPermission, allowSupervisor, router, canShowWebLogin]);

  if (isChecking) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}
