// src/hooks/useAuth.ts
import { useSelector } from 'react-redux';
import { RootState } from '../store';

export const useAuth = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const role = useSelector((state: RootState) => state.auth.role);
  const isAuthenticated = !!user;

  const hasRole = (roles: string | string[]) => {
    if (!role) return false;
    if (Array.isArray(roles)) return roles.includes(role);
    return role === roles;
  };

  return { user, role, isAuthenticated, hasRole };
};
