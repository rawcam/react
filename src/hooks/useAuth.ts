// src/hooks/useAuth.ts
import { useSelector } from 'react-redux';
import { RootState } from '../store';

export const useAuth = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const hasRole = (roles: string | string[]) => {
    if (!user) return false;
    const role = user.role;
    if (Array.isArray(roles)) return roles.includes(role);
    return role === roles;
  };

  return { user, isAuthenticated, hasRole };
};
