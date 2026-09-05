import { useNavigate } from 'react-router-dom';
import { WorkoutPlayer } from '@/features/workouts';

/** The immersive full-screen player. It logs each set into the workouts
 *  session store and saves the run on completion. */
export function SessionRoute() {
  const navigate = useNavigate();
  return (
    <WorkoutPlayer
      onExit={() => navigate('/stats')}
      onNoSession={() => navigate('/today')}
    />
  );
}
