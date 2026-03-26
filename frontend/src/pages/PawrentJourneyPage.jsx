/**
 * PawrentJourneyPage.jsx
 * Route wrapper for /pawrent-journey
 */
import PawrentJourney from '../components/pawrent/PawrentJourney';
import { useAuth } from '../context/AuthContext';
import { usePillarContext } from '../context/PillarContext';

export default function PawrentJourneyPage() {
  const { token } = useAuth();
  const { currentPet } = usePillarContext();
  return <PawrentJourney pet={currentPet} token={token} />;
}
