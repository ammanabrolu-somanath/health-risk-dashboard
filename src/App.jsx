import { useState } from 'react';
import { DEFAULT_PROFILE } from './data/demoProfiles.js';
import { Landing } from './pages/Landing.jsx';
import { Dashboard } from './pages/Dashboard.jsx';

/**
 * Two views, one useState. A router would have cost a dependency and bought
 * nothing at this size.
 */
export default function App() {
  const [view, setView] = useState('landing');
  const [profile, setProfile] = useState(DEFAULT_PROFILE);

  if (view === 'landing') {
    return <Landing onStart={() => setView('dashboard')} />;
  }

  return (
    <Dashboard
      profile={profile}
      setProfile={setProfile}
      onRestart={() => {
        setProfile(DEFAULT_PROFILE);
        setView('landing');
      }}
    />
  );
}
