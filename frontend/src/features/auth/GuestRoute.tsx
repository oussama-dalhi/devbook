import { Navigate, Outlet } from 'react-router';
import { useMe } from './useMe';

export const GuestRoute = () => {
  const { data: user, isPending } = useMe();

  if (isPending) return null;
  if (user) return <Navigate to="/" replace />;

  return <Outlet />;
};
