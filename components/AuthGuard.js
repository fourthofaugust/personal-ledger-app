'use client';

import { useAuth } from '@/contexts/AuthContext';
import PinLogin from './PinLogin';
import PinSetup from './PinSetup';

export default function AuthGuard({ children }) {
  const { isAuthenticated, isPinSet, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // If PIN is not set, show setup screen
  if (!isPinSet) {
    return <PinSetup />;
  }

  // If PIN is set but user is not authenticated, show login screen
  if (!isAuthenticated) {
    return <PinLogin />;
  }

  // User is authenticated, show the app
  return <>{children}</>;
}
