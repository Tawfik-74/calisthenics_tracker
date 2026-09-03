import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthGate } from '@/features/auth';
import { AppShell } from './AppShell';
import { LoginRoute } from './routes/login.route';
import { TodayRoute } from './routes/today.route';
import { SessionRoute } from './routes/session.route';
import { SquadRoute } from './routes/squad.route';
import { MemberRoute } from './routes/member.route';
import { StatsRoute } from './routes/stats.route';

const protectedRoute = (el: React.ReactNode) => (
  <AuthGate>
    <AppShell>{el}</AppShell>
  </AuthGate>
);

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/today" replace /> },
  { path: '/login', element: <LoginRoute /> },
  { path: '/today', element: protectedRoute(<TodayRoute />) },
  { path: '/session', element: protectedRoute(<SessionRoute />) },
  { path: '/squad', element: protectedRoute(<SquadRoute />) },
  { path: '/squad/:userId', element: protectedRoute(<MemberRoute />) },
  { path: '/stats', element: protectedRoute(<StatsRoute />) },
  { path: '*', element: <Navigate to="/today" replace /> },
]);
