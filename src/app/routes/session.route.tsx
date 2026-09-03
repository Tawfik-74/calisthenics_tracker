import { useNavigate } from 'react-router-dom';
import { ActiveSession } from '@/features/workouts';

/** workouts + social — the ledger, rest timer and summary all live inside workouts. */
export function SessionRoute() {
  const navigate = useNavigate();
  return (
    <ActiveSession
      onExit={() => navigate('/stats')}
      onNoSession={() => navigate('/today')}
    />
  );
}
